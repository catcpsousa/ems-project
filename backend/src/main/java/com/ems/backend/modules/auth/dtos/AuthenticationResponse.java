package com.ems.backend.modules.auth.dtos;

public record AuthenticationResponse(
    String token,
    String username,
    String role,
    String fullName
) {
    
}
