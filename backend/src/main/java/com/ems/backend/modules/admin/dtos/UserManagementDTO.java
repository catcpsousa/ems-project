package com.ems.backend.modules.admin.dtos;

import java.time.LocalDateTime;

import com.ems.backend.modules.auth.entities.User.Role;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserManagementDTO {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private Role role;
    private boolean enabled;
    private LocalDateTime createdAt;
    private Long eventsCreated;
    private Long bookingsMade;
}
