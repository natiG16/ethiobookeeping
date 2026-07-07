package com.ethiobooks.reports;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class ReportI18nTest {

    private final ReportI18n i18n = new ReportI18n();

    @BeforeEach
    void loadBundles() {
        ReflectionTestUtils.invokeMethod(i18n, "loadBundles");
    }

    @Test
    void englishLocale_returnsEnglishLabel() {
        assertThat(i18n.t("en", "report.col.income")).isEqualTo("Income");
    }

    @Test
    void amharicLocale_returnsAmharicLabel() {
        assertThat(i18n.t("am", "report.col.income")).isNotBlank();
    }
}
