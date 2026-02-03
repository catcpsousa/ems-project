package com.ems.backend.modules.admin.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ems.backend.modules.admin.entities.EventCategory;

import java.util.List;
import java.util.Optional;


public interface EventCategoryRepository extends JpaRepository<EventCategory, Long> {

    List<EventCategory> findByActiveTrue();
    Optional<EventCategory> findByName(String name);
    boolean existsByName(String name);
}
