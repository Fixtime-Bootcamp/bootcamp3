package com.fixtime.appointment;

import java.time.LocalDateTime;

/** Continuous free interval within the technician's working day. */
public record AvailabilityResponse(LocalDateTime startsAt, LocalDateTime endsAt) {
}