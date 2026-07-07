package com.ethiobooks.localization;

import com.ethiobooks.common.dto.ApiResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/localization")
@RequiredArgsConstructor
public class LocalizationController {

    private final ObjectMapper objectMapper;

    @GetMapping("/{locale}")
    public ApiResponse<Map<String, String>> getTranslations(@PathVariable String locale) {
        String file = "localization/" + (locale.equals("am") ? "am" : "en") + ".json";
        try {
            ClassPathResource resource = new ClassPathResource(file);
            Map<String, String> translations = objectMapper.readValue(
                    resource.getInputStream(), new TypeReference<>() {});
            return ApiResponse.ok(translations);
        } catch (Exception e) {
            return ApiResponse.error("Locale not found");
        }
    }
}
