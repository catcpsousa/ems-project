package com.ems.backend.modules.booking.entities;

public enum SeatStatus {
    AVAILABLE,   // Livre para reserva
    LOCKED,      // Bloqueado temporariamente (10 min)
    BOOKED       // Confirmado/Pago
}
