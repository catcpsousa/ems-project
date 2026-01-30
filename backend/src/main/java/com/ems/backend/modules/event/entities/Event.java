package com.ems.backend.modules.event.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.ems.backend.modules.auth.entities.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {

    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private String location;

    private String onlineLink;

    @Column(nullable = false)
    private String category;

    private String coverImage;

    // true = reserved seats, false = free entry
    @Column(nullable = false)
    @Builder.Default
    private Boolean hasSeating = true;

    // Total capacity (for free entry events)
    private Integer capacity;

    // Price per ticket (0.0 = free event)
    @Builder.Default
    private BigDecimal ticketPrice = BigDecimal.ZERO;

    // event status
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EventStatus status = EventStatus.DRAFT;

    // Event organizer
    @ManyToOne(fetch = FetchType.LAZY)
    private User organizer;
    
    // Configurations for seat map
    private Integer seatRows;
    private Integer seatColumns;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
