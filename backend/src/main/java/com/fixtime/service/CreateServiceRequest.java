package com.fixtime.service;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record CreateServiceRequest(
        @NotBlank(message = "O nome do servico e obrigatorio")
        String name,

        String description,

        @NotNull(message = "A duracao e obrigatoria")
        @Positive(message = "A duracao deve ser positiva")
        Integer durationMinutes,

        @NotNull(message = "O preco e obrigatorio")
        @Min(value = 0, message = "O preco nao pode ser negativo")
        BigDecimal price) {
}
