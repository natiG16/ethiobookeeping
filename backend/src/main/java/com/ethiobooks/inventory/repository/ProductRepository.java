package com.ethiobooks.inventory.repository;

import com.ethiobooks.inventory.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    List<Product> findByBusinessIdAndActiveTrueOrderByNameAsc(UUID businessId);

    Optional<Product> findByIdAndBusinessId(UUID id, UUID businessId);

    boolean existsByBusinessIdAndNameIgnoreCase(UUID businessId, String name);

    @Query("""
            SELECT p FROM Product p
            WHERE p.business.id = :businessId
            AND p.active = true
            AND p.lowStockThreshold IS NOT NULL
            AND p.quantityOnHand <= p.lowStockThreshold
            ORDER BY p.name ASC
            """)
    List<Product> findLowStock(@Param("businessId") UUID businessId);

    @Query("""
            SELECT COUNT(p) FROM Product p
            WHERE p.business.id = :businessId
            AND p.active = true
            AND p.lowStockThreshold IS NOT NULL
            AND p.quantityOnHand <= p.lowStockThreshold
            """)
    long countLowStock(@Param("businessId") UUID businessId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Product p SET p.quantityOnHand = p.quantityOnHand - :quantity
            WHERE p.id = :productId AND p.business.id = :businessId
            AND p.active = true AND p.quantityOnHand >= :quantity
            """)
    int decrementQuantity(
            @Param("productId") UUID productId,
            @Param("businessId") UUID businessId,
            @Param("quantity") BigDecimal quantity);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Product p SET p.quantityOnHand = p.quantityOnHand + :quantity
            WHERE p.id = :productId AND p.business.id = :businessId
            """)
    int incrementQuantity(
            @Param("productId") UUID productId,
            @Param("businessId") UUID businessId,
            @Param("quantity") BigDecimal quantity);
}
