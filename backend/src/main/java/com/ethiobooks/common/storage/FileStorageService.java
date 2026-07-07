package com.ethiobooks.common.storage;

import com.ethiobooks.common.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif");

    private final Path uploadRoot;
    private final long maxBytes;

    public FileStorageService(
            @Value("${app.upload.dir:uploads}") String uploadDir,
            @Value("${app.upload.max-size-bytes:2097152}") long maxBytes) {
        this.uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
        this.maxBytes = maxBytes;
    }

    public String storeUserAvatar(UUID userId, MultipartFile file) {
        return storeImage("users", userId.toString(), file);
    }

    public String storeBusinessLogo(UUID businessId, MultipartFile file) {
        return storeImage("businesses", businessId.toString(), file);
    }

    public String storePaymentMethodLogo(UUID methodId, MultipartFile file) {
        return storeImage("payment-methods", methodId.toString(), file);
    }

    private String storeImage(String folder, String id, MultipartFile file) {
        validate(file);
        String ext = extensionFor(file);
        Path dir = uploadRoot.resolve(folder);
        try {
            Files.createDirectories(dir);
            Path target = dir.resolve(id + ext);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/" + folder + "/" + id + ext;
        } catch (IOException e) {
            throw new BusinessException("Could not save image. Please try again.");
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Please choose an image file.");
        }
        if (file.getSize() > maxBytes) {
            throw new BusinessException("Image must be 2 MB or smaller.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BusinessException("Only JPEG, PNG, WebP, or GIF images are allowed.");
        }
    }

    private String extensionFor(MultipartFile file) {
        String contentType = file.getContentType().toLowerCase();
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".jpg";
        };
    }
}
