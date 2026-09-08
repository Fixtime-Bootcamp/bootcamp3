package com.fixtime.blockeddate;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BlockedDateRepository extends JpaRepository<BlockedDate, Long> {
    boolean existsByDate(LocalDate date);
    Optional<BlockedDate> findByDate(LocalDate date);
    List<BlockedDate> findAllByOrderByDateAsc();
}
