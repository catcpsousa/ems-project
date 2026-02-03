package com.ems.backend.modules.admin.repositories;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ems.backend.modules.admin.entities.SystemLog;
import com.ems.backend.modules.admin.entities.SystemLog.LogLevel;

public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {

    Page<SystemLog> findByLevelOrderByCreatedAtDesc(LogLevel level, Pageable pageable);

    Page<SystemLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<SystemLog> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime after);

    @Query("SELECT COUNT(l) FROM SystemLog l WHERE l.level = :level AND l.createdAt >= :after")
    Long countByLevelAfter(@Param("level") LogLevel level, @Param("after") LocalDateTime after);

    @Query("SELECT l.source, COUNT(l) FROM SystemLog l WHERE l.level = 'ERROR' GROUP BY l.source ORDER BY COUNT(l) DESC")
    List<Object[]> countErrorsBySource();
}