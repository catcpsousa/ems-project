package com.ems.backend.modules.booking.services;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ems.backend.modules.auth.entities.User;
import com.ems.backend.modules.auth.repositories.UserRepository;
import com.ems.backend.modules.booking.dtos.DigitalTicketResponse;
import com.ems.backend.modules.booking.dtos.EventFeedbackRequest;
import com.ems.backend.modules.booking.dtos.EventFeedbackResponse;
import com.ems.backend.modules.booking.dtos.MyBookingResponse;
import com.ems.backend.modules.booking.dtos.NotificationResponse;
import com.ems.backend.modules.booking.entities.EventFeedback;
import com.ems.backend.modules.booking.entities.Seat;
import com.ems.backend.modules.booking.repositories.EventFeedbackRepository;
import com.ems.backend.modules.booking.repositories.SeatRepository;
import com.ems.backend.modules.event.entities.Event;
import com.ems.backend.modules.event.repositories.EventRepository;
import com.ems.backend.modules.notification.entities.UserNotification;
import com.ems.backend.modules.notification.repositories.UserNotificationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ParticipantService {

    private final SeatRepository seatRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final EventFeedbackRepository eventFeedbackRepository;
    private final UserNotificationRepository userNotificationRepository;

    /*
        Gets all the reservations made by a participant
    */
    @Transactional(readOnly = true)
    public List<MyBookingResponse> getMyBookings(String username) {
        List<Seat> bookedSeats = seatRepository.findBookedSeatsWithEventByUsername(username);
        
        LocalDate today = LocalDate.now();
        
        return bookedSeats.stream()
            .map(seat -> {
                Event event = seat.getEvent();
                String status = determineBookingStatus(event.getStartTime(), today);

                return MyBookingResponse.builder()
                    .bookingId(seat.getId())
                    .eventId(event.getId())
                    .eventTitle(event.getTitle())
                    .eventDescription(event.getDescription())
                    .eventCategory(event.getCategory())
                    .eventCoverImage(event.getCoverImage())
                    .eventStartTime(event.getStartTime())
                    .eventEndTime(event.getEndTime())
                    .eventLocation(event.getLocation())
                    .eventOnlineLink(event.getOnlineLink())
                    .seatNumber(seat.getSeatNumber())
                    .ticketPrice(event.getTicketPrice())
                    .organizerName(event.getOrganizer().getFullName())
                    .status(status)
                    .build();
            })
            .collect(Collectors.toList());
    }

    /*
        Gets all the events happening today for a participant
    */
    @Transactional(readOnly = true)
    public List<MyBookingResponse> getTodayEvents(String username) {
        return getMyBookings(username).stream()
            .filter(booking -> "TODAY".equals(booking.getStatus()))
            .collect(Collectors.toList());
    }

    /*
        Gets the digital ticket for a booking
    */
    @Transactional(readOnly = true)
    public DigitalTicketResponse getDigitalTicket(Long bookingId, String username) {
        Seat seat = seatRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        if(!username.equals(seat.getLockedBy())) {
            throw new RuntimeException("Access denied to this booking");
        }

        Event event = seat.getEvent();
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        String ticketCode = generateTicketCode(seat.getId(), event.getId());

        return DigitalTicketResponse.builder()
            .ticketCode(ticketCode)
            .eventTitle(event.getTitle())
            .eventStartTime(event.getStartTime())
            .eventLocation(event.getLocation() != null ? event.getLocation() : event.getOnlineLink())
            .seatNumber(seat.getSeatNumber())
            .participantName(user.getFullName())
            .qrCodeData(ticketCode) // the frontend can generate the QR code from this data
            .build();
    }

    /*
        Submits feedback for an event
    */
    @Transactional
    public EventFeedbackResponse submitFeedback(EventFeedbackRequest request, String username){
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        Event event = eventRepository.findById(request.getEventId())
            .orElseThrow(() -> new RuntimeException("Event not found"));

        //verify if the user participated in the event
        boolean hasBooking = seatRepository.findBookedSeatsWithEventByUsername(username)
            .stream()
            .anyMatch(seat -> seat.getEvent().getId().equals(event.getId()));
        if(!hasBooking){
            throw new RuntimeException("User has not participated in this event");
        };
        
        // verify if the user has already submitted feedback for this event
        if(eventFeedbackRepository.existsByEventIdAndUserId(request.getEventId(), user.getId())){
            throw new RuntimeException("Feedback already submitted for this event");
        }

        // validate rating
        if(request.getRating() < 1 || request.getRating() > 5){
            throw new RuntimeException("Rating must be between 1 and 5");
        }

        EventFeedback feedback = EventFeedback.builder()
            .event(event)
            .user(user)
            .rating(request.getRating())
            .comment(request.getComment())
            .build();

        EventFeedback saved = eventFeedbackRepository.save(feedback);
        log.info("User {} submitted feedback for event {}", username, event.getTitle());
        return toFeedbackResponse(saved);
    }

    /*
        Gets feedback from user
    */
    @Transactional(readOnly = true)
    public List<EventFeedbackResponse> getMyFeedbacks(String username){
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        return eventFeedbackRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
            .stream()
            .map(this::toFeedbackResponse)
            .collect(Collectors.toList());
    }

    /*
        Gets notifications for user
    */
    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(String username){
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        return userNotificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
            .stream()
            .map(this::toNotificationResponse)
            .collect(Collectors.toList());
    }

    /*
        Counts unread notifications for user
    */
    @Transactional(readOnly = true)
    public Long countUnreadNotifications(String username){
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        return userNotificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }

    /*
        Marks all notifications as read for user
    */
    @Transactional
    public void markAllNotificationsAsRead(String username){
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        userNotificationRepository.markAllAsRead(user.getId());
    }
    
    /*
        Auxiliar Methods
    */
    private String determineBookingStatus(LocalDateTime eventStart, LocalDate today){
        if(eventStart == null) return "UPCOMING";

        LocalDate eventDate = eventStart.toLocalDate();

        if(eventDate.isEqual(today)){
            return "TODAY";
        } else if(eventDate.isAfter(today)){
            return "UPCOMING";
        } else {
            return "PAST";
        }
    }

    private String generateTicketCode(Long seatId, Long eventId){
        return String.format("EMS-%d-%d-%s",
            eventId,
            seatId,
            UUID.randomUUID().toString().substring(0, 8).toUpperCase());
    }

    private EventFeedbackResponse toFeedbackResponse(EventFeedback eventFeedback) {
        return EventFeedbackResponse.builder()
            .id(eventFeedback.getId())
            .eventId(eventFeedback.getEvent().getId())
            .eventTitle(eventFeedback.getEvent().getTitle())
            .rating(eventFeedback.getRating())
            .comment(eventFeedback.getComment())
            .createdAt(eventFeedback.getCreatedAt())
            .build();
    }

    private NotificationResponse toNotificationResponse(UserNotification notification) {
        return NotificationResponse.builder()
            .id(notification.getId())
            .type(notification.getType())
            .message(notification.getMessage())
            .eventId(notification.getEvent() != null ? notification.getEvent().getId() : null)
            .eventTitle(notification.getEvent() != null ? notification.getEvent().getTitle() : null)
            .read(notification.getIsRead())
            .createdAt(notification.getCreatedAt())
            .build();
    }
}
