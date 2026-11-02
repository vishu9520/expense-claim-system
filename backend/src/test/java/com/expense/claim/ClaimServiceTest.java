package com.expense.claim;

import com.expense.claim.dto.request.ClaimActionRequest;
import com.expense.claim.dto.request.ClaimRequest;
import com.expense.claim.dto.response.ClaimResponse;
import com.expense.claim.entity.Claim;
import com.expense.claim.entity.User;
import com.expense.claim.enums.ClaimCategory;
import com.expense.claim.enums.ClaimStatus;
import com.expense.claim.enums.Role;
import com.expense.claim.exception.AccessDeniedException;
import com.expense.claim.exception.BadRequestException;
import com.expense.claim.repository.AuditLogRepository;
import com.expense.claim.repository.ClaimRepository;
import com.expense.claim.repository.UserRepository;
import com.expense.claim.service.AuditLogService;
import com.expense.claim.service.ClaimService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClaimServiceTest {

    @Mock private ClaimRepository claimRepository;
    @Mock private UserRepository userRepository;
    @Mock private AuditLogRepository auditLogRepository;
    @Mock private AuditLogService auditLogService;

    @InjectMocks private ClaimService claimService;

    private User employee;
    private User manager;
    private Claim pendingClaim;
    private UserDetails employeeDetails;

    @BeforeEach
    void setUp() {
        employee = User.builder().id(2L).name("Ankit").email("ankit@test.com")
                .role(Role.EMPLOYEE).isActive(true).build();
        manager = User.builder().id(1L).name("Manager").email("manager@test.com")
                .role(Role.MANAGER).isActive(true).build();

        pendingClaim = Claim.builder().id(1L).user(employee).title("Test Claim")
                .amount(BigDecimal.valueOf(1000)).category(ClaimCategory.TRAVEL)
                .expenseDate(LocalDate.now()).status(ClaimStatus.PENDING).build();

        employeeDetails = new org.springframework.security.core.userdetails.User(
                "ankit@test.com", "pass", List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE")));
    }

    @Test
    void createClaim_ShouldReturnClaimResponse() {
        ClaimRequest req = new ClaimRequest();
        req.setTitle("Travel to Delhi");
        req.setAmount(BigDecimal.valueOf(2000));
        req.setCategory(ClaimCategory.TRAVEL);
        req.setExpenseDate(LocalDate.now());

        when(userRepository.findByEmail("ankit@test.com")).thenReturn(Optional.of(employee));
        when(claimRepository.save(any())).thenReturn(pendingClaim);

        ClaimResponse response = claimService.createClaim(req, employeeDetails);

        assertNotNull(response);
        assertEquals("Test Claim", response.getTitle());
        assertEquals(ClaimStatus.PENDING, response.getStatus());
        verify(auditLogService).log(any(), any(), eq("CLAIM_CREATED"), anyString());
    }

    @Test
    void updateClaim_WhenNotPending_ShouldThrowBadRequest() {
        pendingClaim.setStatus(ClaimStatus.APPROVED);
        when(userRepository.findByEmail("ankit@test.com")).thenReturn(Optional.of(employee));
        when(claimRepository.findById(1L)).thenReturn(Optional.of(pendingClaim));

        ClaimRequest req = new ClaimRequest();
        req.setTitle("Updated"); req.setAmount(BigDecimal.ONE);
        req.setCategory(ClaimCategory.FOOD); req.setExpenseDate(LocalDate.now());

        assertThrows(BadRequestException.class, () -> claimService.updateClaim(1L, req, employeeDetails));
    }

    @Test
    void deleteClaim_WhenAnotherUser_ShouldThrowAccessDenied() {
        User anotherUser = User.builder().id(99L).email("other@test.com").build();
        pendingClaim.setUser(anotherUser);

        when(userRepository.findByEmail("ankit@test.com")).thenReturn(Optional.of(employee));
        when(claimRepository.findById(1L)).thenReturn(Optional.of(pendingClaim));

        assertThrows(AccessDeniedException.class, () -> claimService.deleteClaim(1L, employeeDetails));
    }

    @Test
    void processAction_Reject_WithoutComment_ShouldThrowBadRequest() {
        when(claimRepository.findById(1L)).thenReturn(Optional.of(pendingClaim));
        when(userRepository.findByEmail("manager@test.com")).thenReturn(Optional.of(manager));

        UserDetails managerDetails = new org.springframework.security.core.userdetails.User(
                "manager@test.com", "pass", List.of(new SimpleGrantedAuthority("ROLE_MANAGER")));

        ClaimActionRequest req = new ClaimActionRequest();
        req.setAction(ClaimStatus.REJECTED);
        req.setComment(""); // empty comment

        assertThrows(BadRequestException.class, () -> claimService.processClaimAction(1L, req, managerDetails));
    }

    @Test
    void processAction_Approve_ShouldSetStatusApproved() {
        when(claimRepository.findById(1L)).thenReturn(Optional.of(pendingClaim));
        when(userRepository.findByEmail("manager@test.com")).thenReturn(Optional.of(manager));
        when(claimRepository.save(any())).thenReturn(pendingClaim);

        UserDetails managerDetails = new org.springframework.security.core.userdetails.User(
                "manager@test.com", "pass", List.of(new SimpleGrantedAuthority("ROLE_MANAGER")));

        ClaimActionRequest req = new ClaimActionRequest();
        req.setAction(ClaimStatus.APPROVED);

        ClaimResponse response = claimService.processClaimAction(1L, req, managerDetails);
        assertNotNull(response);
        verify(claimRepository).save(argThat(c -> c.getStatus() == ClaimStatus.APPROVED));
    }
}

