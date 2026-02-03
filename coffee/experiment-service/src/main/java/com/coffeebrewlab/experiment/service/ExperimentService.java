package com.coffeebrewlab.experiment.service;

import com.coffeebrewlab.common.dto.ExperimentCompleteDto;
import com.coffeebrewlab.common.dto.ExperimentDto;
import com.coffeebrewlab.common.event.ExperimentEvent;
import com.coffeebrewlab.experiment.entity.Experiment;
import com.coffeebrewlab.experiment.kafka.ExperimentEventProducer;
import com.coffeebrewlab.experiment.repository.ExperimentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExperimentService {

    private final ExperimentRepository experimentRepository;
    private final ExperimentEventProducer eventProducer;

    @Transactional
    public ExperimentDto createExperiment(ExperimentDto dto) {
        Experiment experiment = Experiment.builder()
                .coffeeBean(dto.getCoffeeBean())
                .roastLevel(dto.getRoastLevel())
                .grindSize(dto.getGrindSize())
                .waterTemperature(dto.getWaterTemperature())
                .coffeeAmount(dto.getCoffeeAmount())
                .waterAmount(dto.getWaterAmount())
                .brewMethod(dto.getBrewMethod())
                .extractionTime(dto.getExtractionTime())
                .tasteScore(dto.getTasteScore())
                .flavorNotes(dto.getFlavorNotes())
                .notes(dto.getNotes())
                .status(Experiment.ExperimentStatus.IN_PROGRESS)
                .build();

        Experiment saved = experimentRepository.save(experiment);
        
        log.info("☕ [EXPERIMENT] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log.info("☕ [EXPERIMENT] 🆕 새 실험 생성");
        log.info("☕ [EXPERIMENT] → ID: {}", saved.getId());
        log.info("☕ [EXPERIMENT] → 원두: {} ({})", saved.getCoffeeBean(), saved.getRoastLevel());
        log.info("☕ [EXPERIMENT] → 추출법: {} | 분쇄도: {}", saved.getBrewMethod(), saved.getGrindSize());
        log.info("☕ [EXPERIMENT] → 물온도: {}°C | 추출시간: {}초", saved.getWaterTemperature(), saved.getExtractionTime());
        log.info("☕ [EXPERIMENT] → 커피: {}g | 물: {}ml", saved.getCoffeeAmount(), saved.getWaterAmount());
        log.info("☕ [EXPERIMENT] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        // Kafka 이벤트 발행
        publishEvent(saved, ExperimentEvent.EventType.EXPERIMENT_STARTED);

        return toDto(saved);
    }

    @Transactional
    public ExperimentDto completeExperiment(String id, ExperimentCompleteDto dto) {
        Experiment experiment = experimentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Experiment not found: " + id));

        experiment.setTasteScore(dto.getTasteScore());
        experiment.setSournessHot(dto.getSournessHot());
        experiment.setSweetnessHot(dto.getSweetnessHot());
        experiment.setBitternessHot(dto.getBitternessHot());
        experiment.setSournessCold(dto.getSournessCold());
        experiment.setSweetnessCold(dto.getSweetnessCold());
        experiment.setBitternessCold(dto.getBitternessCold());
        experiment.setFlavorNotes(dto.getFlavorNotes());
        experiment.setNotes(dto.getNotes());
        experiment.setStatus(Experiment.ExperimentStatus.COMPLETED);

        Experiment saved = experimentRepository.save(experiment);
        
        log.info("☕ [EXPERIMENT] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log.info("☕ [EXPERIMENT] ✅ 실험 완료");
        log.info("☕ [EXPERIMENT] → ID: {}", saved.getId());
        log.info("☕ [EXPERIMENT] → 원두: {} | 추출법: {}", saved.getCoffeeBean(), saved.getBrewMethod());
        log.info("☕ [EXPERIMENT] → 맛 점수: ⭐ {}/10", saved.getTasteScore());
        log.info("☕ [EXPERIMENT] → 풍미: {}", saved.getFlavorNotes());
        log.info("☕ [EXPERIMENT] → 메모: {}", saved.getNotes());
        log.info("☕ [EXPERIMENT] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        // Kafka 이벤트 발행
        publishEvent(saved, ExperimentEvent.EventType.EXPERIMENT_COMPLETED);

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public ExperimentDto getExperiment(String id) {
        return experimentRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new RuntimeException("Experiment not found: " + id));
    }

    @Transactional(readOnly = true)
    public Page<ExperimentDto> getRecentExperiments(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return experimentRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::toDto);
    }

    @Transactional
    public void deleteExperiment(String id) {
        // 삭제 전에 실험 정보를 가져와서 Kafka 이벤트 발행
        Experiment experiment = experimentRepository.findById(id).orElse(null);
        
        if (experiment == null) {
            // DB에 없어도 Elasticsearch/Redis에서 삭제하기 위해 최소 정보로 이벤트 발행
            log.warn("☕ [EXPERIMENT] ⚠️ DB에 실험이 없지만 Elasticsearch/Redis에서 삭제 시도: {}", id);
            publishDeleteEventForMissingExperiment(id);
            return;
        }
        
        log.info("☕ [EXPERIMENT] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log.info("☕ [EXPERIMENT] 🗑️ 실험 삭제");
        log.info("☕ [EXPERIMENT] → ID: {}", experiment.getId());
        log.info("☕ [EXPERIMENT] → 원두: {} | 추출법: {}", experiment.getCoffeeBean(), experiment.getBrewMethod());
        log.info("☕ [EXPERIMENT] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        
        // Kafka 이벤트 발행 (Elasticsearch와 Redis에서도 삭제되도록)
        publishEvent(experiment, ExperimentEvent.EventType.EXPERIMENT_DELETED);
        
        // DB에서 삭제
        experimentRepository.deleteById(id);
        log.info("☕ [EXPERIMENT] ✅ 실험 삭제 완료: {}", id);
    }
    
    // DB에 없는 실험에 대한 삭제 이벤트 발행 (Elasticsearch/Redis 정리용)
    private void publishDeleteEventForMissingExperiment(String experimentId) {
        ExperimentEvent event = ExperimentEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .experimentId(experimentId)
                .eventType(ExperimentEvent.EventType.EXPERIMENT_DELETED)
                .timestamp(LocalDateTime.now())
                .build();
        
        eventProducer.sendEvent(event);
        log.info("☕ [EXPERIMENT] ✅ 삭제 이벤트 발행 완료 (DB에 없는 실험, Elasticsearch/Redis 정리용): {}", experimentId);
    }

    private void publishEvent(Experiment experiment, ExperimentEvent.EventType eventType) {
        ExperimentEvent event = ExperimentEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .experimentId(experiment.getId())
                .eventType(eventType)
                .timestamp(LocalDateTime.now())
                .coffeeBean(experiment.getCoffeeBean())
                .roastLevel(experiment.getRoastLevel())
                .grindSize(experiment.getGrindSize())
                .waterTemperature(experiment.getWaterTemperature())
                .coffeeAmount(experiment.getCoffeeAmount())
                .waterAmount(experiment.getWaterAmount())
                .brewMethod(experiment.getBrewMethod())
                .extractionTime(experiment.getExtractionTime())
                .tasteScore(experiment.getTasteScore())
                .sournessHot(experiment.getSournessHot())
                .sweetnessHot(experiment.getSweetnessHot())
                .bitternessHot(experiment.getBitternessHot())
                .sournessCold(experiment.getSournessCold())
                .sweetnessCold(experiment.getSweetnessCold())
                .bitternessCold(experiment.getBitternessCold())
                .flavorNotes(experiment.getFlavorNotes())
                .notes(experiment.getNotes())
                .build();

        eventProducer.sendEvent(event);
    }

    private ExperimentDto toDto(Experiment experiment) {
        return ExperimentDto.builder()
                .id(experiment.getId())
                .coffeeBean(experiment.getCoffeeBean())
                .roastLevel(experiment.getRoastLevel())
                .grindSize(experiment.getGrindSize())
                .waterTemperature(experiment.getWaterTemperature())
                .coffeeAmount(experiment.getCoffeeAmount())
                .waterAmount(experiment.getWaterAmount())
                .brewMethod(experiment.getBrewMethod())
                .extractionTime(experiment.getExtractionTime())
                .tasteScore(experiment.getTasteScore())
                .sournessHot(experiment.getSournessHot())
                .sweetnessHot(experiment.getSweetnessHot())
                .bitternessHot(experiment.getBitternessHot())
                .sournessCold(experiment.getSournessCold())
                .sweetnessCold(experiment.getSweetnessCold())
                .bitternessCold(experiment.getBitternessCold())
                .flavorNotes(experiment.getFlavorNotes())
                .notes(experiment.getNotes())
                .createdAt(experiment.getCreatedAt())
                .updatedAt(experiment.getUpdatedAt())
                .build();
    }
}

