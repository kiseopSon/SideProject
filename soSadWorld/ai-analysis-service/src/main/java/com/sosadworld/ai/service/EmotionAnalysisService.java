package com.sosadworld.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sosadworld.ai.dto.AnalysisRequest;
import com.sosadworld.ai.dto.AnalysisResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmotionAnalysisService {
    
    private final OllamaClient ollamaClient;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    private static final String ANALYSIS_PROMPT_TEMPLATE = """
        다음은 사용자가 작성한 일기 내용입니다. 이 일기의 감정 상태를 분석해주세요.
        
        일기 내용:
        %s
        
        분석 요청사항:
        1. 감정 비율을 분석해주세요 (우울, 기쁨, 화남의 백분율, 합계 100%%)
        2. 현재 상황을 간단히 설명해주세요 (필수)
        3. 문제가 될 만한 행실이나 생각 패턴을 지적해주세요 (필수)
        4. 정신과 치료나 상담이 필요한 수준인지 판단해주세요
           - 단기적인 스트레스나 일시적인 감정 표현이면 false
           - 지속적인 우울감, 자해 생각, 일상생활 장애가 있으면 true
        5. 앞으로 취해야 할 태도나 행실을 구체적으로 제안해주세요 (필수)
        
        응답 형식:
        {
          "depressionPercent": 숫자,
          "joyPercent": 숫자,
          "angerPercent": 숫자,
          "currentSituation": "현재 상황 설명 (필수)",
          "problematicBehavior": "문제 행실 (필수)",
          "needsProfessionalHelp": true또는false,
          "recommendation": "추천 사항 (필수)"
        }
        
        JSON 형식으로만 응답해주세요. 모든 필드를 반드시 작성해주세요.
        """;
    
    public Mono<AnalysisResponse> analyzeEmotion(AnalysisRequest request) {
        String prompt = String.format(ANALYSIS_PROMPT_TEMPLATE, request.getDiaryContent());
        
        return ollamaClient.generateJson(prompt)
                .map(response -> parseAnalysisResponse(response, request))
                .onErrorResume(error -> {
                    log.error("감정 분석 실패", error);
                    return Mono.just(createErrorResponse(request));
                });
    }
    
    private AnalysisResponse parseAnalysisResponse(String jsonResponse, AnalysisRequest request) {
        if (jsonResponse == null || jsonResponse.trim().isEmpty()) {
            log.warn("Ollama 응답이 비어있음");
            return createErrorResponse(request);
        }
        
        try {
            // JsonNode로 먼저 파싱하여 최상위 레벨의 감정 비율을 처리
            JsonNode jsonNode = objectMapper.readTree(jsonResponse);
            AnalysisResponse response = new AnalysisResponse();
            response.setDiaryId(request.getDiaryId());
            response.setUserId(request.getUserId());
            
            // 감정 점수를 emotionScores 객체로 변환
            AnalysisResponse.EmotionScores scores = new AnalysisResponse.EmotionScores();
            if (jsonNode.has("depressionPercent")) {
                scores.setDepressionPercent(jsonNode.get("depressionPercent").decimalValue());
            } else {
                scores.setDepressionPercent(BigDecimal.ZERO);
            }
            if (jsonNode.has("joyPercent")) {
                scores.setJoyPercent(jsonNode.get("joyPercent").decimalValue());
            } else {
                scores.setJoyPercent(BigDecimal.ZERO);
            }
            if (jsonNode.has("angerPercent")) {
                scores.setAngerPercent(jsonNode.get("angerPercent").decimalValue());
            } else {
                scores.setAngerPercent(BigDecimal.ZERO);
            }
            response.setEmotionScores(scores);
            
            // 다른 필드 추출
            response.setCurrentSituation(jsonNode.has("currentSituation") ? jsonNode.get("currentSituation").asText() : "");
            response.setProblematicBehavior(jsonNode.has("problematicBehavior") ? jsonNode.get("problematicBehavior").asText() : "");
            response.setNeedsProfessionalHelp(jsonNode.has("needsProfessionalHelp") && jsonNode.get("needsProfessionalHelp").asBoolean());
            response.setRecommendation(jsonNode.has("recommendation") ? jsonNode.get("recommendation").asText() : "");
            
            return response;
        } catch (Exception e) {
            log.warn("JSON 파싱 실패, 텍스트에서 추출 시도: {}", e.getMessage());
            return parseFromText(jsonResponse, request);
        }
    }
    
    private AnalysisResponse parseFromText(String text, AnalysisRequest request) {
        AnalysisResponse response = new AnalysisResponse();
        response.setDiaryId(request.getDiaryId());
        response.setUserId(request.getUserId());
        
        AnalysisResponse.EmotionScores scores = new AnalysisResponse.EmotionScores();
        scores.setDepressionPercent(extractPercent(text, "depressionPercent"));
        if (scores.getDepressionPercent().equals(BigDecimal.ZERO)) {
            scores.setDepressionPercent(extractPercent(text, "우울"));
        }
        scores.setJoyPercent(extractPercent(text, "joyPercent"));
        if (scores.getJoyPercent().equals(BigDecimal.ZERO)) {
            scores.setJoyPercent(extractPercent(text, "기쁨"));
        }
        scores.setAngerPercent(extractPercent(text, "angerPercent"));
        if (scores.getAngerPercent().equals(BigDecimal.ZERO)) {
            scores.setAngerPercent(extractPercent(text, "화남"));
        }
        
        response.setEmotionScores(scores);
        response.setCurrentSituation(extractText(text, "currentSituation"));
        if (response.getCurrentSituation().isEmpty()) {
            response.setCurrentSituation(extractText(text, "현재 상황"));
        }
        response.setProblematicBehavior(extractText(text, "problematicBehavior"));
        if (response.getProblematicBehavior().isEmpty()) {
            response.setProblematicBehavior(extractText(text, "문제"));
        }
        
        // needsProfessionalHelp 판단 개선: JSON 필드에서 직접 추출 시도
        Pattern needsHelpPattern = Pattern.compile("\"needsProfessionalHelp\"\\s*:\\s*(true|false)", Pattern.CASE_INSENSITIVE);
        Matcher needsHelpMatcher = needsHelpPattern.matcher(text);
        if (needsHelpMatcher.find()) {
            response.setNeedsProfessionalHelp(needsHelpMatcher.group(1).equalsIgnoreCase("true"));
        } else {
            // 기본값: false (단기 스트레스일 수도 있으므로 보수적으로 판단)
            response.setNeedsProfessionalHelp(false);
        }
        
        response.setRecommendation(extractText(text, "recommendation"));
        if (response.getRecommendation().isEmpty()) {
            response.setRecommendation(extractText(text, "추천"));
        }
        if (response.getRecommendation().isEmpty()) {
            response.setRecommendation(extractText(text, "제안"));
        }
        
        return response;
    }
    
    private BigDecimal extractPercent(String text, String key) {
        Pattern pattern = Pattern.compile(key + "[\\s:]*([0-9.]+)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            try {
                return new BigDecimal(matcher.group(1)).setScale(2, RoundingMode.HALF_UP);
            } catch (Exception e) {
                log.warn("숫자 추출 실패: " + matcher.group(1), e);
            }
        }
        return BigDecimal.ZERO;
    }
    
    private String extractText(String text, String keyword) {
        // JSON 형식 먼저 시도: "keyword": "value"
        Pattern jsonPattern = Pattern.compile("\"" + Pattern.quote(keyword) + "\"\\s*:\\s*\"([^\"]+)\"", Pattern.CASE_INSENSITIVE);
        Matcher jsonMatcher = jsonPattern.matcher(text);
        if (jsonMatcher.find()) {
            return jsonMatcher.group(1).trim();
        }
        
        // 텍스트 형식 시도: keyword: value
        Pattern textPattern = Pattern.compile(keyword + "[\\s:：]*([^\\n\\r]+)", Pattern.CASE_INSENSITIVE);
        Matcher textMatcher = textPattern.matcher(text);
        if (textMatcher.find()) {
            String extracted = textMatcher.group(1).trim();
            // JSON 값이 아닌 경우 따옴표 제거
            if (extracted.startsWith("\"") && extracted.endsWith("\"")) {
                extracted = extracted.substring(1, extracted.length() - 1);
            }
            return extracted;
        }
        
        return "";
    }
    
    private AnalysisResponse createErrorResponse(AnalysisRequest request) {
        AnalysisResponse response = new AnalysisResponse();
        response.setDiaryId(request.getDiaryId());
        response.setUserId(request.getUserId());
        
        AnalysisResponse.EmotionScores scores = new AnalysisResponse.EmotionScores();
        scores.setDepressionPercent(BigDecimal.ZERO);
        scores.setJoyPercent(BigDecimal.ZERO);
        scores.setAngerPercent(BigDecimal.ZERO);
        response.setEmotionScores(scores);
        
        response.setCurrentSituation("분석 중 오류가 발생했습니다.");
        response.setNeedsProfessionalHelp(false);
        
        return response;
    }
}
