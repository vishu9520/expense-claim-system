package com.expense.claim.dto.request;

import com.expense.claim.enums.ClaimCategory;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ClaimRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    @DecimalMax(value = "99999999.99", message = "Amount exceeds maximum allowed")
    private BigDecimal amount;

    @NotNull(message = "Category is required")
    private ClaimCategory category;

    @NotNull(message = "Expense date is required")
    @PastOrPresent(message = "Expense date cannot be in the future")
    private LocalDate expenseDate;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;
}

