package com.ethiobooks.common.util;

import com.ethiobooks.inventory.domain.Product;
import com.ethiobooks.transactions.domain.Transaction;
import com.ethiobooks.transactions.domain.TransactionType;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class ProfitCalculatorTest {

    @Test
    void inventorySale_profitIsSellMinusBuyTimesQty() {
        Product product = Product.builder()
                .buyPrice(new BigDecimal("10"))
                .sellPrice(new BigDecimal("12"))
                .build();
        Transaction sale = Transaction.builder()
                .type(TransactionType.INCOME)
                .amount(new BigDecimal("12"))
                .product(product)
                .productQuantity(BigDecimal.ONE)
                .build();

        BigDecimal cogs = ProfitCalculator.costOfGoodsSold(sale);
        BigDecimal profit = ProfitCalculator.netProfit(new BigDecimal("12"), BigDecimal.ZERO, cogs);

        assertThat(cogs).isEqualByComparingTo("10");
        assertThat(profit).isEqualByComparingTo("2");
    }

    @Test
    void nonInventoryIncome_countsFullAmountAsProfit() {
        Transaction service = Transaction.builder()
                .type(TransactionType.INCOME)
                .amount(new BigDecimal("50"))
                .build();

        BigDecimal cogs = ProfitCalculator.costOfGoodsSold(service);
        BigDecimal profit = ProfitCalculator.netProfit(new BigDecimal("50"), new BigDecimal("20"), cogs);

        assertThat(cogs).isEqualByComparingTo("0");
        assertThat(profit).isEqualByComparingTo("30");
    }

    @Test
    void inventorySaleWithoutBuyPrice_treatsFullSaleAsProfit() {
        Product product = Product.builder().sellPrice(new BigDecimal("12")).build();
        Transaction sale = Transaction.builder()
                .type(TransactionType.INCOME)
                .amount(new BigDecimal("12"))
                .product(product)
                .productQuantity(BigDecimal.ONE)
                .build();

        assertThat(ProfitCalculator.costOfGoodsSold(sale)).isEqualByComparingTo("0");
    }
}
