package com.fixtime.appointment;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AppointmentExportRow(
        Long id,
        LocalDateTime startsAt,
        LocalDateTime endsAt,
        Long customerId,
        String customerName,
        Long technicianId,
        String technicianName,
        Long serviceId,
        String serviceName,
        Integer durationMinutes,
        BigDecimal price,
        AppointmentStatus status) {
}
