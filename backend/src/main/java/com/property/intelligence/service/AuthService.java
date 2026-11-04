package com.property.intelligence.service;

import com.property.intelligence.dto.AuthResponse;
import com.property.intelligence.dto.LoginRequest;
import com.property.intelligence.dto.SignupRequest;
import com.property.intelligence.entity.User;
import com.property.intelligence.exception.AppException;
import com.property.intelligence.repository.UserRepository;
import com.property.intelligence.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new AppException("Passwords do not match");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new AppException("An account with this email address already exists");
        }

        User user = new User(
                request.getFullName().trim(),
                normalizedEmail,
                request.getPhone().trim(),
                passwordEncoder.encode(request.getPassword())
        );

        User savedUser = userRepository.save(user);
        String token = jwtService.generateToken(savedUser.getId(), savedUser.getEmail());

        return new AuthResponse(
                token,
                savedUser.getId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getPhone()
        );
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
        );

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new AppException("User not found"));

        String token = jwtService.generateToken(user.getId(), user.getEmail());

        return new AuthResponse(
                token,
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone()
        );
    }
}

