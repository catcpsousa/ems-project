package com.ems.backend.modules.booking.controllers;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.ems.backend.modules.booking.entities.Seat;
import com.ems.backend.modules.booking.services.BookingService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    /**
     * Bloqueia um assento temporariamente (10 min)
     * POST /api/bookings/seats/{seatId}/lock
     */
    @PostMapping("/seats/{seatId}/lock")
    public ResponseEntity<?> lockSeat(@PathVariable Long seatId, Principal principal) {
        try {
            Seat seat = bookingService.lockSeat(seatId, principal.getName());
            return ResponseEntity.ok(seat);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Confirma a reserva (LOCKED → BOOKED)
     * POST /api/bookings/seats/{seatId}/confirm
     */
    @PostMapping("/seats/{seatId}/confirm")
    public ResponseEntity<?> confirmBooking(@PathVariable Long seatId, Principal principal) {
        try {
            Seat seat = bookingService.confirmBooking(seatId, principal.getName());
            return ResponseEntity.ok(seat);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Liberta o lock (utilizador desistiu)
     * POST /api/bookings/seats/{seatId}/release
     */
    @PostMapping("/seats/{seatId}/release")
    public ResponseEntity<?> releaseLock(@PathVariable Long seatId, Principal principal) {
        try {
            Seat seat = bookingService.releaseLock(seatId, principal.getName());
            return ResponseEntity.ok(seat);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Criar assento (para testes)
     */
    @PostMapping("/seats")
    public ResponseEntity<Seat> createSeat(@RequestParam("number") String seatNumber) {
        return ResponseEntity.ok(bookingService.createSeat(seatNumber));
    }

    /**
     * Listar todos os assentos
     */
    @GetMapping("/seats")
    public ResponseEntity<List<Seat>> getAllSeats() {
        return ResponseEntity.ok(bookingService.getAllSeats());
    }

    /**
     * Obter assento por ID
     */
    @GetMapping("/seats/{seatId}")
    public ResponseEntity<Seat> getSeat(@PathVariable Long seatId) {
        return ResponseEntity.ok(bookingService.getSeat(seatId));
    }

    /**
     * Obter assento por número
     */
    @GetMapping("/seats/number/{seatNumber}")
    public ResponseEntity<Seat> getSeatByNumber(@PathVariable String seatNumber) {
        return ResponseEntity.ok(bookingService.getSeatByNumber(seatNumber));
    }
}