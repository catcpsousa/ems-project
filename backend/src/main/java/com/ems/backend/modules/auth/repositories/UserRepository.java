package com.ems.backend.modules.auth.repositories;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ems.backend.modules.auth.entities.User;
import com.ems.backend.modules.auth.entities.User.Role;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Long countByEnabledTrue();

    Long countByRole(Role role);

    Long countByRoleAndEnabledTrue(Role role);

    Page<User> findByRole(Role role, Pageable pageable);

    @Query("SELECT u FROM User u WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<User> findByUsernameContainingOrEmailContaining(@Param("search") String search1, @Param("search") String search2, Pageable pageable);

    @Query("SELECT u FROM User u WHERE (LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))) AND u.role = :role")
    Page<User> findByUsernameContainingOrEmailContainingAndRole(@Param("search") String search1, @Param("search") String search2, @Param("role") Role role, Pageable pageable);
}