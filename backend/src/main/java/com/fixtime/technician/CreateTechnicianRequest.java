package com.fixtime.technician;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateTechnicianRequest(
        @NotBlank(message = "O nome do tecnico e obrigatorio")
        String name,

        @NotBlank(message = "O e-mail do tecnico e obrigatorio")
        @Email(message = "O formato do e-mail e invalido")
        String email,

        @NotBlank(message = "O telefone do tecnico e obrigatorio")
        String phone) {
}
