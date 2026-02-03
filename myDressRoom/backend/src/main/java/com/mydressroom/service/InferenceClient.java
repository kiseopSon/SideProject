package com.mydressroom.service;

import com.mydressroom.config.InferenceProperties;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.util.MimeTypeUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

@Component
public class InferenceClient {

    private final RestClient restClient;
    private final String generatePath;

    public InferenceClient(RestClient inferenceRestClient, InferenceProperties props) {
        this.restClient = inferenceRestClient;
        this.generatePath = props.generatePath();
    }

    /**
     * 인퍼런스 서비스에 사람 이미지 + 의류 이미지들을 전송하고, 합성된 이미지 바이트를 받습니다.
     */
    public byte[] generate(Path personImagePath, List<Path> garmentPaths) throws IOException {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("person", new FileSystemResource(personImagePath))
            .contentType(MediaType.parseMediaType(MimeTypeUtils.IMAGE_JPEG_VALUE));
        for (int i = 0; i < garmentPaths.size(); i++) {
            builder.part("garments", new FileSystemResource(garmentPaths.get(i)))
                .contentType(MediaType.APPLICATION_OCTET_STREAM);
        }

        return restClient.post()
            .uri(generatePath)
            .contentType(MediaType.MULTIPART_FORM_DATA)
            .body(builder.build())
            .retrieve()
            .body(byte[].class);
    }
}
