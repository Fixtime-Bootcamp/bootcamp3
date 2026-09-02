package com.fixtime.appointment;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record CreateAppointmentRequest(
        @NotNull Long customerId,
        @NotNull Long technicianId,
        @NotNull Long serviceId,
        @NotNull LocalDateTime startsAt,
        @NotNull Integer durationMinutes) {
}
