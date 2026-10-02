package com.fixtime.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Saude", description = "Verificacao de disponibilidade da API")
@RestController
public class HealthController {
    @GetMapping("/api/v1/health")
    @Operation(summary = "Verificar saude da API")
    public Map<String, String> health() {
        return Map.of("status", "UP", "service", "fixtime-api");
    }
}
