package com.ems.backend.modules.auth.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.ems.backend.core.services.JwtService;
import com.ems.backend.modules.auth.dtos.AuthenticationResponse;
import com.ems.backend.modules.auth.dtos.LoginRequest;
import com.ems.backend.modules.auth.dtos.RegisterRequest;
import com.ems.backend.modules.auth.entities.User;
import com.ems.backend.modules.auth.entities.User.Role;
import com.ems.backend.modules.auth.repositories.UserRepository;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    /**
     * Registo público (PARTICIPANT ou ORGANIZER)
     */
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        // Verificar se username já existe
        if (userRepository.findByUsername(request.username()).isPresent()) {
            return ResponseEntity.badRequest().body("Username já existe");
        }

        // Verificar se email já existe
        if (userRepository.findByEmail(request.email()).isPresent()) {
            return ResponseEntity.badRequest().body("Email já existe");
        }

        // Determinar role (apenas PARTICIPANT ou ORGANIZER permitidos no registo público)
        Role role = Role.PARTICIPANT; // default
        if (request.role() != null) {
            try {
                Role requestedRole = Role.valueOf(request.role().toUpperCase());
                if (requestedRole == Role.PARTICIPANT || requestedRole == Role.ORGANIZER) {
                    role = requestedRole;
                }
            } catch (IllegalArgumentException ignored) {
                // Mantém PARTICIPANT como default
            }
        }

        var user = User.builder()
                .username(request.username())
                .password(passwordEncoder.encode(request.password()))
                .email(request.email())
                .fullName(request.fullName())
                .phone(request.phone())
                .role(role)
                .enabled(true)
                .build();

        userRepository.save(user);
        return ResponseEntity.ok("Conta criada com sucesso como " + role.name());
    }

    /**
     * Registo de ADMIN (apenas por outro ADMIN)
     */
    @PostMapping("/register/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> registerAdmin(@RequestBody RegisterRequest request) {
        if (userRepository.findByUsername(request.username()).isPresent()) {
            return ResponseEntity.badRequest().body("Username já existe");
        }

        var user = User.builder()
                .username(request.username())
                .password(passwordEncoder.encode(request.password()))
                .email(request.email())
                .fullName(request.fullName())
                .phone(request.phone())
                .role(Role.ADMIN)
                .enabled(true)
                .build();

        userRepository.save(user);
        return ResponseEntity.ok("Administrador registado com sucesso");
    }

    /**
     * Login
     */
    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(@RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.username(),
                        request.password()
                )
        );

        var user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new RuntimeException("Utilizador não encontrado"));

        var jwtToken = jwtService.generateToken(user);

        return ResponseEntity.ok(new AuthenticationResponse(
                jwtToken,
                user.getUsername(),
                user.getRole().name(),
                user.getFullName()
        ));
    }

    /**
     * Obter dados do utilizador autenticado
     */
    @GetMapping("/me")
    public ResponseEntity<UserInfoResponse> getCurrentUser(
            @RequestHeader("Authorization") String authHeader
    ) {
        String token = authHeader.replace("Bearer ", "");
        String username = jwtService.extractUsername(token);

        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Utilizador não encontrado"));

        return ResponseEntity.ok(new UserInfoResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().name()
        ));
    }

    // DTO interno para resposta do /me
    public record UserInfoResponse(
            Long id,
            String username,
            String email,
            String fullName,
            String role
    ) {}
}