package com.ems.backend.modules.booking.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventFeedbackRequest {
    private Long eventId;
    private Integer rating; // e.g., 1 to 5
    private String comment;
}
