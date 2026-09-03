package com.fixtime.appointment;

import com.fixtime.customer.CustomerService;
import com.fixtime.exception.ConflictException;
import com.fixtime.exception.ResourceNotFoundException;
import com.fixtime.service.ServiceCatalogService;
import com.fixtime.service.ServiceEntity;
import com.fixtime.technician.TechnicianService;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppointmentService {
    private static final LocalTime OPENING = LocalTime.of(8, 0);
    private static final LocalTime CLOSING = LocalTime.of(18, 0);
    private static final int MINIMUM_NOTICE_HOURS = 2;

    private final AppointmentRepository repository;
    private final CustomerService customerService;
    private final TechnicianService technicianService;
    private final ServiceCatalogService serviceCatalogService;
    private final Clock clock;

    public AppointmentService(
            AppointmentRepository repository,
            CustomerService customerService,
            TechnicianService technicianService,
            ServiceCatalogService serviceCatalogService,
            Clock clock) {
        this.repository = repository;
        this.customerService = customerService;
        this.technicianService = technicianService;
        this.serviceCatalogService = serviceCatalogService;
        this.clock = clock;
    }

    @Transactional
    public AppointmentResponse create(CreateAppointmentRequest request) {
        // 1. Validar existencia e status ativo dos envolvidos
        customerService.getActiveCustomerOrThrow(request.customerId());
        technicianService.getActiveTechnicianOrThrow(request.technicianId());
        ServiceEntity serviceEntity = serviceCatalogService.getActiveServiceOrThrow(request.serviceId());

        int durationMinutes = serviceEntity.getDurationMinutes();
        if (durationMinutes <= 0) {
            throw new IllegalArgumentException("A duracao do servico deve ser positiva");
        }

        LocalDateTime startsAt = request.startsAt();
        LocalDateTime endsAt = startsAt.plusMinutes(durationMinutes);

        // 2. Validar antecedencia minima de 2 horas
        LocalDateTime minimumStart = LocalDateTime.now(clock).plusHours(MINIMUM_NOTICE_HOURS);
        if (!startsAt.isAfter(minimumStart)) {
            throw new IllegalArgumentException("O agendamento exige duas horas de antecedencia");
        }

        // 3. Validar dias uteis (Segunda a Sexta)
        if (startsAt.getDayOfWeek() == DayOfWeek.SATURDAY || startsAt.getDayOfWeek() == DayOfWeek.SUNDAY) {
            throw new IllegalArgumentException("O horario deve estar em um dia util entre 08:00 e 18:00");
        }

        // 4. Validar horario de funcionamento (08:00 as 18:00 e mesmo dia)
        if (startsAt.toLocalTime().isBefore(OPENING) || endsAt.toLocalTime().isAfter(CLOSING)
                || !startsAt.toLocalDate().equals(endsAt.toLocalDate())) {
            throw new IllegalArgumentException("O horario deve estar em um dia util entre 08:00 e 18:00");
        }

        // 5. Validar sobreposicao de horarios para o mesmo tecnico
        List<Appointment> conflicts = repository.findConflictingAppointments(
                request.technicianId(),
                AppointmentStatus.SCHEDULED,
                startsAt,
                endsAt);
        if (!conflicts.isEmpty()) {
            throw new ConflictException("O tecnico ja possui uma visita nesse intervalo");
        }

        // 6. Persistir novo agendamento
        Appointment appointment = new Appointment(
                request.customerId(),
                request.technicianId(),
                request.serviceId(),
                startsAt,
                endsAt,
                durationMinutes,
                AppointmentStatus.SCHEDULED);

        Appointment saved = repository.save(appointment);
        return AppointmentResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> list() {
        return repository.findAllByOrderByStartsAtAsc().stream()
                .map(AppointmentResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AvailabilityResponse> availability(Long technicianId, LocalDate date) {
        technicianService.getActiveTechnicianOrThrow(technicianId);
        if (date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY) {
            throw new IllegalArgumentException("A disponibilidade so pode ser consultada em dias uteis");
        }

        LocalDateTime dayStart = date.atTime(OPENING);
        LocalDateTime dayEnd = date.atTime(CLOSING);
        List<Appointment> appointments = repository.findByTechnicianAndStatusAndDay(
                technicianId, AppointmentStatus.SCHEDULED, dayStart, dayEnd);
        List<AvailabilityResponse> availableIntervals = new java.util.ArrayList<>();
        LocalDateTime cursor = dayStart;
        for (Appointment appointment : appointments) {
            LocalDateTime occupiedStart = appointment.getStartsAt().isBefore(dayStart)
                    ? dayStart : appointment.getStartsAt();
            LocalDateTime occupiedEnd = appointment.getEndsAt().isAfter(dayEnd)
                    ? dayEnd : appointment.getEndsAt();
            if (cursor.isBefore(occupiedStart)) {
                availableIntervals.add(new AvailabilityResponse(cursor, occupiedStart));
            }
            if (cursor.isBefore(occupiedEnd)) {
                cursor = occupiedEnd;
            }
        }
        if (cursor.isBefore(dayEnd)) {
            availableIntervals.add(new AvailabilityResponse(cursor, dayEnd));
        }
        return availableIntervals;
    }

    @Transactional
    public AppointmentResponse cancel(Long id) {
        Appointment appointment = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agendamento com ID " + id + " nao encontrado"));

        if (appointment.getStatus() != AppointmentStatus.SCHEDULED) {
            throw new IllegalStateException("Apenas agendamentos no status SCHEDULED podem ser cancelados");
        }

        LocalDateTime now = LocalDateTime.now(clock);
        if (appointment.getStartsAt().isBefore(now.plusHours(MINIMUM_NOTICE_HOURS))) {
            throw new IllegalArgumentException("O cancelamento exige duas horas de antecedencia");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        Appointment saved = repository.save(appointment);
        return AppointmentResponse.fromEntity(saved);
    }

    @Transactional
    public AppointmentResponse complete(Long id) {
        Appointment appointment = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agendamento com ID " + id + " nao encontrado"));

        if (appointment.getStatus() != AppointmentStatus.SCHEDULED) {
            throw new IllegalStateException("Apenas agendamentos no status SCHEDULED podem ser concluidos");
        }

        LocalDateTime now = LocalDateTime.now(clock);
        if (!now.isAfter(appointment.getEndsAt())) {
            throw new IllegalStateException("O agendamento so pode ser concluido apos o horario final da visita");
        }

        appointment.setStatus(AppointmentStatus.COMPLETED);
        Appointment saved = repository.save(appointment);
        return AppointmentResponse.fromEntity(saved);
    }
}
