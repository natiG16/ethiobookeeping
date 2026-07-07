package com.ethiobooks.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateSubscriptionRequest {
    @NotBlank
    private String subscriptionPlan;

    @NotNull
    private Boolean subscriptionActive;

    private String supportNotes;
}
