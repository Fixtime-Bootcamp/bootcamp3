package com.fixtime.appointment;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.stream.Stream;

public final class AppointmentCsvWriter {
    static final byte[] UTF8_BOM = new byte[] {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};
    static final String HEADER =
            "ID,Data Inicio,Data Fim,ID Cliente,Nome Cliente,ID Tecnico,Nome Tecnico,ID Servico,Nome Servico,Duracao (min),Preco (R$),Status";
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private AppointmentCsvWriter() {
    }

    public static void write(OutputStream out, Stream<AppointmentExportRow> rows) throws IOException {
        out.write(UTF8_BOM);
        BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(out, StandardCharsets.UTF_8));
        writer.write(HEADER);
        writer.write("\r\n");
        try {
            rows.forEach(row -> {
                try {
                    writer.write(toLine(row));
                    writer.write("\r\n");
                } catch (IOException ex) {
                    throw new UncheckedIOException(ex);
                }
            });
        } catch (UncheckedIOException ex) {
            throw ex.getCause();
        }
        writer.flush();
    }

    static String toLine(AppointmentExportRow row) {
        return String.join(
                ",",
                escape(value(row.id())),
                escape(formatDate(row.startsAt())),
                escape(formatDate(row.endsAt())),
                escape(value(row.customerId())),
                escape(nullToEmpty(row.customerName())),
                escape(value(row.technicianId())),
                escape(nullToEmpty(row.technicianName())),
                escape(value(row.serviceId())),
                escape(nullToEmpty(row.serviceName())),
                escape(value(row.durationMinutes())),
                escape(formatPrice(row.price())),
                escape(row.status() == null ? "" : row.status().name()));
    }

    static String escape(String value) {
        if (value == null) {
            return "";
        }
        boolean mustQuote = value.contains(",")
                || value.contains("\"")
                || value.contains("\n")
                || value.contains("\r");
        String escaped = value.replace("\"", "\"\"");
        if (mustQuote) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }

    private static String formatDate(java.time.LocalDateTime value) {
        return value == null ? "" : DATE_TIME.format(value);
    }

    private static String formatPrice(BigDecimal price) {
        if (price == null) {
            return "";
        }
        return price.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private static String value(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
