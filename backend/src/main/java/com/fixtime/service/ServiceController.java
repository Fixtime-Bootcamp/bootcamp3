package com.fixtime.service;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Servicos", description = "Catalogo de servicos")
@RestController
@RequestMapping("/api/v1/services")
public class ServiceController {
    private final ServiceCatalogService service;

    public ServiceController(ServiceCatalogService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Cadastrar servico")
    public ServiceResponse create(@Valid @RequestBody CreateServiceRequest request) {
        return service.create(request);
    }

    @GetMapping
    @Operation(summary = "Listar servicos")
    public List<ServiceResponse> list() {
        return service.listAll();
    }

    @PatchMapping("/{id}/toggle-active")
    @Operation(summary = "Ativar ou inativar servico")
    public ServiceResponse toggleActive(@PathVariable Long id) {
        return service.toggleActive(id);
    }
}
