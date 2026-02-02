package com.ems.backend.modules.booking.dtos;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventFeedbackResponse {
    private Long id;
    private Long eventId;
    private String eventTitle;
    private Integer rating; // e.g., 1 to 5
    private String comment;
    private LocalDateTime createdAt;
}
