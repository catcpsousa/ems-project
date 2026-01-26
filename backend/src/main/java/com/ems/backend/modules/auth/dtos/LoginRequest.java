package com.ems.backend.modules.auth.dtos;

public record LoginRequest(
    String username, 
    String password
) {}
