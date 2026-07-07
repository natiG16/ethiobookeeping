package com.ethiobooks.debts.repository;

import com.ethiobooks.debts.domain.Debt;
import com.ethiobooks.debts.domain.DebtStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DebtRepository extends JpaRepository<Debt, UUID> {

    Optional<Debt> findByIdAndBusinessId(UUID id, UUID businessId);

    Page<Debt> findByBusinessIdOrderByCreatedAtDesc(UUID businessId, Pageable pageable);

    List<Debt> findByBusinessIdAndStatus(UUID businessId, DebtStatus status);

    @Query("""
            SELECT COALESCE(SUM(d.totalAmount - d.paidAmount), 0) FROM Debt d
            WHERE d.business.id = :businessId AND d.status IN ('ACTIVE', 'OVERDUE')
            """)
    BigDecimal sumUnpaid(@Param("businessId") UUID businessId);

    @Query("""
            SELECT d FROM Debt d
            WHERE d.business.id = :businessId
            AND d.status = 'ACTIVE'
            AND d.dueDate < :today
            """)
    List<Debt> findOverdue(@Param("businessId") UUID businessId, @Param("today") LocalDate today);

    @Query("""
            SELECT d FROM Debt d
            JOIN FETCH d.business b
            JOIN FETCH b.owner
            WHERE d.status IN ('ACTIVE', 'OVERDUE')
            AND d.dueDate IS NOT NULL
            AND b.owner.id = :userId
            """)
    List<Debt> findOpenWithDueDateForOwner(@Param("userId") UUID userId);

    @Query("""
            SELECT d FROM Debt d
            JOIN FETCH d.business b
            JOIN FETCH b.owner
            WHERE d.status IN ('ACTIVE', 'OVERDUE')
            AND d.dueDate IS NOT NULL
            """)
    List<Debt> findAllOpenWithDueDate();

    long countByCustomerId(UUID customerId);

    @Query("""
            SELECT d FROM Debt d
            WHERE d.business.id = :businessId
            AND (d.customer.id = :customerId OR (d.customer IS NULL AND lower(d.customerName) = lower(:name)))
            ORDER BY d.createdAt DESC
            """)
    List<Debt> findByBusinessIdAndCustomerOrName(
            @Param("businessId") UUID businessId,
            @Param("customerId") UUID customerId,
            @Param("name") String name);

    @Query("""
            SELECT COALESCE(SUM(d.totalAmount - d.paidAmount), 0) FROM Debt d
            WHERE d.business.id = :businessId
            AND d.status IN ('ACTIVE', 'OVERDUE')
            AND (d.customer.id = :customerId OR (d.customer IS NULL AND lower(d.customerName) = lower(:name)))
            """)
    BigDecimal sumRemainingByCustomerOrName(
            @Param("businessId") UUID businessId,
            @Param("customerId") UUID customerId,
            @Param("name") String name);

    @Query("""
            SELECT COUNT(d) FROM Debt d
            WHERE d.business.id = :businessId
            AND d.status IN ('ACTIVE', 'OVERDUE')
            AND (d.customer.id = :customerId OR (d.customer IS NULL AND lower(d.customerName) = lower(:name)))
            """)
    long countActiveByCustomerOrName(
            @Param("businessId") UUID businessId,
            @Param("customerId") UUID customerId,
            @Param("name") String name);
}
