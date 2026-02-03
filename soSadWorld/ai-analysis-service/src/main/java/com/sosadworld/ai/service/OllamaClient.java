package com.sosadworld.ai.service;

import com.sosadworld.ai.dto.OllamaRequest;
import com.sosadworld.ai.dto.OllamaResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Slf4j
@Service
public class OllamaClient {
    
    private final WebClient webClient;
    private final String baseUrl;
    private final String model;
    
    public OllamaClient(
            @Value("${ollama.base-url:http://localhost:11434}") String baseUrl,
            @Value("${ollama.model:llama2}") String model) {
        this.baseUrl = baseUrl;
        this.model = model;
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .build();
    }
    
    public Mono<String> generate(String prompt) {
        OllamaRequest request = new OllamaRequest();
        request.setModel(model);
        request.setPrompt(prompt);
        request.setStream(false);
        
        return webClient.post()
                .uri("/api/generate")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(OllamaResponse.class)
                .map(OllamaResponse::getResponse)
                .doOnError(error -> log.error("Ollama API 호출 실패", error))
                .onErrorResume(error -> Mono.just(""));
    }
    
    public Mono<String> generateJson(String prompt) {
        OllamaRequest request = new OllamaRequest();
        request.setModel(model);
        request.setPrompt(prompt);
        request.setStream(false);
        request.setFormat("json");
        
        return webClient.post()
                .uri("/api/generate")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(OllamaResponse.class)
                .map(OllamaResponse::getResponse)
                .doOnError(error -> log.error("Ollama API 호출 실패", error))
                .onErrorResume(error -> Mono.just(""));
    }
}
