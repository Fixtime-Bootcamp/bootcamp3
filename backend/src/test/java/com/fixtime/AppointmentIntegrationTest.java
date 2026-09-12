package com.fixtime;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fixtime.appointment.CreateAppointmentRequest;
import com.fixtime.customer.CreateCustomerRequest;
import com.fixtime.service.CreateServiceRequest;
import com.fixtime.technician.CreateTechnicianRequest;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AppointmentIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Fluxo completo: Cadastrar Cliente, Tecnico, Servico e criar Agendamento com persistencia H2")
    void fullSchedulingFlowIntegrationTest() throws Exception {
        // 1. Cadastrar Cliente
        CreateCustomerRequest customerReq = new CreateCustomerRequest("Ana Silva", "ana.silva@example.com", "11988887777");
        String customerResponse = mockMvc.perform(post("/api/v1/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(customerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.name", is("Ana Silva")))
                .andExpect(jsonPath("$.active", is(true)))
                .andReturn().getResponse().getContentAsString();

        Long customerId = objectMapper.readTree(customerResponse).get("id").asLong();

        // 2. Cadastrar Tecnico
        CreateTechnicianRequest techReq = new CreateTechnicianRequest("Carlos Santos", "carlos.santos@example.com", "11977776666");
        String techResponse = mockMvc.perform(post("/api/v1/technicians")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(techReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.name", is("Carlos Santos")))
                .andReturn().getResponse().getContentAsString();

        Long techId = objectMapper.readTree(techResponse).get("id").asLong();

        // 3. Cadastrar Servico
        CreateServiceRequest serviceReq = new CreateServiceRequest(
                "Troca de Placa",
                "Substituicao de componente principal",
                90,
                new BigDecimal("250.00"));

        String serviceResponse = mockMvc.perform(post("/api/v1/services")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(serviceReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.durationMinutes", is(90)))
                .andReturn().getResponse().getContentAsString();

        Long serviceId = objectMapper.readTree(serviceResponse).get("id").asLong();

        // 4. Criar Agendamento em dia util futuro (Segunda-feira 09:00)
        LocalDateTime futureMonday = LocalDateTime.now().plusWeeks(1)
                .with(java.time.DayOfWeek.MONDAY)
                .withHour(9)
                .withMinute(0)
                .withSecond(0)
                .withNano(0);

        CreateAppointmentRequest appointmentReq = new CreateAppointmentRequest(
                customerId,
                techId,
                serviceId,
                futureMonday);

        String appointmentResponse = mockMvc.perform(post("/api/v1/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(appointmentReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.customerId", is(customerId.intValue())))
                .andExpect(jsonPath("$.technicianId", is(techId.intValue())))
                .andExpect(jsonPath("$.serviceId", is(serviceId.intValue())))
                .andExpect(jsonPath("$.durationMinutes", is(90)))
                .andExpect(jsonPath("$.status", is("SCHEDULED")))
                .andReturn().getResponse().getContentAsString();

        Long appointmentId = objectMapper.readTree(appointmentResponse).get("id").asLong();

        // 5. Rejeitar conflito de horario para o mesmo tecnico (mesma segunda-feira 09:30, 90min de duracao colide com 09:00-10:30)
        CreateAppointmentRequest conflictReq = new CreateAppointmentRequest(
                customerId,
                techId,
                serviceId,
                futureMonday.plusMinutes(30));

        mockMvc.perform(post("/api/v1/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(conflictReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error", is("CONFLICT")))
                .andExpect(jsonPath("$.message", notNullValue()));

        // 6. Permitir horario adjacente (mesma segunda-feira 10:30, logo apos o fim das 10:30)
        CreateAppointmentRequest adjacentReq = new CreateAppointmentRequest(
                customerId,
                techId,
                serviceId,
                futureMonday.plusMinutes(90));

        mockMvc.perform(post("/api/v1/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adjacentReq)))
                .andExpect(status().isCreated());

        // 7. Cancelar agendamento com antecedencia
        mockMvc.perform(patch("/api/v1/appointments/" + appointmentId + "/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELLED")));

        // 8. Listar agendamentos
        mockMvc.perform(get("/api/v1/appointments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.totalElements", is(2)))
                .andExpect(jsonPath("$.totalPages", is(1)))
                .andExpect(jsonPath("$.pageNumber", is(0)))
                .andExpect(jsonPath("$.size", is(20)));
    }

    @Test
    @DisplayName("Validar resposta 400 estruturada ao enviar payload invalido")
    void returns400OnInvalidPayload() throws Exception {
        mockMvc.perform(post("/api/v1/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("VALIDATION_FAILED")))
                .andExpect(jsonPath("$.fieldErrors", notNullValue()));
    }

    @Nested
    @DisplayName("Paginacao e busca de agendamentos")
    class ListingPaginationTests {

        private Long tech1;
        private Long customer1;
        private Long apt1;
        private Long apt2;
        private Long apt3;
        private LocalDate mondayDate;
        private LocalDate tuesdayDate;

        @BeforeEach
        void seedAppointments() throws Exception {
            customer1 = createCustomer("Cliente Um", "cliente1@example.com", "11911111111");
            Long customer2 = createCustomer("Cliente Dois", "cliente2@example.com", "11922222222");
            tech1 = createTechnician("Tecnico Um", "tecnico1@example.com", "11933333333");
            Long tech2 = createTechnician("Tecnico Dois", "tecnico2@example.com", "11944444444");
            Long serviceId = createService("Manutencao", 60);

            LocalDateTime monday = nextWeekday(java.time.DayOfWeek.MONDAY, 9);
            LocalDateTime tuesday = nextWeekday(java.time.DayOfWeek.TUESDAY, 9);
            LocalDateTime wednesday = nextWeekday(java.time.DayOfWeek.WEDNESDAY, 9);
            mondayDate = monday.toLocalDate();
            tuesdayDate = tuesday.toLocalDate();

            apt1 = createAppointment(customer1, tech1, serviceId, monday);
            apt2 = createAppointment(customer2, tech1, serviceId, tuesday);
            apt3 = createAppointment(customer1, tech2, serviceId, wednesday);
            cancelAppointment(apt3);
        }

        @Test
        @DisplayName("Deve usar paginacao padrao: pagina 0, tamanho 20, ordenado por startsAt ASC")
        void defaultPagination() throws Exception {
            mockMvc.perform(get("/api/v1/appointments"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.pageNumber", is(0)))
                    .andExpect(jsonPath("$.size", is(20)))
                    .andExpect(jsonPath("$.totalElements", is(3)))
                    .andExpect(jsonPath("$.totalPages", is(1)))
                    .andExpect(jsonPath("$.content[0].id", is(apt1.intValue())))
                    .andExpect(jsonPath("$.content[1].id", is(apt2.intValue())))
                    .andExpect(jsonPath("$.content[2].id", is(apt3.intValue())));
        }

        @Test
        @DisplayName("Deve retornar pagina vazia ao paginar alem do limite de dados")
        void pageBeyondAvailableData() throws Exception {
            mockMvc.perform(get("/api/v1/appointments").param("page", "5").param("size", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(0)))
                    .andExpect(jsonPath("$.totalElements", is(3)))
                    .andExpect(jsonPath("$.pageNumber", is(5)))
                    .andExpect(jsonPath("$.size", is(10)));
        }

        @Test
        @DisplayName("Deve filtrar por technicianId")
        void filtersByTechnicianId() throws Exception {
            mockMvc.perform(get("/api/v1/appointments").param("technicianId", tech1.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(2)))
                    .andExpect(jsonPath("$.totalElements", is(2)));
        }

        @Test
        @DisplayName("Deve filtrar por customerId")
        void filtersByCustomerId() throws Exception {
            mockMvc.perform(get("/api/v1/appointments").param("customerId", customer1.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(2)));
        }

        @Test
        @DisplayName("Deve filtrar por status")
        void filtersByStatus() throws Exception {
            mockMvc.perform(get("/api/v1/appointments").param("status", "CANCELLED"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(1)))
                    .andExpect(jsonPath("$.content[0].id", is(apt3.intValue())));
        }

        @Test
        @DisplayName("Deve filtrar por intervalo de startDate e endDate")
        void filtersByDateRange() throws Exception {
            mockMvc.perform(get("/api/v1/appointments")
                            .param("startDate", mondayDate.toString())
                            .param("endDate", tuesdayDate.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(2)));
        }

        @Test
        @DisplayName("Deve combinar multiplos filtros simultaneamente")
        void combinesMultipleFilters() throws Exception {
            mockMvc.perform(get("/api/v1/appointments")
                            .param("technicianId", tech1.toString())
                            .param("status", "SCHEDULED")
                            .param("startDate", mondayDate.toString())
                            .param("endDate", tuesdayDate.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content", hasSize(2)));
        }

        @Test
        @DisplayName("Deve ordenar de forma ascendente e descendente por startsAt")
        void sortsAscendingAndDescending() throws Exception {
            mockMvc.perform(get("/api/v1/appointments").param("sort", "startsAt,asc"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].id", is(apt1.intValue())))
                    .andExpect(jsonPath("$.content[2].id", is(apt3.intValue())));

            mockMvc.perform(get("/api/v1/appointments").param("sort", "startsAt,desc"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.content[0].id", is(apt3.intValue())))
                    .andExpect(jsonPath("$.content[2].id", is(apt1.intValue())));
        }

        @Test
        @DisplayName("Deve retornar 400 para valor de status invalido")
        void invalidStatusReturns400() throws Exception {
            mockMvc.perform(get("/api/v1/appointments").param("status", "NOT_A_STATUS"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error", is("BAD_REQUEST")));
        }
    }

    private Long createCustomer(String name, String email, String phone) throws Exception {
        CreateCustomerRequest request = new CreateCustomerRequest(name, email, phone);
        String response = mockMvc.perform(post("/api/v1/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }

    private Long createTechnician(String name, String email, String phone) throws Exception {
        CreateTechnicianRequest request = new CreateTechnicianRequest(name, email, phone);
        String response = mockMvc.perform(post("/api/v1/technicians")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }

    private Long createService(String name, int durationMinutes) throws Exception {
        CreateServiceRequest request = new CreateServiceRequest(
                name, "Descricao", durationMinutes, new BigDecimal("100.00"));
        String response = mockMvc.perform(post("/api/v1/services")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }

    private Long createAppointment(Long customerId, Long technicianId, Long serviceId, LocalDateTime startsAt)
            throws Exception {
        CreateAppointmentRequest request = new CreateAppointmentRequest(customerId, technicianId, serviceId, startsAt);
        String response = mockMvc.perform(post("/api/v1/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }

    private void cancelAppointment(Long id) throws Exception {
        mockMvc.perform(patch("/api/v1/appointments/" + id + "/cancel"))
                .andExpect(status().isOk());
    }

    private LocalDateTime nextWeekday(java.time.DayOfWeek day, int hour) {
        return LocalDateTime.now().plusWeeks(1)
                .with(day)
                .withHour(hour)
                .withMinute(0)
                .withSecond(0)
                .withNano(0);
    }
}
