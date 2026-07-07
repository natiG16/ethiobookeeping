package com.ethiobooks.suppliers.repository;

import com.ethiobooks.suppliers.domain.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SupplierRepository extends JpaRepository<Supplier, UUID> {

    List<Supplier> findByBusinessIdOrderByNameAsc(UUID businessId);

    Optional<Supplier> findByIdAndBusinessId(UUID id, UUID businessId);

    boolean existsByBusinessIdAndNameIgnoreCase(UUID businessId, String name);
}
