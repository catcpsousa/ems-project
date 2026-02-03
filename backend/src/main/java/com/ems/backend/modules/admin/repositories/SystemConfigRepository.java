package com.ems.backend.modules.admin.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ems.backend.modules.admin.entities.SystemConfig;

public interface SystemConfigRepository extends JpaRepository<SystemConfig, Long> {

    Optional<SystemConfig> findByConfigKey(String configKey);
    boolean existsByConfigKey(String configKey);
}
