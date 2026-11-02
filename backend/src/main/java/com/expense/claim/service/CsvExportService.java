package com.expense.claim.service;

import com.expense.claim.entity.Claim;
import com.expense.claim.enums.ClaimStatus;
import com.expense.claim.repository.ClaimRepository;
import com.opencsv.CSVWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.StringWriter;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CsvExportService {

    private final ClaimRepository claimRepository;

    public String exportClaimsAsCsv(ClaimStatus status, LocalDate fromDate, LocalDate toDate) {
        LocalDate from = fromDate != null ? fromDate : LocalDate.of(2000, 1, 1);
        LocalDate to = toDate != null ? toDate : LocalDate.now();

        List<Claim> claims;
        if (status != null) {
            claims = claimRepository.findByStatusAndExpenseDateBetween(status, from, to);
        } else {
            claims = claimRepository.findAll();
        }

        StringWriter writer = new StringWriter();
        try (CSVWriter csvWriter = new CSVWriter(writer)) {
            // Header
            csvWriter.writeNext(new String[]{
                "ID", "Employee Name", "Employee Email",
                "Title", "Amount", "Category", "Expense Date",
                "Status", "Description", "Manager Comment", "Created At"
            });

            // Data rows
            for (Claim claim : claims) {
                csvWriter.writeNext(new String[]{
                    String.valueOf(claim.getId()),
                    claim.getUser().getName(),
                    claim.getUser().getEmail(),
                    claim.getTitle(),
                    claim.getAmount().toString(),
                    claim.getCategory().name(),
                    claim.getExpenseDate().toString(),
                    claim.getStatus().name(),
                    claim.getDescription() != null ? claim.getDescription() : "",
                    claim.getManagerComment() != null ? claim.getManagerComment() : "",
                    claim.getCreatedAt().toString()
                });
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate CSV: " + e.getMessage());
        }

        return writer.toString();
    }
}

