package com.sosadworld.analysis;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class AnalysisResultServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AnalysisResultServiceApplication.class, args);
    }
}
