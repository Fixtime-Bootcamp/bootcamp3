package com.fixtime.appointment;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.io.IOException;
import java.time.Clock;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.http.HttpHeaders;
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
    private static final DateTimeFormatter FILENAME_DATE_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE;

    private final AppointmentService service;
    private final AppointmentExportService exportService;
    private final Clock clock;

    public AppointmentController(AppointmentService service, AppointmentExportService exportService, Clock clock) {
        this.service = service;
        this.exportService = exportService;
        this.clock = clock;
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

    @GetMapping("/export")
    public void export(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) Long technicianId,
            @RequestParam(required = false) AppointmentStatus status,
            HttpServletResponse response) throws IOException {
        exportService.validatePeriod(startDate, endDate);

        String filename = "appointments-" + LocalDate.now(clock).format(FILENAME_DATE_FORMAT) + ".csv";
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename);

        exportService.writeCsv(response.getOutputStream(), startDate, endDate, technicianId, status);
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
