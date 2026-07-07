package com.ethiobooks.dashboard;

import com.ethiobooks.common.dto.ApiResponse;
import com.ethiobooks.dashboard.dto.DashboardSummaryDto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/businesses/{businessId}/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ApiResponse<DashboardSummaryDto> summary(@PathVariable UUID businessId) {
        return ApiResponse.ok(dashboardService.getSummary(businessId));
    }
}
