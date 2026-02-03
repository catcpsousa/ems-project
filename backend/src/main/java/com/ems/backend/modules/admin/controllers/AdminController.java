package com.ems.backend.modules.admin.controllers;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ems.backend.modules.admin.dtos.AdminDashboardStats;
import com.ems.backend.modules.admin.dtos.CategoryDTO;
import com.ems.backend.modules.admin.dtos.ResolveReportRequest;
import com.ems.backend.modules.admin.dtos.SystemConfigDTO;
import com.ems.backend.modules.admin.dtos.UpdateUserRoleRequest;
import com.ems.backend.modules.admin.dtos.UserManagementDTO;
import com.ems.backend.modules.admin.entities.ContentReport;
import com.ems.backend.modules.admin.entities.ContentReport.ReportStatus;
import com.ems.backend.modules.admin.entities.SystemLog;
import com.ems.backend.modules.admin.entities.SystemLog.LogLevel;
import com.ems.backend.modules.admin.services.AdminService;
import com.ems.backend.modules.auth.entities.User;
import com.ems.backend.modules.auth.entities.User.Role;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {
    
    private final AdminService adminService;

    // =============== DASHBOARD ================
    @GetMapping("/stats")
    public ResponseEntity<AdminDashboardStats> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    // =============== USER MANAGEMENT ================
    @GetMapping("/users")
    public ResponseEntity<Page<UserManagementDTO>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Role role) {
        return ResponseEntity.ok(adminService.getAllUsers(page, size, search, role));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserManagementDTO> updateUserRole(
            @PathVariable Long id,
            @RequestBody UpdateUserRoleRequest request) {
        return ResponseEntity.ok(adminService.updateUserRole(id, request.getRole()));
    }

    @PostMapping("/users/{id}/toggle-status")
    public ResponseEntity<UserManagementDTO> toggleUserStatus(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.toggleUserStatus(id));
    }

    // ================ CONTENT MODERATION ================
    @GetMapping("/reports")
    public ResponseEntity<Page<ContentReport>> getReports(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminService.getReports(status, page, size));
    }

    @PutMapping("/reports/{id}/resolve")
    public ResponseEntity<ContentReport> resolveReport(
            @PathVariable Long id,
            @RequestBody ResolveReportRequest request,
            @AuthenticationPrincipal User admin) {
        return ResponseEntity.ok(adminService.resolveReport(id, request, admin));
    }

    // ================ SYSTEM LOGS ================
    @GetMapping("/logs")
    public ResponseEntity<Page<SystemLog>> getLogs(
            @RequestParam(required = false) LogLevel level,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(adminService.getLogs(level, page, size));
    }

    // ================ CATEGORIES ================
    @GetMapping("/categories")
    public ResponseEntity<List<CategoryDTO>> getAllCategories() {
        return ResponseEntity.ok(adminService.getAllCategories());
    }

    @PostMapping("/categories")
    public ResponseEntity<CategoryDTO> createCategory(@RequestBody CategoryDTO categoryDTO) {
        return ResponseEntity.ok(adminService.createCategory(categoryDTO));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<CategoryDTO> updateCategory(
            @PathVariable Long id,
            @RequestBody CategoryDTO categoryDTO) {
        return ResponseEntity.ok(adminService.updateCategory(id, categoryDTO));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        adminService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    // ================ SYSTEM CONFIG ===============
    @GetMapping("/config")
    public ResponseEntity<List<SystemConfigDTO>> getAllConfigs() {
        return ResponseEntity.ok(adminService.getAllConfigs());
    }

    @PostMapping("/config")
    public ResponseEntity<SystemConfigDTO> setConfig(@RequestBody SystemConfigDTO configDTO) {
        return ResponseEntity.ok(adminService.setConfig(configDTO));
    }
}