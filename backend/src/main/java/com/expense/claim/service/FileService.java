package com.expense.claim.service;

import com.expense.claim.entity.Claim;
import com.expense.claim.exception.BadRequestException;
import com.expense.claim.exception.ResourceNotFoundException;
import com.expense.claim.repository.ClaimRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileService {

    private static final List<String> ALLOWED_TYPES = List.of(
            "image/jpeg", "image/png", "image/jpg", "application/pdf"
    );
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024L; // 10MB

    @Value("${app.upload.dir}")
    private String uploadDir;

    private final ClaimRepository claimRepository;

    @Transactional
    public String uploadReceipt(Long claimId, MultipartFile file) {
        validateFile(file);

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + claimId));

        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String ext = StringUtils.getFilenameExtension(file.getOriginalFilename());
            String fileName = UUID.randomUUID() + "." + ext;
            Path target = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            // Delete old file if exists
            if (claim.getReceiptPath() != null) {
                try {
                    Files.deleteIfExists(Paths.get(claim.getReceiptPath()));
                } catch (IOException ignored) {}
            }

            claim.setReceiptPath(target.toString());
            claim.setReceiptName(file.getOriginalFilename());
            claimRepository.save(claim);

            return fileName;
        } catch (IOException e) {
            throw new BadRequestException("Failed to store file: " + e.getMessage());
        }
    }

    public Resource downloadReceipt(Long claimId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + claimId));

        if (claim.getReceiptPath() == null) {
            throw new ResourceNotFoundException("No receipt attached to this claim.");
        }

        try {
            Path filePath = Paths.get(claim.getReceiptPath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists()) {
                throw new ResourceNotFoundException("Receipt file not found.");
            }

            return resource;
        } catch (MalformedURLException e) {
            throw new BadRequestException("Could not load receipt: " + e.getMessage());
        }
    }

    public String getReceiptContentType(Long claimId) {
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found."));
        if (claim.getReceiptName() == null) return "application/octet-stream";
        String name = claim.getReceiptName().toLowerCase();
        if (name.endsWith(".pdf")) return "application/pdf";
        if (name.endsWith(".png")) return "image/png";
        return "image/jpeg";
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is empty.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("File size exceeds the 10MB limit.");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new BadRequestException("Only JPEG, PNG, and PDF files are allowed.");
        }
    }
}

