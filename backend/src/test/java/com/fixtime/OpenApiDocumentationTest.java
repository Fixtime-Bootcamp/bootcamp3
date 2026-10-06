package com.fixtime;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Valida a documentacao interativa da API (Issue #25): especificacao OpenAPI em /v3/api-docs
 * e Swagger UI em /swagger-ui.html.
 */
@SpringBootTest
@AutoConfigureMockMvc
class OpenApiDocumentationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Deve expor metadados FixTime API 1.0.0 em /v3/api-docs")
    void exposesApiMetadata() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.openapi", notNullValue()))
                .andExpect(jsonPath("$.info.title", is("FixTime API")))
                .andExpect(jsonPath("$.info.version", is("1.0.0")))
                .andExpect(jsonPath("$.info.contact.name", is("Equipe FixTime")));
    }

    @Test
    @DisplayName("Deve documentar endpoints /api/v1 com codigos HTTP de sucesso e erro")
    void documentsEndpointsAndStatusCodes() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(jsonPath("$.paths['/api/v1/appointments'].post.summary", is("Criar agendamento")))
                .andExpect(jsonPath("$.paths['/api/v1/appointments'].post.responses['201']", notNullValue()))
                .andExpect(jsonPath("$.paths['/api/v1/appointments'].post.responses['400']", notNullValue()))
                .andExpect(jsonPath("$.paths['/api/v1/appointments'].post.responses['409']", notNullValue()))
                .andExpect(jsonPath("$.paths['/api/v1/appointments'].post.responses['500']", notNullValue()))
                .andExpect(jsonPath("$.paths['/api/v1/appointments/{id}/cancel'].patch.responses['200']", notNullValue()))
                .andExpect(jsonPath("$.paths['/api/v1/appointments/{id}/cancel'].patch.responses['404']", notNullValue()))
                .andExpect(jsonPath("$.paths['/api/v1/customers'].get.responses['200']", notNullValue()))
                .andExpect(jsonPath("$.components.schemas.ErrorResponse", notNullValue()))
                .andExpect(jsonPath("$.components.schemas.CreateAppointmentRequest", notNullValue()))
                .andExpect(jsonPath("$.components.schemas.AppointmentResponse", notNullValue()));
    }

    @Test
    @DisplayName("Deve servir o Swagger UI em /swagger-ui.html")
    void servesSwaggerUi() throws Exception {
        mockMvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Swagger UI")));
    }
}
