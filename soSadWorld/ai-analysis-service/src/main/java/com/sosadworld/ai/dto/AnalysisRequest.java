package com.sosadworld.ai.dto;

import lombok.Data;

@Data
public class AnalysisRequest {
    private String diaryContent;
    private Long diaryId;
    private String userId;
}
