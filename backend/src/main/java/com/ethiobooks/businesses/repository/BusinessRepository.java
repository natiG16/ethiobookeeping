package com.ethiobooks.businesses.repository;

import com.ethiobooks.businesses.domain.Business;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BusinessRepository extends JpaRepository<Business, UUID> {

    @Query("SELECT b FROM Business b WHERE b.owner.id = :ownerId")
    List<Business> findByOwnerId(@Param("ownerId") UUID ownerId);

    @Query("SELECT COUNT(b) FROM Business b WHERE b.owner.id = :ownerId")
    long countByOwnerId(@Param("ownerId") UUID ownerId);

    Optional<Business> findByIdAndOwnerId(UUID id, UUID ownerId);

    @Query("SELECT b FROM Business b JOIN FETCH b.owner ORDER BY b.createdAt DESC")
    List<Business> findAllWithOwnerOrderByCreatedAtDesc();
}
