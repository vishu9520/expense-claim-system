package com.expense.claim.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    // Employee dashboard fields
    private BigDecimal totalClaimed;
    private BigDecimal totalApproved;
    private BigDecimal totalRejected;
    private BigDecimal totalPending;

    // Manager dashboard fields
    private Long pendingCount;
    private Long approvedCount;
    private Long rejectedCount;
    private Map<String, BigDecimal> totalsByCategory;
    private List<MonthlySummary> monthlySummary;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlySummary {
        private int month;
        private String monthName;
        private BigDecimal totalAmount;
        private Long claimsCount;
    }
}

