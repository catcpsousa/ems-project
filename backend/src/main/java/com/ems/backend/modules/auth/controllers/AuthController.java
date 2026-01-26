package com.ems.backend.modules.auth.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.ems.backend.core.services.JwtService;
import com.ems.backend.modules.auth.dtos.AuthenticationResponse;
import com.ems.backend.modules.auth.dtos.LoginRequest;
import com.ems.backend.modules.auth.dtos.RegisterRequest;
import com.ems.backend.modules.auth.repositories.UserRepository;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    // Register
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request){
        var user = com.ems.backend.modules.auth.entities.User.builder()
            .username(request.username())
            .password(passwordEncoder.encode(request.password()))
            .role(com.ems.backend.modules.auth.entities.User.Role.USER)
            .build();
        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully");
    }

    // Login
    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(@RequestBody LoginRequest request){
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.username(),
                request.password()
            )
        );
        var user = userRepository.findByUsername(request.username())
            .orElseThrow(() -> new RuntimeException("User not found"));
        var jwtToken = jwtService.generateToken(user);
        return ResponseEntity.ok(new AuthenticationResponse(jwtToken));
    }

}
