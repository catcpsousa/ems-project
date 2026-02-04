package com.ems.backend.modules.event.services;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import com.ems.backend.modules.auth.entities.User;
import com.ems.backend.modules.auth.repositories.UserRepository;
import com.ems.backend.modules.booking.entities.Seat;
import com.ems.backend.modules.booking.entities.SeatStatus;
import com.ems.backend.modules.booking.repositories.SeatRepository;
import com.ems.backend.modules.event.dtos.CreateEventRequest;
import com.ems.backend.modules.event.dtos.EventResponse;
import com.ems.backend.modules.event.dtos.EventStatsResponse;
import com.ems.backend.modules.event.dtos.OrganizerDashboardStats;
import com.ems.backend.modules.event.dtos.ParticipantResponse;
import com.ems.backend.modules.event.entities.Event;
import com.ems.backend.modules.event.entities.EventStatus;
import com.ems.backend.modules.event.repositories.EventRepository;
import com.ems.backend.modules.notification.OrganizerNotificationService;

import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {

    private final EventRepository eventRepository;
    private final SeatRepository seatRepository;
    private final UserRepository userRepository;
    private final OrganizerNotificationService notificationService;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    /*
        Creates a new event (draft)
    */
   @Transactional
   public EventResponse createEvent(CreateEventRequest request, String organizerUsername){
        User organizer = userRepository.findByUsername(organizerUsername)
                .orElseThrow(() -> new RuntimeException("Organizer not found"));

        Event event = Event.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .coverImage(request.getCoverImage())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .location(request.getLocation())
                .onlineLink(request.getOnlineLink())
                .hasSeating(request.getHasSeating() != null ? request.getHasSeating() : true)
                .capacity(request.getCapacity())
                .seatRows(request.getSeatRows())
                .seatColumns(request.getSeatColumns())
                .ticketPrice(request.getTicketPrice() != null ? request.getTicketPrice() : BigDecimal.ZERO)
                .status(EventStatus.DRAFT)
                .organizer(organizer)
                .build();
        Event savedEvent = eventRepository.save(event);

        // Generate seats if the event has booked seatings
        if(Boolean.TRUE.equals(event.getHasSeating()) &&
            request.getSeatRows() != null && request.getSeatColumns() != null) {
            generateSeats(savedEvent, request.getSeatRows(), request.getSeatColumns());
        }
        log.info("✅ Event created with ID: {} by organizer: {}", savedEvent.getId(), organizerUsername);
        return toResponse(savedEvent);
   }

   /*
        Generate seats automatically
   */
    private void generateSeats(Event event, int rows, int columns) {
        // Implementation for seat generation
        List<Seat> seats = new ArrayList<>();
        for (int r = 0; r < rows && r < 26; r++) {
            char rowLetter = (char) ('A' + r);
            for (int col = 1; col <= columns; col++) {
                String seatNumber = "" + rowLetter + col;
                Seat seat = Seat.builder()
                        .event(event)
                        .seatNumber(seatNumber)
                        .status(SeatStatus.AVAILABLE)
                        .build();
                seats.add(seat);
            }
        }
        seatRepository.saveAll(seats);
        log.info("✅ Generated {} seats for event ID {}", seats.size(), event.getId());
    }

    /*
        Publish an event (DRAFT -> PUBLISHED)
    */
    @Transactional
    public EventResponse publishEvent(Long eventId, String organizerUsername) {
        Event event = getEventForOrganizer(eventId, organizerUsername);
        if(event.getStatus() != EventStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT events can be published");
        }
        event.setStatus(EventStatus.PUBLISHED);
        Event saved = eventRepository.save(event);
        log.info("✅ Event ID: {} published by organizer: {}", eventId, organizerUsername);
        return toResponse(saved);
    }

    /*
        Cancel an event (PUBLISHED -> CANCELLED)
    */
    @Transactional
    public EventResponse cancelEvent(Long eventId, String organizerUsername) {
        Event event = getEventForOrganizer(eventId, organizerUsername);
        event.setStatus(EventStatus.CANCELLED);
        Event saved = eventRepository.save(event);

        log.info("✅ Event ID: {} cancelled by organizer: {}", eventId, organizerUsername);
        return toResponse(saved);
    }

    /*
        Update event details
    */
    @Transactional
    public EventResponse updateEvent(Long eventId, CreateEventRequest request, String organizerUsername) {
        Event event = getEventForOrganizer(eventId, organizerUsername);

        // Check if the schedule changer
        boolean isScheduleChanged = false;
        LocalDateTime oldStartTime = event.getStartTime();
        LocalDateTime oldEndTime = event.getEndTime();
        LocalDateTime newStartTime = request.getStartTime();
        LocalDateTime newEndTime = request.getEndTime();

        if(newStartTime != null && !newStartTime.equals(oldStartTime)) {
            isScheduleChanged = true;
        }
        if(newEndTime != null && !newEndTime.equals(oldEndTime)) {
            isScheduleChanged = true;
        }

        // Apply updates
        if(request.getTitle() != null) event.setTitle(request.getTitle());
        if(request.getDescription() != null) event.setDescription(request.getDescription());
        if(request.getCategory() != null) event.setCategory(request.getCategory());
        if(request.getCoverImage() != null) event.setCoverImage(request.getCoverImage());
        if(request.getStartTime() != null) event.setStartTime(request.getStartTime());
        if(request.getEndTime() != null) event.setEndTime(request.getEndTime());
        if(request.getLocation() != null) event.setLocation(request.getLocation());
        if(request.getOnlineLink() != null) event.setOnlineLink(request.getOnlineLink());
        if(request.getTicketPrice() != null) event.setTicketPrice(request.getTicketPrice());

        Event saved = eventRepository.save(event);

        // Notify participants if schedule changed
        if(isScheduleChanged){
            log.info("⏰ Schedule changed for event ID: {}. Notifying participants...", eventId);
            notificationService.notifyScheduleChange(
                eventId,
                oldStartTime != null ? oldStartTime.format(DATE_TIME_FORMATTER) : null,
                newStartTime != null ? newStartTime.format(DATE_TIME_FORMATTER) : null,
                oldEndTime != null ? oldEndTime.format(DATE_TIME_FORMATTER) : null,
                newEndTime != null ? newEndTime.format(DATE_TIME_FORMATTER) : null
            );
        }

        return toResponse(saved);
    }

    /*
        Catches the events by organizer
    */
    @Transactional(readOnly = true)
    public List<EventResponse> getOrganizerEvents(String organizerUsername){
        User organizer = userRepository.findByUsername(organizerUsername)
            .orElseThrow(() -> new RuntimeException("Organizer not found"));
        return eventRepository.findByOrganizerId(organizer.getId())
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    /*
        returns the event stats
    */
    @Transactional(readOnly = true)
    public EventStatsResponse getEventStats(Long eventId, String organizerUsername) {
        Event event = getEventForOrganizer(eventId, organizerUsername);

        Long totalSeats = seatRepository.countByEventId(eventId);
        Long bookedSeats = seatRepository.countByEventIdAndStatus(eventId, SeatStatus.BOOKED);
        Long lockedSeats = seatRepository.countByEventIdAndStatus(eventId, SeatStatus.LOCKED);
        Long availableSeats = seatRepository.countByEventIdAndStatus(eventId, SeatStatus.AVAILABLE);

        //null protection
        long total = totalSeats != null ? totalSeats : 0L;
        long booked = bookedSeats != null ? bookedSeats : 0L;
        long locked = lockedSeats != null ? lockedSeats : 0L;
        long available = availableSeats != null ? availableSeats : 0L;

        double occupancyRate = total > 0 ? ((double) booked / total) * 100 : 0;
        BigDecimal ticketPrice = event.getTicketPrice() != null ? event.getTicketPrice() : BigDecimal.ZERO;
        BigDecimal totalRevenue = ticketPrice.multiply(BigDecimal.valueOf(booked));

        return EventStatsResponse.builder()
            .eventId(eventId)
            .eventTitle(event.getTitle())
            .totalSeats((int) total)
            .bookedSeats((int) booked)
            .lockedSeats((int) locked)
            .availableSeats((int) available)
            .occupancyRate(Math.round(occupancyRate * 100.0) / 100.0)
            .totalRevenue(totalRevenue)
            .build();
    }

    /*
        general general KPIS of the organizer
    */
    @Transactional(readOnly = true)
    public OrganizerDashboardStats getOrganizerDashboardStats(String organizerUsername) {
        User organizer = userRepository.findByUsername(organizerUsername)
            .orElseThrow(() -> new RuntimeException("Organizer not found"));

        List<Event> events = eventRepository.findByOrganizerId(organizer.getId());
        
        int totalEvents = events.size();
        long totalBookings = 0;
        long totalSeats = 0;
        BigDecimal totalRevenue = BigDecimal.ZERO;

        for (Event event : events){
            Long booked = seatRepository.countByEventIdAndStatus(event.getId(), SeatStatus.BOOKED);
            Long seats = seatRepository.countByEventId(event.getId());
            
            //null protection
            long bookedCount = booked != null ? booked : 0L;
            long seatsCount = seats != null ? seats : 0L;
            
            totalBookings += bookedCount;
            totalSeats += seatsCount;
            
            BigDecimal ticketPrice = event.getTicketPrice() != null ? event.getTicketPrice() : BigDecimal.ZERO;
            totalRevenue = totalRevenue.add(ticketPrice.multiply(BigDecimal.valueOf(bookedCount)));  // ✅
        }

        double averageOccupancy = totalSeats > 0 ? 
            ((double)totalBookings / totalSeats) * 100 : 0;

        return OrganizerDashboardStats.builder()
            .totalEvents(totalEvents)
            .totalBookings((int) totalBookings)
            .averageOccupancy(Math.round(averageOccupancy * 100.0) / 100.0)  // <-- CORRIGIR: dividir por 100.0
            .totalRevenue(totalRevenue)
            .build();
    }


    /*
        List of the participant's of an event
    */
    @Transactional(readOnly = true)
    public List<ParticipantResponse> getEventParticipants(Long eventId, String organizerUsername) {
        getEventForOrganizer(eventId, organizerUsername); // validate access

        List<Seat> bookedSeats = seatRepository.findBookedSeatsByEventId(eventId);
        return bookedSeats.stream()
            .map(seat -> {
                User user = userRepository.findByUsername(seat.getLockedBy()).orElse(null);
                return ParticipantResponse.builder()
                    .id(user != null ? user.getId() : null)
                    .username(seat.getLockedBy())
                    .fullName(user != null ? user.getFullName() : "N/A")
                    .email(user != null ? user.getEmail() : "N/A")
                    .seatNumber(seat.getSeatNumber())
                    .build();
            })
            .collect(Collectors.toList());
    }

    /*
        seats of an event
    */
    @Transactional(readOnly = true)
    public List<Seat> getEventSeats(Long eventId){
        return seatRepository.findByEventId(eventId);
    }

    /*
        Gets all published events(public)
    */
    @Transactional(readOnly = true)
    public List<EventResponse> getPublishedEvents() {
        return eventRepository.findByStatus(EventStatus.PUBLISHED)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    /*
      === Auxiliar methods ===
    */
    private Event getEventForOrganizer(Long eventId, String organizerUsername) {
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new RuntimeException("Event not found"));
        if(!event.getOrganizer().getUsername().equals(organizerUsername)) {
            throw new RuntimeException("Unauthorized access to event");
        }
        return event;
    }

    private EventResponse toResponse(Event event){
        return EventResponse.builder()
            .id(event.getId())
            .title(event.getTitle())
            .description(event.getDescription())
            .category(event.getCategory())
            .coverImage(event.getCoverImage())
            .startTime(event.getStartTime())
            .endTime(event.getEndTime())
            .location(event.getLocation())
            .onlineLink(event.getOnlineLink())
            .hasSeating(event.getHasSeating())
            .capacity (event.getCapacity())
            .seatRows(event.getSeatRows())
            .seatColumns(event.getSeatColumns())
            .ticketPrice(event.getTicketPrice())
            .status(event.getStatus())
            .organizerName(event.getOrganizer() != null ? event.getOrganizer().getFullName() : "N/A")
            .createdAt(event.getCreatedAt())
            .updatedAt(event.getUpdatedAt())
            .build();
    }

}
