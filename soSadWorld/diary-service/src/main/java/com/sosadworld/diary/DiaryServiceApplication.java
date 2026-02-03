package com.sosadworld.diary;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class DiaryServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(DiaryServiceApplication.class, args);
    }
}
