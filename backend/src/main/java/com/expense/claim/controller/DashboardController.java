package com.expense.claim.controller;

import com.expense.claim.dto.response.ApiResponse;
import com.expense.claim.dto.response.DashboardResponse;
import com.expense.claim.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Dashboard stats for Employee and Manager")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/employee")
    @Operation(summary = "Employee dashboard: totals for claimed, approved, rejected, pending amounts")
    public ResponseEntity<ApiResponse<DashboardResponse>> getEmployeeDashboard(
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getEmployeeDashboard(currentUser)));
    }

    @GetMapping("/manager")
    @Operation(summary = "Manager dashboard: status counts, category totals, monthly summary")
    public ResponseEntity<ApiResponse<DashboardResponse>> getManagerDashboard() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getManagerDashboard()));
    }
}

