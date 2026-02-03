package com.sosadworld.analysis.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class AnalysisResultRequest {
    private Long diaryId;
    private String userId;
    private EmotionScores emotionScores;
    private String currentSituation;
    private String problematicBehavior;
    private Boolean needsProfessionalHelp;
    private String recommendation;
    
    @Data
    public static class EmotionScores {
        private BigDecimal depressionPercent;
        private BigDecimal joyPercent;
        private BigDecimal angerPercent;
    }
}
