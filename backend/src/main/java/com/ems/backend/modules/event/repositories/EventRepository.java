package com.ems.backend.modules.event.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ems.backend.modules.event.entities.Event;
import com.ems.backend.modules.event.entities.EventStatus;

public interface EventRepository extends JpaRepository<Event, Long> {
    // Find events by organizer
    List<Event> findByOrganizerId(Long organizerId);

    // Find events by organizer and status
    List<Event> findByOrganizerIdAndStatus(Long organizerId, EventStatus status);

    // Count events by organizer
    Long countByOrganizerId(Long organizerId);

    // Find published events
    List<Event> findByStatus(EventStatus status);
}
