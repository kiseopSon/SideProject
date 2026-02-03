package com.sosadworld.analysis.service;

import com.sosadworld.analysis.dto.AnalysisResultRequest;
import com.sosadworld.analysis.dto.AnalysisResultResponse;
import com.sosadworld.analysis.dto.StatisticsResponse;
import com.sosadworld.analysis.entity.AnalysisResult;
import com.sosadworld.analysis.repository.AnalysisResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalysisResultService {
    
    private final AnalysisResultRepository analysisResultRepository;
    
    @Transactional
    public AnalysisResultResponse saveAnalysisResult(AnalysisResultRequest request) {
        // 기존 결과가 있으면 업데이트, 없으면 새로 생성
        AnalysisResult result = analysisResultRepository
                .findByDiaryIdAndUserId(request.getDiaryId(), request.getUserId())
                .map(existing -> {
                    existing.setDepressionPercent(request.getEmotionScores().getDepressionPercent());
                    existing.setJoyPercent(request.getEmotionScores().getJoyPercent());
                    existing.setAngerPercent(request.getEmotionScores().getAngerPercent());
                    existing.setCurrentSituation(request.getCurrentSituation());
                    existing.setProblematicBehavior(request.getProblematicBehavior());
                    existing.setNeedsProfessionalHelp(request.getNeedsProfessionalHelp());
                    existing.setRecommendation(request.getRecommendation());
                    return existing;
                })
                .orElse(AnalysisResult.builder()
                        .diaryId(request.getDiaryId())
                        .userId(request.getUserId())
                        .depressionPercent(request.getEmotionScores().getDepressionPercent())
                        .joyPercent(request.getEmotionScores().getJoyPercent())
                        .angerPercent(request.getEmotionScores().getAngerPercent())
                        .currentSituation(request.getCurrentSituation())
                        .problematicBehavior(request.getProblematicBehavior())
                        .needsProfessionalHelp(request.getNeedsProfessionalHelp())
                        .recommendation(request.getRecommendation())
                        .build());
        
        AnalysisResult saved = analysisResultRepository.save(result);
        return toResponse(saved);
    }
    
    @Transactional(readOnly = true)
    public List<AnalysisResultResponse> getAnalysisResultsByUserId(String userId) {
        return analysisResultRepository.findByUserIdOrderByAnalyzedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public AnalysisResultResponse getAnalysisResultByDiaryId(Long diaryId, String userId) {
        AnalysisResult result = analysisResultRepository
                .findByDiaryIdAndUserId(diaryId, userId)
                .orElseThrow(() -> new RuntimeException("분석 결과를 찾을 수 없습니다"));
        
        return toResponse(result);
    }
    
    @Transactional(readOnly = true)
    public StatisticsResponse getStatisticsByUserId(String userId) {
        List<AnalysisResult> results = analysisResultRepository.findByUserIdOrderByAnalyzedAtDesc(userId);
        
        if (results.isEmpty()) {
            StatisticsResponse response = new StatisticsResponse();
            response.setTotalAnalyses(0L);
            response.setNeedsProfessionalHelpCount(0L);
            StatisticsResponse.EmotionAverages averages = new StatisticsResponse.EmotionAverages();
            averages.setAverageDepressionPercent(BigDecimal.ZERO);
            averages.setAverageJoyPercent(BigDecimal.ZERO);
            averages.setAverageAngerPercent(BigDecimal.ZERO);
            response.setEmotionAverages(averages);
            return response;
        }
        
        BigDecimal avgDepression = results.stream()
                .map(AnalysisResult::getDepressionPercent)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(results.size()), 2, RoundingMode.HALF_UP);
        
        BigDecimal avgJoy = results.stream()
                .map(AnalysisResult::getJoyPercent)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(results.size()), 2, RoundingMode.HALF_UP);
        
        BigDecimal avgAnger = results.stream()
                .map(AnalysisResult::getAngerPercent)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(results.size()), 2, RoundingMode.HALF_UP);
        
        StatisticsResponse response = new StatisticsResponse();
        StatisticsResponse.EmotionAverages averages = new StatisticsResponse.EmotionAverages();
        averages.setAverageDepressionPercent(avgDepression);
        averages.setAverageJoyPercent(avgJoy);
        averages.setAverageAngerPercent(avgAnger);
        response.setEmotionAverages(averages);
        response.setTotalAnalyses((long) results.size());
        response.setNeedsProfessionalHelpCount(
                analysisResultRepository.countNeedsProfessionalHelpByUserId(userId)
        );
        
        return response;
    }
    
    private AnalysisResultResponse toResponse(AnalysisResult result) {
        AnalysisResultResponse response = new AnalysisResultResponse();
        response.setId(result.getId());
        response.setDiaryId(result.getDiaryId());
        response.setUserId(result.getUserId());
        
        AnalysisResultResponse.EmotionScores scores = new AnalysisResultResponse.EmotionScores();
        scores.setDepressionPercent(result.getDepressionPercent());
        scores.setJoyPercent(result.getJoyPercent());
        scores.setAngerPercent(result.getAngerPercent());
        response.setEmotionScores(scores);
        
        response.setCurrentSituation(result.getCurrentSituation());
        response.setProblematicBehavior(result.getProblematicBehavior());
        response.setNeedsProfessionalHelp(result.getNeedsProfessionalHelp());
        response.setRecommendation(result.getRecommendation());
        response.setAnalyzedAt(result.getAnalyzedAt());
        
        return response;
    }
}
