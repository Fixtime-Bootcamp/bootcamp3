package com.fixtime.appointment;

import java.time.LocalDateTime;

public record AppointmentResponse(
        Long id,
        Long customerId,
        Long technicianId,
        Long serviceId,
        LocalDateTime startsAt,
        LocalDateTime endsAt,
        int durationMinutes,
        AppointmentStatus status) {
    public static AppointmentResponse fromEntity(Appointment appointment) {
        return new AppointmentResponse(
                appointment.getId(),
                appointment.getCustomerId(),
                appointment.getTechnicianId(),
                appointment.getServiceId(),
                appointment.getStartsAt(),
                appointment.getEndsAt(),
                appointment.getDurationMinutes(),
                appointment.getStatus());
    }
}
