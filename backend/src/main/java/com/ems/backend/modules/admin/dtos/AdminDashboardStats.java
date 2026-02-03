package com.ems.backend.modules.admin.dtos;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStats {
    private Long totalUsers;
    private Long activeUsers;
    private Long totalEvents;
    private Long publishedEvents;
    private Long totalOrganizers;
    private Long totalParticipants;
    private Long pendingReports;
    private Long errorsToday;
    private Long bookingsToday;
    private Map<String, Long> usersByRole;
    private Map<String, Long> eventsByStatus;
}
