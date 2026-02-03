package com.coffeebrewlab.gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                // Experiment Service 라우팅
                .route("experiment-service", r -> r
                        .path("/api/experiments/**")
                        .uri("lb://experiment-service"))
                
                // Statistics Service 라우팅
                .route("statistics-service", r -> r
                        .path("/api/statistics/**")
                        .uri("lb://statistics-service"))
                
                // Dashboard 라우팅
                .route("dashboard", r -> r
                        .path("/dashboard")
                        .uri("lb://statistics-service"))
                
                // Experiment Form 라우팅
                .route("experiment-form", r -> r
                        .path("/experiment-form")
                        .uri("lb://statistics-service"))
                
                // Complete Form 라우팅
                .route("complete-form", r -> r
                        .path("/complete-form")
                        .uri("lb://statistics-service"))
                
                // Search Page 라우팅
                .route("search-page", r -> r
                        .path("/search-page")
                        .uri("lb://statistics-service"))
                
                // History Page 라우팅
                .route("history-page", r -> r
                        .path("/history-page")
                        .uri("lb://statistics-service"))
                
                // 기본 경로를 experiment-form으로 리다이렉트
                .route("root", r -> r
                        .path("/")
                        .uri("lb://statistics-service"))
                
                .build();
    }
}

