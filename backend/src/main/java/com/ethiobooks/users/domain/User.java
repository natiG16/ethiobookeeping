package com.ethiobooks.users.domain;

import com.ethiobooks.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "google_id", unique = true, length = 255)
    private String googleId;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", nullable = false)
    @Builder.Default
    private AuthProvider authProvider = AuthProvider.LOCAL;

    @Column(name = "profile_picture_url", length = 500)
    private String profilePictureUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserRole role = UserRole.OWNER;

    @Column(nullable = false, length = 5)
    @Builder.Default
    private String locale = "en";

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String theme = "light";

    @Enumerated(EnumType.STRING)
    @Column(name = "calendar_system", nullable = false, length = 20)
    @Builder.Default
    private CalendarSystem calendarSystem = CalendarSystem.ETHIOPIAN;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "email_verified", nullable = false)
    @Builder.Default
    private boolean emailVerified = false;

    @Column(name = "email_verified_at")
    private java.time.Instant emailVerifiedAt;

    public boolean isGoogleUser() {
        return authProvider == AuthProvider.GOOGLE;
    }

    public boolean hasPassword() {
        return passwordHash != null && !passwordHash.isBlank();
    }
}
