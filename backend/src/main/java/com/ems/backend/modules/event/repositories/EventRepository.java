package com.ems.backend.modules.event.repositories;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

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

    // Admin queries
    @Query("SELECT e.status, COUNT(e) FROM Event e GROUP BY e.status")
    List<Object[]> countGroupedByStatus();

    default Map<String, Long> countByStatus() {
        return countGroupedByStatus().stream()
                .collect(Collectors.toMap(
                        arr -> ((EventStatus) arr[0]).name(),
                        arr -> (Long) arr[1]
                ));
    }
}
