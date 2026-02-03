package com.sosadworld.analysis.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class AnalysisResultResponse {
    private Long id;
    private Long diaryId;
    private String userId;
    private EmotionScores emotionScores;
    private String currentSituation;
    private String problematicBehavior;
    private Boolean needsProfessionalHelp;
    private String recommendation;
    private LocalDateTime analyzedAt;
    
    @Data
    public static class EmotionScores {
        private BigDecimal depressionPercent;
        private BigDecimal joyPercent;
        private BigDecimal angerPercent;
    }
}
