package com.ems.backend.modules.auth.dtos;

public record RegisterRequest(
    String username,
    String password,
    String email,
    String fullName,
    String phone,
    String role  // "PARTICIPANT" ou "ORGANIZER"
) {}