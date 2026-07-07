package com.ethiobooks.admin;

import com.ethiobooks.admin.dto.AdminAccountDto;
import com.ethiobooks.admin.dto.UpdateSubscriptionRequest;
import com.ethiobooks.admin.dto.UpdateUserStatusRequest;
import com.ethiobooks.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/accounts")
    public ApiResponse<List<AdminAccountDto>> listAccounts() {
        return ApiResponse.ok(adminService.listAccounts());
    }

    @PatchMapping("/users/{userId}/status")
    public ApiResponse<AdminAccountDto> updateUserStatus(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        return ApiResponse.ok(adminService.updateUserStatus(userId, request));
    }

    @PatchMapping("/businesses/{businessId}/subscription")
    public ApiResponse<AdminAccountDto> updateSubscription(
            @PathVariable UUID businessId,
            @Valid @RequestBody UpdateSubscriptionRequest request) {
        return ApiResponse.ok(adminService.updateSubscription(businessId, request));
    }
}
