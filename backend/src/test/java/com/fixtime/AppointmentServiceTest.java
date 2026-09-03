package com.fixtime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fixtime.appointment.Appointment;
import com.fixtime.appointment.AppointmentRepository;
import com.fixtime.appointment.AppointmentResponse;
import com.fixtime.appointment.AppointmentService;
import com.fixtime.appointment.AppointmentStatus;
import com.fixtime.appointment.CreateAppointmentRequest;
import com.fixtime.customer.Customer;
import com.fixtime.customer.CustomerRepository;
import com.fixtime.customer.CustomerService;
import com.fixtime.exception.ConflictException;
import com.fixtime.exception.ResourceNotFoundException;
import com.fixtime.service.ServiceCatalogService;
import com.fixtime.service.ServiceEntity;
import com.fixtime.service.ServiceRepository;
import com.fixtime.technician.Technician;
import com.fixtime.technician.TechnicianRepository;
import com.fixtime.technician.TechnicianService;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class AppointmentServiceTest {

    private AppointmentRepository appointmentRepository;
    private CustomerRepository customerRepository;
    private TechnicianRepository technicianRepository;
    private ServiceRepository serviceRepository;

    private CustomerService customerService;
    private TechnicianService technicianService;
    private ServiceCatalogService serviceCatalogService;

    // Fixed clock on a Wednesday at 08:00 UTC
    private final Clock clock = Clock.fixed(Instant.parse("2026-09-02T08:00:00Z"), ZoneId.of("UTC"));

    private AppointmentService appointmentService;

    private Customer activeCustomer;
    private Technician activeTechnician;
    private ServiceEntity activeService;

    @BeforeEach
    void setUp() {
        appointmentRepository = mock(AppointmentRepository.class);
        customerRepository = mock(CustomerRepository.class);
        technicianRepository = mock(TechnicianRepository.class);
        serviceRepository = mock(ServiceRepository.class);

        customerService = new CustomerService(customerRepository);
        technicianService = new TechnicianService(technicianRepository);
        serviceCatalogService = new ServiceCatalogService(serviceRepository);

        appointmentService = new AppointmentService(
                appointmentRepository,
                customerService,
                technicianService,
                serviceCatalogService,
                clock);

        activeCustomer = new Customer("Cliente Exemplo", "cliente@email.com", "11999999999", true);
        activeCustomer.setId(1L);

        activeTechnician = new Technician("Tecnico Exemplo", "tecnico@email.com", "11888888888", true);
        activeTechnician.setId(2L);

        activeService = new ServiceEntity("Reparo", "Descricao", 60, new BigDecimal("150.00"), true);
        activeService.setId(3L);
    }

    @Nested
    @DisplayName("Disponibilidade de Tecnico")
    class AvailabilityTests {

        @Test
        @DisplayName("Deve retornar intervalos livres ao redor de agendamento")
        void returnsFreeIntervalsAroundAppointment() {
            when(technicianRepository.findById(2L)).thenReturn(Optional.of(activeTechnician));
            Appointment appointment = new Appointment(1L, 2L, 3L,
                    LocalDateTime.of(2026, 9, 2, 10, 0),
                    LocalDateTime.of(2026, 9, 2, 12, 0),
                    120, AppointmentStatus.SCHEDULED);
            when(appointmentRepository.findByTechnicianAndStatusAndDay(
                    eq(2L), eq(AppointmentStatus.SCHEDULED), any(), any())).thenReturn(List.of(appointment));

            List<com.fixtime.appointment.AvailabilityResponse> response = appointmentService.availability(
                    2L, LocalDate.of(2026, 9, 2));

            assertThat(response).extracting("startsAt", "endsAt").containsExactly(
                    org.assertj.core.groups.Tuple.tuple(LocalDateTime.of(2026, 9, 2, 8, 0), LocalDateTime.of(2026, 9, 2, 10, 0)),
                    org.assertj.core.groups.Tuple.tuple(LocalDateTime.of(2026, 9, 2, 12, 0), LocalDateTime.of(2026, 9, 2, 18, 0)));
        }

        @Test
        @DisplayName("Deve rejeitar consulta em fim de semana")
        void rejectsWeekendAvailability() {
            when(technicianRepository.findById(2L)).thenReturn(Optional.of(activeTechnician));

            assertThatThrownBy(() -> appointmentService.availability(2L, LocalDate.of(2026, 9, 5)))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("dias uteis");
        }
    }

    @Nested
    @DisplayName("Criação de Agendamentos")
    class CreationTests {

        @Test
        @DisplayName("Deve criar agendamento com sucesso dentro do horario comercial e respeitando antecedencia")
        void createsAppointmentSuccessfully() {
            when(customerRepository.findById(1L)).thenReturn(Optional.of(activeCustomer));
            when(technicianRepository.findById(2L)).thenReturn(Optional.of(activeTechnician));
            when(serviceRepository.findById(3L)).thenReturn(Optional.of(activeService));
            when(appointmentRepository.findConflictingAppointments(eq(2L), eq(List.of(AppointmentStatus.SCHEDULED)), any(), any()))
                    .thenReturn(Collections.emptyList());

            Appointment saved = new Appointment(1L, 2L, 3L,
                    LocalDateTime.of(2026, 9, 2, 11, 0),
                    LocalDateTime.of(2026, 9, 2, 12, 0),
                    60,
                    AppointmentStatus.SCHEDULED);
            saved.setId(10L);
            when(appointmentRepository.save(any(Appointment.class))).thenReturn(saved);

            CreateAppointmentRequest request = new CreateAppointmentRequest(1L, 2L, 3L,
                    LocalDateTime.of(2026, 9, 2, 11, 0));

            AppointmentResponse response = appointmentService.create(request);

            assertThat(response).isNotNull();
            assertThat(response.id()).isEqualTo(10L);
            assertThat(response.startsAt()).isEqualTo(LocalDateTime.of(2026, 9, 2, 11, 0));
            assertThat(response.endsAt()).isEqualTo(LocalDateTime.of(2026, 9, 2, 12, 0));
            assertThat(response.durationMinutes()).isEqualTo(60);
            assertThat(response.status()).isEqualTo(AppointmentStatus.SCHEDULED);
        }

        @Test
        @DisplayName("Deve rejeitar agendamento sem antecedencia minima de 2 horas")
        void rejectsInsufficientNotice() {
            when(customerRepository.findById(1L)).thenReturn(Optional.of(activeCustomer));
            when(technicianRepository.findById(2L)).thenReturn(Optional.of(activeTechnician));
            when(serviceRepository.findById(3L)).thenReturn(Optional.of(activeService));

            // Clock is 08:00, 09:30 is only 1.5 hours in advance
            CreateAppointmentRequest request = new CreateAppointmentRequest(1L, 2L, 3L,
                    LocalDateTime.of(2026, 9, 2, 9, 30));

            assertThatThrownBy(() -> appointmentService.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("duas horas de antecedencia");
        }

        @Test
        @DisplayName("Deve rejeitar agendamentos no fim de semana")
        void rejectsWeekend() {
            when(customerRepository.findById(1L)).thenReturn(Optional.of(activeCustomer));
            when(technicianRepository.findById(2L)).thenReturn(Optional.of(activeTechnician));
            when(serviceRepository.findById(3L)).thenReturn(Optional.of(activeService));

            // 2026-09-05 is Saturday
            CreateAppointmentRequest request = new CreateAppointmentRequest(1L, 2L, 3L,
                    LocalDateTime.of(2026, 9, 5, 10, 0));

            assertThatThrownBy(() -> appointmentService.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("dia util");
        }

        @Test
        @DisplayName("Deve rejeitar agendamentos fora do horario das 08:00 as 18:00")
        void rejectsOutsideBusinessHours() {
            when(customerRepository.findById(1L)).thenReturn(Optional.of(activeCustomer));
            when(technicianRepository.findById(2L)).thenReturn(Optional.of(activeTechnician));
            when(serviceRepository.findById(3L)).thenReturn(Optional.of(activeService));

            // Starts at 17:30 with 60min duration ends at 18:30 (after 18:00)
            CreateAppointmentRequest request = new CreateAppointmentRequest(1L, 2L, 3L,
                    LocalDateTime.of(2026, 9, 2, 17, 30));

            assertThatThrownBy(() -> appointmentService.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("08:00 e 18:00");
        }

        @Test
        @DisplayName("Deve rejeitar sobreposicao de horario para o mesmo tecnico")
        void rejectsOverlappingAppointments() {
            when(customerRepository.findById(1L)).thenReturn(Optional.of(activeCustomer));
            when(technicianRepository.findById(2L)).thenReturn(Optional.of(activeTechnician));
            when(serviceRepository.findById(3L)).thenReturn(Optional.of(activeService));

            Appointment existing = new Appointment(9L, 2L, 3L,
                    LocalDateTime.of(2026, 9, 2, 10, 0),
                    LocalDateTime.of(2026, 9, 2, 11, 30),
                    90,
                    AppointmentStatus.SCHEDULED);

            when(appointmentRepository.findConflictingAppointments(eq(2L), eq(List.of(AppointmentStatus.SCHEDULED)), any(), any()))
                    .thenReturn(List.of(existing));

            CreateAppointmentRequest request = new CreateAppointmentRequest(1L, 2L, 3L,
                    LocalDateTime.of(2026, 9, 2, 11, 0));

            assertThatThrownBy(() -> appointmentService.create(request))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("ja possui uma visita nesse intervalo");
        }
    }

    @Nested
    @DisplayName("Cancelamento e Conclusão")
    class TransitionTests {

        @Test
        @DisplayName("Deve cancelar agendamento com antecedencia de 2 horas")
        void cancelsAppointmentSuccessfully() {
            Appointment appointment = new Appointment(1L, 2L, 3L,
                    LocalDateTime.of(2026, 9, 2, 14, 0),
                    LocalDateTime.of(2026, 9, 2, 15, 0),
                    60,
                    AppointmentStatus.SCHEDULED);
            appointment.setId(10L);

            when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appointment));
            when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

            AppointmentResponse response = appointmentService.cancel(10L);

            assertThat(response.status()).isEqualTo(AppointmentStatus.CANCELLED);
            verify(appointmentRepository).save(appointment);
        }

        @Test
        @DisplayName("Deve rejeitar cancelamento com menos de 2 horas de antecedencia")
        void rejectsCancellationWithShortNotice() {
            // Clock is 08:00, appointment at 09:00 (only 1 hour notice)
            Appointment appointment = new Appointment(1L, 2L, 3L,
                    LocalDateTime.of(2026, 9, 2, 9, 0),
                    LocalDateTime.of(2026, 9, 2, 10, 0),
                    60,
                    AppointmentStatus.SCHEDULED);
            appointment.setId(10L);

            when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appointment));

            assertThatThrownBy(() -> appointmentService.cancel(10L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("duas horas de antecedencia");
        }

        @Test
        @DisplayName("Deve concluir agendamento estritamente apos o termino da visita")
        void completesAppointmentSuccessfully() {
            // Appointment ended at 07:30, clock is 08:00 (after endsAt)
            Appointment appointment = new Appointment(1L, 2L, 3L,
                    LocalDateTime.of(2026, 9, 2, 6, 30),
                    LocalDateTime.of(2026, 9, 2, 7, 30),
                    60,
                    AppointmentStatus.SCHEDULED);
            appointment.setId(10L);

            when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appointment));
            when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArgument(0));

            AppointmentResponse response = appointmentService.complete(10L);

            assertThat(response.status()).isEqualTo(AppointmentStatus.COMPLETED);
        }

        @Test
        @DisplayName("Deve rejeitar conclusao antes do horario final da visita")
        void rejectsCompletionBeforeEnd() {
            // Appointment ends at 10:00, clock is 08:00
            Appointment appointment = new Appointment(1L, 2L, 3L,
                    LocalDateTime.of(2026, 9, 2, 9, 0),
                    LocalDateTime.of(2026, 9, 2, 10, 0),
                    60,
                    AppointmentStatus.SCHEDULED);
            appointment.setId(10L);

            when(appointmentRepository.findById(10L)).thenReturn(Optional.of(appointment));

            assertThatThrownBy(() -> appointmentService.complete(10L))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("apos o horario final");
        }

        @Test
        @DisplayName("Deve lancar ResourceNotFoundException para agendamento inexistente")
        void throwsNotFoundForInvalidId() {
            when(appointmentRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> appointmentService.cancel(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("ID 999");
        }
    }
}
