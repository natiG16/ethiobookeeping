package com.ethiobooks.reports;

import com.ethiobooks.businesses.BusinessService;
import com.ethiobooks.businesses.domain.Business;
import com.ethiobooks.common.exception.BusinessException;
import com.ethiobooks.common.util.ProfitCalculator;
import com.ethiobooks.debts.repository.DebtRepository;
import com.ethiobooks.reports.dto.ReportAnalyticsDto;
import com.ethiobooks.subscription.PlanFeatureService;
import com.ethiobooks.transactions.domain.Transaction;
import com.ethiobooks.transactions.domain.TransactionType;
import com.ethiobooks.transactions.repository.TransactionRepository;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private static final String PDF_LANG = "en";
    private static final DeviceRgb HEADER_BG = new DeviceRgb(5, 150, 105);
    private static final DeviceRgb SECTION_BG = new DeviceRgb(241, 245, 249);
    private static final DateTimeFormatter GENERATED_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final TransactionRepository transactionRepository;
    private final DebtRepository debtRepository;
    private final BusinessService businessService;
    private final PlanFeatureService planFeatureService;
    private final ReportI18n i18n;

    public ReportAnalyticsDto getAnalytics(
            UUID businessId, String period, LocalDate from, LocalDate to) {
        Business business = businessService.findOwned(businessId);
        planFeatureService.requireActiveSubscription(business);
        planFeatureService.requirePdfReports(business);
        PeriodRange range = resolveRange(period, from, to);
        List<Transaction> lines = loadLines(businessId, range.from(), range.to());
        Totals totals = computeTotals(businessId, range.from(), range.to());
        return ReportAnalyticsCalculator.compute(
                lines, totals.income(), totals.expenses(), totals.costOfGoodsSold(), totals.profit());
    }

    @Transactional(readOnly = true)
    public byte[] generatePdf(UUID businessId, String period, LocalDate from, LocalDate to) {
        Business business = businessService.findOwned(businessId);
        planFeatureService.requireActiveSubscription(business);
        planFeatureService.requirePdfReports(business);

        PeriodRange range = resolveRange(period, from, to);
        List<Transaction> lines = loadLines(businessId, range.from(), range.to());
        Totals totals = computeTotals(businessId, range.from(), range.to());
        BigDecimal unpaid = debtRepository.sumUnpaid(businessId);
        if (unpaid == null) {
            unpaid = BigDecimal.ZERO;
        }
        ReportAnalyticsDto analytics = ReportAnalyticsCalculator.compute(
                lines, totals.income(), totals.expenses(), totals.costOfGoodsSold(), totals.profit());

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfFont font = PdfFontFactory.createFont();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document doc = new Document(pdf);
            doc.setMargins(36, 36, 48, 36);
            doc.setFont(font);

            addHeader(doc, font, business, range.periodKey(), range.from(), range.to());
            addAnalyticsSection(doc, font, analytics);
            addStatementTable(doc, font, lines);
            addProfitLossSection(
                    doc,
                    font,
                    totals.income(),
                    totals.costOfGoodsSold(),
                    totals.expenses(),
                    totals.profit(),
                    unpaid);

            doc.close();
            return baos.toByteArray();
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to generate PDF for business {}", businessId, e);
            throw new BusinessException("Could not generate PDF report. Please try again.");
        }
    }

    private String label(String key) {
        return i18n.t(PDF_LANG, key);
    }

    private List<Transaction> loadLines(UUID businessId, LocalDate from, LocalDate to) {
        return transactionRepository
                .findByBusinessIdAndTransactionDateBetweenOrderByTransactionDateAscCreatedAtAsc(
                        businessId, from, to);
    }

    private Totals computeTotals(UUID businessId, LocalDate from, LocalDate to) {
        BigDecimal income = transactionRepository.sumByTypeAndDateRange(
                businessId, TransactionType.INCOME, from, to);
        BigDecimal expenses = transactionRepository.sumByTypeAndDateRange(
                businessId, TransactionType.EXPENSE, from, to);
        if (income == null) {
            income = BigDecimal.ZERO;
        }
        if (expenses == null) {
            expenses = BigDecimal.ZERO;
        }
        BigDecimal cogs = transactionRepository.sumCostOfGoodsSold(businessId, from, to);
        if (cogs == null) {
            cogs = BigDecimal.ZERO;
        }
        BigDecimal profit = ProfitCalculator.netProfit(income, expenses, cogs);
        return new Totals(income, cogs, expenses, profit);
    }

    public String statementFilename(String period, LocalDate from, LocalDate to) {
        PeriodRange range = resolveRange(period, from, to);
        if ("custom".equals(range.periodKey())) {
            return "mysuq-statement-" + range.from() + "_to_" + range.to() + ".pdf";
        }
        return "mysuq-statement-" + range.periodKey() + ".pdf";
    }

    private PeriodRange resolveRange(String period, LocalDate from, LocalDate to) {
        if (from != null && to != null) {
            if (from.isAfter(to)) {
                throw new BusinessException("Start date must be on or before end date");
            }
            return new PeriodRange(from, to, "custom");
        }
        return periodRange(period != null ? period : "daily");
    }

    private PeriodRange periodRange(String period) {
        LocalDate to = LocalDate.now();
        LocalDate from = switch (period.toLowerCase()) {
            case "weekly" -> to.minusDays(6);
            case "monthly" -> to.withDayOfMonth(1);
            default -> to;
        };
        String key = switch (period.toLowerCase()) {
            case "weekly" -> "weekly";
            case "monthly" -> "monthly";
            default -> "daily";
        };
        return new PeriodRange(from, to, key);
    }

    private void addHeader(
            Document doc,
            PdfFont font,
            Business business,
            String periodKey,
            LocalDate from,
            LocalDate to) {
        Table accent = new Table(1).useAllAvailableWidth().setMarginBottom(14);
        accent.addCell(new Cell()
                .setHeight(4)
                .setBackgroundColor(HEADER_BG)
                .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
        doc.add(accent);

        doc.add(p(font, label("app.name"), 10).setBold().setFontColor(new DeviceRgb(100, 116, 139)));
        doc.add(p(font, businessDisplayName(business), 17)
                .setBold()
                .setFontColor(HEADER_BG)
                .setMarginBottom(2));
        doc.add(p(font, label("report.statementTitle"), 13)
                .setBold()
                .setFontColor(new DeviceRgb(30, 41, 59))
                .setMarginBottom(2));
        doc.add(p(font, label("report.period." + periodKey) + "  |  " + from + "  to  " + to, 11)
                .setFontColor(new DeviceRgb(71, 85, 105))
                .setMarginBottom(14));

        Table meta = new Table(UnitValue.createPercentArray(new float[]{34, 66}))
                .useAllAvailableWidth()
                .setMarginBottom(16);
        if (business.getBusinessType() != null && !business.getBusinessType().isBlank()) {
            addMetaRow(meta, font, "report.type", business.getBusinessType());
        }
        if (business.getTinNumber() != null && !business.getTinNumber().isBlank()) {
            addMetaRow(meta, font, "report.tin", business.getTinNumber());
        }
        String currency = business.getCurrency() != null ? business.getCurrency() : "ETB";
        addMetaRow(meta, font, "report.currency", currency);
        addMetaRow(meta, font, "report.generated", LocalDateTime.now().format(GENERATED_FMT));
        doc.add(meta);
    }

    private void addAnalyticsSection(Document doc, PdfFont font, ReportAnalyticsDto a) {
        doc.add(p(font, label("report.analyticsTitle"), 12)
                .setBold()
                .setBackgroundColor(SECTION_BG)
                .setPadding(6)
                .setMarginBottom(8));

        Table table = new Table(UnitValue.createPercentArray(new float[]{55, 45}))
                .useAllAvailableWidth()
                .setMarginBottom(14);
        addSummaryRow(table, font, label("report.txCount"), String.valueOf(a.getTransactionCount()), false);
        addSummaryRow(table, font, label("report.incomeCount"), String.valueOf(a.getIncomeCount()), false);
        addSummaryRow(table, font, label("report.expenseCount"), String.valueOf(a.getExpenseCount()), false);
        addSummaryRow(table, font, label("report.avgIncome"), formatMoney(a.getAvgIncome()), false);
        addSummaryRow(table, font, label("report.avgExpense"), formatMoney(a.getAvgExpense()), false);
        addSummaryRow(
                table,
                font,
                label("report.topPayment"),
                nullSafe(a.getTopPaymentMethod()) + " | " + formatMoney(a.getTopPaymentAmount()),
                false);
        addSummaryRow(table, font, label("report.profitMargin"), formatPercent(a.getProfitMarginPercent()), true);
        doc.add(table);
    }

    private void addMetaRow(Table table, PdfFont font, String labelKey, String value) {
        table.addCell(new Cell()
                .add(p(font, label(labelKey), 9).setBold())
                .setBackgroundColor(SECTION_BG)
                .setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 0.5f))
                .setPadding(6));
        table.addCell(new Cell()
                .add(p(font, value, 9))
                .setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 0.5f))
                .setPadding(6));
    }

    private void addStatementTable(Document doc, PdfFont font, List<Transaction> lines) {
        doc.add(p(font, label("report.activity"), 12)
                .setBold()
                .setMarginTop(4)
                .setMarginBottom(8));

        float[] widths = {14, 30, 14, 14, 14, 14};
        Table table = new Table(UnitValue.createPercentArray(widths)).useAllAvailableWidth();

        addHeaderCell(table, font, label("report.col.date"));
        addHeaderCell(table, font, label("report.col.description"));
        addHeaderCell(table, font, label("report.col.payment"));
        addHeaderCell(table, font, label("report.col.income"));
        addHeaderCell(table, font, label("report.col.expense"));
        addHeaderCell(table, font, label("report.col.balance"));

        if (lines.isEmpty()) {
            table.addCell(new Cell(1, 6)
                    .add(p(font, label("report.empty"), 9).setItalic())
                    .setPadding(10)
                    .setTextAlignment(TextAlignment.CENTER));
        } else {
            BigDecimal running = BigDecimal.ZERO;
            for (Transaction tx : lines) {
                BigDecimal amount = tx.getAmount() != null ? tx.getAmount() : BigDecimal.ZERO;
                boolean isIncome = tx.getType() == TransactionType.INCOME;
                running = running.add(isIncome ? amount : amount.negate());

                table.addCell(bodyCell(font, tx.getTransactionDate().toString()));
                table.addCell(bodyCell(font, descriptionOf(tx)));
                table.addCell(bodyCell(font, paymentOf(tx)));
                table.addCell(amountCell(font, isIncome ? amount : null));
                table.addCell(amountCell(font, isIncome ? null : amount));
                table.addCell(amountCell(font, running));
            }
        }

        doc.add(table);
    }

    private void addProfitLossSection(
            Document doc,
            PdfFont font,
            BigDecimal income,
            BigDecimal costOfGoodsSold,
            BigDecimal expenses,
            BigDecimal profit,
            BigDecimal unpaid) {
        doc.add(p(font, " ", 8).setMarginTop(16));
        doc.add(p(font, label("report.plTitle"), 12)
                .setBold()
                .setBackgroundColor(SECTION_BG)
                .setPadding(6)
                .setMarginBottom(8));

        Table pl = new Table(UnitValue.createPercentArray(new float[]{62, 38})).useAllAvailableWidth();
        addSummaryRow(pl, font, label("report.totalIncome"), formatMoney(income), false);
        if (costOfGoodsSold.signum() > 0) {
            addSummaryRow(pl, font, label("report.costOfGoodsSold"), formatMoney(costOfGoodsSold), false);
            BigDecimal grossProfit = income.subtract(costOfGoodsSold);
            addSummaryRow(pl, font, label("report.grossProfit"), formatMoney(grossProfit), false);
        }
        addSummaryRow(pl, font, label("report.totalExpenses"), formatMoney(expenses), false);
        String netKey = profit.signum() >= 0 ? "report.netProfit" : "report.netLoss";
        addSummaryRow(pl, font, label(netKey), formatMoney(profit.abs()), true);
        if (unpaid.signum() > 0) {
            addSummaryRow(pl, font, label("report.unpaidDebts"), formatMoney(unpaid), false);
        }
        doc.add(pl);

        doc.add(p(font, label("report.balanceFootnote"), 8)
                .setFontColor(ColorConstants.GRAY)
                .setMarginTop(10));
    }

    private String descriptionOf(Transaction tx) {
        if (tx.getDescription() != null && !tx.getDescription().isBlank()) {
            return pdfSafe(tx.getDescription().trim());
        }
        return tx.getType() == TransactionType.INCOME
                ? label("report.incomeDefault")
                : label("report.expenseDefault");
    }

    private String paymentOf(Transaction tx) {
        if (tx.getPaymentMethod() != null && !tx.getPaymentMethod().isBlank()) {
            return pdfSafe(tx.getPaymentMethod());
        }
        return "-";
    }

    private Paragraph p(PdfFont font, String text, float size) {
        return new Paragraph(pdfSafe(text)).setFont(font).setFontSize(size);
    }

    /** Standard PDF fonts only support Latin-1; strip unsupported chars (e.g. Amharic) to avoid generation failures. */
    static String pdfSafe(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        StringBuilder sb = new StringBuilder(value.length());
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if (c == '\n' || c == '\r' || c == '\t') {
                sb.append(' ');
            } else if (c >= 32 && c <= 126 || c >= 160 && c <= 255) {
                sb.append(c);
            } else {
                sb.append('?');
            }
        }
        return sb.toString().trim();
    }

    private void addHeaderCell(Table table, PdfFont font, String text) {
        table.addHeaderCell(new Cell()
                .add(p(font, text, 7).setBold().setFontColor(ColorConstants.WHITE))
                .setBackgroundColor(HEADER_BG)
                .setTextAlignment(TextAlignment.CENTER)
                .setPadding(5));
    }

    private Cell bodyCell(PdfFont font, String text) {
        return new Cell()
                .add(p(font, text != null ? text : "", 8))
                .setPadding(4)
                .setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 0.5f));
    }

    private Cell amountCell(PdfFont font, BigDecimal amount) {
        String text = amount == null ? "" : formatMoney(amount);
        return new Cell()
                .add(p(font, text, 8))
                .setPadding(4)
                .setTextAlignment(TextAlignment.RIGHT)
                .setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 0.5f));
    }

    private void addSummaryRow(Table table, PdfFont font, String labelText, String value, boolean highlight) {
        Paragraph labelPara = p(font, labelText, 10);
        Paragraph valuePara = p(font, value, 10);
        if (highlight) {
            labelPara.setBold();
            valuePara.setBold();
        }
        Cell labelCell = new Cell()
                .add(labelPara)
                .setPadding(6)
                .setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 0.5f));
        Cell valueCell = new Cell()
                .add(valuePara)
                .setTextAlignment(TextAlignment.RIGHT)
                .setPadding(6)
                .setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 0.5f));
        if (highlight) {
            labelCell.setBackgroundColor(new DeviceRgb(236, 253, 245));
            valueCell.setBackgroundColor(new DeviceRgb(236, 253, 245));
        }
        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null) {
            amount = BigDecimal.ZERO;
        }
        return String.format("%,.2f ETB", amount);
    }

    private String formatPercent(BigDecimal percent) {
        if (percent == null) {
            percent = BigDecimal.ZERO;
        }
        return percent.stripTrailingZeros().toPlainString() + "%";
    }

    private static String nullSafe(String value) {
        return pdfSafe(value != null ? value : "");
    }

    private String businessDisplayName(Business business) {
        if (business.getName() != null && !business.getName().isBlank()) {
            String safe = nullSafe(business.getName());
            if (!safe.isBlank()) {
                return safe;
            }
        }
        return label("report.unnamedBusiness");
    }

    private record PeriodRange(LocalDate from, LocalDate to, String periodKey) {}

    private record Totals(BigDecimal income, BigDecimal costOfGoodsSold, BigDecimal expenses, BigDecimal profit) {}
}
