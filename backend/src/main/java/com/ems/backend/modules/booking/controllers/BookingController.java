package com.ems.backend.modules.booking.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ems.backend.modules.booking.entities.Seat;
import com.ems.backend.modules.booking.services.BookingService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    
    // POST /api/bookings/seats/{id}/reserve
    @PostMapping("/seats/{seatId}/reserve")
    public ResponseEntity<String> reserveSeat(@RequestBody Long seatId) {
        try {
            Seat seat = bookingService.reserveSeat(seatId);
            return ResponseEntity.ok("Seat " + seat.getSeatNumber() + " reserved successfully.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    //auxiliar endpoint to create seats for testing
    @PostMapping("/seats")
    public ResponseEntity<Seat> createSeat(@RequestBody String seatNumber){
        return ResponseEntity.ok(bookingService.createSeat(seatNumber));
    }
    
}
