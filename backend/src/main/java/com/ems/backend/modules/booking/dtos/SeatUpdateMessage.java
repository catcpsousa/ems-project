package com.ems.backend.modules.booking.dtos;

import com.ems.backend.modules.booking.entities.SeatStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatUpdateMessage {
    private Long seatId;
    private String seatNumber;
    private SeatStatus status;
    private String lockedBy;
    private String message;
}
