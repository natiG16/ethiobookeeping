package com.ethiobooks.auth.email;

import com.ethiobooks.auth.email.domain.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, UUID> {

    Optional<EmailVerificationToken> findByTokenHashAndUsedAtIsNull(String tokenHash);

    @Modifying
    @Query("UPDATE EmailVerificationToken t SET t.usedAt = :now WHERE t.user.id = :userId AND t.usedAt IS NULL")
    void invalidateActiveForUser(@Param("userId") UUID userId, @Param("now") Instant now);

    @Query("SELECT COUNT(t) FROM EmailVerificationToken t WHERE t.user.id = :userId AND t.createdAt >= :since")
    long countRecentByUser(@Param("userId") UUID userId, @Param("since") Instant since);
}
