package com.sosadworld.analysis.repository;

import com.sosadworld.analysis.entity.AnalysisResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnalysisResultRepository extends JpaRepository<AnalysisResult, Long> {
    
    List<AnalysisResult> findByUserIdOrderByAnalyzedAtDesc(String userId);
    
    Optional<AnalysisResult> findByDiaryIdAndUserId(Long diaryId, String userId);
    
    @Query("SELECT AVG(a.depressionPercent), AVG(a.joyPercent), AVG(a.angerPercent) " +
           "FROM AnalysisResult a WHERE a.userId = :userId")
    Object[] findAverageEmotionScoresByUserId(@Param("userId") String userId);
    
    @Query("SELECT COUNT(a) FROM AnalysisResult a WHERE a.userId = :userId AND a.needsProfessionalHelp = true")
    Long countNeedsProfessionalHelpByUserId(@Param("userId") String userId);
}
