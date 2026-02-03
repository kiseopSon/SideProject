package com.coffeebrewlab.consumer.service;

import com.coffeebrewlab.common.event.ExperimentEvent;
import com.coffeebrewlab.consumer.document.ExperimentDocument;
import com.coffeebrewlab.consumer.repository.ExperimentDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.mapping.IndexCoordinates;
import org.springframework.data.elasticsearch.core.query.Criteria;
import org.springframework.data.elasticsearch.core.query.CriteriaQuery;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventProcessingService {

    private final ExperimentDocumentRepository documentRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ElasticsearchOperations elasticsearchOperations;

    private static final String RECENT_EXPERIMENTS_KEY = "recent:experiments";
    private static final String STATS_KEY_PREFIX = "stats:";

    public void processEvent(ExperimentEvent event) {
        log.info("🔄 [EVENT-PROCESSOR] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log.info("🔄 [EVENT-PROCESSOR] 이벤트 처리 시작: {}", event.getEventType());
        
        // 삭제 이벤트인 경우
        if (event.getEventType() == ExperimentEvent.EventType.EXPERIMENT_DELETED) {
            // 1. 기존 EXPERIMENT_COMPLETED 문서 삭제
            deleteCompletedFromElasticsearch(event);
            // 2. EXPERIMENT_DELETED 이벤트를 Elasticsearch에 저장 (히스토리용)
            saveToElasticsearch(event);
            log.info("🔄 [EVENT-PROCESSOR] → Elasticsearch 삭제 이벤트 저장 완료");
            // 3. Redis에서 제거
            deleteFromRedis(event);
            log.info("🔄 [EVENT-PROCESSOR] ✅ 삭제 처리 완료 - Experiment: {}", event.getExperimentId());
            log.info("🔄 [EVENT-PROCESSOR] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            return;
        }
        
        // 1. Elasticsearch에 저장
        saveToElasticsearch(event);
        log.info("🔄 [EVENT-PROCESSOR] → Elasticsearch 저장 완료");

        // 2. Redis 캐시 업데이트
        updateRedisCache(event);
        log.info("🔄 [EVENT-PROCESSOR] → Redis 캐시 업데이트 완료");

        log.info("🔄 [EVENT-PROCESSOR] ✅ 처리 완료 - Experiment: {}", event.getExperimentId());
        log.info("🔄 [EVENT-PROCESSOR] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }

    private void saveToElasticsearch(ExperimentEvent event) {
        ExperimentDocument document = ExperimentDocument.builder()
                .id(UUID.randomUUID().toString())
                .experimentId(event.getExperimentId())
                .eventType(event.getEventType().name())
                .timestamp(event.getTimestamp())
                .coffeeBean(event.getCoffeeBean())
                .roastLevel(event.getRoastLevel())
                .grindSize(event.getGrindSize())
                .waterTemperature(event.getWaterTemperature())
                .coffeeAmount(event.getCoffeeAmount())
                .waterAmount(event.getWaterAmount())
                .brewMethod(event.getBrewMethod())
                .extractionTime(event.getExtractionTime())
                .tasteScore(event.getTasteScore())
                .sournessHot(event.getSournessHot())
                .sweetnessHot(event.getSweetnessHot())
                .bitternessHot(event.getBitternessHot())
                .sournessCold(event.getSournessCold())
                .sweetnessCold(event.getSweetnessCold())
                .bitternessCold(event.getBitternessCold())
                .flavorNotes(event.getFlavorNotes())
                .notes(event.getNotes())
                .build();

        documentRepository.save(document);
        log.debug("Saved document to Elasticsearch: {}", document.getId());
    }

    private void updateRedisCache(ExperimentEvent event) {
        // 최근 실험 목록 업데이트 (최근 100개 유지)
        redisTemplate.opsForList().leftPush(RECENT_EXPERIMENTS_KEY, event);
        redisTemplate.opsForList().trim(RECENT_EXPERIMENTS_KEY, 0, 99);

        // 실험 완료 시 통계 업데이트
        if (event.getEventType() == ExperimentEvent.EventType.EXPERIMENT_COMPLETED) {
            updateStatistics(event);
        }

        // TTL 설정 (24시간)
        redisTemplate.expire(RECENT_EXPERIMENTS_KEY, Duration.ofHours(24));
    }

    private void updateStatistics(ExperimentEvent event) {
        // 추출 방법별 실험 수 증가
        String brewMethodKey = STATS_KEY_PREFIX + "brewMethod:" + event.getBrewMethod();
        redisTemplate.opsForValue().increment(brewMethodKey);

        // 원두별 실험 수 증가
        String coffeeBeanKey = STATS_KEY_PREFIX + "coffeeBean:" + event.getCoffeeBean();
        redisTemplate.opsForValue().increment(coffeeBeanKey);

        // 전체 실험 수 증가
        redisTemplate.opsForValue().increment(STATS_KEY_PREFIX + "totalCompleted");

        // 점수 합계 업데이트 (평균 계산용)
        if (event.getTasteScore() != null) {
            String scoreKey = STATS_KEY_PREFIX + "totalScore";
            redisTemplate.opsForValue().increment(scoreKey, event.getTasteScore().longValue());
        }

        log.debug("Updated statistics for experiment: {}", event.getExperimentId());
    }
    
    // EXPERIMENT_COMPLETED 문서만 삭제 (EXPERIMENT_DELETED는 저장하기 위해)
    private void deleteCompletedFromElasticsearch(ExperimentEvent event) {
        try {
            // experimentId와 eventType이 EXPERIMENT_COMPLETED인 문서만 검색
            Criteria criteria = new Criteria("experimentId").is(event.getExperimentId())
                    .and(new Criteria("eventType").is("EXPERIMENT_COMPLETED"));
            CriteriaQuery query = new CriteriaQuery(criteria);
            
            IndexCoordinates indexCoordinates = IndexCoordinates.of("coffee-experiments");
            
            // Map으로 결과 받기 (날짜 변환 오류 방지)
            org.springframework.data.elasticsearch.core.SearchHits<java.util.Map> searchHits = 
                elasticsearchOperations.search(query, java.util.Map.class, indexCoordinates);
            
            int deletedCount = 0;
            for (org.springframework.data.elasticsearch.core.SearchHit<java.util.Map> hit : searchHits.getSearchHits()) {
                String documentId = hit.getId();
                elasticsearchOperations.delete(documentId, indexCoordinates);
                deletedCount++;
                log.info("🗑️ [ELASTICSEARCH] 완료 문서 삭제: {} (Experiment ID: {})", documentId, event.getExperimentId());
            }
            
            if (deletedCount > 0) {
                log.info("🔄 [EVENT-PROCESSOR] → Elasticsearch 완료 문서 삭제 완료: {}개", deletedCount);
            } else {
                log.info("🔄 [EVENT-PROCESSOR] → Elasticsearch에서 삭제할 완료 문서 없음: {}", event.getExperimentId());
            }
        } catch (Exception e) {
            log.error("🔄 [EVENT-PROCESSOR] ❌ Elasticsearch 완료 문서 삭제 실패: {}", event.getExperimentId(), e);
        }
    }
    
    private void deleteFromRedis(ExperimentEvent event) {
        try {
            // Redis에서 해당 실험을 최근 실험 목록에서 제거
            List<Object> recentExperiments = redisTemplate.opsForList().range(RECENT_EXPERIMENTS_KEY, 0, -1);
            if (recentExperiments != null && !recentExperiments.isEmpty()) {
                // 삭제할 항목을 제외한 새 리스트 생성
                List<Object> filteredList = new java.util.ArrayList<>();
                int removedCount = 0;
                
                for (Object obj : recentExperiments) {
                    if (obj instanceof ExperimentEvent) {
                        ExperimentEvent expEvent = (ExperimentEvent) obj;
                        if (expEvent.getExperimentId().equals(event.getExperimentId())) {
                            removedCount++;
                            log.info("🗑️ [REDIS] 최근 실험 목록에서 제거: {} (Experiment ID: {})", 
                                    expEvent.getCoffeeBean(), event.getExperimentId());
                            // 이 항목은 새 리스트에 추가하지 않음 (삭제)
                        } else {
                            // 다른 실험은 유지
                            filteredList.add(obj);
                        }
                    } else {
                        // ExperimentEvent가 아닌 경우 유지
                        filteredList.add(obj);
                    }
                }
                
                // 리스트를 새로 작성
                if (removedCount > 0) {
                    // 기존 리스트 삭제
                    redisTemplate.delete(RECENT_EXPERIMENTS_KEY);
                    // 필터링된 리스트로 재작성
                    if (!filteredList.isEmpty()) {
                        for (Object item : filteredList) {
                            redisTemplate.opsForList().rightPush(RECENT_EXPERIMENTS_KEY, item);
                        }
                    }
                    log.info("🗑️ [REDIS] 최근 실험 목록 재작성 완료: {}개 제거, {}개 유지 (Experiment ID: {})", 
                            removedCount, filteredList.size(), event.getExperimentId());
                } else {
                    log.warn("🗑️ [REDIS] 삭제할 실험을 찾을 수 없음: {}", event.getExperimentId());
                }
            }
            
            // 통계 업데이트 (감소)
            if (event.getBrewMethod() != null) {
                String brewMethodKey = STATS_KEY_PREFIX + "brewMethod:" + event.getBrewMethod();
                redisTemplate.opsForValue().decrement(brewMethodKey);
            }
            if (event.getCoffeeBean() != null) {
                String coffeeBeanKey = STATS_KEY_PREFIX + "coffeeBean:" + event.getCoffeeBean();
                redisTemplate.opsForValue().decrement(coffeeBeanKey);
            }
            redisTemplate.opsForValue().decrement(STATS_KEY_PREFIX + "totalCompleted");
            
            if (event.getTasteScore() != null) {
                String scoreKey = STATS_KEY_PREFIX + "totalScore";
                redisTemplate.opsForValue().decrement(scoreKey, event.getTasteScore().longValue());
            }
            
            log.info("🔄 [EVENT-PROCESSOR] → Redis 삭제 완료");
        } catch (Exception e) {
            log.error("🔄 [EVENT-PROCESSOR] ❌ Redis 삭제 실패: {}", event.getExperimentId(), e);
        }
    }
}

