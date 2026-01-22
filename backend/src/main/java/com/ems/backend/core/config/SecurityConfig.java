package com.ems.backend.core.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.Customizer;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception{
        http
            .cors(Customizer.withDefaults()) //Ativates CORS configuration
            .csrf(csrf -> csrf.disable()) //Disables CSRF for simplicity
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll() //Permits all requests without authentication
            );
        return http.build();
    }
}
