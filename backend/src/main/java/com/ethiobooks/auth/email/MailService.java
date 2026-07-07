package com.ethiobooks.auth.email;

import com.ethiobooks.config.AppMailProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;
    private final AppMailProperties mailProperties;

    public void sendVerificationEmail(String toEmail, String fullName, String verifyUrl) {
        String subject = "Verify your mysuq account";
        String body =
                """
                Hello %s,

                Thanks for signing up for mysuq. Please confirm your email address by opening this link:

                %s

                This link expires in %d hours. If you did not create an account, you can ignore this email.

                — mysuq
                """
                        .formatted(
                                fullName != null && !fullName.isBlank() ? fullName : "there",
                                verifyUrl,
                                mailProperties.getVerificationTtlHours());

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailProperties.getFrom());
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);

        try {
            mailSender.send(message);
            log.info("Verification email sent to {}", toEmail);
        } catch (MailException e) {
            log.error("Failed to send verification email to {}: {}", toEmail, e.getMessage());
            log.warn("DEV verification link for {}: {}", toEmail, verifyUrl);
            throw e;
        }
    }
}
