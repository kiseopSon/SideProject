package com.mydressroom.controller;

import com.mydressroom.config.StorageProperties;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Files;
import java.nio.file.Path;

@RestController
@RequestMapping("/api/output")
public class OutputController {

    private final Path outputDir;

    public OutputController(StorageProperties props) {
        this.outputDir = Path.of(props.outputDir());
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> serve(@PathVariable String filename) {
        Path base = outputDir.normalize().toAbsolutePath();
        Path path = base.resolve(filename).normalize().toAbsolutePath();
        if (!Files.exists(path) || !path.startsWith(base)) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new PathResource(path);
        String contentType = filename.endsWith(".png") ? "image/png" : "application/octet-stream";
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
            .body(resource);
    }
}
