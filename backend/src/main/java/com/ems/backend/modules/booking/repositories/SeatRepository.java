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

    List<Seat> findByEventId(Long eventId);

    @Query("SELECT COUNT(s) FROM Seat s WHERE s.event.id = :eventId AND s.status = :status")
    Long countByEventIdAndStatus(@Param("eventId") Long eventId, @Param("status") SeatStatus status);

    Long countByEventId(Long eventId);

    @Query("SELECT s FROM Seat s WHERE s.status = :status AND s.lockExpiresAt < :now")
    List<Seat> findExpiredLocks(@Param("status") SeatStatus status, @Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE Seat s SET s.status = 'AVAILABLE', s.lockedBy = null, s.lockExpiresAt = null " +
           "WHERE s.status = 'LOCKED' AND s.lockExpiresAt < :now")
    int releaseExpiredLocks(@Param("now") LocalDateTime now);

    @Query("SELECT s FROM Seat s WHERE s.event.id = :eventId AND s.status = 'BOOKED'")
    List<Seat> findBookedSeatsByEventId(@Param("eventId") Long eventId);

    // Novos métodos para o participante
    @Query("SELECT s FROM Seat s WHERE s.lockedBy = :username AND s.status = 'BOOKED'")
    List<Seat> findBookedSeatsByUsername(@Param("username") String username);

    @Query("SELECT s FROM Seat s JOIN FETCH s.event WHERE s.lockedBy = :username AND s.status = 'BOOKED'")
    List<Seat> findBookedSeatsWithEventByUsername(@Param("username") String username);

    // Admin queries - count bookings by a specific user (using lockedBy as the booker identifier)
    @Query("SELECT COUNT(s) FROM Seat s WHERE s.lockedBy = :username AND s.status = 'BOOKED'")
    Long countBookedByUsername(@Param("username") String username);

    @Query("SELECT COUNT(s) FROM Seat s WHERE s.status = 'BOOKED' AND s.bookedAt > :after")
    Long countBookedAfter(@Param("after") LocalDateTime after);
}
