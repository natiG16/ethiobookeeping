package com.ethiobooks.config;

import com.ethiobooks.users.domain.AuthProvider;
import com.ethiobooks.users.domain.User;
import com.ethiobooks.users.domain.UserRole;
import com.ethiobooks.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrap implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Override
    public void run(ApplicationArguments args) {
        if (!StringUtils.hasText(adminEmail) || !StringUtils.hasText(adminPassword)) {
            return;
        }
        String email = adminEmail.trim().toLowerCase();
        userRepository.findByEmail(email).ifPresentOrElse(
                user -> {
                    user.setRole(UserRole.ADMIN);
                    user.setActive(true);
                    user.setPasswordHash(passwordEncoder.encode(adminPassword));
                    user.setEmailVerified(true);
                    userRepository.save(user);
                    log.info("Ensured admin user: {}", email);
                },
                () -> {
                    User admin = User.builder()
                            .email(email)
                            .fullName("Support Admin")
                            .passwordHash(passwordEncoder.encode(adminPassword))
                            .role(UserRole.ADMIN)
                            .authProvider(AuthProvider.LOCAL)
                            .active(true)
                            .emailVerified(true)
                            .build();
                    userRepository.save(admin);
                    log.info("Created admin user: {}", email);
                }
        );
    }
}
