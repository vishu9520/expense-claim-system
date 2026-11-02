package com.expense.claim.dto.response;

import com.expense.claim.enums.ClaimCategory;
import com.expense.claim.enums.ClaimStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClaimResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String title;
    private BigDecimal amount;
    private ClaimCategory category;
    private LocalDate expenseDate;
    private String description;
    private ClaimStatus status;
    private String managerComment;
    private String receiptName;
    private boolean hasReceipt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

