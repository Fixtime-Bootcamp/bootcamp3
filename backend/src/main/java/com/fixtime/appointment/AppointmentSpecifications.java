package com.fixtime.appointment;

import java.time.LocalDateTime;
import org.springframework.data.jpa.domain.Specification;

public final class AppointmentSpecifications {

    private AppointmentSpecifications() {
    }

    public static Specification<Appointment> startsAtFrom(LocalDateTime from) {
        return (root, query, cb) -> from == null ? null : cb.greaterThanOrEqualTo(root.get("startsAt"), from);
    }

    public static Specification<Appointment> startsAtBefore(LocalDateTime to) {
        return (root, query, cb) -> to == null ? null : cb.lessThan(root.get("startsAt"), to);
    }

    public static Specification<Appointment> hasTechnicianId(Long technicianId) {
        return (root, query, cb) -> technicianId == null ? null : cb.equal(root.get("technicianId"), technicianId);
    }

    public static Specification<Appointment> hasCustomerId(Long customerId) {
        return (root, query, cb) -> customerId == null ? null : cb.equal(root.get("customerId"), customerId);
    }

    public static Specification<Appointment> hasStatus(AppointmentStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    public static Specification<Appointment> filterBy(
            LocalDateTime startsAtFrom, LocalDateTime startsAtBefore,
            Long technicianId, Long customerId, AppointmentStatus status) {
        return Specification.where(startsAtFrom(startsAtFrom))
                .and(startsAtBefore(startsAtBefore))
                .and(hasTechnicianId(technicianId))
                .and(hasCustomerId(customerId))
                .and(hasStatus(status));
    }
}
