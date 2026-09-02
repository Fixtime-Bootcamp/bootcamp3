package com.fixtime.appointment;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Service;

@Service
public class AppointmentService {
    private static final LocalTime OPENING = LocalTime.of(8, 0);
    private static final LocalTime CLOSING = LocalTime.of(18, 0);
    private static final int MINIMUM_NOTICE_HOURS = 2;

    private final Clock clock;
    private final AtomicLong sequence = new AtomicLong();
    private final List<Appointment> appointments = new ArrayList<>();

    public AppointmentService() {
        this(Clock.systemDefaultZone());
    }

    public AppointmentService(Clock clock) {
        this.clock = clock;
    }

    public synchronized Appointment create(CreateAppointmentRequest request) {
        if (request.durationMinutes() <= 0) {
            throw new IllegalArgumentException("A duracao deve ser positiva");
        }
        LocalDateTime startsAt = request.startsAt();
        LocalDateTime endsAt = startsAt.plusMinutes(request.durationMinutes());
        LocalDateTime minimumStart = LocalDateTime.now(clock).plusHours(MINIMUM_NOTICE_HOURS);
        if (!startsAt.isAfter(minimumStart)) {
            throw new IllegalArgumentException("O agendamento exige duas horas de antecedencia");
        }
        if (startsAt.getDayOfWeek() == DayOfWeek.SATURDAY || startsAt.getDayOfWeek() == DayOfWeek.SUNDAY
                || startsAt.toLocalTime().isBefore(OPENING) || endsAt.toLocalTime().isAfter(CLOSING)
                || !startsAt.toLocalDate().equals(endsAt.toLocalDate())) {
            throw new IllegalArgumentException("O horario deve estar em um dia util entre 08:00 e 18:00");
        }
        boolean conflicts = appointments.stream()
                .filter(item -> item.technicianId() == request.technicianId())
                .filter(item -> item.status() == AppointmentStatus.SCHEDULED)
                .anyMatch(item -> startsAt.isBefore(item.endsAt()) && endsAt.isAfter(item.startsAt()));
        if (conflicts) {
            throw new IllegalArgumentException("O tecnico ja possui uma visita nesse intervalo");
        }
        Appointment appointment = new Appointment(sequence.incrementAndGet(), request.customerId(), request.technicianId(),
                request.serviceId(), startsAt, endsAt, AppointmentStatus.SCHEDULED);
        appointments.add(appointment);
        return appointment;
    }

    public synchronized List<Appointment> list() {
        return List.copyOf(appointments);
    }
}
