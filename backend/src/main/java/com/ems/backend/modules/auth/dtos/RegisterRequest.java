package com.ems.backend.modules.auth.dtos;

public record RegisterRequest(
    String username, 
    String password
) {}