package com.coffeebrewlab.consumer.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.time.LocalDateTime;

@Document(indexName = "coffee-experiments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExperimentDocument {

    @Id
    private String id;

    @Field(type = FieldType.Keyword)
    private String experimentId;

    @Field(type = FieldType.Keyword)
    private String eventType;

    @Field(type = FieldType.Date)
    private LocalDateTime timestamp;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String coffeeBean;

    @Field(type = FieldType.Keyword)
    private String roastLevel;

    @Field(type = FieldType.Double)
    private Double grindSize;

    @Field(type = FieldType.Double)
    private Double waterTemperature;

    @Field(type = FieldType.Double)
    private Double coffeeAmount;

    @Field(type = FieldType.Double)
    private Double waterAmount;

    @Field(type = FieldType.Keyword)
    private String brewMethod;

    @Field(type = FieldType.Integer)
    private Integer extractionTime;

    @Field(type = FieldType.Double)
    private Double tasteScore;
    
    // 뜨거울 때 맛 (1-10)
    @Field(type = FieldType.Double)
    private Double sournessHot;
    
    @Field(type = FieldType.Double)
    private Double sweetnessHot;
    
    @Field(type = FieldType.Double)
    private Double bitternessHot;
    
    // 식었을 때 맛 (1-10)
    @Field(type = FieldType.Double)
    private Double sournessCold;
    
    @Field(type = FieldType.Double)
    private Double sweetnessCold;
    
    @Field(type = FieldType.Double)
    private Double bitternessCold;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String flavorNotes;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String notes;
}

