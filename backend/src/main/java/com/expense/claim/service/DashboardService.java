package com.expense.claim.service;

import com.expense.claim.dto.response.DashboardResponse;
import com.expense.claim.enums.ClaimStatus;
import com.expense.claim.exception.ResourceNotFoundException;
import com.expense.claim.repository.ClaimRepository;
import com.expense.claim.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Month;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ClaimRepository claimRepository;
    private final UserRepository userRepository;

    public DashboardResponse getEmployeeDashboard(UserDetails currentUser) {
        Long userId = userRepository.findByEmail(currentUser.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found."))
                .getId();

        List<Object[]> rows = claimRepository.getEmployeeDashboardTotals(userId);

        BigDecimal totalClaimed = BigDecimal.ZERO;
        BigDecimal totalApproved = BigDecimal.ZERO;
        BigDecimal totalRejected = BigDecimal.ZERO;
        BigDecimal totalPending = BigDecimal.ZERO;

        for (Object[] row : rows) {
            ClaimStatus status = (ClaimStatus) row[0];
            BigDecimal amount = (BigDecimal) row[1];
            totalClaimed = totalClaimed.add(amount);
            switch (status) {
                case APPROVED -> totalApproved = amount;
                case REJECTED -> totalRejected = amount;
                case PENDING  -> totalPending  = amount;
            }
        }

        return DashboardResponse.builder()
                .totalClaimed(totalClaimed)
                .totalApproved(totalApproved)
                .totalRejected(totalRejected)
                .totalPending(totalPending)
                .build();
    }

    public DashboardResponse getManagerDashboard() {
        // Status counts
        List<Object[]> statusRows = claimRepository.getManagerStatusCounts();
        long pendingCount = 0, approvedCount = 0, rejectedCount = 0;
        for (Object[] row : statusRows) {
            ClaimStatus status = (ClaimStatus) row[0];
            long count = (Long) row[1];
            switch (status) {
                case PENDING  -> pendingCount  = count;
                case APPROVED -> approvedCount = count;
                case REJECTED -> rejectedCount = count;
            }
        }

        // Category totals
        List<Object[]> categoryRows = claimRepository.getManagerCategoryTotals();
        Map<String, BigDecimal> totalsByCategory = new HashMap<>();
        for (Object[] row : categoryRows) {
            totalsByCategory.put(row[0].toString(), (BigDecimal) row[1]);
        }

        // Monthly summary
        List<Object[]> monthlyRows = claimRepository.getManagerMonthlySummary();
        List<DashboardResponse.MonthlySummary> monthlySummary = new ArrayList<>();
        for (Object[] row : monthlyRows) {
            int month = ((Number) row[0]).intValue();
            monthlySummary.add(DashboardResponse.MonthlySummary.builder()
                    .month(month)
                    .monthName(Month.of(month).name())
                    .totalAmount((BigDecimal) row[1])
                    .claimsCount(((Number) row[2]).longValue())
                    .build());
        }

        return DashboardResponse.builder()
                .pendingCount(pendingCount)
                .approvedCount(approvedCount)
                .rejectedCount(rejectedCount)
                .totalsByCategory(totalsByCategory)
                .monthlySummary(monthlySummary)
                .build();
    }
}

