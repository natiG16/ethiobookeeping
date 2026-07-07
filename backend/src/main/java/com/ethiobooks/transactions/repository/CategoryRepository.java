package com.ethiobooks.transactions.repository;

import com.ethiobooks.transactions.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    List<Category> findByBusinessIdOrderByNameAsc(UUID businessId);

    Optional<Category> findByIdAndBusinessId(UUID id, UUID businessId);

    boolean existsByBusinessIdAndNameIgnoreCase(UUID businessId, String name);
}
