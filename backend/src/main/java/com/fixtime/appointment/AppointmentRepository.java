package com.fixtime.appointment;

import jakarta.persistence.QueryHint;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Stream;
import org.hibernate.jpa.HibernateHints;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @Query("SELECT a FROM Appointment a " +
           "WHERE a.technicianId = :technicianId " +
           "AND a.status IN :statuses " +
           "AND a.startsAt < :endsAt " +
           "AND a.endsAt > :startsAt")
    List<Appointment> findConflictingAppointments(
            @Param("technicianId") Long technicianId,
            @Param("statuses") List<AppointmentStatus> statuses,
            @Param("startsAt") LocalDateTime startsAt,
            @Param("endsAt") LocalDateTime endsAt);

    @Query("SELECT a FROM Appointment a " +
           "WHERE (:from IS NULL OR a.startsAt >= :from) " +
           "AND (:to IS NULL OR a.startsAt < :to) " +
           "AND (:technicianId IS NULL OR a.technicianId = :technicianId) " +
           "AND (:status IS NULL OR a.status = :status) " +
           "ORDER BY a.startsAt ASC")
    List<Appointment> findAllForListing(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("technicianId") Long technicianId,
            @Param("status") AppointmentStatus status);

    @Query("SELECT a FROM Appointment a " +
          "WHERE a.technicianId = :technicianId " +
          "AND a.status = :status " +
          "AND a.startsAt < :dayEnd " +
          "AND a.endsAt > :dayStart " +
          "ORDER BY a.startsAt ASC")
    List<Appointment> findByTechnicianAndStatusAndDay(
           @Param("technicianId") Long technicianId,
           @Param("status") AppointmentStatus status,
           @Param("dayStart") LocalDateTime dayStart,
           @Param("dayEnd") LocalDateTime dayEnd);

    @QueryHints(@QueryHint(name = HibernateHints.HINT_FETCH_SIZE, value = "50"))
    @Query("SELECT new com.fixtime.appointment.AppointmentExportRow("
            + "a.id, a.startsAt, a.endsAt, a.customerId, c.name, a.technicianId, t.name, "
            + "a.serviceId, s.name, a.durationMinutes, s.price, a.status) "
            + "FROM Appointment a "
            + "LEFT JOIN com.fixtime.customer.Customer c ON c.id = a.customerId "
            + "LEFT JOIN com.fixtime.technician.Technician t ON t.id = a.technicianId "
            + "LEFT JOIN com.fixtime.service.ServiceEntity s ON s.id = a.serviceId "
            + "WHERE (:from IS NULL OR a.startsAt >= :from) "
            + "AND (:to IS NULL OR a.startsAt < :to) "
            + "AND (:technicianId IS NULL OR a.technicianId = :technicianId) "
            + "AND (:status IS NULL OR a.status = :status) "
            + "ORDER BY a.startsAt ASC")
    Stream<AppointmentExportRow> streamForExport(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("technicianId") Long technicianId,
            @Param("status") AppointmentStatus status);
}
