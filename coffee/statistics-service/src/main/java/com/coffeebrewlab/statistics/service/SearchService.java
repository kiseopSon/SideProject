package com.coffeebrewlab.statistics.service;

import com.coffeebrewlab.statistics.document.ExperimentSearchDocument;
import com.coffeebrewlab.statistics.repository.ExperimentSearchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.mapping.IndexCoordinates;
import org.springframework.data.elasticsearch.core.query.Criteria;
import org.springframework.data.elasticsearch.core.query.CriteriaQuery;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchService {

    private final ExperimentSearchRepository searchRepository;
    private final ElasticsearchOperations elasticsearchOperations;

    // 통합 검색 (원두, 풍미, 메모 모두 검색)
    public Page<ExperimentSearchDocument> searchAll(String query, int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
            
            Criteria criteria = new Criteria()
                    .or(new Criteria("coffeeBean").contains(query))
                    .or(new Criteria("flavorNotes").contains(query))
                    .or(new Criteria("notes").contains(query));
            
            // 완료된 실험만
            criteria = criteria.and(new Criteria("eventType").is("EXPERIMENT_COMPLETED"));
            
            Query searchQuery = new CriteriaQuery(criteria).setPageable(pageable);
            
            // Map으로 결과 받기 (변환 오류 방지)
            IndexCoordinates indexCoordinates = IndexCoordinates.of("coffee-experiments");
            SearchHits<Map> searchHits = elasticsearchOperations.search(searchQuery, Map.class, indexCoordinates);
            
            List<ExperimentSearchDocument> content = new ArrayList<>();
            for (SearchHit<Map> hit : searchHits.getSearchHits()) {
                try {
                    Map<String, Object> source = hit.getContent();
                    // eventType 확인
                    String eventType = source.get("eventType") != null ? source.get("eventType").toString() : null;
                    
                    // 검색에서는 삭제된 실험 제외
                    if ("EXPERIMENT_DELETED".equals(eventType)) {
                        continue;
                    }
                    
                    ExperimentSearchDocument doc = convertMapToDocument(source);
                    if (doc != null) {
                        content.add(doc);
                    }
                } catch (Exception e) {
                    log.warn("검색 결과 변환 오류, 문서 건너뛰기: {}", e.getMessage());
                    continue;
                }
            }
            
            log.info("🔍 [SEARCH] 검색 결과: {}개 (전체: {})", content.size(), searchHits.getTotalHits());
            
            return new PageImpl<>(content, pageable, searchHits.getTotalHits());
        } catch (Exception e) {
            log.error("🔍 [SEARCH] 검색 오류", e);
            return new PageImpl<>(List.of(), PageRequest.of(page, size), 0);
        }
    }
    
    // Map을 ExperimentSearchDocument로 변환
    private ExperimentSearchDocument convertMapToDocument(Map<String, Object> source) {
        try {
            ExperimentSearchDocument.ExperimentSearchDocumentBuilder builder = ExperimentSearchDocument.builder();
            
            if (source.get("id") != null) {
                builder.id(source.get("id").toString());
            }
            if (source.get("experimentId") != null) {
                builder.experimentId(source.get("experimentId").toString());
            }
            if (source.get("eventType") != null) {
                builder.eventType(source.get("eventType").toString());
            }
            
            // 날짜 변환 처리 (여러 형식 지원)
            if (source.get("timestamp") != null) {
                LocalDateTime timestamp = parseTimestamp(source.get("timestamp").toString());
                builder.timestamp(timestamp);
            } else {
                builder.timestamp(LocalDateTime.now());
            }
            
            if (source.get("coffeeBean") != null) {
                builder.coffeeBean(source.get("coffeeBean").toString());
            }
            if (source.get("roastLevel") != null) {
                builder.roastLevel(source.get("roastLevel").toString());
            }
            if (source.get("grindSize") != null) {
                builder.grindSize(convertToDouble(source.get("grindSize")));
            }
            if (source.get("waterTemperature") != null) {
                builder.waterTemperature(convertToDouble(source.get("waterTemperature")));
            }
            if (source.get("coffeeAmount") != null) {
                builder.coffeeAmount(convertToDouble(source.get("coffeeAmount")));
            }
            if (source.get("waterAmount") != null) {
                builder.waterAmount(convertToDouble(source.get("waterAmount")));
            }
            if (source.get("brewMethod") != null) {
                builder.brewMethod(source.get("brewMethod").toString());
            }
            if (source.get("extractionTime") != null) {
                builder.extractionTime(convertToInteger(source.get("extractionTime")));
            }
            if (source.get("tasteScore") != null) {
                builder.tasteScore(convertToDouble(source.get("tasteScore")));
            }
            if (source.get("sournessHot") != null) {
                builder.sournessHot(convertToDouble(source.get("sournessHot")));
            }
            if (source.get("sweetnessHot") != null) {
                builder.sweetnessHot(convertToDouble(source.get("sweetnessHot")));
            }
            if (source.get("bitternessHot") != null) {
                builder.bitternessHot(convertToDouble(source.get("bitternessHot")));
            }
            if (source.get("sournessCold") != null) {
                builder.sournessCold(convertToDouble(source.get("sournessCold")));
            }
            if (source.get("sweetnessCold") != null) {
                builder.sweetnessCold(convertToDouble(source.get("sweetnessCold")));
            }
            if (source.get("bitternessCold") != null) {
                builder.bitternessCold(convertToDouble(source.get("bitternessCold")));
            }
            if (source.get("flavorNotes") != null) {
                builder.flavorNotes(source.get("flavorNotes").toString());
            }
            if (source.get("notes") != null) {
                builder.notes(source.get("notes").toString());
            }
            
            return builder.build();
        } catch (Exception e) {
            log.error("Map 변환 오류", e);
            return null;
        }
    }
    
    // 날짜 문자열을 LocalDateTime으로 변환 (여러 형식 지원)
    private LocalDateTime parseTimestamp(String timestampStr) {
        if (timestampStr == null || timestampStr.isEmpty()) {
            return LocalDateTime.now();
        }
        
        try {
            // ISO 형식: 2026-01-07T12:34:56 또는 2026-01-07T12:34:56.789
            if (timestampStr.contains("T")) {
                return LocalDateTime.parse(timestampStr.replace("Z", ""));
            }
            // 날짜만 있는 경우: 2026-01-07
            else if (timestampStr.matches("\\d{4}-\\d{2}-\\d{2}")) {
                LocalDate date = LocalDate.parse(timestampStr);
                return date.atStartOfDay();
            }
            // 밀리초 타임스탬프
            else if (timestampStr.matches("\\d+")) {
                return LocalDateTime.ofEpochSecond(Long.parseLong(timestampStr) / 1000, 0, 
                        java.time.ZoneOffset.UTC);
            }
            // 기타 형식 시도
            else {
                return LocalDateTime.parse(timestampStr, DateTimeFormatter.ISO_DATE_TIME);
            }
        } catch (Exception e) {
            log.warn("날짜 파싱 실패: {}, 현재 시간 사용", timestampStr);
            return LocalDateTime.now();
        }
    }
    
    private Double convertToDouble(Object value) {
        if (value == null) return null;
        if (value instanceof Double) return (Double) value;
        if (value instanceof Number) return ((Number) value).doubleValue();
        try {
            return Double.parseDouble(value.toString());
        } catch (Exception e) {
            return null;
        }
    }
    
    private Integer convertToInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Integer) return (Integer) value;
        if (value instanceof Number) return ((Number) value).intValue();
        try {
            return Integer.parseInt(value.toString());
        } catch (Exception e) {
            return null;
        }
    }
    

    // 필터링 및 정렬
    public Page<ExperimentSearchDocument> searchWithFilters(
            String coffeeBean, String brewMethod, String roastLevel,
            Double minScore, Double maxScore,
            LocalDateTime startDate, LocalDateTime endDate,
            String sortBy, String sortOrder,
            int page, int size) {
        
        Criteria criteria = new Criteria();
        
        if (coffeeBean != null && !coffeeBean.isEmpty()) {
            criteria = criteria.and(new Criteria("coffeeBean").contains(coffeeBean));
        }
        if (brewMethod != null && !brewMethod.isEmpty()) {
            criteria = criteria.and(new Criteria("brewMethod").is(brewMethod));
        }
        if (roastLevel != null && !roastLevel.isEmpty()) {
            criteria = criteria.and(new Criteria("roastLevel").is(roastLevel));
        }
        if (minScore != null) {
            criteria = criteria.and(new Criteria("tasteScore").greaterThanEqual(minScore));
        }
        if (maxScore != null) {
            criteria = criteria.and(new Criteria("tasteScore").lessThanEqual(maxScore));
        }
        if (startDate != null) {
            // LocalDateTime을 ISO 문자열로 변환하여 사용
            String startDateStr = startDate.format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            criteria = criteria.and(new Criteria("timestamp").greaterThanEqual(startDateStr));
        }
        if (endDate != null) {
            // LocalDateTime을 ISO 문자열로 변환하여 사용
            String endDateStr = endDate.format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            criteria = criteria.and(new Criteria("timestamp").lessThanEqual(endDateStr));
        }
        
        // 히스토리에서는 완료된 실험과 삭제된 실험 모두 포함
        // (필터링은 convertMapToDocument에서 처리)
        
        Sort.Direction direction = "asc".equalsIgnoreCase(sortOrder) ? 
                Sort.Direction.ASC : Sort.Direction.DESC;
        String sortField = sortBy != null ? sortBy : "timestamp";
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));
        
        try {
            Query searchQuery = new CriteriaQuery(criteria).setPageable(pageable);
            
            // Map으로 결과 받기 (변환 오류 방지)
            IndexCoordinates indexCoordinates = IndexCoordinates.of("coffee-experiments");
            SearchHits<Map> searchHits = elasticsearchOperations.search(searchQuery, Map.class, indexCoordinates);
            
            List<ExperimentSearchDocument> content = new ArrayList<>();
            for (SearchHit<Map> hit : searchHits.getSearchHits()) {
                try {
                    Map<String, Object> source = hit.getContent();
                    // eventType 확인
                    String eventType = source.get("eventType") != null ? source.get("eventType").toString() : null;
                    
                    // 검색/필터링에서는 삭제된 실험 제외
                    if ("EXPERIMENT_DELETED".equals(eventType)) {
                        continue;
                    }
                    
                    ExperimentSearchDocument doc = convertMapToDocument(source);
                    if (doc != null) {
                        content.add(doc);
                    }
                } catch (Exception e) {
                    log.warn("필터링 결과 변환 오류, 문서 건너뛰기: {}", e.getMessage());
                    continue;
                }
            }
            
            log.debug("📅 [SEARCH] 검색 결과: {}개", content.size());
            
            return new PageImpl<>(content, pageable, searchHits.getTotalHits());
        } catch (Exception e) {
            log.error("📅 [SEARCH] Elasticsearch 검색 오류", e);
            // 빈 결과 반환
            return new PageImpl<>(List.of(), pageable, 0);
        }
    }

    // 히스토리 - 날짜별 실험 목록 (삭제된 실험 포함)
    public Page<ExperimentSearchDocument> getExperimentsByDate(
            LocalDateTime date, int page, int size) {
        try {
            LocalDateTime startOfDay = date.withHour(0).withMinute(0).withSecond(0);
            LocalDateTime endOfDay = date.withHour(23).withMinute(59).withSecond(59);
            
            log.info("📅 [SEARCH] 날짜별 검색: {} ~ {}", startOfDay, endOfDay);
            
            Criteria criteria = new Criteria();
            // LocalDateTime을 ISO 문자열로 변환하여 사용
            String startDateStr = startOfDay.format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            String endDateStr = endOfDay.format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            criteria = criteria.and(new Criteria("timestamp").greaterThanEqual(startDateStr));
            criteria = criteria.and(new Criteria("timestamp").lessThanEqual(endDateStr));
            // 완료된 실험과 삭제된 실험 모두 포함
            criteria = criteria.and(new Criteria("eventType").in("EXPERIMENT_COMPLETED", "EXPERIMENT_DELETED"));
            
            Sort.Direction direction = Sort.Direction.DESC;
            String sortField = "timestamp";
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));
            
            Query searchQuery = new CriteriaQuery(criteria).setPageable(pageable);
            
            // Map으로 결과 받기 (변환 오류 방지)
            IndexCoordinates indexCoordinates = IndexCoordinates.of("coffee-experiments");
            SearchHits<Map> searchHits = elasticsearchOperations.search(searchQuery, Map.class, indexCoordinates);
            
            List<ExperimentSearchDocument> content = new ArrayList<>();
            for (SearchHit<Map> hit : searchHits.getSearchHits()) {
                try {
                    // 히스토리에서는 삭제된 실험도 포함
                    ExperimentSearchDocument doc = convertMapToDocument(hit.getContent());
                    if (doc != null) {
                        content.add(doc);
                    }
                } catch (Exception e) {
                    log.warn("날짜별 검색 결과 변환 오류, 문서 건너뛰기: {}", e.getMessage());
                    continue;
                }
            }
            
            return new PageImpl<>(content, pageable, searchHits.getTotalHits());
        } catch (Exception e) {
            log.error("📅 [SEARCH] 날짜별 검색 오류", e);
            return new PageImpl<>(List.of(), PageRequest.of(page, size), 0);
        }
    }

    // 히스토리 - 월별 통계 (삭제된 실험 포함)
    public List<ExperimentSearchDocument> getExperimentsByMonth(int year, int month) {
        LocalDateTime startDate = LocalDateTime.of(year, month, 1, 0, 0);
        LocalDateTime endDate = startDate.plusMonths(1).minusSeconds(1);
        
        Criteria criteria = new Criteria();
        // LocalDateTime을 ISO 문자열로 변환하여 사용
        String startDateStr = startDate.format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        String endDateStr = endDate.format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        criteria = criteria.and(new Criteria("timestamp").greaterThanEqual(startDateStr));
        criteria = criteria.and(new Criteria("timestamp").lessThanEqual(endDateStr));
        // 완료된 실험과 삭제된 실험 모두 포함
        criteria = criteria.and(new Criteria("eventType").in("EXPERIMENT_COMPLETED", "EXPERIMENT_DELETED"));
        
        Pageable pageable = PageRequest.of(0, 1000, Sort.by(Sort.Direction.DESC, "timestamp"));
        
        Query searchQuery = new CriteriaQuery(criteria).setPageable(pageable);
        
        IndexCoordinates indexCoordinates = IndexCoordinates.of("coffee-experiments");
        SearchHits<Map> searchHits = elasticsearchOperations.search(searchQuery, Map.class, indexCoordinates);
        
        List<ExperimentSearchDocument> content = new ArrayList<>();
        for (SearchHit<Map> hit : searchHits.getSearchHits()) {
            try {
                ExperimentSearchDocument doc = convertMapToDocument(hit.getContent());
                if (doc != null) {
                    content.add(doc);
                }
            } catch (Exception e) {
                log.warn("월별 검색 결과 변환 오류, 문서 건너뛰기: {}", e.getMessage());
                continue;
            }
        }
        
        return content;
    }

    // 히스토리 - 주별 통계 (삭제된 실험 포함)
    public List<ExperimentSearchDocument> getExperimentsByWeek(int year, int week) {
        LocalDateTime startDate = LocalDateTime.of(year, 1, 1, 0, 0)
                .plusWeeks(week - 1);
        LocalDateTime endDate = startDate.plusWeeks(1).minusSeconds(1);
        
        Criteria criteria = new Criteria();
        // LocalDateTime을 ISO 문자열로 변환하여 사용
        String startDateStr = startDate.format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        String endDateStr = endDate.format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        criteria = criteria.and(new Criteria("timestamp").greaterThanEqual(startDateStr));
        criteria = criteria.and(new Criteria("timestamp").lessThanEqual(endDateStr));
        // 완료된 실험과 삭제된 실험 모두 포함
        criteria = criteria.and(new Criteria("eventType").in("EXPERIMENT_COMPLETED", "EXPERIMENT_DELETED"));
        
        Pageable pageable = PageRequest.of(0, 1000, Sort.by(Sort.Direction.DESC, "timestamp"));
        
        Query searchQuery = new CriteriaQuery(criteria).setPageable(pageable);
        
        IndexCoordinates indexCoordinates = IndexCoordinates.of("coffee-experiments");
        SearchHits<Map> searchHits = elasticsearchOperations.search(searchQuery, Map.class, indexCoordinates);
        
        List<ExperimentSearchDocument> content = new ArrayList<>();
        for (SearchHit<Map> hit : searchHits.getSearchHits()) {
            try {
                ExperimentSearchDocument doc = convertMapToDocument(hit.getContent());
                if (doc != null) {
                    content.add(doc);
                }
            } catch (Exception e) {
                log.warn("주별 검색 결과 변환 오류, 문서 건너뛰기: {}", e.getMessage());
                continue;
            }
        }
        
        return content;
    }

    public Page<ExperimentSearchDocument> searchByFlavorNotes(String flavorNotes, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        return searchRepository.findByFlavorNotesContaining(flavorNotes, pageable);
    }

    public Page<ExperimentSearchDocument> searchByBrewMethod(String brewMethod, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        return searchRepository.findByBrewMethod(brewMethod, pageable);
    }

    public Page<ExperimentSearchDocument> searchByCoffeeBean(String coffeeBean, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        return searchRepository.findByCoffeeBeanContaining(coffeeBean, pageable);
    }

    public List<ExperimentSearchDocument> getTopRatedExperiments(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return searchRepository.findByTasteScoreGreaterThanEqualOrderByTasteScoreDesc(7.0, pageable);
    }

    public List<ExperimentSearchDocument> getRecentCompletedExperiments(int limit) {
        return searchRepository.findTop10ByEventTypeOrderByTimestampDesc("EXPERIMENT_COMPLETED");
    }
}

