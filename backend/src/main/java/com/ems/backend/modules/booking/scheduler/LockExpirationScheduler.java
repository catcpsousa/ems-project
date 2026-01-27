package com.ems.backend.modules.booking.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.ems.backend.modules.booking.services.BookingService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class LockExpirationScheduler {
    private final BookingService bookingService;

    // Executes every 30 seconds
    @Scheduled(fixedRate = 30000)
    public void releaseExpiredLocks() {
        int releasedCount = bookingService.releaseExpiredLocks();
        if (releasedCount > 0) {
            log.info("Scheduler: Released {} expired seat locks", releasedCount);
        }
    }
}
