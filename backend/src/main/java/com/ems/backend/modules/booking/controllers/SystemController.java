package com.ems.backend.modules.booking.controllers;

import com.ems.backend.modules.booking.services.BookingService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;

/**
 * Endpoints internos para processos automáticos do sistema.
 * Apenas acessíveis por role SYSTEM ou ADMIN.
 */
@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
public class SystemController {

    private final BookingService bookingService;
    /*
     * Forces the release of expired locks (manual trigger)
    */
   @PostMapping("/release-expired-locks")
   @PreAuthorize("hasAnyRole('SYSTEM', 'ADMIN')")
   public ResponseEntity<String> releaseExpiredLocks() {
       int released = bookingService.releaseExpiredLocks();
       return ResponseEntity.ok("Released " + released + " expired locks.");
   }
   
}
