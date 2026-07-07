package com.ethiobooks.suppliers.repository;

import com.ethiobooks.suppliers.domain.SupplierPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SupplierPaymentRepository extends JpaRepository<SupplierPayment, UUID> {

    List<SupplierPayment> findByPayableIdOrderByPaymentDateDesc(UUID payableId);
}
