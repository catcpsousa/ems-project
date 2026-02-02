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
public class DigitalTicketResponse {
    private String ticketCode;
    private String eventTitle;
    private LocalDateTime eventStartTime;
    private String eventLocation;
    private String seatNumber;
    private String participantName;
    private String qrCodeData;
}
