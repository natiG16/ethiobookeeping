package com.ethiobooks.common.util;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class EthiopianCalendarTest {

    @Test
    void convertsKnownGregorianDateToEthiopian() {
        EthiopianCalendar.EthiopianDate et = EthiopianCalendar.toEthiopian(LocalDate.of(2026, 3, 15));
        assertThat(et.year()).isEqualTo(2018);
        assertThat(et.month()).isEqualTo(7);
        assertThat(et.day()).isEqualTo(6);
    }

    @Test
    void exportDisplayUsesEthiopianMonthName() {
        String formatted = EthiopianCalendar.formatForExport(
                LocalDate.of(2026, 3, 15), true, false);
        assertThat(formatted).isEqualTo("Megabit 6, 2018");
    }

    @Test
    void exportDisplayUsesGregorianWhenRequested() {
        String formatted = EthiopianCalendar.formatForExport(
                LocalDate.of(2026, 3, 15), false, false);
        assertThat(formatted).isEqualTo("2026-03-15");
    }
}
