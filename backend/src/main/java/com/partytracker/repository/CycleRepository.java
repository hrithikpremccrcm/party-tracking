package com.partytracker.repository;

import com.partytracker.entity.Cycle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CycleRepository extends JpaRepository<Cycle, Long> {
    Optional<Cycle> findByActiveTrue();
    Optional<Cycle> findTopByOrderByCycleNumberDesc();
}
