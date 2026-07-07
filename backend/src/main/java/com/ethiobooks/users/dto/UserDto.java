package com.ethiobooks.users.dto;

import com.ethiobooks.users.domain.AuthProvider;
import com.ethiobooks.users.domain.UserRole;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class UserDto {

    private UUID id;
    private String email;
    private String phone;
    private String fullName;
    private UserRole role;
    private AuthProvider authProvider;
    private String profilePictureUrl;
    private String locale;
    private String theme;
    private String calendarSystem;
    private boolean active;
}
