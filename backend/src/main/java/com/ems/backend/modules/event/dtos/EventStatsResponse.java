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
public class EventStatsResponse {
    private Long eventId;
    private String eventTitle;
    private Integer totalSeats;
    private Integer bookedSeats;
    private Integer lockedSeats;
    private Integer availableSeats;
    private Double occupancyRate; // in percentage
    private BigDecimal totalRevenue;

}
