package com.ems.backend.modules.booking.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ems.backend.modules.booking.entities.EventFeedback;

public interface EventFeedbackRepository extends JpaRepository<EventFeedback, Long> {
    List<EventFeedback> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<EventFeedback> findByEventIdOrderByCreatedAtDesc(Long eventId);

    Optional<EventFeedback> findByEventIdAndUserId(Long eventId, Long userId);

    boolean existsByEventIdAndUserId(Long eventId, Long userId);
}
