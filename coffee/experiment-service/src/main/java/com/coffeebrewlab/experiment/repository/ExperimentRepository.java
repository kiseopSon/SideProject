package com.coffeebrewlab.experiment.repository;

import com.coffeebrewlab.experiment.entity.Experiment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExperimentRepository extends JpaRepository<Experiment, String> {

    Page<Experiment> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<Experiment> findByBrewMethod(String brewMethod);

    List<Experiment> findByCoffeeBean(String coffeeBean);

    List<Experiment> findByRoastLevel(String roastLevel);

    @Query("SELECT e FROM Experiment e WHERE e.status = 'COMPLETED' ORDER BY e.tasteScore DESC")
    List<Experiment> findTopRatedExperiments(Pageable pageable);

    @Query("SELECT AVG(e.tasteScore) FROM Experiment e WHERE e.status = 'COMPLETED'")
    Double getAverageTasteScore();

    @Query("SELECT e.brewMethod, AVG(e.tasteScore) FROM Experiment e WHERE e.status = 'COMPLETED' GROUP BY e.brewMethod")
    List<Object[]> getAverageScoreByBrewMethod();

    @Query("SELECT e.coffeeBean, COUNT(e) FROM Experiment e GROUP BY e.coffeeBean")
    List<Object[]> getExperimentCountByBean();

    Long countByStatus(Experiment.ExperimentStatus status);
}

