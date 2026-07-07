package com.ethiobooks.debts;

import com.ethiobooks.common.dto.ApiResponse;
import com.ethiobooks.debts.dto.DebtDto;
import com.ethiobooks.debts.dto.DebtRequest;
import com.ethiobooks.debts.dto.RepaymentDto;
import com.ethiobooks.debts.dto.RepaymentRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/businesses/{businessId}/debts")
@RequiredArgsConstructor
public class DebtController {

    private final DebtService debtService;

    @GetMapping
    public ApiResponse<Page<DebtDto>> list(
            @PathVariable UUID businessId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.ok(debtService.list(businessId, pageable));
    }

    @GetMapping("/overdue")
    public ApiResponse<List<DebtDto>> overdue(@PathVariable UUID businessId) {
        return ApiResponse.ok(debtService.overdue(businessId));
    }

    @GetMapping("/{debtId}")
    public ApiResponse<DebtDto> get(
            @PathVariable UUID businessId,
            @PathVariable UUID debtId) {
        return ApiResponse.ok(debtService.get(businessId, debtId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DebtDto> create(
            @PathVariable UUID businessId,
            @Valid @RequestBody DebtRequest request) {
        return ApiResponse.ok(debtService.create(businessId, request));
    }

    @GetMapping("/{debtId}/repayments")
    public ApiResponse<List<RepaymentDto>> listRepayments(
            @PathVariable UUID businessId,
            @PathVariable UUID debtId) {
        return ApiResponse.ok(debtService.listRepayments(businessId, debtId));
    }

    @PostMapping("/{debtId}/repayments")
    public ApiResponse<DebtDto> addRepayment(
            @PathVariable UUID businessId,
            @PathVariable UUID debtId,
            @Valid @RequestBody RepaymentRequest request) {
        return ApiResponse.ok(debtService.addRepayment(businessId, debtId, request));
    }

    @PostMapping("/{debtId}/mark-paid")
    public ApiResponse<DebtDto> markPaid(
            @PathVariable UUID businessId,
            @PathVariable UUID debtId) {
        return ApiResponse.ok(debtService.markPaid(businessId, debtId));
    }

    @DeleteMapping("/{debtId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID businessId, @PathVariable UUID debtId) {
        debtService.delete(businessId, debtId);
    }
}
