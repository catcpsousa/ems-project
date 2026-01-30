package com.ems.backend.modules.event.dtos;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.ems.backend.modules.event.entities.EventStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private String coverImage;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String location;
    private String onlineLink;
    private Boolean hasSeating;
    private Integer capacity;
    private Integer seatRows;
    private Integer seatColumns;
    private BigDecimal ticketPrice;
    private EventStatus status;
    private String organizerName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
