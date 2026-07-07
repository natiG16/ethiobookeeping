package com.ethiobooks.businesses.domain;

import com.ethiobooks.common.domain.BaseEntity;
import com.ethiobooks.users.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "businesses")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Business extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    private String name;

    @Column(name = "business_type", length = 100)
    private String businessType;

    @Column(name = "tin_number", length = 50)
    private String tinNumber;

    private String address;

    private String city;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "ETB";

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    /** starter | business | pro — updated manually by admin until billing is automated */
    @Column(name = "subscription_plan", nullable = false, length = 20)
    @Builder.Default
    private String subscriptionPlan = "starter";

    @Column(name = "subscription_active", nullable = false)
    @Builder.Default
    private boolean subscriptionActive = true;

    @Column(name = "support_notes", columnDefinition = "TEXT")
    private String supportNotes;
}
