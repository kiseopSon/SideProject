package com.coffeebrewlab.experiment.kafka;

import com.coffeebrewlab.common.event.ExperimentEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExperimentEventProducer {

    private final KafkaTemplate<String, ExperimentEvent> kafkaTemplate;

    @Value("${kafka.topic.experiment-events}")
    private String topicName;

    public void sendEvent(ExperimentEvent event) {
        CompletableFuture<SendResult<String, ExperimentEvent>> future = 
                kafkaTemplate.send(topicName, event.getExperimentId(), event);

        future.whenComplete((result, ex) -> {
            if (ex == null) {
                log.info("📤 [KAFKA-PRODUCER] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                log.info("📤 [KAFKA-PRODUCER] 이벤트 전송 성공");
                log.info("📤 [KAFKA-PRODUCER] → Event ID: {}", event.getEventId());
                log.info("📤 [KAFKA-PRODUCER] → Type: {}", event.getEventType());
                log.info("📤 [KAFKA-PRODUCER] → Topic: {} | Partition: {} | Offset: {}", 
                        topicName, result.getRecordMetadata().partition(), result.getRecordMetadata().offset());
                log.info("📤 [KAFKA-PRODUCER] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            } else {
                log.error("📤 [KAFKA-PRODUCER] ❌ 이벤트 전송 실패: {}", event.getEventId(), ex);
            }
        });
    }
}

