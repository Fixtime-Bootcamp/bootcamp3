package com.fixtime.appointment;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record CreateAppointmentRequest(
        @NotNull(message = "O ID do cliente e obrigatorio")
        Long customerId,

        @NotNull(message = "O ID do tecnico e obrigatorio")
        Long technicianId,

        @NotNull(message = "O ID do servico e obrigatorio")
        Long serviceId,

        @NotNull(message = "O horario de inicio e obrigatorio")
        LocalDateTime startsAt) {
}
