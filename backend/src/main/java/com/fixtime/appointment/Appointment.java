package com.fixtime.appointment;

import java.time.LocalDateTime;

public record Appointment(
        long id,
        long customerId,
        long technicianId,
        long serviceId,
        LocalDateTime startsAt,
        LocalDateTime endsAt,
        AppointmentStatus status) {
}
