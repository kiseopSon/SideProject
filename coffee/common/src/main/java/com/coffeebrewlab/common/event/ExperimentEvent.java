package com.coffeebrewlab.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 커피 추출 실험 이벤트
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExperimentEvent {
    
    private String eventId;
    private String experimentId;
    private EventType eventType;
    private LocalDateTime timestamp;
    
    // 커피 추출 파라미터
    private String coffeeBean;           // 원두 종류
    private String roastLevel;           // 로스팅 레벨 (Light, Medium, Dark)
    private Double grindSize;            // 분쇄도 (1-10)
    private Double waterTemperature;     // 물 온도 (°C)
    private Double coffeeAmount;         // 커피 양 (g)
    private Double waterAmount;          // 물 양 (ml)
    private String brewMethod;           // 추출 방법 (V60, Aeropress, French Press 등)
    private Integer extractionTime;      // 추출 시간 (초)
    
    // 결과
    private Double tasteScore;           // 맛 점수 (1-10)
    
    // 뜨거울 때 맛 (1-10)
    private Double sournessHot;          // 신맛(뜨거울 때)
    private Double sweetnessHot;         // 단맛(뜨거울 때)
    private Double bitternessHot;        // 쓴맛(뜨거울 때)
    
    // 식었을 때 맛 (1-10)
    private Double sournessCold;         // 신맛(식었을 때)
    private Double sweetnessCold;        // 단맛(식었을 때)
    private Double bitternessCold;       // 쓴맛(식었을 때)
    
    private String flavorNotes;          // 풍미 노트
    private String notes;                // 추가 메모
    
    // 추가 메타데이터
    private Map<String, Object> metadata;
    
    public enum EventType {
        EXPERIMENT_STARTED,
        EXPERIMENT_COMPLETED,
        EXPERIMENT_FAILED,
        EXPERIMENT_UPDATED,
        EXPERIMENT_DELETED
    }
}

