package com.partytracker.repository;

import com.partytracker.entity.Cycle;
import com.partytracker.entity.PartyAssignment;
import com.partytracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PartyAssignmentRepository extends JpaRepository<PartyAssignment, Long> {

    @Query("SELECT pa FROM PartyAssignment pa JOIN FETCH pa.user WHERE pa.cycle = :cycle ORDER BY pa.partyDate ASC")
    List<PartyAssignment> findByCycleOrderByPartyDateAsc(@Param("cycle") Cycle cycle);

    // Returns first match — safe even if duplicate dates exist in old cycles
    @Query("SELECT pa FROM PartyAssignment pa JOIN FETCH pa.user WHERE pa.partyDate = :date AND pa.cycle.active = true ORDER BY pa.id ASC")
    List<PartyAssignment> findByPartyDateAndActiveCycle(@Param("date") LocalDate date);

    boolean existsByUserAndCycle(User user, Cycle cycle);

    @Query("SELECT pa FROM PartyAssignment pa JOIN FETCH pa.user WHERE pa.partyDate >= :startDate AND pa.partyDate <= :endDate ORDER BY pa.partyDate")
    List<PartyAssignment> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT pa FROM PartyAssignment pa JOIN FETCH pa.user WHERE pa.cycle.active = true ORDER BY pa.partyDate ASC")
    List<PartyAssignment> findCurrentCycleAssignments();

    @Modifying
    @Query("DELETE FROM PartyAssignment pa WHERE pa.cycle = :cycle")
    void deleteByCycle(@Param("cycle") Cycle cycle);

    List<PartyAssignment> findByCycle(Cycle cycle);
}
