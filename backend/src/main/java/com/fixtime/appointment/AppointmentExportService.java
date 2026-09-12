package com.fixtime.appointment;

import com.fixtime.customer.Customer;
import com.fixtime.customer.CustomerRepository;
import com.fixtime.service.ServiceEntity;
import com.fixtime.service.ServiceRepository;
import com.fixtime.technician.Technician;
import com.fixtime.technician.TechnicianRepository;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Gera o CSV de exportacao de agendamentos (RF08), escrevendo linha a linha
 * diretamente no OutputStream da resposta HTTP para evitar concentrar todo o
 * conteudo do arquivo em memoria durante a geracao.
 */
@Service
public class AppointmentExportService {

    private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final byte[] UTF8_BOM = new byte[] {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};
    private static final String[] HEADERS = {
            "ID", "Data Inicio", "Data Fim", "ID Cliente", "Nome Cliente",
            "ID Tecnico", "Nome Tecnico", "ID Servico", "Nome Servico",
            "Duracao (min)", "Preco (R$)", "Status"
    };

    private final AppointmentRepository appointmentRepository;
    private final CustomerRepository customerRepository;
    private final TechnicianRepository technicianRepository;
    private final ServiceRepository serviceRepository;

    public AppointmentExportService(
            AppointmentRepository appointmentRepository,
            CustomerRepository customerRepository,
            TechnicianRepository technicianRepository,
            ServiceRepository serviceRepository) {
        this.appointmentRepository = appointmentRepository;
        this.customerRepository = customerRepository;
        this.technicianRepository = technicianRepository;
        this.serviceRepository = serviceRepository;
    }

    @Transactional(readOnly = true)
    public void writeCsv(
            OutputStream outputStream,
            LocalDate startDate,
            LocalDate endDate,
            Long technicianId,
            AppointmentStatus status) throws IOException {

        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("startDate nao pode ser posterior a endDate");
        }

        LocalDateTime from = startDate == null ? null : startDate.atStartOfDay();
        LocalDateTime to = endDate == null ? null : endDate.plusDays(1).atStartOfDay();

        List<Appointment> appointments = appointmentRepository.findAllForListing(from, to, technicianId, status);

        Map<Long, String> customerNames = loadNames(
                appointments, Appointment::getCustomerId, customerRepository::findAllById, Customer::getId, Customer::getName);
        Map<Long, String> technicianNames = loadNames(
                appointments, Appointment::getTechnicianId, technicianRepository::findAllById, Technician::getId, Technician::getName);
        Map<Long, ServiceEntity> services = new HashMap<>();
        serviceRepository.findAllById(distinctIds(appointments, Appointment::getServiceId))
                .forEach(entity -> services.put(entity.getId(), entity));

        outputStream.write(UTF8_BOM);
        Writer writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8);
        writer.write(toCsvLine(HEADERS));

        for (Appointment appointment : appointments) {
            ServiceEntity service = services.get(appointment.getServiceId());
            String[] row = {
                    String.valueOf(appointment.getId()),
                    appointment.getStartsAt().format(DATE_TIME_FORMAT),
                    appointment.getEndsAt().format(DATE_TIME_FORMAT),
                    String.valueOf(appointment.getCustomerId()),
                    customerNames.getOrDefault(appointment.getCustomerId(), ""),
                    String.valueOf(appointment.getTechnicianId()),
                    technicianNames.getOrDefault(appointment.getTechnicianId(), ""),
                    String.valueOf(appointment.getServiceId()),
                    service == null ? "" : service.getName(),
                    String.valueOf(appointment.getDurationMinutes()),
                    service == null ? "" : formatPrice(service.getPrice()),
                    appointment.getStatus().name()
            };
            writer.write(toCsvLine(row));
        }

        writer.flush();
    }

    private <T> Map<Long, String> loadNames(
            List<Appointment> appointments,
            Function<Appointment, Long> idExtractor,
            Function<Iterable<Long>, Iterable<T>> finder,
            Function<T, Long> entityIdExtractor,
            Function<T, String> nameExtractor) {
        Map<Long, String> names = new HashMap<>();
        for (T entity : finder.apply(distinctIds(appointments, idExtractor))) {
            names.put(entityIdExtractor.apply(entity), nameExtractor.apply(entity));
        }
        return names;
    }

    private List<Long> distinctIds(List<Appointment> appointments, Function<Appointment, Long> extractor) {
        return appointments.stream().map(extractor).distinct().toList();
    }

    private static String formatPrice(BigDecimal price) {
        return price.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private static String toCsvLine(String[] fields) {
        StringBuilder line = new StringBuilder();
        for (int i = 0; i < fields.length; i++) {
            if (i > 0) {
                line.append(',');
            }
            line.append(escapeCsvField(fields[i]));
        }
        line.append("\r\n");
        return line.toString();
    }

    private static String escapeCsvField(String value) {
        if (value == null) {
            return "";
        }
        boolean needsQuoting = value.contains(",") || value.contains("\"")
                || value.contains("\n") || value.contains("\r");
        String escaped = value.replace("\"", "\"\"");
        return needsQuoting ? "\"" + escaped + "\"" : escaped;
    }
}
