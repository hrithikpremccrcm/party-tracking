package com.partytracker.repository;

import com.partytracker.entity.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HolidayRepository extends JpaRepository<Holiday, Long> {
    boolean existsByHolidayDate(LocalDate date);
    Optional<Holiday> findByHolidayDate(LocalDate date);
    List<Holiday> findByHolidayDateBetween(LocalDate start, LocalDate end);
}
