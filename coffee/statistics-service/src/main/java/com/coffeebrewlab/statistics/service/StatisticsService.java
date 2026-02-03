package com.coffeebrewlab.statistics.service;

import com.coffeebrewlab.common.dto.StatisticsDto;
import com.coffeebrewlab.common.event.ExperimentEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String RECENT_EXPERIMENTS_KEY = "recent:experiments";
    private static final String STATS_KEY_PREFIX = "stats:";

    public StatisticsDto getOverallStatistics() {
        log.info("📊 [STATISTICS] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log.info("📊 [STATISTICS] 통계 데이터 조회 시작");
        
        Long totalExperiments = getTotalExperiments();
        Double averageScore = getAverageTasteScore();
        Map<String, Double> scoreByBrewMethod = getAverageScoreByBrewMethod();
        Map<String, Long> countByBean = getExperimentCountByBean();

        String mostUsedBrewMethod = getMostUsedBrewMethod(scoreByBrewMethod);
        String bestRatedBean = getBestRatedBean(countByBean);

        log.info("📊 [STATISTICS] → 전체 실험 수: {}", totalExperiments);
        log.info("📊 [STATISTICS] → 평균 점수: {}", averageScore);
        log.info("📊 [STATISTICS] → 인기 추출법: {}", mostUsedBrewMethod);
        log.info("📊 [STATISTICS] → 인기 원두: {}", bestRatedBean);
        log.info("📊 [STATISTICS] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        return StatisticsDto.builder()
                .totalExperiments(totalExperiments)
                .averageTasteScore(averageScore)
                .mostUsedBrewMethod(mostUsedBrewMethod)
                .bestRatedCoffeeBean(bestRatedBean)
                .averageScoreByBrewMethod(scoreByBrewMethod)
                .experimentCountByBean(countByBean)
                .recentExperimentCount(getRecentExperimentCount())
                .build();
    }

    public List<ExperimentEvent> getRecentExperiments(int limit) {
        List<Object> results = redisTemplate.opsForList()
                .range(RECENT_EXPERIMENTS_KEY, 0, limit - 1);

        if (results == null) {
            return Collections.emptyList();
        }

        List<ExperimentEvent> experiments = new ArrayList<>();
        for (Object obj : results) {
            if (obj instanceof ExperimentEvent) {
                ExperimentEvent event = (ExperimentEvent) obj;
                // 삭제된 실험은 제외 (대시보드에서 표시하지 않음)
                if (event.getEventType() != ExperimentEvent.EventType.EXPERIMENT_DELETED) {
                    experiments.add(event);
                }
            }
        }
        return experiments;
    }

    private Long getTotalExperiments() {
        Object value = redisTemplate.opsForValue().get(STATS_KEY_PREFIX + "totalCompleted");
        if (value == null) return 0L;
        return value instanceof Number ? ((Number) value).longValue() : 0L;
    }

    private Double getAverageTasteScore() {
        Long totalExperiments = getTotalExperiments();
        if (totalExperiments == 0) return 0.0;

        Object totalScoreObj = redisTemplate.opsForValue().get(STATS_KEY_PREFIX + "totalScore");
        if (totalScoreObj == null) return 0.0;

        Long totalScore = totalScoreObj instanceof Number ? ((Number) totalScoreObj).longValue() : 0L;
        return (double) totalScore / totalExperiments;
    }

    private Map<String, Double> getAverageScoreByBrewMethod() {
        Set<String> keys = redisTemplate.keys(STATS_KEY_PREFIX + "brewMethod:*");
        Map<String, Double> result = new HashMap<>();

        if (keys != null) {
            for (String key : keys) {
                String brewMethod = key.replace(STATS_KEY_PREFIX + "brewMethod:", "");
                Object value = redisTemplate.opsForValue().get(key);
                if (value instanceof Number) {
                    result.put(brewMethod, ((Number) value).doubleValue());
                }
            }
        }
        return result;
    }

    private Map<String, Long> getExperimentCountByBean() {
        Set<String> keys = redisTemplate.keys(STATS_KEY_PREFIX + "coffeeBean:*");
        Map<String, Long> result = new HashMap<>();

        if (keys != null) {
            for (String key : keys) {
                String coffeeBean = key.replace(STATS_KEY_PREFIX + "coffeeBean:", "");
                Object value = redisTemplate.opsForValue().get(key);
                if (value instanceof Number) {
                    result.put(coffeeBean, ((Number) value).longValue());
                }
            }
        }
        return result;
    }

    private String getMostUsedBrewMethod(Map<String, Double> scoreByBrewMethod) {
        return scoreByBrewMethod.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");
    }

    private String getBestRatedBean(Map<String, Long> countByBean) {
        return countByBean.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");
    }

    private Long getRecentExperimentCount() {
        Long size = redisTemplate.opsForList().size(RECENT_EXPERIMENTS_KEY);
        return size != null ? size : 0L;
    }
}

