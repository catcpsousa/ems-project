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
                // ===== PÚBLICOS =====
                .requestMatchers("/api/auth/register", "/api/auth/login").permitAll()
                .requestMatchers("/ws/**").permitAll()
                
                // Catálogo público de eventos (apenas GET sem sub-paths específicos)
                .requestMatchers(HttpMethod.GET, "/api/events").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/events/{id}").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/events/{id}/seats").permitAll()

                // ===== ADMIN =====
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/auth/register/admin").hasRole("ADMIN")
                .requestMatchers("/api/system/**").hasAnyRole("ADMIN", "SYSTEM")

                // ===== ORGANIZER =====
                // Endpoints específicos do organizador (devem vir ANTES dos genéricos!)
                .requestMatchers(HttpMethod.GET, "/api/events/my-events").hasAnyRole("ORGANIZER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/events/dashboard-stats").hasAnyRole("ORGANIZER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/events/{id}/stats").hasAnyRole("ORGANIZER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/events/{id}/participants").hasAnyRole("ORGANIZER", "ADMIN")
                
                // POST endpoints para eventos - ordem específica primeiro
                .requestMatchers(HttpMethod.POST, "/api/events/{id}/message").hasAnyRole("ORGANIZER", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/events/{id}/publish").hasAnyRole("ORGANIZER", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/events/{id}/cancel").hasAnyRole("ORGANIZER", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/events/{id}").hasAnyRole("ORGANIZER", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/events").hasAnyRole("ORGANIZER", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/events/**").hasAnyRole("ORGANIZER", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/events/**").hasAnyRole("ORGANIZER", "ADMIN")

                // ===== PARTICIPANT =====
                // Reservas de lugares
                .requestMatchers("/api/bookings/**").hasAnyRole("PARTICIPANT", "ORGANIZER", "ADMIN")
                
                // Dashboard do participante
                .requestMatchers(HttpMethod.GET, "/api/participant/bookings").hasAnyRole("PARTICIPANT", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/participant/bookings/*/ticket").hasAnyRole("PARTICIPANT", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/participant/today").hasAnyRole("PARTICIPANT", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/participant/notifications").hasAnyRole("PARTICIPANT", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/participant/notifications/unread-count").hasAnyRole("PARTICIPANT", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/participant/notifications/mark-read").hasAnyRole("PARTICIPANT", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/participant/feedback").hasAnyRole("PARTICIPANT", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/participant/feedback").hasAnyRole("PARTICIPANT", "ADMIN")
                .requestMatchers("/api/participant/**").hasAnyRole("PARTICIPANT", "ADMIN")

                // ===== AUTENTICADO (qualquer role) =====
                .requestMatchers("/api/auth/me").authenticated()

                // Qualquer outra requisição precisa de autenticação
                .anyRequest().authenticated()
            );

        return http.build();
    }
}