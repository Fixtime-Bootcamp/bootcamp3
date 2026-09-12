package com.fixtime.blockeddate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CreateBlockedDateRequest(
        @NotNull(message = "A data a ser bloqueada e obrigatoria")
        LocalDate date,

        @NotBlank(message = "O motivo do bloqueio e obrigatorio")
        String reason
) {}
