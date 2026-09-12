package com.fixtime;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fixtime.web.HealthController;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Teste de contrato Web MVC para o endpoint de saúde da aplicação.
 * Valida o cumprimento do requisito RNF01 e disponibilidade da API REST /api/v1/health.
 */
@WebMvcTest(HealthController.class)
class HealthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    /**
     * Valida RNF01: Endpoint /api/v1/health responde 200 OK com payload JSON {"status": "UP"}.
     */
    @Test
    @DisplayName("Deve retornar status UP e 200 OK no endpoint de saude")
    void returnsServiceHealth() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("UP")));
    }
}
