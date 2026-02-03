package com.mydressroom.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties({ StorageProperties.class, InferenceProperties.class })
public class AppConfig {

    @Bean
    public RestClient inferenceRestClient(InferenceProperties props) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(java.time.Duration.ofMillis(props.connectTimeoutMs()));
        factory.setReadTimeout(java.time.Duration.ofMillis(props.readTimeoutMs()));

        return RestClient.builder()
            .baseUrl(props.baseUrl())
            .requestFactory(factory)
            .build();
    }
}
