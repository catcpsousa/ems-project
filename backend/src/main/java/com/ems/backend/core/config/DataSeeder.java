package com.ems.backend.core.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.ems.backend.modules.auth.entities.User;
import com.ems.backend.modules.auth.repositories.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner seedUsers() {
        return args -> {
            // Admin
            if (userRepository.findByUsername("admin").isEmpty()) {
                userRepository.save(User.builder()
                        .username("admin")
                        .password(passwordEncoder.encode("admin123"))
                        .email("admin@ems.com")
                        .fullName("Administrador")
                        .role(User.Role.ADMIN)
                        .enabled(true)
                        .build());
                log.info("✅ Admin criado: admin / admin123");
            }

            // Organizador de exemplo
            if (userRepository.findByUsername("organizer").isEmpty()) {
                userRepository.save(User.builder()
                        .username("organizer")
                        .password(passwordEncoder.encode("org123"))
                        .email("organizer@ems.com")
                        .fullName("Organizador Teste")
                        .role(User.Role.ORGANIZER)
                        .enabled(true)
                        .build());
                log.info("✅ Organizador criado: organizer / org123");
            }

            // Participante de exemplo
            if (userRepository.findByUsername("participant").isEmpty()) {
                userRepository.save(User.builder()
                        .username("participant")
                        .password(passwordEncoder.encode("part123"))
                        .email("participant@ems.com")
                        .fullName("Participante Teste")
                        .role(User.Role.PARTICIPANT)
                        .enabled(true)
                        .build());
                log.info("✅ Participante criado: participant / part123");
            }

            // Sistema (interno)
            if (userRepository.findByUsername("system").isEmpty()) {
                userRepository.save(User.builder()
                        .username("system")
                        .password(passwordEncoder.encode("system-internal"))
                        .email("system@ems.internal")
                        .fullName("Sistema")
                        .role(User.Role.SYSTEM)
                        .enabled(true)
                        .build());
                log.info("✅ System user criado (uso interno)");
            }
        };
    }
}