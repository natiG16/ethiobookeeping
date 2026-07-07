package com.ethiobooks.reports;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

@Component
public class ReportI18n {

    private final Map<String, Map<String, String>> bundles = new HashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    void loadBundles() {
        bundles.put("en", loadBundle("en"));
        bundles.put("am", loadBundle("am"));
    }

    public String t(String locale, String key) {
        String lang = "am".equalsIgnoreCase(locale) ? "am" : "en";
        return bundles.getOrDefault(lang, Map.of()).getOrDefault(key, key);
    }

    /** Bilingual label: English (Amharic) or Amharic (English) based on locale. */
    public String tb(String locale, String key) {
        String en = t("en", key);
        String am = t("am", key);
        if (en.equals(am)) {
            return en;
        }
        if ("am".equalsIgnoreCase(locale)) {
            return am + " (" + en + ")";
        }
        return en + " (" + am + ")";
    }

    public String t(String locale, String key, Map<String, String> params) {
        String text = t(locale, key);
        if (params == null) {
            return text;
        }
        for (var e : params.entrySet()) {
            text = text.replace("{" + e.getKey() + "}", e.getValue());
        }
        return text;
    }

    private Map<String, String> loadBundle(String lang) {
        try {
            ClassPathResource resource = new ClassPathResource("localization/" + lang + ".json");
            try (InputStream in = resource.getInputStream()) {
                return objectMapper.readValue(in, new TypeReference<>() {});
            }
        } catch (Exception e) {
            return Map.of();
        }
    }
}
