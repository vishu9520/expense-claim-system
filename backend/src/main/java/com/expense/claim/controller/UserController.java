package com.expense.claim.controller;

import com.expense.claim.dto.response.ApiResponse;
import com.expense.claim.dto.response.UserResponse;
import com.expense.claim.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manager/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "Manager: view users, activate/deactivate")
public class UserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "Manager: Get all users")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Manager: Get user by ID")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(id)));
    }

    @PutMapping("/{id}/activate")
    @Operation(summary = "Manager: Activate a user account")
    public ResponseEntity<ApiResponse<UserResponse>> activateUser(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("User activated.", userService.setUserActiveStatus(id, true)));
    }

    @PutMapping("/{id}/deactivate")
    @Operation(summary = "Manager: Deactivate a user account")
    public ResponseEntity<ApiResponse<UserResponse>> deactivateUser(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("User deactivated.", userService.setUserActiveStatus(id, false)));
    }
}

