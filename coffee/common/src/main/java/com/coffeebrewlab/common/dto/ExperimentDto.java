package com.coffeebrewlab.common.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 커피 추출 실험 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExperimentDto {
    
    private String id;
    
    @NotBlank(message = "원두 종류는 필수입니다")
    private String coffeeBean;
    
    @NotBlank(message = "로스팅 레벨은 필수입니다")
    private String roastLevel;
    
    @NotNull(message = "분쇄도는 필수입니다")
    @Min(value = 1, message = "분쇄도는 1 이상이어야 합니다")
    @Max(value = 10, message = "분쇄도는 10 이하여야 합니다")
    private Double grindSize;
    
    @NotNull(message = "물 온도는 필수입니다")
    @Min(value = 80, message = "물 온도는 80°C 이상이어야 합니다")
    @Max(value = 100, message = "물 온도는 100°C 이하여야 합니다")
    private Double waterTemperature;
    
    @NotNull(message = "커피 양은 필수입니다")
    @Positive(message = "커피 양은 양수여야 합니다")
    private Double coffeeAmount;
    
    @NotNull(message = "물 양은 필수입니다")
    @Positive(message = "물 양은 양수여야 합니다")
    private Double waterAmount;
    
    @NotBlank(message = "추출 방법은 필수입니다")
    private String brewMethod;
    
    @NotNull(message = "추출 시간은 필수입니다")
    @Positive(message = "추출 시간은 양수여야 합니다")
    private Integer extractionTime;
    
    @Min(value = 1, message = "맛 점수는 1 이상이어야 합니다")
    @Max(value = 10, message = "맛 점수는 10 이하여야 합니다")
    private Double tasteScore;
    
    // 뜨거울 때 맛 (1-10)
    @Min(value = 1, message = "신맛(뜨거울 때)은 1 이상이어야 합니다")
    @Max(value = 10, message = "신맛(뜨거울 때)은 10 이하여야 합니다")
    private Double sournessHot;
    
    @Min(value = 1, message = "단맛(뜨거울 때)은 1 이상이어야 합니다")
    @Max(value = 10, message = "단맛(뜨거울 때)은 10 이하여야 합니다")
    private Double sweetnessHot;
    
    @Min(value = 1, message = "쓴맛(뜨거울 때)은 1 이상이어야 합니다")
    @Max(value = 10, message = "쓴맛(뜨거울 때)은 10 이하여야 합니다")
    private Double bitternessHot;
    
    // 식었을 때 맛 (1-10)
    @Min(value = 1, message = "신맛(식었을 때)은 1 이상이어야 합니다")
    @Max(value = 10, message = "신맛(식었을 때)은 10 이하여야 합니다")
    private Double sournessCold;
    
    @Min(value = 1, message = "단맛(식었을 때)은 1 이상이어야 합니다")
    @Max(value = 10, message = "단맛(식었을 때)은 10 이하여야 합니다")
    private Double sweetnessCold;
    
    @Min(value = 1, message = "쓴맛(식었을 때)은 1 이상이어야 합니다")
    @Max(value = 10, message = "쓴맛(식었을 때)은 10 이하여야 합니다")
    private Double bitternessCold;
    
    private String flavorNotes;
    private String notes;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

