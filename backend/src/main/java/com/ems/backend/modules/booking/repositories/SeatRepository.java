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

    // Encontrar assentos com lock expirado
    @Query("SELECT s FROM Seat s WHERE s.status = :status AND s.lockExpiresAt < :now")
    List<Seat> findExpiredLocks(@Param("status") SeatStatus status, @Param("now") LocalDateTime now);

    // Libertar locks expirados em batch
    @Modifying
    @Query("UPDATE Seat s SET s.status = 'AVAILABLE', s.lockedBy = null, s.lockExpiresAt = null " +
           "WHERE s.status = 'LOCKED' AND s.lockExpiresAt < :now")
    int releaseExpiredLocks(@Param("now") LocalDateTime now);
}
