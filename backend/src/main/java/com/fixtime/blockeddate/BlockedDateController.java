package com.fixtime.blockeddate;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Datas bloqueadas", description = "Bloqueios de agenda e feriados")
@RestController
@RequestMapping("/api/v1/blocked-dates")
public class BlockedDateController {
    private final BlockedDateService service;

    public BlockedDateController(BlockedDateService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Criar bloqueio de data")
    public BlockedDateResponse create(@Valid @RequestBody CreateBlockedDateRequest request) {
        return service.create(request);
    }

    @GetMapping
    @Operation(summary = "Listar datas bloqueadas")
    public List<BlockedDateResponse> list() {
        return service.listAll();
    }
}
