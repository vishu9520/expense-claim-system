package com.expense.claim.controller;

import com.expense.claim.dto.response.ApiResponse;
import com.expense.claim.service.CsvExportService;
import com.expense.claim.service.FileService;
import com.expense.claim.enums.ClaimStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@RestController
@RequiredArgsConstructor
@Tag(name = "Files & Export", description = "Receipt upload/download and CSV export")
public class FileController {

    private final FileService fileService;
    private final CsvExportService csvExportService;

    @PostMapping("/api/employee/claims/{id}/receipt")
    @Operation(summary = "Upload receipt (image or PDF) for a claim")
    public ResponseEntity<ApiResponse<String>> uploadReceipt(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        String fileName = fileService.uploadReceipt(id, file);
        return ResponseEntity.ok(ApiResponse.success("Receipt uploaded.", fileName));
    }

    @GetMapping("/api/files/download/{claimId}")
    @Operation(summary = "Download/View the receipt for a claim")
    public ResponseEntity<Resource> downloadReceipt(@PathVariable Long claimId) {
        Resource resource = fileService.downloadReceipt(claimId);
        String contentType = fileService.getReceiptContentType(claimId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @GetMapping("/api/manager/claims/export/csv")
    @Operation(summary = "Manager: Export claims as CSV")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(required = false) ClaimStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        String csv = csvExportService.exportClaimsAsCsv(status, fromDate, toDate);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"claims-export.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv.getBytes());
    }
}

