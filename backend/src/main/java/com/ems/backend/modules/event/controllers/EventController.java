package com.ems.backend.modules.event.controllers;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ems.backend.modules.booking.entities.Seat;
import com.ems.backend.modules.event.dtos.CreateEventRequest;
import com.ems.backend.modules.event.dtos.EventResponse;
import com.ems.backend.modules.event.dtos.EventStatsResponse;
import com.ems.backend.modules.event.dtos.OrganizerDashboardStats;
import com.ems.backend.modules.event.dtos.ParticipantResponse;
import com.ems.backend.modules.event.services.EventService;
import com.ems.backend.modules.notification.OrganizerNotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Slf4j
public class EventController {

    private final EventService eventService;
    private final OrganizerNotificationService notificationService;

    /*
        Creates a new event (draft)
    */
    @PostMapping
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<EventResponse> createEvent(
        @RequestBody CreateEventRequest createEventRequest,
        Principal principal){
            return ResponseEntity.ok(
                eventService.createEvent(createEventRequest, principal.getName()));
    }
    
    /*
        Gets the events of an authenticated organizer
    */
    @GetMapping("/my-events")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<List<EventResponse>> getMyEvents(Principal principal){
        return ResponseEntity.ok(
            eventService.getOrganizerEvents(principal.getName()));
    }

    /*
        Gets the general statistics of the organizer
    */
    @GetMapping("/dashboard-stats")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<OrganizerDashboardStats> getDashboardStats(Principal principal){
        return ResponseEntity.ok(
            eventService.getOrganizerDashboardStats(principal.getName()));
    }

    /*
        Publishes an event
    */
    @PostMapping("/{eventId}/publish")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<EventResponse> publishEvent(@PathVariable Long eventId, Principal principal) {
        return ResponseEntity.ok(
            eventService.publishEvent(eventId, principal.getName()));
    }

    /*
        Cancels an event
    */
    @PostMapping("/{eventId}/cancel")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<EventResponse> cancelEvent(@PathVariable Long eventId, Principal principal) {
        return ResponseEntity.ok(
            eventService.cancelEvent(eventId, principal.getName()));
    }

    /*
        Updates an event
    */
    @PostMapping("/{eventId}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<EventResponse> updateEvent(
        @PathVariable Long eventId,
        @RequestBody CreateEventRequest updateEventRequest,
        Principal principal) {
            return ResponseEntity.ok(
                eventService.updateEvent(eventId, updateEventRequest, principal.getName()));
    }

    /*
        Gets event statistics by ID
    */
    @GetMapping("/{eventId}/stats")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<EventStatsResponse> getEventStats(
            @PathVariable Long eventId,
            Principal principal) {
        return ResponseEntity.ok(eventService.getEventStats(eventId, principal.getName()));
    }

    /*
        Gets the list of participants for an event
    */
    @GetMapping("/{eventId}/participants")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<List<ParticipantResponse>> getEventParticipants(
            @PathVariable Long eventId,
            Principal principal) {
        return ResponseEntity.ok(eventService.getEventParticipants(eventId, principal.getName()));
    }

    /*
        Gets the seats of an event
    */
    @GetMapping("/{eventId}/seats")
    public ResponseEntity<List<Seat>> getEventSeats(
            @PathVariable Long eventId) {
        return ResponseEntity.ok(eventService.getEventSeats(eventId));
    }

    /*
        Gets all published events
    */
    @GetMapping
    public ResponseEntity<List<EventResponse>> getPublishedEvents() {
        return ResponseEntity.ok(eventService.getPublishedEvents());
    }

    /*
        Sends a message to all participants of an event
    */
    @PostMapping("/{eventId}/message")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<?> sendMessageToParticipants(
            @PathVariable Long eventId,
            @RequestBody Map<String, String> body,
            Principal principal) {
        
        log.info("📧 === MESSAGE ENDPOINT HIT ===");
        log.info("📧 Event ID: {}", eventId);
        log.info("📧 Principal: {}", principal != null ? principal.getName() : "NULL");
        log.info("📧 Body: {}", body);
        log.info("📧 Sending message to event {} by user {}", eventId, principal.getName());
        
        try {
            // Verify if the organizer owns the event
            eventService.getEventStats(eventId, principal.getName());
            
            String message = body.get("message");
            if (message == null || message.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Message is required"));
            }
            
            notificationService.sendUrgentMessage(eventId, message);
            
            log.info("✅ Message sent successfully to event {}", eventId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Message sent successfully"));
        } catch (Exception e) {
            log.error("❌ Error sending message: {}", e.getMessage());
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }
}