package com.expense.claim.dto.request;

import com.expense.claim.enums.ClaimStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ClaimActionRequest {

    @NotNull(message = "Action (APPROVED or REJECTED) is required")
    private ClaimStatus action;

    private String comment;
}

