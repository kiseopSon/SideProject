package com.mydressroom.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.storage")
public record StorageProperties(String baseDir, String uploadDir, String outputDir) {}
