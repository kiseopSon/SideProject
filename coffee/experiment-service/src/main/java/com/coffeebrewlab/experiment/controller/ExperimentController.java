package com.coffeebrewlab.experiment.controller;

import com.coffeebrewlab.common.dto.ExperimentCompleteDto;
import com.coffeebrewlab.common.dto.ExperimentDto;
import com.coffeebrewlab.experiment.service.ExperimentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/experiments")
@RequiredArgsConstructor
public class ExperimentController {

    private final ExperimentService experimentService;

    @PostMapping
    public ResponseEntity<ExperimentDto> createExperiment(@Valid @RequestBody ExperimentDto dto) {
        ExperimentDto created = experimentService.createExperiment(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExperimentDto> getExperiment(@PathVariable String id) {
        return ResponseEntity.ok(experimentService.getExperiment(id));
    }

    @GetMapping
    public ResponseEntity<Page<ExperimentDto>> getRecentExperiments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(experimentService.getRecentExperiments(page, size));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<ExperimentDto> completeExperiment(
            @PathVariable String id,
            @Valid @RequestBody ExperimentCompleteDto dto) {
        return ResponseEntity.ok(experimentService.completeExperiment(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExperiment(@PathVariable String id) {
        experimentService.deleteExperiment(id);
        return ResponseEntity.noContent().build();
    }
}

