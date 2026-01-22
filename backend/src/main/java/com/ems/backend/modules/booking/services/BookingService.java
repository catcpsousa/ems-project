package com.ems.backend.modules.booking.services;

import org.springframework.stereotype.Service;

import com.ems.backend.modules.booking.entities.Seat;
import com.ems.backend.modules.booking.entities.SeatStatus;
import com.ems.backend.modules.booking.repositories.SeatRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final SeatRepository seatRepository;

    // the annotation @Transactional is critical here
    // maintains the connection with the DB open while the Lock is active
    @Transactional
    public Seat reserveSeat(Long seatId){
        //1. Tries to search for the seat
        //Thanks to the @Lock in the repository, the code will stop here and wait (Pessimistic Lock)
        Seat seat = seatRepository.findByIdWithLock(seatId)
                .orElseThrow(() -> new RuntimeException("Seat not found"));
        //2. Check if the seat is available
        if(seat.getStatus() != SeatStatus.AVAILABLE){
            throw new RuntimeException("Seat is not available. Try another one.");
        }

        //3. Reserve the seat
        seat.setStatus(SeatStatus.RESERVED);

        // The save is implicit at the end of the transaction, but it can be called explicitly
        return seatRepository.save(seat);
    }

    //auxiliar method to create seats
    public Seat createSeat(String seatNumber){
        Seat seat = Seat.builder()
                .seatNumber(seatNumber)
                .status(SeatStatus.AVAILABLE)
                .build();
        return seatRepository.save(seat);
    }

    public Seat getSeat(Long seatId){
        return seatRepository.findById(seatId)
            .orElseThrow(() -> new RuntimeException("Seat not found"));
    }

    public Seat getSeatByNumber(String seatNumber) {
        return seatRepository.findBySeatNumber(seatNumber)
            .orElseThrow(() -> new RuntimeException("Seat not found"));
    }
}
