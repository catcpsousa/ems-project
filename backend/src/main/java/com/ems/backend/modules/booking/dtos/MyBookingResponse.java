package com.ems.backend.modules.booking.dtos;

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
public class MyBookingResponse {
    private Long bookingId;
    private Long eventId;
    private String eventTitle;
    private String eventDescription;
    private String eventCategory;
    private String eventCoverImage;
    private LocalDateTime eventStartTime;
    private LocalDateTime eventEndTime;
    private String eventLocation;
    private String eventOnlineLink;
    private String seatNumber;
    private BigDecimal ticketPrice;
    private String organizerName;
    private String status; // UPCOMING, TODAY, PAST
}
