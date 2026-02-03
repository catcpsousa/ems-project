package com.ems.backend.modules.admin.services;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.ems.backend.modules.admin.dtos.AdminDashboardStats;
import com.ems.backend.modules.admin.dtos.CategoryDTO;
import com.ems.backend.modules.admin.dtos.ResolveReportRequest;
import com.ems.backend.modules.admin.dtos.SystemConfigDTO;
import com.ems.backend.modules.admin.dtos.UserManagementDTO;
import com.ems.backend.modules.admin.entities.ContentReport;
import com.ems.backend.modules.admin.entities.ContentReport.ReportStatus;
import com.ems.backend.modules.admin.entities.EventCategory;
import com.ems.backend.modules.admin.entities.SystemConfig;
import com.ems.backend.modules.admin.entities.SystemLog;
import com.ems.backend.modules.admin.entities.SystemLog.LogLevel;
import com.ems.backend.modules.admin.repositories.ContentReportRepository;
import com.ems.backend.modules.admin.repositories.EventCategoryRepository;
import com.ems.backend.modules.admin.repositories.SystemConfigRepository;
import com.ems.backend.modules.admin.repositories.SystemLogRepository;
import com.ems.backend.modules.auth.entities.User;
import com.ems.backend.modules.auth.entities.User.Role;
import com.ems.backend.modules.auth.repositories.UserRepository;
import com.ems.backend.modules.booking.repositories.SeatRepository;
import com.ems.backend.modules.event.repositories.EventRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final SeatRepository seatRepository;
    private final SystemLogRepository systemLogRepository;
    private final EventCategoryRepository eventCategoryRepository;
    private final SystemConfigRepository systemConfigRepository;
    private final ContentReportRepository contentReportRepository;

    // ================= DASHBOARD STATS ================= //

    public AdminDashboardStats getDashboardStats() {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();

        // user stats
        Long totalUsers = userRepository.count();
        Long activeUsers = userRepository.countByEnabledTrue();

        Map<String, Long> usersByRole = new HashMap<>();
        for (Role role : Role.values()) {
            usersByRole.put(role.name(), userRepository.countByRole(role));
        }

        // event stats
        Long totalEvents = eventRepository.count();
        Map<String, Long> eventsByStatus = eventRepository.countByStatus();

        // other stats
        Long pendingReports = contentReportRepository.countPending();
        Long errorsToday = systemLogRepository.countByLevelAfter(LogLevel.ERROR, todayStart);
        Long bookingsToday = seatRepository.countBookedAfter(todayStart);

        return AdminDashboardStats.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .totalEvents(totalEvents)
                .publishedEvents(eventsByStatus.getOrDefault("PUBLISHED", 0L))
                .totalOrganizers(usersByRole.getOrDefault("ORGANIZER", 0L))
                .totalParticipants(usersByRole.getOrDefault("PARTICIPANT", 0L))
                .pendingReports(pendingReports)
                .errorsToday(errorsToday)
                .bookingsToday(bookingsToday)
                .usersByRole(usersByRole)
                .eventsByStatus(eventsByStatus)
                .build();
    }

    // ================= USER MANAGEMENT ================= //

    public Page<UserManagementDTO> getAllUsers(int page, int size, String search, Role roleFilter) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> users;

        if (search != null && !search.isEmpty() && roleFilter != null) {
            users = userRepository.findByUsernameContainingOrEmailContainingAndRole(search, search, roleFilter, pageable);
        } else if (search != null && !search.isEmpty()) {
            users = userRepository.findByUsernameContainingOrEmailContaining(search, search, pageable);
        } else if (roleFilter != null) {
            users = userRepository.findByRole(roleFilter, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }

        return users.map(this::toUserManagementDTO);
    }

    private UserManagementDTO toUserManagementDTO(User user) {
        Long eventsCreated = eventRepository.countByOrganizerId(user.getId());
        Long bookingsMade = seatRepository.countBookedByUsername(user.getUsername());

        return UserManagementDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .eventsCreated(eventsCreated)
                .bookingsMade(bookingsMade)
                .build();
    }

    @Transactional
    public UserManagementDTO updateUserRole(Long userId, Role newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == Role.ADMIN && newRole != Role.ADMIN) {
            long adminCount = userRepository.countByRole(Role.ADMIN);
            if (adminCount <= 1) {
                throw new RuntimeException("Cannot change role. At least one ADMIN must remain.");
            }
        }

        user.setRole(newRole);
        userRepository.save(user);

        logAction(LogLevel.INFO, "AdminService", "Updated role for user " + user.getUsername() + " to " + newRole);

        return toUserManagementDTO(user);
    }

    @Transactional
    public UserManagementDTO toggleUserStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == Role.ADMIN && user.isEnabled()) {
            long activeAdmins = userRepository.countByRoleAndEnabledTrue(Role.ADMIN);
            if (activeAdmins <= 1) {
                throw new RuntimeException("Cannot disable user. At least one ADMIN must remain enabled.");
            }
        }

        user.setEnabled(!user.isEnabled());
        userRepository.save(user);

        logAction(LogLevel.INFO, "AdminService", "Toggled status for user " + user.getUsername() + " to " + (user.isEnabled() ? "ENABLED" : "DISABLED"));

        return toUserManagementDTO(user);
    }

    // ================ CONTENT MODERATION ================ //

    public Page<ContentReport> getReports(ReportStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        if (status != null) {
            return contentReportRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        } else {
            return contentReportRepository.findAll(pageable);
        }
    }

    @Transactional
    public ContentReport resolveReport(Long reportId, ResolveReportRequest request, User admin) {
        ContentReport report = contentReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        report.setStatus(request.getStatus());
        report.setResolvedBy(admin);
        report.setResolvedAt(LocalDateTime.now());
        report.setAdminNotes(request.getAdminNotes());

        logAction(LogLevel.INFO, "AdminService", "Report #" + reportId + " resolved by " + admin.getUsername() + " with status " + request.getStatus());
        return contentReportRepository.save(report);
    }

    // ================ SYSTEM LOGS ================ //

    public Page<SystemLog> getLogs(LogLevel level, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        if (level != null) {
            return systemLogRepository.findByLevelOrderByCreatedAtDesc(level, pageable);
        } else {
            return systemLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
    }

    public void logAction(LogLevel level, String source, String message) {
        SystemLog log = SystemLog.builder()
                .level(level)
                .source(source)
                .message(message)
                .build();
        systemLogRepository.save(log);
    }

    public void logError(String source, String message, String stackTrace, String userId, String requestPath) {
        SystemLog log = SystemLog.builder()
                .level(LogLevel.ERROR)
                .source(source)
                .message(message)
                .stackTrace(stackTrace)
                .userId(userId)
                .requestPath(requestPath)
                .build();
        systemLogRepository.save(log);
    }

    // ================ CATEGORIES =============== //

    public List<CategoryDTO> getAllCategories() {
        return eventCategoryRepository.findAll().stream()
                .map(this::toCategoryDTO)
                .collect(Collectors.toList());
    }

    public List<CategoryDTO> getActiveCategories() {
        return eventCategoryRepository.findByActiveTrue().stream()
                .map(this::toCategoryDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryDTO createCategory(CategoryDTO dto) {
        if (eventCategoryRepository.existsByName(dto.getName())) {
            throw new RuntimeException("Category with the same name already exists");
        }

        EventCategory category = EventCategory.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .icon(dto.getIcon())
                .active(dto.getActive() != null ? dto.getActive() : true)
                .build();

        return toCategoryDTO(eventCategoryRepository.save(category));
    }

    @Transactional
    public CategoryDTO updateCategory(Long categoryId, CategoryDTO dto) {
        EventCategory category = eventCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (!category.getName().equals(dto.getName()) && eventCategoryRepository.existsByName(dto.getName())) {
            throw new RuntimeException("Category with the same name already exists");
        }

        category.setName(dto.getName());
        category.setDescription(dto.getDescription());
        category.setIcon(dto.getIcon());
        category.setActive(dto.getActive());

        return toCategoryDTO(eventCategoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(Long categoryId) {
        if (!eventCategoryRepository.existsById(categoryId)) {
            throw new RuntimeException("Category not found");
        }
        eventCategoryRepository.deleteById(categoryId);
    }

    private CategoryDTO toCategoryDTO(EventCategory category) {
        return CategoryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .icon(category.getIcon())
                .active(category.getActive())
                .build();
    }

    // ================ SYSTEM CONFIG ================ //

    public List<SystemConfigDTO> getAllConfigs() {
        return systemConfigRepository.findAll().stream()
                .map(this::toConfigDTO)
                .collect(Collectors.toList());
    }

    public String getConfigValue(String key, String defaultValue) {
        return systemConfigRepository.findByConfigKey(key)
                .map(SystemConfig::getConfigValue)
                .orElse(defaultValue);
    }

    @Transactional
    public SystemConfigDTO setConfig(SystemConfigDTO dto) {
        SystemConfig config = systemConfigRepository.findByConfigKey(dto.getConfigKey())
                .orElse(SystemConfig.builder().configKey(dto.getConfigKey()).build());

        config.setConfigValue(dto.getConfigValue());
        config.setDescription(dto.getDescription());

        return toConfigDTO(systemConfigRepository.save(config));
    }

    private SystemConfigDTO toConfigDTO(SystemConfig config) {
        return SystemConfigDTO.builder()
                .id(config.getId())
                .configKey(config.getConfigKey())
                .configValue(config.getConfigValue())
                .description(config.getDescription())
                .build();
    }
}