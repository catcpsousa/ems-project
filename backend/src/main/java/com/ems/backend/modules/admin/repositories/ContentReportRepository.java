package com.ems.backend.modules.admin.repositories;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.ems.backend.modules.admin.entities.ContentReport;
import com.ems.backend.modules.admin.entities.ContentReport.ReportStatus;
import com.ems.backend.modules.admin.entities.ContentReport.ReportType;

public interface ContentReportRepository extends JpaRepository<ContentReport, Long> {

    Page<ContentReport> findByStatusOrderByCreatedAtDesc(ReportStatus status, Pageable pageable);
    
    Page<ContentReport> findByTypeAndStatusOrderByCreatedAtDesc(ReportType type, ReportStatus status, Pageable pageable);

    List<ContentReport> findByStatusIn(List<ReportStatus> statuses);

    @Query("SELECT COUNT(r) FROM ContentReport r WHERE r.status = 'PENDING'")
    Long countPending();

    @Query("SELECT r.type, COUNT(r) FROM ContentReport r WHERE r.status = 'PENDING' GROUP BY r.type")
    List<Object[]> countPendingByType();

}
