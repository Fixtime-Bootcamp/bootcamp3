package com.fixtime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fixtime.appointment.CreateAppointmentRequest;
import com.fixtime.customer.CreateCustomerRequest;
import com.fixtime.service.CreateServiceRequest;
import com.fixtime.technician.CreateTechnicianRequest;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
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
 * Testes de integração para a exportação de agendamentos em CSV via API REST.
 * Valida o requisito funcional RF08, conformidade RFC 4180, codificação UTF-8 com BOM e tratamento de erros (RNF03).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AppointmentExportIntegrationTest {

    private static final byte[] UTF8_BOM = new byte[] {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Valida RF08: Exportação de CSV com BOM UTF-8 (para compatibilidade com Excel),
     * cabeçalho RFC 4180 e dados formatados com caracteres acentuados.
     */
    @Test
    @DisplayName("Exporta CSV com BOM UTF-8, cabecalho e dados, incluindo caracteres acentuados")
    void exportsCsvWithDataAndAccentedCharacters() throws Exception {
        Long customerId = createCustomer("João Ferreira Núñez", "joao.ferreira@example.com");
        Long technicianId = createTechnician("Cárlos Aração", "carlos.aracao@example.com");
        Long serviceId = createService("Manutenção de Ar-Condicionado", 60, new BigDecimal("199.90"));

        LocalDateTime futureMonday = LocalDateTime.now().plusWeeks(1)
                .with(java.time.DayOfWeek.MONDAY)
                .withHour(9).withMinute(0).withSecond(0).withNano(0);

        createAppointment(customerId, technicianId, serviceId, futureMonday);

        byte[] csvBytes = mockMvc.perform(get("/api/v1/appointments/export"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", org.hamcrest.Matchers.containsString("text/csv")))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.matchesPattern(
                        "attachment; filename=appointments-\\d{4}-\\d{2}-\\d{2}\\.csv")))
                .andReturn().getResponse().getContentAsByteArray();

        assertThat(csvBytes[0]).isEqualTo(UTF8_BOM[0]);
        assertThat(csvBytes[1]).isEqualTo(UTF8_BOM[1]);
        assertThat(csvBytes[2]).isEqualTo(UTF8_BOM[2]);

        String csv = new String(csvBytes, 3, csvBytes.length - 3, StandardCharsets.UTF_8);
        String[] lines = csv.split("\r\n");

        assertThat(lines[0]).isEqualTo(
                "ID,Data Inicio,Data Fim,ID Cliente,Nome Cliente,ID Tecnico,Nome Tecnico,ID Servico,Nome Servico,Duracao (min),Preco (R$),Status");
        assertThat(lines[1]).contains("João Ferreira Núñez");
        assertThat(lines[1]).contains("Cárlos Aração");
        assertThat(lines[1]).contains("Manutenção de Ar-Condicionado");
        assertThat(lines[1]).contains("60");
        assertThat(lines[1]).contains("199.90");
        assertThat(lines[1]).contains("SCHEDULED");
    }

    /**
     * Valida RF08: Exportação de CSV quando a busca não retorna registros, gerando apenas o cabeçalho e BOM UTF-8.
     */
    @Test
    @DisplayName("Exporta apenas BOM e cabecalho quando o filtro nao encontra resultados")
    void exportsHeaderOnlyWhenFilterHasNoResults() throws Exception {
        byte[] csvBytes = mockMvc.perform(get("/api/v1/appointments/export")
                        .param("startDate", "2099-01-01")
                        .param("endDate", "2099-01-31"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsByteArray();

        String csv = new String(csvBytes, 3, csvBytes.length - 3, StandardCharsets.UTF_8);
        String[] lines = csv.split("\r\n");

        assertThat(lines).hasSize(1);
        assertThat(lines[0]).isEqualTo(
                "ID,Data Inicio,Data Fim,ID Cliente,Nome Cliente,ID Tecnico,Nome Tecnico,ID Servico,Nome Servico,Duracao (min),Preco (R$),Status");
    }

    /**
     * Valida RF08 e RNF03: Resposta de erro 400 Bad Request com payload padronizado JSON quando startDate > endDate.
     */
    @Test
    @DisplayName("Responde 400 no formato JSON padrao quando startDate e posterior a endDate")
    void returns400WhenStartDateIsAfterEndDate() throws Exception {
        mockMvc.perform(get("/api/v1/appointments/export")
                        .param("startDate", "2026-05-10")
                        .param("endDate", "2026-05-01"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", org.hamcrest.Matchers.is("BAD_REQUEST")))
                .andExpect(jsonPath("$.message", org.hamcrest.Matchers.notNullValue()));
    }

    private Long createCustomer(String name, String email) throws Exception {
        CreateCustomerRequest req = new CreateCustomerRequest(name, email, "11988887777");
        String response = mockMvc.perform(post("/api/v1/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }

    private Long createTechnician(String name, String email) throws Exception {
        CreateTechnicianRequest req = new CreateTechnicianRequest(name, email, "11977776666");
        String response = mockMvc.perform(post("/api/v1/technicians")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }

    private Long createService(String name, int durationMinutes, BigDecimal price) throws Exception {
        CreateServiceRequest req = new CreateServiceRequest(name, "Descricao de teste", durationMinutes, price);
        String response = mockMvc.perform(post("/api/v1/services")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }

    private Long createAppointment(Long customerId, Long technicianId, Long serviceId, LocalDateTime startsAt) throws Exception {
        CreateAppointmentRequest req = new CreateAppointmentRequest(customerId, technicianId, serviceId, startsAt);
        String response = mockMvc.perform(post("/api/v1/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }
}
