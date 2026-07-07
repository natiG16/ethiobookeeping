package com.ethiobooks.otp.repository;

import com.ethiobooks.otp.domain.PhoneOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface PhoneOtpRepository extends JpaRepository<PhoneOtp, UUID> {

    List<PhoneOtp> findTop5ByPhoneOrderByCreatedAtDesc(String phone);

    @Query("""
            SELECT COUNT(o) FROM PhoneOtp o
            WHERE o.phone = :phone AND o.createdAt >= :since
            """)
    long countRecent(@Param("phone") String phone, @Param("since") Instant since);
}

