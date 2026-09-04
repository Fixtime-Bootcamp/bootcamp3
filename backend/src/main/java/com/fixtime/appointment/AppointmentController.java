package com.fixtime.appointment;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/appointments")
public class AppointmentController {
    private final AppointmentService service;

    public AppointmentController(AppointmentService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentResponse create(@Valid @RequestBody CreateAppointmentRequest request) {
        return service.create(request);
    }

    @GetMapping
    public List<AppointmentResponse> list(
            @RequestParam(required = false) LocalDate date,
            @RequestParam(required = false) Long technicianId,
            @RequestParam(required = false) AppointmentStatus status) {
        return service.list(date, technicianId, status);
    }

    @PatchMapping("/{id}/cancel")
    public AppointmentResponse cancel(@PathVariable Long id) {
        return service.cancel(id);
    }

    @PatchMapping("/{id}/complete")
    public AppointmentResponse complete(@PathVariable Long id) {
        return service.complete(id);
    }
}
