package com.expense.claim.controller;

import com.expense.claim.dto.request.ClaimActionRequest;
import com.expense.claim.dto.request.ClaimRequest;
import com.expense.claim.dto.response.ApiResponse;
import com.expense.claim.dto.response.AuditLogResponse;
import com.expense.claim.dto.response.ClaimResponse;
import com.expense.claim.dto.response.PageResponse;
import com.expense.claim.enums.ClaimStatus;
import com.expense.claim.service.ClaimService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Claims", description = "Employee and Manager claim operations")
public class ClaimController {

    private final ClaimService claimService;

    // ── EMPLOYEE ENDPOINTS ──────────────────────────────────────────────────

    @PostMapping("/api/employee/claims")
    @Operation(summary = "Create a new expense claim")
    public ResponseEntity<ApiResponse<ClaimResponse>> createClaim(
            @Valid @RequestBody ClaimRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(ApiResponse.success("Claim created.", claimService.createClaim(request, currentUser)));
    }

    @GetMapping("/api/employee/claims")
    @Operation(summary = "Get own claims with pagination, search and status filter")
    public ResponseEntity<ApiResponse<PageResponse<ClaimResponse>>> getEmployeeClaims(
            @RequestParam(required = false) ClaimStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(ApiResponse.success(
                claimService.getEmployeeClaims(currentUser, status, search, page, size)));
    }

    @GetMapping("/api/employee/claims/{id}")
    @Operation(summary = "Get a single claim (own only)")
    public ResponseEntity<ApiResponse<ClaimResponse>> getEmployeeClaim(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(ApiResponse.success(claimService.getEmployeeClaim(id, currentUser)));
    }

    @PutMapping("/api/employee/claims/{id}")
    @Operation(summary = "Update a PENDING claim")
    public ResponseEntity<ApiResponse<ClaimResponse>> updateClaim(
            @PathVariable Long id,
            @Valid @RequestBody ClaimRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(ApiResponse.success("Claim updated.", claimService.updateClaim(id, request, currentUser)));
    }

    @DeleteMapping("/api/employee/claims/{id}")
    @Operation(summary = "Delete a PENDING claim")
    public ResponseEntity<ApiResponse<Void>> deleteClaim(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        claimService.deleteClaim(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Claim deleted.", null));
    }

    // ── MANAGER ENDPOINTS ───────────────────────────────────────────────────

    @GetMapping("/api/manager/claims")
    @Operation(summary = "Manager: Get all claims with filters")
    public ResponseEntity<ApiResponse<PageResponse<ClaimResponse>>> getAllClaims(
            @RequestParam(required = false) ClaimStatus status,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                claimService.getAllClaims(status, userId, fromDate, toDate, page, size)));
    }

    @GetMapping("/api/manager/claims/{id}")
    @Operation(summary = "Manager: Get a single claim")
    public ResponseEntity<ApiResponse<ClaimResponse>> getManagerClaim(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(claimService.getManagerClaim(id)));
    }

    @PutMapping("/api/manager/claims/{id}/action")
    @Operation(summary = "Manager: Approve or Reject a claim")
    public ResponseEntity<ApiResponse<ClaimResponse>> processAction(
            @PathVariable Long id,
            @Valid @RequestBody ClaimActionRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(ApiResponse.success("Action applied.",
                claimService.processClaimAction(id, request, currentUser)));
    }

    // ── AUDIT LOGS ──────────────────────────────────────────────────────────

    @GetMapping("/api/claims/{id}/audit-logs")
    @Operation(summary = "Get audit trail for a claim")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getAuditLogs(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(claimService.getAuditLogs(id)));
    }
}

