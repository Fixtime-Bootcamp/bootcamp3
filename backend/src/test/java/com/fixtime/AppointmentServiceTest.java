package com.fixtime;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThat;

import com.fixtime.appointment.AppointmentService;
import com.fixtime.appointment.CreateAppointmentRequest;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;

class AppointmentServiceTest {
    private final Clock clock = Clock.fixed(Instant.parse("2026-09-02T08:00:00Z"), ZoneId.of("UTC"));

    @Test
    void createsAppointmentWithinBusinessHours() {
        AppointmentService service = new AppointmentService(clock);
        var appointment = service.create(new CreateAppointmentRequest(1L, 2L, 3L,
                LocalDateTime.of(2026, 9, 2, 11, 0), 60));
        assertThat(appointment.endsAt()).isEqualTo(LocalDateTime.of(2026, 9, 2, 12, 0));
    }

    @Test
    void rejectsOverlappingVisitsForSameTechnician() {
        AppointmentService service = new AppointmentService(clock);
        service.create(new CreateAppointmentRequest(1L, 2L, 3L,
                LocalDateTime.of(2026, 9, 2, 11, 0), 60));
        assertThatThrownBy(() -> service.create(new CreateAppointmentRequest(4L, 2L, 3L,
                LocalDateTime.of(2026, 9, 2, 11, 30), 30)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("intervalo");
    }

    @Test
    void rejectsWeekendVisits() {
        AppointmentService service = new AppointmentService(clock);
        assertThatThrownBy(() -> service.create(new CreateAppointmentRequest(1L, 2L, 3L,
                LocalDateTime.of(2026, 9, 5, 11, 0), 60)))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
