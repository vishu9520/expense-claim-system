package com.expense.claim.service;

import com.expense.claim.entity.AuditLog;
import com.expense.claim.entity.Claim;
import com.expense.claim.entity.User;
import com.expense.claim.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void log(Claim claim, User actor, String action, String description) {
        AuditLog log = AuditLog.builder()
                .claim(claim)
                .user(actor)
                .action(action)
                .description(description)
                .build();
        auditLogRepository.save(log);
    }
}

