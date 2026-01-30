package com.ems.backend.modules.event.dtos;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizerDashboardStats {
    private Integer totalEvents;
    private Integer totalBookings;
    private Double averageOccupancy;
    private BigDecimal totalRevenue;
}
