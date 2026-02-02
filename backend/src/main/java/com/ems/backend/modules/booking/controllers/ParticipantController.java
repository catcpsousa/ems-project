package com.ems.backend.modules.booking.controllers;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ems.backend.modules.booking.dtos.DigitalTicketResponse;
import com.ems.backend.modules.booking.dtos.EventFeedbackRequest;
import com.ems.backend.modules.booking.dtos.EventFeedbackResponse;
import com.ems.backend.modules.booking.dtos.MyBookingResponse;
import com.ems.backend.modules.booking.dtos.NotificationResponse;
import com.ems.backend.modules.booking.services.ParticipantService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/participant")
@RequiredArgsConstructor
public class ParticipantController {

    private final ParticipantService participantService;

    /*
        Gets all the reservations of a participant
    */
    @GetMapping("/bookings")
    public ResponseEntity<List<MyBookingResponse>> getMyBookings(Principal principal){
        return ResponseEntity.ok(
            participantService.getMyBookings(principal.getName()));
    }

    /*
        Gets all the events for today
    */
    @GetMapping("/today")
    public ResponseEntity<List<MyBookingResponse>> getTodayEvents(Principal principal){
        return ResponseEntity.ok(
            participantService.getTodayEvents(principal.getName()));
    }

    /*
        Get digital tickets for participant
    */
    @GetMapping("/bookings/{bookingId}/ticket")
    public ResponseEntity<DigitalTicketResponse> getDigitalTicket(
        @PathVariable Long bookingId,
        Principal principal){
            return ResponseEntity.ok(
                participantService.getDigitalTicket(bookingId, principal.getName()));
    }

    /*
        Submit feedback for an event
    */
    @PostMapping("/feedback")
    public ResponseEntity<EventFeedbackResponse> submitFeedback(
            @RequestBody EventFeedbackRequest request,
            Principal principal) {
        return ResponseEntity.ok(participantService.submitFeedback(request, principal.getName()));
    }

    /*
        Gets feedbacks from user
    */
    @GetMapping("/feedback")
    public ResponseEntity<List<EventFeedbackResponse>> getMyFeedbacks(Principal principal){
        return ResponseEntity.ok(
            participantService.getMyFeedbacks(principal.getName()));
    }

    /*
        Gets notifications for participant
    */
    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(Principal principal){
        return ResponseEntity.ok(
            participantService.getMyNotifications(principal.getName()));
    }

    /*
        Counts unread notifications for participant
    */
    @GetMapping("/notifications/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Principal principal){
        long count = participantService.countUnreadNotifications(principal.getName());
        return ResponseEntity.ok(Map.of("count", count));
    }

    /*
        Marks a notification as read
    */
    @PostMapping("/notifications/mark-read")
    public ResponseEntity<Void> markNotificationAsRead(Principal principal){
        participantService.markAllNotificationsAsRead(principal.getName());
        return ResponseEntity.ok().build();
    }
    
}
