package com.fixtime.blockeddate;

import java.time.LocalDate;
import java.time.Month;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class NationalHolidayProvider {

    /**
     * Retorna o nome do feriado nacional brasileiro caso a data coincida, ou Optional.empty().
     * Abrange todos os feriados nacionais fixos e móveis (Carnaval, Sexta-feira Santa, Corpus Christi).
     */
    public Optional<String> getHolidayName(LocalDate date) {
        if (date == null) {
            return Optional.empty();
        }

        Map<LocalDate, String> holidaysOfYear = getHolidaysForYear(date.getYear());
        return Optional.ofNullable(holidaysOfYear.get(date));
    }

    public boolean isNationalHoliday(LocalDate date) {
        return getHolidayName(date).isPresent();
    }

    public Map<LocalDate, String> getHolidaysForYear(int year) {
        Map<LocalDate, String> holidays = new HashMap<>();

        // Feriados Nacionais Fixos no Brasil
        holidays.put(LocalDate.of(year, Month.JANUARY, 1), "Confraternizacao Universal");
        holidays.put(LocalDate.of(year, Month.APRIL, 21), "Tiradentes");
        holidays.put(LocalDate.of(year, Month.MAY, 1), "Dia Mundial do Trabalho");
        holidays.put(LocalDate.of(year, Month.SEPTEMBER, 7), "Independencia do Brasil");
        holidays.put(LocalDate.of(year, Month.OCTOBER, 12), "Nossa Senhora Aparecida");
        holidays.put(LocalDate.of(year, Month.NOVEMBER, 2), "Finados");
        holidays.put(LocalDate.of(year, Month.NOVEMBER, 15), "Proclamacao da Republica");
        holidays.put(LocalDate.of(year, Month.NOVEMBER, 20), "Dia Nacional de Zumbi e da Consciencia Negra");
        holidays.put(LocalDate.of(year, Month.DECEMBER, 25), "Natal");

        // Feriados Móveis baseados no Domingo de Páscoa (Algoritmo de Meeus/Jones/Butcher)
        LocalDate easter = calculateEasterSunday(year);
        holidays.put(easter.minusDays(47), "Carnaval");
        holidays.put(easter.minusDays(2), "Sexta-feira Santa (Paixao de Cristo)");
        holidays.put(easter.plusDays(60), "Corpus Christi");

        return holidays;
    }

    /**
     * Calcula o Domingo de Páscoa no calendário Gregoriano.
     */
    public LocalDate calculateEasterSunday(int year) {
        int a = year % 19;
        int b = year / 100;
        int c = year % 100;
        int d = b / 4;
        int e = b % 4;
        int f = (b + 8) / 25;
        int g = (b - f + 1) / 3;
        int h = (19 * a + b - d - g + 15) % 30;
        int i = c / 4;
        int k = c % 4;
        int l = (32 + 2 * e + 2 * i - h - k) % 7;
        int m = (a + 11 * h + 22 * l) / 451;
        int month = (h + l - 7 * m + 114) / 31;
        int day = ((h + l - 7 * m + 114) % 31) + 1;

        return LocalDate.of(year, month, day);
    }
}
