package com.partytracker.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;

public class Dtos {

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class UserDto {
        private Long id;
        private String name;
        private boolean active;
        private Integer cycleOrder;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class CreateUserRequest {
        private String name;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class AdminLoginRequest {
        private String password;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class AdminLoginResponse {
        private boolean success;
        private String message;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class PartyAssignmentDto {
        private Long id;
        private Long userId;
        private String userName;
        private LocalDate partyDate;
        private boolean completed;
        private Long cycleId;
        private boolean isToday;
        private boolean isHoliday;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class HolidayDto {
        private Long id;
        private LocalDate holidayDate;
        private String description;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class CreateHolidayRequest {
        private LocalDate holidayDate;
        private String description;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class ReassignRequest {
        private Long assignmentId;
        private LocalDate newDate;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class BulkReassignRequest {
        private LocalDate fromDate;
        private LocalDate toDate;
        private int shiftDays;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class StartCycleRequest {
        private List<Long> userIds; // ordered list
        private LocalDate startDate;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class TodayPartyResponse {
        private String userName;
        private LocalDate date;
        private boolean isHoliday;
        private boolean isWeekend;
        private PartyAssignmentDto assignment;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class CycleDto {
        private Long id;
        private Integer cycleNumber;
        private LocalDate startDate;
        private LocalDate endDate;
        private boolean active;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class DragAllRequest {
        private LocalDate fromDate;
        private LocalDate toDate;
    }

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class SwapAssignmentRequest {
        private Long assignmentId1;
        private Long assignmentId2;
    }
}
