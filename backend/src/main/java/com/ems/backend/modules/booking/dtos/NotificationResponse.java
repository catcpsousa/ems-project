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
public class NotificationResponse {
    private Long id;
    private String type;
    private String message;
    private Long eventId;
    private String eventTitle;
    private Boolean read;
    private LocalDateTime createdAt;
}
