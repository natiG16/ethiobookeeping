package com.ethiobooks.reports;

import com.ethiobooks.common.dto.ApiResponse;
import com.ethiobooks.reports.dto.ReportAnalyticsDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/businesses/{businessId}/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/analytics")
    public ApiResponse<ReportAnalyticsDto> analytics(
            @PathVariable UUID businessId,
            @RequestParam(required = false) String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.ok(reportService.getAnalytics(businessId, period, from, to));
    }

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> downloadPdf(
            @PathVariable UUID businessId,
            @RequestParam(required = false) String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        byte[] pdf = reportService.generatePdf(businessId, period, from, to);
        String filename = reportService.statementFilename(period, from, to);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=" + filename)
                .header("X-Report-Format", "statement-v2")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
