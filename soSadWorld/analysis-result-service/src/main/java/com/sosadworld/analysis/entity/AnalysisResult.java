package com.sosadworld.analysis.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "analysis_results")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisResult {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long diaryId;
    
    @Column(nullable = false)
    private String userId;
    
    // 감정 점수
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal depressionPercent;
    
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal joyPercent;
    
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal angerPercent;
    
    @Column(columnDefinition = "TEXT")
    private String currentSituation;
    
    @Column(columnDefinition = "TEXT")
    private String problematicBehavior;
    
    @Column(nullable = false)
    private Boolean needsProfessionalHelp;
    
    @Column(columnDefinition = "TEXT")
    private String recommendation;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime analyzedAt;
}
