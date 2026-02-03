package com.mydressroom.service;

import com.mydressroom.config.StorageProperties;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
public class StorageService {

    private final Path uploadDir;
    private final Path outputDir;

    public StorageService(StorageProperties props) {
        this.uploadDir = Path.of(props.uploadDir());
        this.outputDir = Path.of(props.outputDir());
        initDirs();
    }

    private void initDirs() {
        try {
            Files.createDirectories(uploadDir);
            Files.createDirectories(outputDir);
        } catch (IOException e) {
            throw new IllegalStateException("저장 디렉터리 생성 실패", e);
        }
    }

    public Path saveUpload(String subdir, String filename, MultipartFile file) throws IOException {
        Path dir = uploadDir.resolve(subdir);
        Files.createDirectories(dir);
        String safeName = filename != null && !filename.isBlank()
            ? sanitize(filename)
            : UUID.randomUUID() + extensionOf(file.getOriginalFilename());
        Path target = dir.resolve(safeName);
        file.transferTo(target.toFile());
        return target;
    }

    public Path saveOutput(String jobId, byte[] imageBytes, String extension) throws IOException {
        Path out = outputDir.resolve(jobId + (extension != null ? extension : ".png"));
        Files.write(out, imageBytes);
        return out;
    }

    public Path outputPath(String jobId) {
        return outputDir.resolve(jobId + ".png");
    }

    public boolean outputExists(String jobId) {
        return Files.exists(outputPath(jobId));
    }

    public Path uploadPath(String subdir, String filename) {
        return uploadDir.resolve(subdir).resolve(filename);
    }

    private static String sanitize(String name) {
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private static String extensionOf(String originalFilename) {
        if (originalFilename == null || !originalFilename.contains(".")) return ".bin";
        return originalFilename.substring(originalFilename.lastIndexOf('.'));
    }
}
