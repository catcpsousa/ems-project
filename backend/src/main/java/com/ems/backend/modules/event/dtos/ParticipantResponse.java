package com.ems.backend.modules.event.dtos;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipantResponse {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String seatNumber;
    private LocalDateTime bookedAt;
}
