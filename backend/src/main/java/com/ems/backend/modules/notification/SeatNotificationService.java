package com.ems.backend.modules.notification;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.ems.backend.modules.booking.dtos.SeatUpdateMessage;
import com.ems.backend.modules.booking.entities.Seat;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class SeatNotificationService {
    private final SimpMessagingTemplate messagingTemplate;

    public void notifySeatUpdate(Seat seat, String message) {
        SeatUpdateMessage update = SeatUpdateMessage.builder()
                .seatId(seat.getId())
                .seatNumber(seat.getSeatNumber())
                .status(seat.getStatus())
                .lockedBy(seat.getLockedBy())
                .message(message)
                .build();

        log.info("Notifying seat update: {}", update);
        messagingTemplate.convertAndSend("/topic/seats", update);
    }

    public void notifySeatsReleased(int count){
        if(count > 0){
            log.info("Released {} expired seat locks", count);
            // Notifies that there have been changes (client should refetch)
            messagingTemplate.convertAndSend("/topic/seats/refresh", count);
        }
    }
}
