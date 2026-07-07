package com.ethiobooks.transactions.repository;

import com.ethiobooks.transactions.domain.Transaction;
import com.ethiobooks.transactions.domain.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    @Query("""
            SELECT t FROM Transaction t
            LEFT JOIN FETCH t.category
            LEFT JOIN FETCH t.product
            WHERE t.id = :id AND t.business.id = :businessId
            """)
    Optional<Transaction> findByIdAndBusinessId(@Param("id") UUID id, @Param("businessId") UUID businessId);

    Page<Transaction> findByBusinessId(UUID businessId, Pageable pageable);

    List<Transaction> findByBusinessIdAndTransactionDateBetweenOrderByTransactionDateAscCreatedAtAsc(
            UUID businessId, LocalDate from, LocalDate to);

    long countByBusinessIdAndTransactionDateBetween(UUID businessId, LocalDate from, LocalDate to);

    @Query("""
            SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t
            WHERE t.business.id = :businessId AND t.type = :type
            AND t.transactionDate = :date
            """)
    BigDecimal sumByTypeAndDate(
            @Param("businessId") UUID businessId,
            @Param("type") TransactionType type,
            @Param("date") LocalDate date);

    @Query("""
            SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t
            WHERE t.business.id = :businessId AND t.type = :type
            AND t.transactionDate BETWEEN :from AND :to
            """)
    BigDecimal sumByTypeAndDateRange(
            @Param("businessId") UUID businessId,
            @Param("type") TransactionType type,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query("""
            SELECT t.transactionDate, t.type, SUM(t.amount)
            FROM Transaction t
            WHERE t.business.id = :businessId
            AND t.transactionDate BETWEEN :from AND :to
            GROUP BY t.transactionDate, t.type
            ORDER BY t.transactionDate
            """)
    List<Object[]> dailyAggregates(
            @Param("businessId") UUID businessId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    List<Transaction> findByClientIdAndSyncedFalse(String clientId);

    @Query("""
            SELECT t.paymentMethod, t.type, COALESCE(SUM(t.amount), 0)
            FROM Transaction t
            WHERE t.business.id = :businessId
            AND t.transactionDate BETWEEN :from AND :to
            GROUP BY t.paymentMethod, t.type
            """)
    List<Object[]> paymentMethodAggregates(
            @Param("businessId") UUID businessId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query("""
            SELECT COALESCE(c.name, 'Uncategorized'), t.type, COALESCE(SUM(t.amount), 0)
            FROM Transaction t
            LEFT JOIN t.category c
            WHERE t.business.id = :businessId
            AND t.transactionDate BETWEEN :from AND :to
            GROUP BY COALESCE(c.name, 'Uncategorized'), t.type
            ORDER BY SUM(t.amount) DESC
            """)
    List<Object[]> categoryAggregates(
            @Param("businessId") UUID businessId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    long countByCategoryId(UUID categoryId);

    @Query("""
            SELECT COALESCE(SUM(t.productQuantity), 0) FROM Transaction t
            WHERE t.product.id = :productId AND t.type = com.ethiobooks.transactions.domain.TransactionType.INCOME
            """)
    BigDecimal sumSoldQuantityByProductId(@Param("productId") UUID productId);

    @Query("""
            SELECT t.product.id, COALESCE(SUM(t.productQuantity), 0)
            FROM Transaction t
            WHERE t.product.id IN :productIds AND t.type = com.ethiobooks.transactions.domain.TransactionType.INCOME
            GROUP BY t.product.id
            """)
    List<Object[]> sumSoldQuantityByProductIds(@Param("productIds") Collection<UUID> productIds);

    @Query("""
            SELECT COALESCE(SUM(p.buyPrice * t.productQuantity), 0)
            FROM Transaction t
            JOIN t.product p
            WHERE t.business.id = :businessId
            AND t.type = com.ethiobooks.transactions.domain.TransactionType.INCOME
            AND t.transactionDate BETWEEN :from AND :to
            AND t.productQuantity IS NOT NULL
            AND p.buyPrice IS NOT NULL
            AND p.buyPrice > 0
            """)
    BigDecimal sumCostOfGoodsSold(
            @Param("businessId") UUID businessId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}
