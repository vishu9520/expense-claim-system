package com.expense.claim.repository;

import com.expense.claim.entity.Claim;
import com.expense.claim.enums.ClaimCategory;
import com.expense.claim.enums.ClaimStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {

    // Employee: own claims with pagination, search, status filter
    @Query("SELECT c FROM Claim c WHERE c.user.id = :userId " +
           "AND (:status IS NULL OR c.status = :status) " +
           "AND (:search IS NULL OR LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Claim> findByUserIdWithFilters(
            @Param("userId") Long userId,
            @Param("status") ClaimStatus status,
            @Param("search") String search,
            Pageable pageable);

    // Manager: all claims with filters
    @Query("SELECT c FROM Claim c WHERE " +
           "(:status IS NULL OR c.status = :status) " +
           "AND (:userId IS NULL OR c.user.id = :userId) " +
           "AND (:fromDate IS NULL OR c.expenseDate >= :fromDate) " +
           "AND (:toDate IS NULL OR c.expenseDate <= :toDate)")
    Page<Claim> findAllWithFilters(
            @Param("status") ClaimStatus status,
            @Param("userId") Long userId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            Pageable pageable);

    // Dashboard: Employee totals
    @Query("SELECT c.status, COALESCE(SUM(c.amount), 0) FROM Claim c WHERE c.user.id = :userId GROUP BY c.status")
    List<Object[]> getEmployeeDashboardTotals(@Param("userId") Long userId);

    // Dashboard: Manager status counts
    @Query("SELECT c.status, COUNT(c) FROM Claim c GROUP BY c.status")
    List<Object[]> getManagerStatusCounts();

    // Dashboard: Manager totals by category
    @Query("SELECT c.category, COALESCE(SUM(c.amount), 0) FROM Claim c GROUP BY c.category")
    List<Object[]> getManagerCategoryTotals();

    // Dashboard: Manager monthly summary (current year)
    @Query("SELECT MONTH(c.createdAt), COALESCE(SUM(c.amount), 0), COUNT(c) " +
           "FROM Claim c WHERE YEAR(c.createdAt) = YEAR(CURRENT_DATE) GROUP BY MONTH(c.createdAt)")
    List<Object[]> getManagerMonthlySummary();

    // CSV export for manager
    List<Claim> findByStatusAndExpenseDateBetween(ClaimStatus status, LocalDate from, LocalDate to);

    List<Claim> findAllByUserId(Long userId);
}

