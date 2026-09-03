package com.fixtime.appointment;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @Query("SELECT a FROM Appointment a " +
           "WHERE a.technicianId = :technicianId " +
           "AND a.status = :status " +
           "AND a.startsAt < :endsAt " +
           "AND a.endsAt > :startsAt")
    List<Appointment> findConflictingAppointments(
            @Param("technicianId") Long technicianId,
            @Param("status") AppointmentStatus status,
            @Param("startsAt") LocalDateTime startsAt,
            @Param("endsAt") LocalDateTime endsAt);

    List<Appointment> findAllByOrderByStartsAtAsc();
}
