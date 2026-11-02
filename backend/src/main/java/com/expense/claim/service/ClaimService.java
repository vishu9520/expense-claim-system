package com.expense.claim.service;

import com.expense.claim.dto.request.ClaimActionRequest;
import com.expense.claim.dto.request.ClaimRequest;
import com.expense.claim.dto.response.AuditLogResponse;
import com.expense.claim.dto.response.ClaimResponse;
import com.expense.claim.dto.response.PageResponse;
import com.expense.claim.entity.AuditLog;
import com.expense.claim.entity.Claim;
import com.expense.claim.entity.User;
import com.expense.claim.enums.ClaimStatus;
import com.expense.claim.exception.AccessDeniedException;
import com.expense.claim.exception.BadRequestException;
import com.expense.claim.exception.ResourceNotFoundException;
import com.expense.claim.repository.AuditLogRepository;
import com.expense.claim.repository.ClaimRepository;
import com.expense.claim.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditLogService auditLogService;

    // ── Employee: Create Claim ───────────────────────────────────────────────
    @Transactional
    public ClaimResponse createClaim(ClaimRequest request, UserDetails currentUser) {
        User user = getUserByEmail(currentUser.getUsername());

        Claim claim = Claim.builder()
                .user(user)
                .title(request.getTitle())
                .amount(request.getAmount())
                .category(request.getCategory())
                .expenseDate(request.getExpenseDate())
                .description(request.getDescription())
                .status(ClaimStatus.PENDING)
                .build();

        claim = claimRepository.save(claim);
        auditLogService.log(claim, user, "CLAIM_CREATED", "Claim created by employee.");
        return mapToResponse(claim);
    }

    // ── Employee: Update Claim ───────────────────────────────────────────────
    @Transactional
    public ClaimResponse updateClaim(Long claimId, ClaimRequest request, UserDetails currentUser) {
        User user = getUserByEmail(currentUser.getUsername());
        Claim claim = getClaimAndVerifyOwnership(claimId, user);

        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw new BadRequestException("Only PENDING claims can be edited.");
        }

        claim.setTitle(request.getTitle());
        claim.setAmount(request.getAmount());
        claim.setCategory(request.getCategory());
        claim.setExpenseDate(request.getExpenseDate());
        claim.setDescription(request.getDescription());

        claim = claimRepository.save(claim);
        auditLogService.log(claim, user, "CLAIM_UPDATED", "Claim updated by employee.");
        return mapToResponse(claim);
    }

    // ── Employee: Delete Claim ───────────────────────────────────────────────
    @Transactional
    public void deleteClaim(Long claimId, UserDetails currentUser) {
        User user = getUserByEmail(currentUser.getUsername());
        Claim claim = getClaimAndVerifyOwnership(claimId, user);

        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw new BadRequestException("Only PENDING claims can be deleted.");
        }

        claimRepository.delete(claim);
    }

    // ── Employee: Get Own Claims ─────────────────────────────────────────────
    public PageResponse<ClaimResponse> getEmployeeClaims(UserDetails currentUser,
                                                          ClaimStatus status, String search,
                                                          int page, int size) {
        User user = getUserByEmail(currentUser.getUsername());
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<Claim> claims = claimRepository.findByUserIdWithFilters(user.getId(), status, search, pageable);
        return toPageResponse(claims);
    }

    // ── Employee: Get Single Claim ───────────────────────────────────────────
    public ClaimResponse getEmployeeClaim(Long claimId, UserDetails currentUser) {
        User user = getUserByEmail(currentUser.getUsername());
        Claim claim = getClaimAndVerifyOwnership(claimId, user);
        return mapToResponse(claim);
    }

    // ── Manager: Get All Claims ──────────────────────────────────────────────
    public PageResponse<ClaimResponse> getAllClaims(ClaimStatus status, Long userId,
                                                     LocalDate fromDate, LocalDate toDate,
                                                     int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Claim> claims = claimRepository.findAllWithFilters(status, userId, fromDate, toDate, pageable);
        return toPageResponse(claims);
    }

    // ── Manager: Get Single Claim ────────────────────────────────────────────
    public ClaimResponse getManagerClaim(Long claimId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + claimId));
        return mapToResponse(claim);
    }

    // ── Manager: Approve / Reject Claim ─────────────────────────────────────
    @Transactional
    public ClaimResponse processClaimAction(Long claimId, ClaimActionRequest request,
                                             UserDetails currentUser) {
        User manager = getUserByEmail(currentUser.getUsername());
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + claimId));

        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw new BadRequestException("Only PENDING claims can be approved or rejected.");
        }

        if (request.getAction() == ClaimStatus.REJECTED &&
                (request.getComment() == null || request.getComment().isBlank())) {
            throw new BadRequestException("A comment is mandatory when rejecting a claim.");
        }

        if (request.getAction() == ClaimStatus.PENDING) {
            throw new BadRequestException("Action must be APPROVED or REJECTED.");
        }

        claim.setStatus(request.getAction());
        claim.setManagerComment(request.getComment());
        claim = claimRepository.save(claim);

        String action = request.getAction() == ClaimStatus.APPROVED ? "CLAIM_APPROVED" : "CLAIM_REJECTED";
        String desc = request.getAction() == ClaimStatus.APPROVED
                ? "Claim approved by manager."
                : "Claim rejected by manager. Reason: " + request.getComment();

        auditLogService.log(claim, manager, action, desc);
        return mapToResponse(claim);
    }

    // ── Audit Logs for a Claim ───────────────────────────────────────────────
    public List<AuditLogResponse> getAuditLogs(Long claimId) {
        List<AuditLog> logs = auditLogRepository.findByClaimIdOrderByCreatedAtAsc(claimId);
        return logs.stream().map(this::mapAuditLog).collect(Collectors.toList());
    }

    // ── Helper: Map ──────────────────────────────────────────────────────────
    public ClaimResponse mapToResponse(Claim claim) {
        return ClaimResponse.builder()
                .id(claim.getId())
                .userId(claim.getUser().getId())
                .userName(claim.getUser().getName())
                .userEmail(claim.getUser().getEmail())
                .title(claim.getTitle())
                .amount(claim.getAmount())
                .category(claim.getCategory())
                .expenseDate(claim.getExpenseDate())
                .description(claim.getDescription())
                .status(claim.getStatus())
                .managerComment(claim.getManagerComment())
                .receiptName(claim.getReceiptName())
                .hasReceipt(claim.getReceiptPath() != null)
                .createdAt(claim.getCreatedAt())
                .updatedAt(claim.getUpdatedAt())
                .build();
    }

    private AuditLogResponse mapAuditLog(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .claimId(log.getClaim().getId())
                .userId(log.getUser().getId())
                .userName(log.getUser().getName())
                .action(log.getAction())
                .description(log.getDescription())
                .createdAt(log.getCreatedAt())
                .build();
    }

    private PageResponse<ClaimResponse> toPageResponse(Page<Claim> page) {
        List<ClaimResponse> content = page.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return PageResponse.<ClaimResponse>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
    }

    private Claim getClaimAndVerifyOwnership(Long claimId, User user) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + claimId));
        if (!claim.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have access to this claim.");
        }
        return claim;
    }
}

