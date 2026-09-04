package com.fixtime.technician;

import com.fixtime.appointment.AppointmentService;
import com.fixtime.appointment.AvailabilityResponse;
import java.time.LocalDate;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/technicians")
public class TechnicianAvailabilityController {
    private final AppointmentService appointmentService;

    public TechnicianAvailabilityController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    /** Returns continuous free intervals between 08:00 and 18:00 on a weekday. */
    @GetMapping("/{technicianId}/availability")
    public List<AvailabilityResponse> availability(
            @PathVariable Long technicianId,
            @RequestParam LocalDate date) {
        return appointmentService.availability(technicianId, date);
    }
}