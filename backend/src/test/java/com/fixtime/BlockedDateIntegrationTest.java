package com.fixtime;

import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fixtime.appointment.CreateAppointmentRequest;
import com.fixtime.blockeddate.CreateBlockedDateRequest;
import com.fixtime.customer.CreateCustomerRequest;
import com.fixtime.service.CreateServiceRequest;
import com.fixtime.technician.CreateTechnicianRequest;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Testes de integração para bloqueio de datas, feriados nacionais e impacto em agendamentos/disponibilidade.
 * Valida o cumprimento estrito da regra de negócio RN08 e requisitos funcionais RF04 e RF05.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class BlockedDateIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Valida RN08 e RNF01: Cadastro e listagem de datas bloqueadas personalizadas via endpoints REST.
     */
    @Test
    @DisplayName("Deve cadastrar e listar datas bloqueadas com sucesso via API")
    void createAndListBlockedDates() throws Exception {
        LocalDate holiday = LocalDate.now().plusWeeks(2).with(DayOfWeek.WEDNESDAY);

        CreateBlockedDateRequest request = new CreateBlockedDateRequest(holiday, "Feriado Nacional");

        mockMvc.perform(post("/api/v1/blocked-dates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.date", is(holiday.toString())))
                .andExpect(jsonPath("$.reason", is("Feriado Nacional")))
                .andExpect(jsonPath("$.createdAt", notNullValue()));

        mockMvc.perform(get("/api/v1/blocked-dates"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].date", is(holiday.toString())))
                .andExpect(jsonPath("$[0].reason", is("Feriado Nacional")));
    }

    /**
     * Valida RN08 e RNF03: Retorno de 409 Conflict ao tentar cadastrar duplicidade de bloqueio para a mesma data.
     */
    @Test
    @DisplayName("Deve retornar 409 Conflict ao tentar cadastrar bloqueio para data ja bloqueada")
    void rejectsDuplicateBlockedDate() throws Exception {
        LocalDate holiday = LocalDate.now().plusWeeks(3).with(DayOfWeek.THURSDAY);

        CreateBlockedDateRequest request = new CreateBlockedDateRequest(holiday, "Recesso Coletivo");

        mockMvc.perform(post("/api/v1/blocked-dates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/blocked-dates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error", is("CONFLICT")))
                .andExpect(jsonPath("$.message", is("A data " + holiday + " ja esta bloqueada")));
    }

    /**
     * Valida RN08 e RF05: Rejeição de agendamento em data previamente bloqueada por operador com 400 Bad Request.
     */
    @Test
    @DisplayName("Deve rejeitar criacao de agendamento em data bloqueada (400 Bad Request)")
    void rejectsAppointmentCreationOnBlockedDate() throws Exception {
        // 1. Cadastrar cliente, tecnico e servico
        CreateCustomerRequest customerReq = new CreateCustomerRequest("Bruno Lima", "bruno@example.com", "11999990000");
        String custRes = mockMvc.perform(post("/api/v1/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(customerReq)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Long customerId = objectMapper.readTree(custRes).get("id").asLong();

        CreateTechnicianRequest techReq = new CreateTechnicianRequest("Mariana Costa", "mariana@example.com", "11988880000");
        String techRes = mockMvc.perform(post("/api/v1/technicians")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(techReq)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Long techId = objectMapper.readTree(techRes).get("id").asLong();

        CreateServiceRequest servReq = new CreateServiceRequest("Instalacao", "Servico de instalacao", 60, new BigDecimal("180.00"));
        String servRes = mockMvc.perform(post("/api/v1/services")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(servReq)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Long serviceId = objectMapper.readTree(servRes).get("id").asLong();

        // 2. Bloquear data
        LocalDate blockedDate = LocalDate.now().plusWeeks(1).with(DayOfWeek.TUESDAY);
        CreateBlockedDateRequest blockReq = new CreateBlockedDateRequest(blockedDate, "Carnaval");
        mockMvc.perform(post("/api/v1/blocked-dates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blockReq)))
                .andExpect(status().isCreated());

        // 3. Tentar agendar na data bloqueada
        LocalDateTime appointmentTime = blockedDate.atTime(10, 0);
        CreateAppointmentRequest appReq = new CreateAppointmentRequest(customerId, techId, serviceId, appointmentTime);

        mockMvc.perform(post("/api/v1/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(appReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("BAD_REQUEST")))
                .andExpect(jsonPath("$.message", is("A data " + blockedDate + " esta bloqueada para agendamentos")));
    }

    /**
     * Valida RN08 e RF04: Consulta de disponibilidade em data bloqueada retorna lista vazia de horários.
     */
    @Test
    @DisplayName("Deve retornar lista de horarios vazia ao consultar disponibilidade em data bloqueada")
    void returnsEmptyAvailabilityOnBlockedDate() throws Exception {
        // 1. Cadastrar tecnico
        CreateTechnicianRequest techReq = new CreateTechnicianRequest("Lucas Rocha", "lucas@example.com", "11977770000");
        String techRes = mockMvc.perform(post("/api/v1/technicians")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(techReq)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Long techId = objectMapper.readTree(techRes).get("id").asLong();

        // 2. Bloquear data
        LocalDate holiday = LocalDate.now().plusWeeks(2).with(DayOfWeek.FRIDAY);
        CreateBlockedDateRequest blockReq = new CreateBlockedDateRequest(holiday, "Sexta-feira Santa");
        mockMvc.perform(post("/api/v1/blocked-dates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blockReq)))
                .andExpect(status().isCreated());

        // 3. Consultar disponibilidade na data bloqueada -> deve retornar lista vazia
        mockMvc.perform(get("/api/v1/technicians/" + techId + "/availability")
                        .param("date", holiday.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", empty()));
    }

    /**
     * Valida RN08 e RF04/RF05: Bloqueio automático de feriado nacional brasileiro fixo (ex: Natal 25/12)
     * sem necessidade de inserção manual de registro na tabela de bloqueios.
     */
    @Test
    @DisplayName("Deve rejeitar agendamento e zerar disponibilidade em feriado nacional automatico (ex: Natal)")
    void automaticNationalHolidayBlocked() throws Exception {
        // 1. Cadastrar cliente, tecnico e servico
        CreateCustomerRequest customerReq = new CreateCustomerRequest("Fernanda Souza", "fernanda@example.com", "11987654321");
        String custRes = mockMvc.perform(post("/api/v1/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(customerReq)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Long customerId = objectMapper.readTree(custRes).get("id").asLong();

        CreateTechnicianRequest techReq = new CreateTechnicianRequest("Gabriel Lima", "gabriel@example.com", "11976543210");
        String techRes = mockMvc.perform(post("/api/v1/technicians")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(techReq)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Long techId = objectMapper.readTree(techRes).get("id").asLong();

        CreateServiceRequest servReq = new CreateServiceRequest("Revisao Geral", "Revisao completa", 60, new BigDecimal("200.00"));
        String servRes = mockMvc.perform(post("/api/v1/services")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(servReq)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Long serviceId = objectMapper.readTree(servRes).get("id").asLong();

        // 25 de Dezembro de 2026 (Natal - cai numa sexta-feira)
        LocalDate christmas = LocalDate.of(2026, 12, 25);

        // 2. Consulta de disponibilidade em feriado nacional deve retornar vazia
        mockMvc.perform(get("/api/v1/technicians/" + techId + "/availability")
                        .param("date", christmas.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", empty()));

        // 3. Tentativa de agendamento em feriado nacional deve retornar 400 Bad Request
        CreateAppointmentRequest appReq = new CreateAppointmentRequest(customerId, techId, serviceId, christmas.atTime(10, 0));
        mockMvc.perform(post("/api/v1/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(appReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("BAD_REQUEST")))
                .andExpect(jsonPath("$.message", is("A data " + christmas + " esta bloqueada para agendamentos")));
    }
}
