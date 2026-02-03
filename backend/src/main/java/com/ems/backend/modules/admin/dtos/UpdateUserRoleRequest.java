package com.ems.backend.modules.admin.dtos;

import com.ems.backend.modules.auth.entities.User.Role;

import lombok.Data;

@Data
public class UpdateUserRoleRequest {
    private Role role;
}
