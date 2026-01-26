package com.ems.backend.modules.booking.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ems.backend.modules.booking.entities.Seat;
import com.ems.backend.modules.booking.repositories.SeatRepository;
import com.ems.backend.modules.booking.services.BookingService;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final SeatRepository seatRepository;

    private final BookingService bookingService;

    // POST /api/bookings/seats/{id}/reserve
    @PostMapping("/seats/{seatId}/reserve")
    public ResponseEntity<String> reserveSeat(@PathVariable Long seatId) {
        try {
            Seat seat = bookingService.reserveSeat(seatId);
            return ResponseEntity.ok("Seat " + seat.getSeatNumber() + " reserved successfully.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    //auxiliar endpoint to create seats for testing
    @PostMapping("/seats")
    public ResponseEntity<Seat> createSeat(@RequestParam("number") String seatNumber) {
        return ResponseEntity.ok(bookingService.createSeat(seatNumber));
    }

    //method to read the seat
    @GetMapping("/seats/{seatId}")
    public ResponseEntity<Seat> getSeat(@PathVariable("id") Long seatId){
        return ResponseEntity.ok(bookingService.getSeat(seatId));
    }

    //method to read the seat by its number
    @GetMapping("/seats/number/{seatNumber}")
    public ResponseEntity<Seat> getSeatByNumber(@PathVariable String seatNumber) {
        return ResponseEntity.ok(bookingService.getSeatByNumber(seatNumber));
    }
    
    @GetMapping("/seats")
    public ResponseEntity<List<Seat>> getAllSeats(){
        // This method would require a corresponding service method to fetch all seats
        // Assuming such a method exists in BookingService
        return ResponseEntity.ok(seatRepository.findAll());
    }
}
