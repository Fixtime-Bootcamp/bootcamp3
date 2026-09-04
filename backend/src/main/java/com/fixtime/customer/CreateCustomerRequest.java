package com.fixtime.customer;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateCustomerRequest(
        @NotBlank(message = "O nome do cliente e obrigatorio")
        String name,

        @NotBlank(message = "O e-mail do cliente e obrigatorio")
        @Email(message = "O formato do e-mail e invalido")
        String email,

        @NotBlank(message = "O telefone do cliente e obrigatorio")
        String phone) {
}
