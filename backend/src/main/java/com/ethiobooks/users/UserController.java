package com.ethiobooks.users;

import com.ethiobooks.common.dto.ApiResponse;
import com.ethiobooks.common.exception.BusinessException;
import com.ethiobooks.security.SecurityUtils;
import com.ethiobooks.users.domain.CalendarSystem;
import com.ethiobooks.users.domain.User;
import com.ethiobooks.users.dto.UserDto;
import com.ethiobooks.users.mapper.UserMapper;
import com.ethiobooks.users.repository.UserRepository;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import com.ethiobooks.common.storage.FileStorageService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/users/me")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final FileStorageService fileStorageService;

    @GetMapping
    public ApiResponse<UserDto> me() {
        User user = userRepository.findById(SecurityUtils.currentUserId()).orElseThrow();
        if (!user.isActive()) {
            throw new BusinessException("Your service has been deactivated. Contact support.");
        }
        return ApiResponse.ok(userMapper.toDto(user));
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<UserDto> uploadAvatar(@RequestPart("file") MultipartFile file) {
        User user = userRepository.findById(SecurityUtils.currentUserId()).orElseThrow();
        String path = fileStorageService.storeUserAvatar(user.getId(), file);
        user.setProfilePictureUrl(path);
        return ApiResponse.ok(userMapper.toDto(userRepository.save(user)));
    }

    @PatchMapping
    public ApiResponse<UserDto> update(@RequestBody ProfileUpdateRequest request) {
        User user = userRepository.findById(SecurityUtils.currentUserId()).orElseThrow();
        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getLocale() != null) user.setLocale(request.getLocale());
        if (request.getTheme() != null) user.setTheme(request.getTheme());
        if (request.getCalendarSystem() != null) {
            user.setCalendarSystem(CalendarSystem.valueOf(request.getCalendarSystem().toUpperCase()));
        }
        return ApiResponse.ok(userMapper.toDto(userRepository.save(user)));
    }

    @Data
    public static class ProfileUpdateRequest {
        private String fullName;
        private String phone;
        @Pattern(regexp = "en|am")
        private String locale;
        @Pattern(regexp = "light|dark")
        private String theme;
        @Pattern(regexp = "ethiopian|gregorian", flags = Pattern.Flag.CASE_INSENSITIVE)
        private String calendarSystem;
    }
}
