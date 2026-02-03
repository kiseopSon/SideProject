package com.sosadworld.analysis.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class StatisticsResponse {
    private EmotionAverages emotionAverages;
    private Long totalAnalyses;
    private Long needsProfessionalHelpCount;
    
    @Data
    public static class EmotionAverages {
        private BigDecimal averageDepressionPercent;
        private BigDecimal averageJoyPercent;
        private BigDecimal averageAngerPercent;
    }
}
