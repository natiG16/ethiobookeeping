package com.ethiobooks.common.util;

import java.time.LocalDate;

/**
 * Ethiopian (Ge'ez) calendar conversions. Gregorian {@link LocalDate} is used for storage;
 * this utility formats or converts for display and export.
 */
public final class EthiopianCalendar {

    private static final int EPOCH = 1723856;

    private static final String[] MONTHS_EN = {
            "", "Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit", "Megabit",
            "Miazia", "Ginbot", "Sene", "Hamle", "Nehase", "Pagumen"
    };

    private EthiopianCalendar() {}

    public record EthiopianDate(int year, int month, int day) {}

    public static EthiopianDate toEthiopian(LocalDate gregorian) {
        int jdn = gregorianToJdn(gregorian.getYear(), gregorian.getMonthValue(), gregorian.getDayOfMonth());
        int r = jdn - EPOCH;
        int ethYear = (4 * r + 3) / 1461;
        int dayOfYear = r - (1461 * ethYear) / 4;
        int ethMonth = dayOfYear / 30 + 1;
        int ethDay = dayOfYear % 30 + 1;
        return new EthiopianDate(ethYear, ethMonth, ethDay);
    }

    /** Ethiopian calendar date as YYYY-MM-DD (Ethiopian year/month/day). */
    public static String formatIsoEthiopian(LocalDate gregorian) {
        EthiopianDate et = toEthiopian(gregorian);
        return String.format("%04d-%02d-%02d", et.year(), et.month(), et.day());
    }

    /** Human-readable Ethiopian date for CSV and UI. */
    public static String formatDisplay(LocalDate gregorian, boolean useAmharicMonthNames) {
        EthiopianDate et = toEthiopian(gregorian);
        String month = monthName(et.month(), useAmharicMonthNames);
        return month + " " + et.day() + ", " + et.year();
    }

    public static String formatForExport(LocalDate gregorian, boolean ethiopianCalendar, boolean useAmharicMonthNames) {
        if (gregorian == null) {
            return "";
        }
        if (ethiopianCalendar) {
            return formatDisplay(gregorian, useAmharicMonthNames);
        }
        return gregorian.toString();
    }

    private static String monthName(int month, boolean amharic) {
        if (amharic) {
            return switch (month) {
                case 1 -> "መስከረም";
                case 2 -> "ጥቅምት";
                case 3 -> "ኅዳር";
                case 4 -> "ታኅሣሥ";
                case 5 -> "ጥር";
                case 6 -> "የካቲት";
                case 7 -> "መጋቢት";
                case 8 -> "ሚያዝያ";
                case 9 -> "ግንቦት";
                case 10 -> "ሰኔ";
                case 11 -> "ሐምሌ";
                case 12 -> "ነሐሴ";
                case 13 -> "ጳጉሜን";
                default -> String.valueOf(month);
            };
        }
        if (month >= 1 && month < MONTHS_EN.length) {
            return MONTHS_EN[month];
        }
        return String.valueOf(month);
    }

    private static int gregorianToJdn(int year, int month, int day) {
        int a = (14 - month) / 12;
        int y = year + 4800 - a;
        int m = month + 12 * a - 3;
        return day + (153 * m + 2) / 5 + 365 * y + y / 4 - y / 100 + y / 400 - 32045;
    }
}
