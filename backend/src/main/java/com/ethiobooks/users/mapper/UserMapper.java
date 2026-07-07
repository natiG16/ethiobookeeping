package com.ethiobooks.users.mapper;

import com.ethiobooks.users.domain.User;
import com.ethiobooks.users.dto.UserDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "calendarSystem", expression = "java(calendarSystemLabel(user))")
    UserDto toDto(User user);

    default String calendarSystemLabel(User user) {
        if (user.getCalendarSystem() == null) {
            return "ethiopian";
        }
        return user.getCalendarSystem().name().toLowerCase();
    }
}
