package com.ems.backend.modules.event.dtos;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEventRequest {

    // 1st step: general info
    private String title;
    private String description;
    private String category;
    private String coverImage;

    // 2nd step: logistics
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String location;   // physical location
    private String onlineLink; // link for online events

    // 3rd step: seating & pricing
    private Boolean hasSeating; // true = reserved seats, false = free entry
    private Integer capacity;   // total number of seats
    private Integer seatRows;   // number of seat rows (if hasSeating = true)
    private Integer seatColumns;// number of seat columns (if hasSeating = true)
    private BigDecimal ticketPrice;
}
