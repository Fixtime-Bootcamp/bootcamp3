package com.fixtime.appointment;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.stream.Stream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class AppointmentCsvWriterTest {

    @Test
    @DisplayName("Deve escrever BOM UTF-8, cabecalho e escapar aspas e virgulas")
    void writesBomHeaderAndEscapesFields() throws Exception {
        AppointmentExportRow row = new AppointmentExportRow(
                1L,
                LocalDateTime.of(2026, 9, 3, 10, 0),
                LocalDateTime.of(2026, 9, 3, 11, 30),
                2L,
                "Cliente \"Especial\", Ltda",
                3L,
                "José",
                4L,
                "Manutenção",
                90,
                new BigDecimal("250"),
                AppointmentStatus.SCHEDULED);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        AppointmentCsvWriter.write(out, Stream.of(row));

        byte[] bytes = out.toByteArray();
        assertThat(bytes).startsWith(AppointmentCsvWriter.UTF8_BOM);

        String csv = new String(bytes, 3, bytes.length - 3, StandardCharsets.UTF_8);
        String[] lines = csv.split("\r\n");
        assertThat(lines[0]).isEqualTo(AppointmentCsvWriter.HEADER);
        assertThat(lines[1]).contains("\"Cliente \"\"Especial\"\", Ltda\"");
        assertThat(lines[1]).contains("José");
        assertThat(lines[1]).contains("Manutenção");
        assertThat(lines[1]).contains("250.00");
        assertThat(lines[1]).startsWith("1,2026-09-03 10:00,2026-09-03 11:30,2,");
    }

    @Test
    @DisplayName("Deve escrever somente BOM e cabecalho quando nao ha linhas")
    void writesHeaderOnlyWhenEmpty() throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        AppointmentCsvWriter.write(out, Stream.empty());

        byte[] bytes = out.toByteArray();
        String csv = new String(bytes, 3, bytes.length - 3, StandardCharsets.UTF_8);
        assertThat(csv).isEqualTo(AppointmentCsvWriter.HEADER + "\r\n");
    }
}
