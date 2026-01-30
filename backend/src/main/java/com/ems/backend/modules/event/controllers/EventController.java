package com.ems.backend.modules.event.controllers;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
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

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    /*
        Creates a new event (draft)
    */
    @PostMapping
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
    public ResponseEntity<List<EventResponse>> getMyEvents(Principal principal){
        return ResponseEntity.ok(
            eventService.getOrganizerEvents(principal.getName()));
    }

    /*
        Gets the general statistics of the organizer
    */
    @GetMapping("/dashboard-stats")
    public ResponseEntity<OrganizerDashboardStats> getDashboardStats(Principal principal){
        return ResponseEntity.ok(
            eventService.getOrganizerDashboardStats(principal.getName()));
    }

    /*
        Publishes an event
    */
    @PostMapping("/{eventId}/publish")
    public ResponseEntity<EventResponse> publishEvent(@PathVariable Long eventId, Principal principal) {
        return ResponseEntity.ok(
            eventService.publishEvent(eventId, principal.getName()));
    }

    /*
        Cancels an event
    */
    @PostMapping("/{eventId}/cancel")
    public ResponseEntity<EventResponse> cancelEvent(@PathVariable Long eventId, Principal principal) {
        return ResponseEntity.ok(
            eventService.cancelEvent(eventId, principal.getName()));
    }

    /*
        Updates an event
    */
    @PostMapping("/{eventId}")
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
    public ResponseEntity<EventStatsResponse> getEventStats(
            @PathVariable Long eventId,
            Principal principal) {
        return ResponseEntity.ok(eventService.getEventStats(eventId, principal.getName()));
    }

    /*
        Gets the list of participants for an event
    */
    @GetMapping("/{eventId}/participants")
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
}
