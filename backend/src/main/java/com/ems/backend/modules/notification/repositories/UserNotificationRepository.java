package com.ems.backend.modules.notification.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ems.backend.modules.notification.entities.UserNotification;

public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {

    List<UserNotification> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<UserNotification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);  // ✅ Corrigido

    Long countByUserIdAndIsReadFalse(Long userId);

    @Modifying
    @Query("UPDATE UserNotification un SET un.isRead = true WHERE un.user.id = :userId AND un.isRead = false")
    int markAllAsRead(@Param("userId") Long userId);

}
