package com.partytracker.controller;

import com.partytracker.dto.Dtos.*;
import com.partytracker.service.PartyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PartyController {

    private final PartyService partyService;

    // ===================== AUTH =====================

    @PostMapping("/admin/login")
    public ResponseEntity<AdminLoginResponse> adminLogin(@RequestBody AdminLoginRequest request) {
        return ResponseEntity.ok(partyService.adminLogin(request));
    }

    // ===================== USERS =====================

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(partyService.getAllUsers());
    }

    @PostMapping("/admin/users")
    public ResponseEntity<UserDto> createUser(@RequestBody CreateUserRequest request) {
        return ResponseEntity.ok(partyService.createUser(request));
    }

    @DeleteMapping("/admin/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        partyService.deleteUser(id);
        return ResponseEntity.ok().build();
    }

    // ===================== HOLIDAYS =====================

    @GetMapping("/holidays")
    public ResponseEntity<List<HolidayDto>> getAllHolidays() {
        return ResponseEntity.ok(partyService.getAllHolidays());
    }

    @PostMapping("/admin/holidays")
    public ResponseEntity<HolidayDto> addHoliday(@RequestBody CreateHolidayRequest request) {
        return ResponseEntity.ok(partyService.addHoliday(request));
    }

    @DeleteMapping("/admin/holidays/{id}")
    public ResponseEntity<Void> deleteHoliday(@PathVariable Long id) {
        partyService.deleteHoliday(id);
        return ResponseEntity.ok().build();
    }

    // ===================== CYCLES =====================

    @GetMapping("/cycle/active")
    public ResponseEntity<?> getActiveCycle() {
        return ResponseEntity.ok(partyService.getActiveCycle().orElse(null));
    }

    @PostMapping("/admin/cycle/start")
    public ResponseEntity<CycleDto> startNewCycle(@RequestBody StartCycleRequest request) {
        return ResponseEntity.ok(partyService.startNewCycle(request));
    }

    // ===================== TODAY =====================

    @GetMapping("/today")
    public ResponseEntity<TodayPartyResponse> getTodayParty() {
        return ResponseEntity.ok(partyService.getTodayParty());
    }

    // ===================== ASSIGNMENTS =====================

    @GetMapping("/assignments")
    public ResponseEntity<List<PartyAssignmentDto>> getCurrentCycleAssignments() {
        return ResponseEntity.ok(partyService.getCurrentCycleAssignments());
    }

    @PutMapping("/admin/assignments/reassign")
    public ResponseEntity<PartyAssignmentDto> reassignParty(@RequestBody ReassignRequest request) {
        return ResponseEntity.ok(partyService.reassignParty(request));
    }

    @PutMapping("/admin/assignments/drag-all")
    public ResponseEntity<List<PartyAssignmentDto>> dragAllFromDate(@RequestBody DragAllRequest request) {
        return ResponseEntity.ok(partyService.dragAllFromDate(request));
    }

    @PutMapping("/admin/assignments/swap")
    public ResponseEntity<List<PartyAssignmentDto>> swapAssignments(@RequestBody SwapAssignmentRequest request) {
        return ResponseEntity.ok(partyService.swapAssignments(request));
    }

    @PutMapping("/admin/assignments/{id}/complete")
    public ResponseEntity<PartyAssignmentDto> markCompleted(@PathVariable Long id) {
        return ResponseEntity.ok(partyService.markCompleted(id));
    }
}
