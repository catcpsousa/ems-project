package com.ems.backend.modules.booking.entities;

import com.ems.backend.modules.event.entities.Event;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "seats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String seatNumber; // e.g., "A-1", "B-2"

    @Enumerated(EnumType.STRING)
    private SeatStatus status; // AVAILABLE, RESERVED, OCCUPIED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event;

    // Versão para Optimistic Locking (opcional, mas bom ter como fallback)
    @Version
    private Long version;
}
