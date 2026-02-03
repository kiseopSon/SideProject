package com.sosadworld.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class OllamaRequest {
    private String model;
    private String prompt;
    private Boolean stream = false;
    
    @JsonProperty("format")
    private String format;  // JSON 형식 요청 시 사용
}
