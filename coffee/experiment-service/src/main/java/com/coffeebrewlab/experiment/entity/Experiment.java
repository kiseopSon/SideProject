package com.coffeebrewlab.experiment.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "experiments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Experiment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String coffeeBean;

    @Column(nullable = false)
    private String roastLevel;

    @Column(nullable = false)
    private Double grindSize;

    @Column(nullable = false)
    private Double waterTemperature;

    @Column(nullable = false)
    private Double coffeeAmount;

    @Column(nullable = false)
    private Double waterAmount;

    @Column(nullable = false)
    private String brewMethod;

    @Column(nullable = false)
    private Integer extractionTime;

    private Double tasteScore;
    
    // 뜨거울 때 맛 (1-10)
    private Double sournessHot;
    private Double sweetnessHot;
    private Double bitternessHot;
    
    // 식었을 때 맛 (1-10)
    private Double sournessCold;
    private Double sweetnessCold;
    private Double bitternessCold;
    
    @Column(length = 1000)
    private String flavorNotes;

    @Column(length = 2000)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExperimentStatus status;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum ExperimentStatus {
        IN_PROGRESS,
        COMPLETED,
        FAILED
    }
}

