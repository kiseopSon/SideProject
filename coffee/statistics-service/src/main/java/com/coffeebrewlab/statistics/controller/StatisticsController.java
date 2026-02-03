package com.coffeebrewlab.statistics.controller;

import com.coffeebrewlab.common.dto.StatisticsDto;
import com.coffeebrewlab.common.event.ExperimentEvent;
import com.coffeebrewlab.statistics.document.ExperimentSearchDocument;
import com.coffeebrewlab.statistics.service.SearchService;
import com.coffeebrewlab.statistics.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;

@Slf4j
@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;
    private final SearchService searchService;

    @GetMapping
    public ResponseEntity<StatisticsDto> getOverallStatistics() {
        return ResponseEntity.ok(statisticsService.getOverallStatistics());
    }

    @GetMapping("/recent")
    public ResponseEntity<List<ExperimentEvent>> getRecentExperiments(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(statisticsService.getRecentExperiments(limit));
    }

    @GetMapping("/top-rated")
    public ResponseEntity<List<ExperimentSearchDocument>> getTopRatedExperiments(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(searchService.getTopRatedExperiments(limit));
    }

    @GetMapping("/search/flavor")
    public ResponseEntity<Page<ExperimentSearchDocument>> searchByFlavorNotes(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(searchService.searchByFlavorNotes(query, page, size));
    }

    @GetMapping("/search/brew-method")
    public ResponseEntity<Page<ExperimentSearchDocument>> searchByBrewMethod(
            @RequestParam String method,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(searchService.searchByBrewMethod(method, page, size));
    }

    @GetMapping("/search/coffee-bean")
    public ResponseEntity<Page<ExperimentSearchDocument>> searchByCoffeeBean(
            @RequestParam String bean,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(searchService.searchByCoffeeBean(bean, page, size));
    }

    // 통합 검색
    @GetMapping("/search")
    public ResponseEntity<Page<ExperimentSearchDocument>> searchAll(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(searchService.searchAll(query, page, size));
    }

    // 필터링 및 정렬
    @GetMapping("/experiments")
    public ResponseEntity<Page<ExperimentSearchDocument>> searchWithFilters(
            @RequestParam(required = false) String coffeeBean,
            @RequestParam(required = false) String brewMethod,
            @RequestParam(required = false) String roastLevel,
            @RequestParam(required = false) Double minScore,
            @RequestParam(required = false) Double maxScore,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        java.time.LocalDateTime start = startDate != null ? 
                java.time.LocalDateTime.parse(startDate, java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
        java.time.LocalDateTime end = endDate != null ? 
                java.time.LocalDateTime.parse(endDate, java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null;
        
        return ResponseEntity.ok(searchService.searchWithFilters(
                coffeeBean, brewMethod, roastLevel, minScore, maxScore,
                start, end, sortBy, sortOrder, page, size));
    }

    // 히스토리 - 날짜별
    @GetMapping("/history/date")
    public ResponseEntity<Page<ExperimentSearchDocument>> getExperimentsByDate(
            @RequestParam String date,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            java.time.LocalDate localDate = java.time.LocalDate.parse(date);
            java.time.LocalDateTime dateTime = localDate.atStartOfDay();
            
            log.info("📅 [HISTORY] 날짜별 조회 요청: {}", date);
            
            Page<ExperimentSearchDocument> result = searchService.getExperimentsByDate(dateTime, page, size);
            
            log.info("📅 [HISTORY] 검색 결과: {}개 (전체: {})", 
                    result.getContent().size(), result.getTotalElements());
            
            // Elasticsearch에 데이터가 없으면 Redis에서 조회
            if (result.getTotalElements() == 0) {
                log.info("📅 [HISTORY] Elasticsearch에 데이터 없음, Redis에서 조회 시도");
                List<ExperimentEvent> recentEvents = statisticsService.getRecentExperiments(100);
                
                // 날짜 필터링
                java.time.LocalDate targetDate = localDate;
                List<ExperimentEvent> filteredEvents = recentEvents.stream()
                        .filter(event -> {
                            if (event.getTimestamp() == null) return false;
                            java.time.LocalDate eventDate = event.getTimestamp().toLocalDate();
                            // 완료된 실험과 삭제된 실험 모두 포함 (히스토리용)
                            return eventDate.equals(targetDate) && 
                                   (event.getEventType() == ExperimentEvent.EventType.EXPERIMENT_COMPLETED ||
                                    event.getEventType() == ExperimentEvent.EventType.EXPERIMENT_DELETED);
                        })
                        .collect(java.util.stream.Collectors.toList());
                
                log.info("📅 [HISTORY] Redis에서 필터링된 결과: {}개", filteredEvents.size());
                
                // ExperimentEvent를 ExperimentSearchDocument로 변환
                List<ExperimentSearchDocument> documents = filteredEvents.stream()
                        .map(this::convertToSearchDocument)
                        .collect(java.util.stream.Collectors.toList());
                
                Page<ExperimentSearchDocument> redisResult = new org.springframework.data.domain.PageImpl<>(
                        documents, 
                        org.springframework.data.domain.PageRequest.of(page, size), 
                        documents.size()
                );
                
                return ResponseEntity.ok(redisResult);
            }
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("📅 [HISTORY] 날짜 파싱 오류: {}", date, e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    private ExperimentSearchDocument convertToSearchDocument(ExperimentEvent event) {
        return ExperimentSearchDocument.builder()
                .id(java.util.UUID.randomUUID().toString())
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
    }

    // 히스토리 - 월별
    @GetMapping("/history/month")
    public ResponseEntity<Map<String, Object>> getMonthStatistics(
            @RequestParam int year,
            @RequestParam int month) {
        List<ExperimentSearchDocument> experiments = searchService.getExperimentsByMonth(year, month);
        
        double avgScore = experiments.stream()
                .filter(e -> e.getTasteScore() != null)
                .mapToDouble(ExperimentSearchDocument::getTasteScore)
                .average()
                .orElse(0.0);
        
        Map<String, Long> countByBrewMethod = experiments.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getBrewMethod() != null ? e.getBrewMethod() : "Unknown",
                        Collectors.counting()));
        
        Map<String, Object> result = Map.of(
                "experiments", experiments,
                "totalCount", experiments.size(),
                "averageScore", avgScore,
                "countByBrewMethod", countByBrewMethod
        );
        
        return ResponseEntity.ok(result);
    }

    // 히스토리 - 주별
    @GetMapping("/history/week")
    public ResponseEntity<List<ExperimentSearchDocument>> getExperimentsByWeek(
            @RequestParam int year,
            @RequestParam int week) {
        return ResponseEntity.ok(searchService.getExperimentsByWeek(year, week));
    }
}

