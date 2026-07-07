package com.ethiobooks.admin.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class AdminAccountDto {
    private UUID userId;
    private String email;
    private String phone;
    private String fullName;
    private boolean userActive;
    private UUID businessId;
    private String businessName;
    private String subscriptionPlan;
    private boolean subscriptionActive;
    private String supportNotes;
    private Instant createdAt;
}
