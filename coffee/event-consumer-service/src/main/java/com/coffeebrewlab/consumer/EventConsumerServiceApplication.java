package com.coffeebrewlab.consumer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class EventConsumerServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(EventConsumerServiceApplication.class, args);
    }
}

