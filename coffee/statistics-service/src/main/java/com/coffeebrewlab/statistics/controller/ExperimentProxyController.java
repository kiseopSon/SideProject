package com.coffeebrewlab.statistics.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;

/**
 * EAI Hub(9002) 경유 시 /api/experiments 요청을 Gateway(8101)로 프록시
 */
@Slf4j
@RestController
public class ExperimentProxyController {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${gateway.port:8101}")
    private int gatewayPort;

    @Value("${gateway.host:localhost}")
    private String gatewayHost;

    private String getGatewayBaseUrl() {
        return "http://" + gatewayHost + ":" + gatewayPort;
    }

    @RequestMapping(value = "/api/experiments", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS})
    public ResponseEntity<?> proxyRoot(@RequestBody(required = false) byte[] body,
                                       HttpServletRequest request,
                                       HttpMethod method) {
        return proxy("/api/experiments", body, request, method);
    }

    @RequestMapping(value = "/api/experiments/**", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
    public ResponseEntity<?> proxyPath(@RequestBody(required = false) byte[] body,
                                      HttpServletRequest request,
                                      HttpMethod method) {
        String path = request.getRequestURI();
        return proxy(path, body, request, method);
    }

    private ResponseEntity<?> proxy(String path, byte[] body, HttpServletRequest request, HttpMethod method) {
        String query = request.getQueryString() != null ? "?" + request.getQueryString() : "";
        String url = getGatewayBaseUrl() + path + query;

        HttpHeaders headers = new HttpHeaders();
        request.getHeaderNames().asIterator().forEachRemaining(name -> {
            if (!name.equalsIgnoreCase("host") && !name.equalsIgnoreCase("content-length")) {
                headers.addAll(name, Collections.list(request.getHeaders(name)));
            }
        });

        HttpEntity<byte[]> entity = new HttpEntity<>(body != null ? body : new byte[0], headers);
        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(url, method, entity, byte[].class);
            HttpHeaders responseHeaders = new HttpHeaders();
            response.getHeaders().forEach((key, values) -> {
                if (!key.equalsIgnoreCase("transfer-encoding")) {
                    responseHeaders.addAll(key, values);
                }
            });
            return new ResponseEntity<>(response.getBody(), responseHeaders, response.getStatusCode());
        } catch (Exception e) {
            log.warn("Experiment proxy 오류: {} -> {}", url, e.getMessage());
            throw e;
        }
    }
}
