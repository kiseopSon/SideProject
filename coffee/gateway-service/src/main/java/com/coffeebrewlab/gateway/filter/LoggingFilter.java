package com.coffeebrewlab.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Slf4j
@Component
public class LoggingFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String requestId = java.util.UUID.randomUUID().toString().substring(0, 8);
        
        log.info("☕ [GATEWAY] [{}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", requestId);
        log.info("☕ [GATEWAY] [{}] → {} {}", requestId, request.getMethod(), request.getURI().getPath());
        log.info("☕ [GATEWAY] [{}] → From: {}", requestId, request.getRemoteAddress());
        log.info("☕ [GATEWAY] [{}] → Content-Type: {}", requestId, 
                request.getHeaders().getFirst(HttpHeaders.CONTENT_TYPE));
        
        long startTime = System.currentTimeMillis();
        
        return chain.filter(exchange)
                .then(Mono.fromRunnable(() -> {
                    ServerHttpResponse response = exchange.getResponse();
                    long duration = System.currentTimeMillis() - startTime;
                    log.info("☕ [GATEWAY] [{}] ← Status: {} | Duration: {}ms", 
                            requestId, response.getStatusCode(), duration);
                    log.info("☕ [GATEWAY] [{}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", requestId);
                }));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}

