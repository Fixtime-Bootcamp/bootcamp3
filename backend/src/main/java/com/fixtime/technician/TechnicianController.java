package com.fixtime.technician;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/technicians")
public class TechnicianController {
    private final TechnicianService service;

    public TechnicianController(TechnicianService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TechnicianResponse create(@Valid @RequestBody CreateTechnicianRequest request) {
        return service.create(request);
    }

    @GetMapping
    public List<TechnicianResponse> list() {
        return service.listAll();
    }
}
