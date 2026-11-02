package com.expense.claim;

import com.expense.claim.dto.request.RegisterRequest;
import com.expense.claim.dto.response.AuthResponse;
import com.expense.claim.entity.User;
import com.expense.claim.enums.Role;
import com.expense.claim.exception.BadRequestException;
import com.expense.claim.repository.RefreshTokenRepository;
import com.expense.claim.repository.UserRepository;
import com.expense.claim.security.JwtTokenProvider;
import com.expense.claim.service.AuthService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;

    @InjectMocks private AuthService authService;

    @Test
    void register_WhenEmailAlreadyExists_ShouldThrowBadRequest() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Test User");
        req.setEmail("existing@test.com");
        req.setPassword("Test@1234");

        when(userRepository.existsByEmail("existing@test.com")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.register(req));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_NewUser_ShouldReturnAuthResponse() {
        RegisterRequest req = new RegisterRequest();
        req.setName("New User");
        req.setEmail("new@test.com");
        req.setPassword("Test@1234");

        User savedUser = User.builder().id(10L).name("New User").email("new@test.com")
                .role(Role.EMPLOYEE).isActive(true).build();

        when(userRepository.existsByEmail("new@test.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPass");
        when(userRepository.save(any())).thenReturn(savedUser);
        when(jwtTokenProvider.generateAccessToken(anyString())).thenReturn("access-token");
        when(jwtTokenProvider.generateRefreshToken(anyString())).thenReturn("refresh-token");
        when(refreshTokenRepository.findByUser(any())).thenReturn(Optional.empty());

        AuthResponse response = authService.register(req);

        assertNotNull(response);
        assertEquals("new@test.com", response.getEmail());
        assertEquals(Role.EMPLOYEE, response.getRole());
        assertEquals("access-token", response.getAccessToken());
    }
}

