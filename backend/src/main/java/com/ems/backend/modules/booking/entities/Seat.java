package com.ems.backend.modules.booking.entities;

import com.ems.backend.modules.event.entities.Event;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

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
    private String seatNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SeatStatus status;

    // Quem bloqueou o assento (username)
    private String lockedBy;

    // Quando expira o lock (null se não está locked)
    private LocalDateTime lockExpiresAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    @JsonIgnore  // Evita erro de lazy loading na serialização
    private Event event;

    private LocalDateTime bookedAt;

    @Version
    private Long version;

    // Método auxiliar para verificar se o lock expirou
    public boolean isLockExpired() {
        return lockExpiresAt != null && LocalDateTime.now().isAfter(lockExpiresAt);
    }
}