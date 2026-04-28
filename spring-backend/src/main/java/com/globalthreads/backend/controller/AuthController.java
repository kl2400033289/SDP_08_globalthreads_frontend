package com.globalthreads.backend.controller;

import jakarta.annotation.PostConstruct;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final JdbcTemplate jdbcTemplate;

    public AuthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void ensureSignupOtpTable() {
        jdbcTemplate.execute(
            """
            CREATE TABLE IF NOT EXISTS signup_otps (
              id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
              email VARCHAR(255) NOT NULL,
              otp CHAR(6) NOT NULL,
              verified TINYINT(1) NOT NULL DEFAULT 0,
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              expires_at TIMESTAMP NOT NULL,
              verified_at TIMESTAMP NULL DEFAULT NULL,
              UNIQUE KEY uniq_signup_otps_email (email),
              INDEX idx_signup_otps_expires_at (expires_at)
            )
            """
        );

        jdbcTemplate.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
              id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
              username VARCHAR(255) NOT NULL,
              email VARCHAR(255) NOT NULL,
              password VARCHAR(255) NOT NULL,
              phone VARCHAR(32) NULL,
              role VARCHAR(50) NOT NULL DEFAULT 'buyer',
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              UNIQUE KEY uniq_users_email (email)
            )
            """
        );
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody Map<String, Object> body) {
        String username = normalizeText(body.get("username"));
        String email = normalizeEmail(body.get("email"));
        String password = normalizeText(body.get("password"));
        String phone = normalizeNullable(body.get("phone"));
        String role = normalizeText(body.get("role")).toLowerCase();

        if (username.isEmpty() || email.isEmpty() || password.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Username, email, and password are required.");
        }

        List<Map<String, Object>> existingUsers = jdbcTemplate.queryForList(
            "SELECT id FROM users WHERE email = ? LIMIT 1",
            email
        );

        if (!existingUsers.isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("This email is already registered with a role. Please use the same email to log in instead of creating another account.");
        }

        jdbcTemplate.update(
            """
            INSERT INTO users (username, email, password, phone, role)
            VALUES (?, ?, ?, ?, ?)
            """,
            username,
            email,
            password,
            phone.isEmpty() ? null : phone,
            role.isEmpty() ? "buyer" : role
        );

        return ResponseEntity.ok("Account created successfully!");
    }

    @PostMapping("/signup/send-otp")
    public ResponseEntity<String> sendSignupOtp(@RequestBody Map<String, Object> body) {
        String email = normalizeEmail(body.get("email"));

        if (email.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email is required.");
        }

        String otp = String.valueOf(100000 + RANDOM.nextInt(900000));
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(10);

        jdbcTemplate.update(
            """
            INSERT INTO signup_otps (email, otp, verified, created_at, expires_at, verified_at)
            VALUES (?, ?, 0, ?, ?, NULL)
            ON DUPLICATE KEY UPDATE
              otp = VALUES(otp),
              verified = 0,
              created_at = VALUES(created_at),
              expires_at = VALUES(expires_at),
              verified_at = NULL
            """,
            email,
            otp,
            Timestamp.valueOf(now),
            Timestamp.valueOf(expiresAt)
        );

        return ResponseEntity.ok("OTP sent successfully.");
    }

    @PostMapping("/signup/verify-otp")
    public ResponseEntity<Boolean> verifySignupOtp(@RequestBody Map<String, Object> body) {
        String email = normalizeEmail(body.get("email"));
        String otp = normalizeText(body.get("otp"));

        if (email.isEmpty() || otp.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(false);
        }

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            """
            SELECT id, otp, expires_at, verified
            FROM signup_otps
            WHERE email = ?
            ORDER BY created_at DESC
            LIMIT 1
            """,
            email
        );

        if (rows.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(false);
        }

        Map<String, Object> record = rows.get(0);
        if (asBoolean(record.get("verified"))) {
            return ResponseEntity.ok(true);
        }

        Timestamp expiresAt = record.get("expires_at") instanceof Timestamp
            ? (Timestamp) record.get("expires_at")
            : null;

        if (expiresAt == null || expiresAt.toInstant().isBefore(java.time.Instant.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(false);
        }

        String storedOtp = normalize(record.get("otp"));
        if (!storedOtp.equals(otp)) {
            return ResponseEntity.ok(false);
        }

        Number id = (Number) record.get("id");
        jdbcTemplate.update(
            """
            UPDATE signup_otps
            SET verified = 1,
                verified_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            id.longValue()
        );

        return ResponseEntity.ok(true);
    }

    private String normalizeEmail(Object value) {
        return value == null ? "" : String.valueOf(value).trim().toLowerCase();
    }

    private String normalizeText(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private String normalizeNullable(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private boolean asBoolean(Object value) {
        if (value instanceof Boolean booleanValue) {
            return booleanValue;
        }

        if (value instanceof Number numberValue) {
            return numberValue.intValue() != 0;
        }

        return "1".equals(normalizeText(value));
    }
}