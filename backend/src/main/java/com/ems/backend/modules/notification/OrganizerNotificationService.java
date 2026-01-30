package com.ems.backend.modules.notification;

import java.util.Map;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizerNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    /*
        Notifies the organizer about a new reservation
    */
    public void notifyNewBooking(Long eventId, String participantName, String seatNumber){
        Map<String, Object> notification = Map.of(
            "type", "NEW_BOOKING",
            "eventId", eventId,
            "participantName", participantName,
            "seatNumber", seatNumber,
            "message", participantName + " booked seat " + seatNumber + " for your event."
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
            "message", participantName + " canceled booking for seat " + seatNumber + " in your event."
        );
        messagingTemplate.convertAndSend("/topic/organizer/" + eventId, notification);
        log.info("Notification sent: canceled booking for event {}", eventId);
    }

    /*
        Sends an urgent notification to the participants of an event
    */
    public void sendUrgentMessage(Long eventId, String message){
        Map<String, Object> notification = Map.of(
            "type", "URGENT_MESSAGE",
            "eventId", eventId,
            "message", message
        );
        messagingTemplate.convertAndSend("/topic/event/" + eventId + "/announcements", notification);
        log.info("Urgent message sent to event {}: {}", eventId, message);
    }
}
