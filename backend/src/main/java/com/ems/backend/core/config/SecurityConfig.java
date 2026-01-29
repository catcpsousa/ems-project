package com.ems.backend.core.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                // ===== Públicos =====
                .requestMatchers("/api/auth/register", "/api/auth/login").permitAll()
                .requestMatchers("/ws/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/events/**").permitAll() // Catálogo público

                // ===== ADMIN =====
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/auth/register/admin").hasRole("ADMIN")
                .requestMatchers("/api/system/**").hasAnyRole("ADMIN", "SYSTEM")

                // ===== ORGANIZER =====
                .requestMatchers(HttpMethod.POST, "/api/events/**").hasAnyRole("ORGANIZER", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/events/**").hasAnyRole("ORGANIZER", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/events/**").hasAnyRole("ORGANIZER", "ADMIN")
                .requestMatchers("/api/organizer/**").hasAnyRole("ORGANIZER", "ADMIN")

                // ===== PARTICIPANT =====
                .requestMatchers("/api/bookings/**").hasAnyRole("PARTICIPANT", "ORGANIZER", "ADMIN")
                .requestMatchers("/api/participant/**").hasAnyRole("PARTICIPANT", "ADMIN")

                // ===== Autenticado (qualquer role) =====
                .requestMatchers("/api/auth/me").authenticated()

                // Qualquer outra requisição precisa de autenticação
                .anyRequest().authenticated()
            );

        return http.build();
    }
}