package com.coffeebrewlab.consumer.repository;

import com.coffeebrewlab.consumer.document.ExperimentDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExperimentDocumentRepository extends ElasticsearchRepository<ExperimentDocument, String> {

    Page<ExperimentDocument> findByEventTypeOrderByTimestampDesc(String eventType, Pageable pageable);

    List<ExperimentDocument> findByBrewMethod(String brewMethod);

    List<ExperimentDocument> findByCoffeeBeanContaining(String coffeeBean);
    
    List<ExperimentDocument> findByExperimentId(String experimentId);

    @Query("{\"bool\": {\"must\": [{\"match\": {\"flavorNotes\": \"?0\"}}]}}")
    List<ExperimentDocument> searchByFlavorNotes(String flavorNotes);

    Page<ExperimentDocument> findByTasteScoreGreaterThanEqual(Double score, Pageable pageable);

    List<ExperimentDocument> findTop10ByOrderByTimestampDesc();
}

