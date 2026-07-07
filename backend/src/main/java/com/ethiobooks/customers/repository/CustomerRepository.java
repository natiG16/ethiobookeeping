package com.ethiobooks.customers.repository;

import com.ethiobooks.customers.domain.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    List<Customer> findByBusinessIdOrderByNameAsc(UUID businessId);

    Optional<Customer> findByIdAndBusinessId(UUID id, UUID businessId);

    Optional<Customer> findByBusinessIdAndNameIgnoreCase(UUID businessId, String name);

    boolean existsByBusinessIdAndNameIgnoreCase(UUID businessId, String name);
}
