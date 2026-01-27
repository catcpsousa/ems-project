package com.ems.backend.modules.booking.services;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ems.backend.modules.booking.entities.Seat;
import com.ems.backend.modules.booking.entities.SeatStatus;
import com.ems.backend.modules.booking.repositories.SeatRepository;
import com.ems.backend.modules.notification.SeatNotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final SeatRepository seatRepository;
    private final SeatNotificationService notificationService;

    // Tempo de lock em minutos
    private static final int LOCK_DURATION_MINUTES = 10;

    /**
     * Bloqueia temporariamente um assento para o utilizador (10 min)
     */
    @Transactional
    public Seat lockSeat(Long seatId, String username) {
        Seat seat = seatRepository.findByIdWithLock(seatId)
                .orElseThrow(() -> new RuntimeException("Assento não encontrado"));

        // Verificar se já está locked por este utilizador
        if (seat.getStatus() == SeatStatus.LOCKED && username.equals(seat.getLockedBy())) {
            // Renovar o lock
            seat.setLockExpiresAt(LocalDateTime.now().plusMinutes(LOCK_DURATION_MINUTES));
            Seat saved = seatRepository.save(seat);
            notificationService.notifySeatUpdate(saved, "Lock renovado");
            return saved;
        }

        // Verificar se está disponível (ou se o lock expirou)
        if (seat.getStatus() == SeatStatus.LOCKED && !seat.isLockExpired()) {
            throw new RuntimeException("Assento já está bloqueado por outro utilizador");
        }

        if (seat.getStatus() == SeatStatus.BOOKED) {
            throw new RuntimeException("Assento já foi reservado");
        }

        // Bloquear o assento
        seat.setStatus(SeatStatus.LOCKED);
        seat.setLockedBy(username);
        seat.setLockExpiresAt(LocalDateTime.now().plusMinutes(LOCK_DURATION_MINUTES));

        Seat saved = seatRepository.save(seat);
        notificationService.notifySeatUpdate(saved, "Assento bloqueado por " + username);

        log.info("Seat {} locked by {} until {}", seatId, username, seat.getLockExpiresAt());
        return saved;
    }

    /**
     * Confirma a reserva (transição LOCKED → BOOKED)
     */
    @Transactional
    public Seat confirmBooking(Long seatId, String username) {
        Seat seat = seatRepository.findByIdWithLock(seatId)
                .orElseThrow(() -> new RuntimeException("Assento não encontrado"));

        if (seat.getStatus() != SeatStatus.LOCKED) {
            throw new RuntimeException("Assento não está bloqueado");
        }

        if (!username.equals(seat.getLockedBy())) {
            throw new RuntimeException("Este assento está bloqueado por outro utilizador");
        }

        if (seat.isLockExpired()) {
            seat.setStatus(SeatStatus.AVAILABLE);
            seat.setLockedBy(null);
            seat.setLockExpiresAt(null);
            seatRepository.save(seat);
            throw new RuntimeException("O tempo de reserva expirou. Tente novamente.");
        }

        // Confirmar reserva
        seat.setStatus(SeatStatus.BOOKED);
        seat.setLockExpiresAt(null); // Já não precisa de expiração

        Seat saved = seatRepository.save(seat);
        notificationService.notifySeatUpdate(saved, "Reserva confirmada por " + username);

        log.info("Seat {} booked by {}", seatId, username);
        return saved;
    }

    /**
     * Cancela o lock (utilizador desistiu)
     */
    @Transactional
    public Seat releaseLock(Long seatId, String username) {
        Seat seat = seatRepository.findByIdWithLock(seatId)
                .orElseThrow(() -> new RuntimeException("Assento não encontrado"));

        if (seat.getStatus() != SeatStatus.LOCKED) {
            throw new RuntimeException("Assento não está bloqueado");
        }

        if (!username.equals(seat.getLockedBy())) {
            throw new RuntimeException("Não podes libertar um assento bloqueado por outro utilizador");
        }

        seat.setStatus(SeatStatus.AVAILABLE);
        seat.setLockedBy(null);
        seat.setLockExpiresAt(null);

        Seat saved = seatRepository.save(seat);
        notificationService.notifySeatUpdate(saved, "Assento libertado");

        log.info("Seat {} released by {}", seatId, username);
        return saved;
    }

    /**
     * Liberta todos os locks expirados (chamado pelo scheduler)
     */
    @Transactional
    public int releaseExpiredLocks() {
        int released = seatRepository.releaseExpiredLocks(LocalDateTime.now());
        notificationService.notifySeatsReleased(released);
        return released;
    }

    // ====== Métodos auxiliares ======

    @Transactional
    public Seat createSeat(String seatNumber) {
        Seat seat = Seat.builder()
                .seatNumber(seatNumber)
                .status(SeatStatus.AVAILABLE)
                .build();
        Seat saved = seatRepository.save(seat);
        notificationService.notifySeatUpdate(saved, "Novo assento criado");
        return saved;
    }

    @Transactional(readOnly = true)
    public Seat getSeat(Long seatId) {
        return seatRepository.findById(seatId)
                .orElseThrow(() -> new RuntimeException("Assento não encontrado"));
    }

    @Transactional(readOnly = true)
    public Seat getSeatByNumber(String seatNumber) {
        return seatRepository.findBySeatNumber(seatNumber)
                .orElseThrow(() -> new RuntimeException("Assento não encontrado"));
    }

    @Transactional(readOnly = true)
    public List<Seat> getAllSeats() {
        return seatRepository.findAll();
    }
}