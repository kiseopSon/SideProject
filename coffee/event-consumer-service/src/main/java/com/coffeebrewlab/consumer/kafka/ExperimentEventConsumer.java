package com.coffeebrewlab.consumer.kafka;

import com.coffeebrewlab.common.event.ExperimentEvent;
import com.coffeebrewlab.consumer.service.EventProcessingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExperimentEventConsumer {

    private final EventProcessingService eventProcessingService;

    @KafkaListener(
            topics = "${kafka.topic.experiment-events}",
            groupId = "${spring.kafka.consumer.group-id}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consumeExperimentEvent(
            @Payload ExperimentEvent event,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset,
            Acknowledgment acknowledgment) {

        log.info("📥 [KAFKA-CONSUMER] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log.info("📥 [KAFKA-CONSUMER] 이벤트 수신");
        log.info("📥 [KAFKA-CONSUMER] → Event ID: {}", event.getEventId());
        log.info("📥 [KAFKA-CONSUMER] → Type: {}", event.getEventType());
        log.info("📥 [KAFKA-CONSUMER] → Partition: {} | Offset: {}", partition, offset);
        log.info("📥 [KAFKA-CONSUMER] → 원두: {} | 추출법: {}", event.getCoffeeBean(), event.getBrewMethod());

        try {
            eventProcessingService.processEvent(event);
            acknowledgment.acknowledge();
            log.info("📥 [KAFKA-CONSUMER] ✅ 이벤트 처리 완료: {}", event.getEventId());
            log.info("📥 [KAFKA-CONSUMER] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        } catch (Exception e) {
            log.error("📥 [KAFKA-CONSUMER] ❌ 이벤트 처리 실패: {}", event.getEventId(), e);
        }
    }
}

