package com.ems.backend.modules.admin.entities;

import java.time.LocalDateTime;

import com.ems.backend.modules.auth.entities.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "content_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportType type; // REVIEW, EVENT, USER
    
    private Long targetId; // ID of the reported content (review ID, event ID, user ID)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter; // User who reported the content

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason; // Reason for reporting

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ReportStatus status = ReportStatus.PENDING; // PENDING, REVIEWING, RES

    private String adminNotes; // Notes added by admin during review

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by")
    private User resolvedBy; // Admin who resolved the report

    private LocalDateTime resolvedAt; // Timestamp when the report was resolved

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public enum ReportType {
        REVIEW,
        EVENT,
        USER
    }

    public enum ReportStatus {
        PENDING,
        REVIEWING,
        RESOLVED,
        DISMISSED
    }
}
