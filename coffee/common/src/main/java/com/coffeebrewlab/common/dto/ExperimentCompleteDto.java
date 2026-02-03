package com.coffeebrewlab.common.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 실험 완료 시 사용하는 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExperimentCompleteDto {

    @NotNull(message = "맛 점수는 필수입니다")
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
}

