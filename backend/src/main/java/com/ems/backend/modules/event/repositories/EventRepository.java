package com.ems.backend.modules.event.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ems.backend.modules.event.entities.Event;

public interface EventRepository extends JpaRepository<Event, Long> {

}
