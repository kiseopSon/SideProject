package com.sosadworld.ai.controller;

import com.sosadworld.ai.dto.AnalysisRequest;
import com.sosadworld.ai.dto.AnalysisResponse;
import com.sosadworld.ai.service.EmotionAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/analysis")
@RequiredArgsConstructor
public class AnalysisController {
    
    private final EmotionAnalysisService emotionAnalysisService;
    
    @PostMapping
    public Mono<AnalysisResponse> analyzeDiary(
            @RequestBody AnalysisRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        
        // JWT에서 사용자 ID 추출
        String userId = jwt.getSubject();
        request.setUserId(userId);
        
        return emotionAnalysisService.analyzeEmotion(request);
    }
    
    @GetMapping("/health")
    public String health() {
        return "OK";
    }
}
