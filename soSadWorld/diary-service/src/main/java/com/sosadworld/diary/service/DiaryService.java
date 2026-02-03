package com.sosadworld.diary.service;

import com.sosadworld.diary.dto.DiaryRequest;
import com.sosadworld.diary.dto.DiaryResponse;
import com.sosadworld.diary.entity.Diary;
import com.sosadworld.diary.repository.DiaryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiaryService {
    
    private final DiaryRepository diaryRepository;
    
    // 특수문자 제거 (한글, 영문, 숫자, 공백, 줄바꿈만 허용)
    private String sanitizeContent(String content) {
        if (content == null) {
            return "";
        }
        return content.replaceAll("[^가-힣a-zA-Z0-9\\s\\n]", "");
    }
    
    @Transactional
    public DiaryResponse createDiary(String userId, DiaryRequest request) {
        String sanitizedContent = sanitizeContent(request.getContent());
        
        Diary diary = Diary.builder()
                .userId(userId)
                .content(sanitizedContent)
                .build();
        
        Diary saved = diaryRepository.save(diary);
        return toResponse(saved);
    }
    
    @Transactional(readOnly = true)
    public List<DiaryResponse> getDiariesByUserId(String userId) {
        return diaryRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public DiaryResponse getDiaryById(Long id, String userId) {
        Diary diary = diaryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("일기를 찾을 수 없습니다"));
        
        if (!diary.getUserId().equals(userId)) {
            throw new RuntimeException("접근 권한이 없습니다");
        }
        
        return toResponse(diary);
    }
    
    private DiaryResponse toResponse(Diary diary) {
        DiaryResponse response = new DiaryResponse();
        response.setId(diary.getId());
        response.setUserId(diary.getUserId());
        response.setContent(diary.getContent());
        response.setCreatedAt(diary.getCreatedAt());
        response.setUpdatedAt(diary.getUpdatedAt());
        return response;
    }
}
