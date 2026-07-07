package com.ethiobooks.debts.repository;

import com.ethiobooks.debts.domain.Repayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface RepaymentRepository extends JpaRepository<Repayment, UUID> {

    List<Repayment> findByDebtIdOrderByRepaymentDateDesc(UUID debtId);

    @Query("""
            SELECT COALESCE(SUM(r.amount), 0) FROM Repayment r
            JOIN r.debt d
            WHERE d.business.id = :businessId
            AND r.repaymentDate = :date
            """)
    BigDecimal sumCollectionsToday(
            @Param("businessId") UUID businessId,
            @Param("date") LocalDate date);
}
