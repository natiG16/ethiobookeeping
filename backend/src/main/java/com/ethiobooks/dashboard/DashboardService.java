package com.ethiobooks.dashboard;

import com.ethiobooks.businesses.BusinessService;
import com.ethiobooks.businesses.domain.Business;
import com.ethiobooks.common.util.ProfitCalculator;
import com.ethiobooks.businesses.domain.BusinessPaymentMethod;
import com.ethiobooks.businesses.repository.BusinessPaymentMethodRepository;
import com.ethiobooks.dashboard.dto.CategoryStatDto;
import com.ethiobooks.dashboard.dto.ChartDataPoint;
import com.ethiobooks.dashboard.dto.DashboardAnalyticsDto;
import com.ethiobooks.dashboard.dto.DashboardSummaryDto;
import com.ethiobooks.dashboard.dto.PaymentMethodStatDto;
import com.ethiobooks.dashboard.dto.PeriodComparisonDto;
import com.ethiobooks.debts.repository.DebtRepository;
import com.ethiobooks.debts.repository.RepaymentRepository;
import com.ethiobooks.inventory.repository.ProductRepository;
import com.ethiobooks.subscription.PlanFeatureService;
import com.ethiobooks.transactions.domain.TransactionType;
import com.ethiobooks.transactions.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TransactionRepository transactionRepository;
    private final DebtRepository debtRepository;
    private final RepaymentRepository repaymentRepository;
    private final BusinessService businessService;
    private final BusinessPaymentMethodRepository paymentMethodRepository;
    private final PlanFeatureService planFeatureService;
    private final ProductRepository productRepository;

    public DashboardSummaryDto getSummary(UUID businessId) {
        Business business = businessService.findOwned(businessId);
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays(6);
        LocalDate monthStart = today.withDayOfMonth(1);

        BigDecimal todayIncome = sum(businessId, TransactionType.INCOME, today, today);
        BigDecimal todayExpenses = sum(businessId, TransactionType.EXPENSE, today, today);
        BigDecimal todayCogs = cogs(businessId, today, today);
        BigDecimal monthIncome = sum(businessId, TransactionType.INCOME, monthStart, today);
        BigDecimal monthExpenses = sum(businessId, TransactionType.EXPENSE, monthStart, today);
        BigDecimal monthCogs = cogs(businessId, monthStart, today);
        BigDecimal unpaidDebts = debtRepository.sumUnpaid(businessId);
        BigDecimal todayProfit = ProfitCalculator.netProfit(todayIncome, todayExpenses, todayCogs);
        BigDecimal monthProfit = ProfitCalculator.netProfit(monthIncome, monthExpenses, monthCogs);

        var builder = DashboardSummaryDto.builder()
                .todayIncome(todayIncome)
                .todayExpenses(todayExpenses)
                .todayProfit(todayProfit)
                .unpaidDebts(unpaidDebts)
                .todayCollections(repaymentRepository.sumCollectionsToday(businessId, today))
                .monthIncome(monthIncome)
                .monthExpenses(monthExpenses)
                .monthCogs(monthCogs)
                .monthProfit(monthProfit)
                .netAfterDebts(monthProfit.subtract(unpaidDebts))
                .weeklyChart(buildWeeklyChart(businessId, weekStart, today))
                .analytics(buildAnalytics(businessId, today, weekStart, monthStart, monthIncome, monthExpenses, monthCogs, monthProfit))
                .periodComparison(buildPeriodComparison(businessId, monthStart, monthIncome, monthExpenses, monthCogs, monthProfit))
                .topExpenseCategories(topCategories(businessId, monthStart, today, TransactionType.EXPENSE, 5))
                .topIncomeCategories(topCategories(businessId, monthStart, today, TransactionType.INCOME, 5))
                .lowStockCount(productRepository.countLowStock(businessId));

        if (planFeatureService.hasPlanAtLeast(business.getSubscriptionPlan(), "pro")) {
            builder.paymentMethodBreakdown(buildPaymentMethodBreakdown(businessId, monthStart, today));
        }

        return builder.build();
    }

    private BigDecimal sum(UUID businessId, TransactionType type, LocalDate from, LocalDate to) {
        BigDecimal total = transactionRepository.sumByTypeAndDateRange(businessId, type, from, to);
        return total != null ? total : BigDecimal.ZERO;
    }

    private BigDecimal cogs(UUID businessId, LocalDate from, LocalDate to) {
        BigDecimal total = transactionRepository.sumCostOfGoodsSold(businessId, from, to);
        return total != null ? total : BigDecimal.ZERO;
    }

    private DashboardAnalyticsDto buildAnalytics(
            UUID businessId,
            LocalDate today,
            LocalDate weekStart,
            LocalDate monthStart,
            BigDecimal monthIncome,
            BigDecimal monthExpenses,
            BigDecimal monthCogs,
            BigDecimal monthProfit) {
        long todayCount = transactionRepository.countByBusinessIdAndTransactionDateBetween(
                businessId, today, today);
        long weekCount = transactionRepository.countByBusinessIdAndTransactionDateBetween(
                businessId, weekStart, today);
        long monthCount = transactionRepository.countByBusinessIdAndTransactionDateBetween(
                businessId, monthStart, today);

        BigDecimal margin = BigDecimal.ZERO;
        if (monthIncome.signum() > 0) {
            margin = monthProfit.multiply(BigDecimal.valueOf(100))
                    .divide(monthIncome, 1, RoundingMode.HALF_UP);
        }

        String topMethod = "—";
        BigDecimal topTotal = BigDecimal.ZERO;
        for (PaymentMethodStatDto row : buildPaymentMethodBreakdown(businessId, monthStart, today)) {
            BigDecimal rowTotal = row.getIncome().add(row.getExpenses());
            if (rowTotal.compareTo(topTotal) > 0) {
                topTotal = rowTotal;
                topMethod = row.getMethod();
            }
        }

        return DashboardAnalyticsDto.builder()
                .todayTransactionCount((int) todayCount)
                .weekTransactionCount((int) weekCount)
                .monthTransactionCount((int) monthCount)
                .monthProfitMargin(margin)
                .topPaymentMethod(topMethod)
                .topPaymentMethodTotal(topTotal)
                .build();
    }

    private List<ChartDataPoint> buildWeeklyChart(UUID businessId, LocalDate from, LocalDate to) {
        List<Object[]> rows = transactionRepository.dailyAggregates(businessId, from, to);
        Map<LocalDate, ChartDataPoint> map = new HashMap<>();

        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            map.put(d, ChartDataPoint.builder()
                    .date(d)
                    .income(BigDecimal.ZERO)
                    .expenses(BigDecimal.ZERO)
                    .build());
        }

        for (Object[] row : rows) {
            LocalDate date = (LocalDate) row[0];
            TransactionType type = (TransactionType) row[1];
            BigDecimal amount = (BigDecimal) row[2];
            ChartDataPoint point = map.get(date);
            if (point == null) continue;
            if (type == TransactionType.INCOME) {
                point.setIncome(amount);
            } else {
                point.setExpenses(amount);
            }
        }

        return new ArrayList<>(map.values());
    }

    private List<PaymentMethodStatDto> buildPaymentMethodBreakdown(
            UUID businessId, LocalDate from, LocalDate to) {
        Map<String, PaymentMethodStatDto> byMethod = new LinkedHashMap<>();
        for (BusinessPaymentMethod configured :
                paymentMethodRepository.findByBusinessIdOrderBySortOrderAscNameAsc(businessId)) {
            byMethod.put(
                    configured.getName(),
                    PaymentMethodStatDto.builder()
                            .method(configured.getName())
                            .income(BigDecimal.ZERO)
                            .expenses(BigDecimal.ZERO)
                            .build());
        }
        for (Object[] row : transactionRepository.paymentMethodAggregates(businessId, from, to)) {
            String method = row[0] != null ? row[0].toString() : "Other";
            TransactionType type = (TransactionType) row[1];
            BigDecimal amount = (BigDecimal) row[2];
            PaymentMethodStatDto stat = byMethod.computeIfAbsent(method, m -> PaymentMethodStatDto.builder()
                    .method(m)
                    .income(BigDecimal.ZERO)
                    .expenses(BigDecimal.ZERO)
                    .build());
            if (type == TransactionType.INCOME) {
                stat.setIncome(stat.getIncome().add(amount));
            } else {
                stat.setExpenses(stat.getExpenses().add(amount));
            }
        }
        return new ArrayList<>(byMethod.values());
    }

    private PeriodComparisonDto buildPeriodComparison(
            UUID businessId,
            LocalDate monthStart,
            BigDecimal monthIncome,
            BigDecimal monthExpenses,
            BigDecimal monthCogs,
            BigDecimal monthProfit) {
        LocalDate prevMonthEnd = monthStart.minusDays(1);
        LocalDate prevMonthStart = prevMonthEnd.withDayOfMonth(1);

        BigDecimal prevIncome = sum(businessId, TransactionType.INCOME, prevMonthStart, prevMonthEnd);
        BigDecimal prevExpenses = sum(businessId, TransactionType.EXPENSE, prevMonthStart, prevMonthEnd);
        BigDecimal prevCogs = cogs(businessId, prevMonthStart, prevMonthEnd);
        BigDecimal prevProfit = ProfitCalculator.netProfit(prevIncome, prevExpenses, prevCogs);

        return PeriodComparisonDto.builder()
                .previousMonthIncome(prevIncome)
                .previousMonthExpenses(prevExpenses)
                .previousMonthProfit(prevProfit)
                .incomeChangePercent(percentChange(prevIncome, monthIncome))
                .expenseChangePercent(percentChange(prevExpenses, monthExpenses))
                .profitChangePercent(percentChange(prevProfit, monthProfit))
                .build();
    }

    private BigDecimal percentChange(BigDecimal previous, BigDecimal current) {
        if (previous == null || previous.signum() == 0) {
            return current.signum() == 0 ? BigDecimal.ZERO : BigDecimal.valueOf(100);
        }
        return current.subtract(previous)
                .multiply(BigDecimal.valueOf(100))
                .divide(previous.abs(), 1, RoundingMode.HALF_UP);
    }

    private List<CategoryStatDto> topCategories(
            UUID businessId, LocalDate from, LocalDate to, TransactionType type, int limit) {
        List<CategoryStatDto> stats = new ArrayList<>();
        for (Object[] row : transactionRepository.categoryAggregates(businessId, from, to)) {
            String name = row[0] != null ? row[0].toString() : "Uncategorized";
            TransactionType rowType = (TransactionType) row[1];
            if (rowType != type) {
                continue;
            }
            stats.add(CategoryStatDto.builder()
                    .categoryName(name)
                    .type(rowType)
                    .amount((BigDecimal) row[2])
                    .build());
            if (stats.size() >= limit) {
                break;
            }
        }
        return stats;
    }
}
