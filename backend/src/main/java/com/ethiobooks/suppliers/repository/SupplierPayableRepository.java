package com.ethiobooks.suppliers.repository;

import com.ethiobooks.suppliers.domain.SupplierPayable;
import com.ethiobooks.suppliers.domain.SupplierPayableStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SupplierPayableRepository extends JpaRepository<SupplierPayable, UUID> {

    Optional<SupplierPayable> findByIdAndBusinessId(UUID id, UUID businessId);

    List<SupplierPayable> findByBusinessIdOrderByCreatedAtDesc(UUID businessId);

    List<SupplierPayable> findBySupplierIdOrderByCreatedAtDesc(UUID supplierId);

    @Query("""
            SELECT COALESCE(SUM(p.totalAmount - p.paidAmount), 0) FROM SupplierPayable p
            WHERE p.business.id = :businessId AND p.status IN ('ACTIVE', 'OVERDUE')
            AND p.supplier.id = :supplierId
            """)
    BigDecimal sumRemainingBySupplier(
            @Param("businessId") UUID businessId,
            @Param("supplierId") UUID supplierId);

    long countBySupplierIdAndStatusIn(UUID supplierId, List<SupplierPayableStatus> statuses);
}
