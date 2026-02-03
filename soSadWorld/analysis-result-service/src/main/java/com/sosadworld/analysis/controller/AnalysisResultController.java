package com.sosadworld.analysis.controller;

import com.sosadworld.analysis.dto.AnalysisResultRequest;
import com.sosadworld.analysis.dto.AnalysisResultResponse;
import com.sosadworld.analysis.dto.StatisticsResponse;
import com.sosadworld.analysis.service.AnalysisResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/results")
@RequiredArgsConstructor
public class AnalysisResultController {
    
    private final AnalysisResultService analysisResultService;
    
    @PostMapping
    public ResponseEntity<AnalysisResultResponse> saveAnalysisResult(
            @RequestBody AnalysisResultRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        request.setUserId(userId);
        AnalysisResultResponse response = analysisResultService.saveAnalysisResult(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @GetMapping
    public ResponseEntity<List<AnalysisResultResponse>> getAnalysisResults(
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        List<AnalysisResultResponse> results = analysisResultService.getAnalysisResultsByUserId(userId);
        return ResponseEntity.ok(results);
    }
    
    @GetMapping("/diary/{diaryId}")
    public ResponseEntity<AnalysisResultResponse> getAnalysisResultByDiaryId(
            @PathVariable Long diaryId,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        AnalysisResultResponse response = analysisResultService.getAnalysisResultByDiaryId(diaryId, userId);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/statistics")
    public ResponseEntity<StatisticsResponse> getStatistics(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        StatisticsResponse statistics = analysisResultService.getStatisticsByUserId(userId);
        return ResponseEntity.ok(statistics);
    }
}
