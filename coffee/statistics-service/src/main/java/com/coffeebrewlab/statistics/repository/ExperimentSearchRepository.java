package com.coffeebrewlab.statistics.repository;

import com.coffeebrewlab.statistics.document.ExperimentSearchDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExperimentSearchRepository extends ElasticsearchRepository<ExperimentSearchDocument, String> {

    Page<ExperimentSearchDocument> findByFlavorNotesContaining(String flavorNotes, Pageable pageable);

    Page<ExperimentSearchDocument> findByBrewMethod(String brewMethod, Pageable pageable);

    Page<ExperimentSearchDocument> findByCoffeeBeanContaining(String coffeeBean, Pageable pageable);

    List<ExperimentSearchDocument> findByTasteScoreGreaterThanEqualOrderByTasteScoreDesc(Double score, Pageable pageable);

    List<ExperimentSearchDocument> findTop10ByEventTypeOrderByTimestampDesc(String eventType);
}

