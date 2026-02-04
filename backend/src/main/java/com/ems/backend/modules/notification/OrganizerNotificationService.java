package com.ems.backend.modules.notification;

import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.util.List;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.ems.backend.modules.auth.entities.User;
import com.ems.backend.modules.auth.repositories.UserRepository;
import com.ems.backend.modules.booking.entities.Seat;
import com.ems.backend.modules.booking.repositories.SeatRepository;
import com.ems.backend.modules.event.entities.Event;
import com.ems.backend.modules.event.repositories.EventRepository;
import com.ems.backend.modules.notification.entities.UserNotification;
import com.ems.backend.modules.notification.repositories.UserNotificationRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizerNotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final SeatRepository seatRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final UserNotificationRepository userNotificationRepository;

    /*
        Notifies the organizer about a new reservation
    */
    public void notifyNewBooking(Long eventId, String participantName, String seatNumber){
        Map<String, Object> notification = Map.of(
            "type", "NEW_BOOKING",
            "eventId", eventId,
            "participantName", participantName,
            "seatNumber", seatNumber,
            "message", participantName + " reservou o lugar " + seatNumber + " no teu evento."
        );
        messagingTemplate.convertAndSend("/topic/organizer/" + eventId, notification);
        log.info("Notification sent: new booking for event {}", eventId);
    }

    /*
        Notifies the organizer about a canceled reservation
    */
    public void notifyCanceledBooking(Long eventId, String participantName, String seatNumber){
        Map<String, Object> notification = Map.of(
            "type", "CANCELED_BOOKING",
            "eventId", eventId,
            "participantName", participantName,
            "seatNumber", seatNumber,
            "message", participantName + " cancelou a reserva do lugar " + seatNumber + " no teu evento."
        );
        messagingTemplate.convertAndSend("/topic/organizer/" + eventId, notification);
        log.info("Notification sent: canceled booking for event {}", eventId);
    }

    /*
        Sends an urgent notification to ALL participants of an event
        - Saves to database for each participant
        - Also sends via WebSocket for real-time
    */
    @Transactional
    public void sendUrgentMessage(Long eventId, String message){
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new RuntimeException("Event not found"));
        
        // Get all booked seats (participants) for this event
        List<Seat> bookedSeats = seatRepository.findBookedSeatsByEventId(eventId);
        
        log.info("📧 Sending message to {} seats of event '{}'", bookedSeats.size(), event.getTitle());
        
        // Collect unique usernames (a user might have multiple seats)
        Set<String> notifiedUsernames = new HashSet<>();
        int notificationCount = 0;
        
        for (Seat seat : bookedSeats) {
            String username = seat.getLockedBy();
            
            // Skip if already notified this user or username is null
            if (username == null || notifiedUsernames.contains(username)) {
                continue;
            }
            
            // Find the user
            User participant = userRepository.findByUsername(username).orElse(null);
            if (participant != null) {
                UserNotification notification = UserNotification.builder()
                    .user(participant)
                    .event(event)
                    .type("ORGANIZER_MESSAGE")
                    .title("Mensagem do Organizador: " + event.getTitle())
                    .message(message)
                    .isRead(false)
                    .build();
                
                userNotificationRepository.save(notification);
                notifiedUsernames.add(username);
                notificationCount++;
                log.debug("📬 Notification saved for user {}", username);
            }
        }
        
        // Also send via WebSocket for real-time delivery
        Map<String, Object> wsNotification = Map.of(
            "type", "URGENT_MESSAGE",
            "eventId", eventId,
            "eventTitle", event.getTitle(),
            "message", message
        );
        messagingTemplate.convertAndSend("/topic/event/" + eventId + "/announcements", wsNotification);
        
        log.info("✅ Message sent to {} unique participants and saved to database", notificationCount);
    }

    /*
        Notifies  all the participants about schedule changes
    */
    @Transactional
    public void notifyScheduleChange(Long eventId, String oldStartTime, String newStartTime, String oldEndTime, String newEndTime){
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new RuntimeException("Event not found"));
        
        List<Seat> bookedSeats = seatRepository.findBookedSeatsByEventId(eventId);
        
        log.info("📧 Notifying schedule change to {} seats of event '{}'", bookedSeats.size(), event.getTitle());
        
        Set<String> notifiedUsernames = new HashSet<>();
        int notificationCount = 0;
        
        // Build the message
        StringBuilder messageBuilder = new StringBuilder();
        messageBuilder.append("O horário do evento foi alterado.\n");
        if (oldStartTime != null && newStartTime != null) {
            messageBuilder.append("Início: de ").append(oldStartTime).append(" para ").append(newStartTime).append("\n");
        }
        if (oldEndTime != null && newEndTime != null) {
            messageBuilder.append("Fim: de ").append(oldEndTime).append(" para ").append(newEndTime).append("\n");
        }
        String message = messageBuilder.toString().trim();
        for (Seat seat : bookedSeats) {
            String username = seat.getLockedBy();
            
            if (username == null || notifiedUsernames.contains(username)) {
                continue;
            }
            
            User participant = userRepository.findByUsername(username).orElse(null);
            if (participant != null) {
                UserNotification notification = UserNotification.builder()
                    .user(participant)
                    .event(event)
                    .type("EVENT_UPDATE")
                    .title("Alteração de Horário: " + event.getTitle())
                    .message(message)
                    .isRead(false)
                    .build();
                
                userNotificationRepository.save(notification);
                notifiedUsernames.add(username);
                notificationCount++;
            }
        }
        
        
        log.info("✅ Schedule change notifications sent to {} unique participants", notificationCount);
    }
}
