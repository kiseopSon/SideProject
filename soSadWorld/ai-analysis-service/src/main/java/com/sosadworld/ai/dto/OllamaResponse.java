package com.sosadworld.ai.dto;

import lombok.Data;

@Data
public class OllamaResponse {
    private String model;
    private String response;
    private Boolean done;
}
