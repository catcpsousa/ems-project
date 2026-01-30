package com.ems.backend.modules.booking.repositories;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ems.backend.modules.booking.entities.Seat;
import com.ems.backend.modules.booking.entities.SeatStatus;

import jakarta.persistence.LockModeType;

public interface SeatRepository extends JpaRepository<Seat, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Seat s WHERE s.id = :id")
    Optional<Seat> findByIdWithLock(@Param("id") Long id);

    Optional<Seat> findBySeatNumber(String seatNumber);

    // Find all seats for a specific event
    List<Seat> findByEventId(Long eventId);

    // count seats by event and status
    @Query("SELECT COUNT(s) FROM Seat s WHERE s.event.id = :eventId AND s.status = :status")
    Long countByEventIdAndStatus(@Param("eventId") Long eventId, @Param("status") SeatStatus status);

    // count total seats for an event
    Long countByEventId(Long eventId);

    // Find seats with expired lock
    @Query("SELECT s FROM Seat s WHERE s.status = :status AND s.lockExpiresAt < :now")
    List<Seat> findExpiredLocks(@Param("status") SeatStatus status, @Param("now") LocalDateTime now);

    // Release expired locks in batch
    @Modifying
    @Query("UPDATE Seat s SET s.status = 'AVAILABLE', s.lockedBy = null, s.lockExpiresAt = null " +
           "WHERE s.status = 'LOCKED' AND s.lockExpiresAt < :now")
    int releaseExpiredLocks(@Param("now") LocalDateTime now);

    // Find participants (booked seats) of an event
    @Query("SELECT s FROM Seat s WHERE s.event.id = :eventId AND s.status = 'BOOKED'")
    List<Seat> findBookedSeatsByEventId(@Param("eventId") Long eventId);
}
