package com.fixtime.web;

import io.swagger.v3.core.converter.ModelConverters;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.responses.ApiResponse;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Metadados da documentacao OpenAPI e respostas de erro padronizadas (ErrorResponse),
 * mantendo os controllers livres de anotacoes repetitivas.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI fixTimeOpenApi() {
        return new OpenAPI()
                .components(new Components().schemas(ModelConverters.getInstance().read(ErrorResponse.class)))
                .info(new Info()
                .title("FixTime API")
                .version("1.0.0")
                .description("API REST de agendamento de visitas para assistencia tecnica: clientes, tecnicos, "
                        + "servicos, disponibilidade, datas bloqueadas e agendamentos.")
                .contact(new Contact()
                        .name("Equipe FixTime")
                        .url("https://github.com/Fixtime-Bootcamp/bootcamp3")));
    }

    @Bean
    public OperationCustomizer standardErrorResponses() {
        Schema<?> errorSchema = new Schema<>().$ref("#/components/schemas/ErrorResponse");
        return (operation, handlerMethod) -> {
            var responses = operation.getResponses();
            boolean hasBody = operation.getRequestBody() != null;
            boolean hasInput = hasBody || (operation.getParameters() != null && !operation.getParameters().isEmpty());
            boolean hasPathVariable = operation.getParameters() != null
                    && operation.getParameters().stream().anyMatch(p -> "path".equals(p.getIn()));
            boolean mayConflict = handlerMethod.getBeanType().getSimpleName().matches("Appointment.*|BlockedDate.*")
                    && handlerMethod.getMethod().isAnnotationPresent(
                            org.springframework.web.bind.annotation.PostMapping.class);

            if (hasInput) {
                responses.addApiResponse("400", error("Requisicao invalida ou regra de negocio violada", errorSchema));
            }
            if (hasPathVariable || (hasBody && handlerMethod.getBeanType().getSimpleName().startsWith("Appointment"))) {
                responses.addApiResponse("404", error("Recurso nao encontrado", errorSchema));
            }
            if (mayConflict) {
                responses.addApiResponse("409", error("Conflito (horario ocupado ou data ja bloqueada)", errorSchema));
            }
            responses.addApiResponse("500", error("Erro interno do servidor", errorSchema));
            return operation;
        };
    }

    private ApiResponse error(String description, Schema<?> schema) {
        return new ApiResponse().description(description)
                .content(new Content().addMediaType("application/json", new MediaType().schema(schema)));
    }
}
