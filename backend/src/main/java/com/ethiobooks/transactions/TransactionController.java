package com.ethiobooks.transactions;

import com.ethiobooks.common.dto.ApiResponse;
import com.ethiobooks.transactions.domain.TransactionType;
import com.ethiobooks.transactions.dto.SyncTransactionsRequest;
import com.ethiobooks.transactions.dto.TransactionDto;
import com.ethiobooks.transactions.dto.TransactionListSummaryDto;
import com.ethiobooks.transactions.dto.TransactionRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/businesses/{businessId}/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping
    public ApiResponse<Page<TransactionDto>> search(
            @PathVariable UUID businessId,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String paymentMethod,
            @PageableDefault(size = 20, sort = "transactionDate", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return ApiResponse.ok(
                transactionService.search(businessId, type, from, to, search, paymentMethod, pageable));
    }

    @GetMapping(value = "/export", produces = "text/csv")
    public ResponseEntity<String> exportCsv(
            @PathVariable UUID businessId,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String paymentMethod) {
        String csv = transactionService.exportCsv(businessId, type, from, to, search, paymentMethod);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"transactions.csv\"")
                .body(csv);
    }

    @GetMapping("/summary")
    public ApiResponse<TransactionListSummaryDto> summary(
            @PathVariable UUID businessId,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String paymentMethod) {
        return ApiResponse.ok(
                transactionService.summarize(businessId, type, from, to, search, paymentMethod));
    }

    @GetMapping("/{transactionId}")
    public ApiResponse<TransactionDto> get(
            @PathVariable UUID businessId,
            @PathVariable UUID transactionId) {
        return ApiResponse.ok(transactionService.get(businessId, transactionId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TransactionDto> create(
            @PathVariable UUID businessId,
            @Valid @RequestBody TransactionRequest request) {
        return ApiResponse.ok(transactionService.create(businessId, request));
    }

    @PutMapping("/{transactionId}")
    public ApiResponse<TransactionDto> update(
            @PathVariable UUID businessId,
            @PathVariable UUID transactionId,
            @Valid @RequestBody TransactionRequest request) {
        return ApiResponse.ok(transactionService.update(businessId, transactionId, request));
    }

    @DeleteMapping("/{transactionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID businessId, @PathVariable UUID transactionId) {
        transactionService.delete(businessId, transactionId);
    }

    @PostMapping("/sync")
    public ApiResponse<List<TransactionDto>> sync(
            @PathVariable UUID businessId,
            @Valid @RequestBody SyncTransactionsRequest request) {
        return ApiResponse.ok(transactionService.sync(businessId, request));
    }
}
