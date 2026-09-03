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
import java.time.LocalDateTime;
import org.junit.jupiter.api.DisplayName;
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
                .andExpect(jsonPath("$", hasSize(2)));
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
}
