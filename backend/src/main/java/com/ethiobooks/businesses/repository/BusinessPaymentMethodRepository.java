package com.ethiobooks.businesses.repository;

import com.ethiobooks.businesses.domain.BusinessPaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BusinessPaymentMethodRepository extends JpaRepository<BusinessPaymentMethod, UUID> {

    List<BusinessPaymentMethod> findByBusinessIdOrderBySortOrderAscNameAsc(UUID businessId);

    Optional<BusinessPaymentMethod> findByIdAndBusinessId(UUID id, UUID businessId);

    boolean existsByBusinessIdAndNameIgnoreCase(UUID businessId, String name);

    long countByBusinessId(UUID businessId);
}
