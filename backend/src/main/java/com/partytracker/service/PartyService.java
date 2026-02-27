package com.partytracker.service;

import com.partytracker.dto.Dtos.*;
import com.partytracker.entity.*;
import com.partytracker.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PartyService {

    private final UserRepository userRepository;
    private final CycleRepository cycleRepository;
    private final PartyAssignmentRepository assignmentRepository;
    private final HolidayRepository holidayRepository;

    @Value("${app.admin.password}")
    private String adminPassword;

    // ===================== AUTH =====================

    public AdminLoginResponse adminLogin(AdminLoginRequest request) {
        if (adminPassword.equals(request.getPassword())) {
            return new AdminLoginResponse(true, "Login successful");
        }
        return new AdminLoginResponse(false, "Invalid password");
    }

    // ===================== USERS =====================

    public List<UserDto> getAllUsers() {
        return userRepository.findByActiveTrue().stream()
                .map(this::toUserDto)
                .collect(Collectors.toList());
    }

    public UserDto createUser(CreateUserRequest request) {

        Optional<User> existingUserOpt = userRepository.findByName(request.getName());

        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();

            if (existingUser.isActive()) {
                throw new RuntimeException(
                        "User with name '" + request.getName() + "' already exists"
                );
            }

            // Reactivate the user
            existingUser.setActive(true);
            existingUser.setName(request.getName());
            User reactivatedUser = userRepository.save(existingUser);

            // Add to current active cycle if exists
            cycleRepository.findByActiveTrue().ifPresent(cycle -> {
                addUserToCurrentCycle(reactivatedUser, cycle);
            });

            return toUserDto(reactivatedUser);
        }

        // Create new user if not found
        User user = new User();
        user.setName(request.getName());
        user.setActive(true);

        User savedUser = userRepository.save(user);

        cycleRepository.findByActiveTrue().ifPresent(cycle -> {
            addUserToCurrentCycle(savedUser, cycle);
        });

        return toUserDto(savedUser);
    }


    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(false);
        userRepository.save(user);
    }

    private void addUserToCurrentCycle(User user, Cycle cycle) {
        // Find the last assignment date in the cycle
        List<PartyAssignment> assignments = assignmentRepository.findByCycleOrderByPartyDateAsc(cycle);
        
        LocalDate nextDate;
        if (assignments.isEmpty()) {
            nextDate = LocalDate.now();
        } else {
            nextDate = assignments.get(assignments.size() - 1).getPartyDate().plusDays(1);
        }
        
        // Find next valid working day
        nextDate = getNextWorkingDay(nextDate);
        
        PartyAssignment assignment = new PartyAssignment();
        assignment.setUser(user);
        assignment.setCycle(cycle);
        assignment.setPartyDate(nextDate);
        assignment.setCompleted(false);
        assignmentRepository.save(assignment);
    }

    // ===================== HOLIDAYS =====================

    public List<HolidayDto> getAllHolidays() {
        return holidayRepository.findAll().stream()
                .map(h -> new HolidayDto(h.getId(), h.getHolidayDate(), h.getDescription()))
                .collect(Collectors.toList());
    }

    @Transactional
    public HolidayDto addHoliday(CreateHolidayRequest request) {
        if (holidayRepository.existsByHolidayDate(request.getHolidayDate())) {
            throw new RuntimeException("Holiday already exists for this date");
        }
        Holiday holiday = new Holiday();
        holiday.setHolidayDate(request.getHolidayDate());
        holiday.setDescription(request.getDescription());
        holiday = holidayRepository.save(holiday);

        // Shift any assignment on this date forward
        shiftAssignmentIfOnHoliday(request.getHolidayDate());

        return new HolidayDto(holiday.getId(), holiday.getHolidayDate(), holiday.getDescription());
    }

    public void deleteHoliday(Long id) {
        holidayRepository.deleteById(id);
    }

    private void shiftAssignmentIfOnHoliday(LocalDate holidayDate) {
        List<PartyAssignment> matches = assignmentRepository.findByPartyDateAndActiveCycle(holidayDate);
        if (!matches.isEmpty()) {
            PartyAssignment assignment = matches.get(0);
            LocalDate newDate = getNextWorkingDay(holidayDate.plusDays(1));
            assignment.setPartyDate(newDate);
            assignment.setUpdatedAt(java.time.LocalDateTime.now());
            assignmentRepository.save(assignment);
        }
    }

    // ===================== CYCLES =====================

    public Optional<CycleDto> getActiveCycle() {
        return cycleRepository.findByActiveTrue().map(this::toCycleDto);
    }

    @Transactional
    public CycleDto startNewCycle(StartCycleRequest request) {
        // Delete assignments and deactivate current cycle
        cycleRepository.findByActiveTrue().ifPresent(c -> {
            assignmentRepository.deleteByCycle(c);
            c.setActive(false);
            cycleRepository.save(c);
        });

        // Create new cycle
        int nextCycleNumber = cycleRepository.findTopByOrderByCycleNumberDesc()
                .map(c -> c.getCycleNumber() + 1).orElse(1);

        Cycle cycle = new Cycle();
        cycle.setCycleNumber(nextCycleNumber);
        cycle.setStartDate(request.getStartDate());
        cycle.setActive(true);
        cycle = cycleRepository.save(cycle);

        // Create assignments in order
        LocalDate currentDate = request.getStartDate();
        for (Long userId : request.getUserIds()) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found: " + userId));

            currentDate = getNextWorkingDay(currentDate);

            PartyAssignment assignment = new PartyAssignment();
            assignment.setUser(user);
            assignment.setCycle(cycle);
            assignment.setPartyDate(currentDate);
            assignment.setCompleted(false);
            assignmentRepository.save(assignment);

            currentDate = currentDate.plusDays(1);
        }

        return toCycleDto(cycle);
    }

    // ===================== ASSIGNMENTS =====================

    public TodayPartyResponse getTodayParty() {
        LocalDate today = LocalDate.now();
        TodayPartyResponse response = new TodayPartyResponse();
        response.setDate(today);

        // Check weekend
        DayOfWeek dow = today.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
            response.setWeekend(true);
            return response;
        }

        // Check holiday
        if (holidayRepository.existsByHolidayDate(today)) {
            response.setHoliday(true);
            return response;
        }

        // Find today's assignment in the active cycle only
        List<PartyAssignment> todayMatches = assignmentRepository.findByPartyDateAndActiveCycle(today);
        if (!todayMatches.isEmpty()) {
            PartyAssignment a = todayMatches.get(0);
            response.setUserName(a.getUser().getName());
            response.setAssignment(toAssignmentDto(a));
        }

        return response;
    }

    public List<PartyAssignmentDto> getCurrentCycleAssignments() {
        return assignmentRepository.findCurrentCycleAssignments().stream()
                .map(this::toAssignmentDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public PartyAssignmentDto reassignParty(ReassignRequest request) {
        PartyAssignment assignment = assignmentRepository.findById(request.getAssignmentId())
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        LocalDate newDate = request.getNewDate();

        // Check if target date has another assignment in active cycle - if so, swap
        List<PartyAssignment> existingList = assignmentRepository.findByPartyDateAndActiveCycle(newDate);
        Optional<PartyAssignment> existingOnDate = existingList.isEmpty() ? Optional.empty() : Optional.of(existingList.get(0));
        if (existingOnDate.isPresent() && !existingOnDate.get().getId().equals(assignment.getId())) {
            // Swap dates
            PartyAssignment other = existingOnDate.get();
            LocalDate oldDate = assignment.getPartyDate();
            other.setPartyDate(oldDate);
            other.setUpdatedAt(java.time.LocalDateTime.now());
            assignmentRepository.save(other);
        }

        assignment.setPartyDate(newDate);
        assignment.setUpdatedAt(java.time.LocalDateTime.now());
        assignment = assignmentRepository.save(assignment);
        return toAssignmentDto(assignment);
    }

    @Transactional
    public List<PartyAssignmentDto> dragAllFromDate(DragAllRequest request) {
        // Move all assignments from fromDate onwards to start at toDate
        Cycle cycle = cycleRepository.findByActiveTrue()
                .orElseThrow(() -> new RuntimeException("No active cycle"));

        List<PartyAssignment> assignments = assignmentRepository.findByCycleOrderByPartyDateAsc(cycle)
                .stream()
                .filter(a -> !a.getPartyDate().isBefore(request.getFromDate()))
                .collect(Collectors.toList());

        LocalDate currentDate = request.getToDate();
        for (PartyAssignment assignment : assignments) {
            currentDate = getNextWorkingDay(currentDate);
            assignment.setPartyDate(currentDate);
            assignment.setUpdatedAt(java.time.LocalDateTime.now());
            assignmentRepository.save(assignment);
            currentDate = currentDate.plusDays(1);
        }

        return getCurrentCycleAssignments();
    }

    @Transactional
    public PartyAssignmentDto markCompleted(Long assignmentId) {
        PartyAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        assignment.setCompleted(true);
        assignment.setUpdatedAt(java.time.LocalDateTime.now());
        assignment = assignmentRepository.save(assignment);
        return toAssignmentDto(assignment);
    }

    @Transactional
    public List<PartyAssignmentDto> swapAssignments(SwapAssignmentRequest request) {
        PartyAssignment a1 = assignmentRepository.findById(request.getAssignmentId1())
                .orElseThrow(() -> new RuntimeException("Assignment 1 not found"));
        PartyAssignment a2 = assignmentRepository.findById(request.getAssignmentId2())
                .orElseThrow(() -> new RuntimeException("Assignment 2 not found"));

        LocalDate temp = a1.getPartyDate();
        a1.setPartyDate(a2.getPartyDate());
        a2.setPartyDate(temp);
        a1.setUpdatedAt(java.time.LocalDateTime.now());
        a2.setUpdatedAt(java.time.LocalDateTime.now());

        assignmentRepository.save(a1);
        assignmentRepository.save(a2);

        return List.of(toAssignmentDto(a1), toAssignmentDto(a2));
    }

    // ===================== HELPERS =====================

    private LocalDate getNextWorkingDay(LocalDate date) {
        while (isNotWorkingDay(date)) {
            date = date.plusDays(1);
        }
        return date;
    }

    private boolean isNotWorkingDay(LocalDate date) {
        DayOfWeek dow = date.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) return true;
        return holidayRepository.existsByHolidayDate(date);
    }

    private UserDto toUserDto(User user) {
        return new UserDto(user.getId(), user.getName(), user.isActive(), user.getCycleOrder());
    }

    private CycleDto toCycleDto(Cycle cycle) {
        return new CycleDto(cycle.getId(), cycle.getCycleNumber(),
                cycle.getStartDate(), cycle.getEndDate(), cycle.isActive());
    }

    private PartyAssignmentDto toAssignmentDto(PartyAssignment a) {
        LocalDate today = LocalDate.now();
        boolean isToday = a.getPartyDate().equals(today);
        boolean isHoliday = holidayRepository.existsByHolidayDate(a.getPartyDate());
        return new PartyAssignmentDto(
                a.getId(), a.getUser().getId(), a.getUser().getName(),
                a.getPartyDate(), a.isCompleted(), a.getCycle().getId(),
                isToday, isHoliday
        );
    }
}
