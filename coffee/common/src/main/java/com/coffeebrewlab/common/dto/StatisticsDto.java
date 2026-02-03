package com.coffeebrewlab.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * 통계 데이터 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatisticsDto {
    
    private Long totalExperiments;
    private Double averageTasteScore;
    private String mostUsedBrewMethod;
    private String bestRatedCoffeeBean;
    private Double averageExtractionTime;
    
    // 추출 방법별 평균 점수
    private Map<String, Double> averageScoreByBrewMethod;
    
    // 원두별 실험 횟수
    private Map<String, Long> experimentCountByBean;
    
    // 로스팅 레벨별 평균 점수
    private Map<String, Double> averageScoreByRoastLevel;
    
    // 최근 트렌드
    private Double recentAverageScore;
    private Long recentExperimentCount;
}

