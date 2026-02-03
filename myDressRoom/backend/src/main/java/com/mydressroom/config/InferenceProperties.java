package com.mydressroom.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.inference")
public record InferenceProperties(
    String baseUrl,
    String generatePath,
    int connectTimeoutMs,
    int readTimeoutMs
) {}
