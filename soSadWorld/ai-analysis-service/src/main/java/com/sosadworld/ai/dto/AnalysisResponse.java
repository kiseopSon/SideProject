package com.sosadworld.ai.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class AnalysisResponse {
    private Long diaryId;
    private String userId;
    private EmotionScores emotionScores;
    private String currentSituation;
    private String problematicBehavior;
    private Boolean needsProfessionalHelp;
    private String recommendation;
    
    @Data
    public static class EmotionScores {
        private BigDecimal depressionPercent;  // 우울 %
        private BigDecimal joyPercent;         // 기쁨 %
        private BigDecimal angerPercent;       // 화남 %
    }
}
