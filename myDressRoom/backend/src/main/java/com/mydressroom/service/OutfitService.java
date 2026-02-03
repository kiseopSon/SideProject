package com.mydressroom.service;

import com.mydressroom.dto.JobResponse;
import com.mydressroom.dto.JobStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OutfitService {

    private final StorageService storage;
    private final InferenceClient inference;
    private final Map<String, OutfitJob> jobs = new ConcurrentHashMap<>();
    private final String serverContextPath;

    public OutfitService(
        StorageService storage,
        InferenceClient inference,
        @Value("${server.servlet.context-path:}") String serverContextPath
    ) {
        this.storage = storage;
        this.inference = inference;
        this.serverContextPath = serverContextPath.isEmpty() ? "" : serverContextPath;
    }

    public String submit(MultipartFile personImage, List<MultipartFile> garmentImages) throws IOException {
        String jobId = UUID.randomUUID().toString();
        Instant now = Instant.now();
        jobs.put(jobId, OutfitJob.builder()
            .jobId(jobId)
            .status(JobStatus.PENDING)
            .createdAt(now)
            .updatedAt(now)
            .build());

        Path personPath = storage.saveUpload(jobId, "person.jpg", personImage);
        for (int i = 0; i < garmentImages.size(); i++) {
            storage.saveUpload(jobId, "garment_" + i + ".jpg", garmentImages.get(i));
        }

        runAsync(jobId, personPath, garmentImages.size());
        return jobId;
    }

    @Async("outfitTaskExecutor")
    public void runAsync(String jobId, Path personPath, int garmentCount) {
        setStatus(jobId, JobStatus.RUNNING, null, null);
        try {
            List<Path> garmentPaths = new java.util.ArrayList<>();
            for (int i = 0; i < garmentCount; i++) {
                Path p = storage.uploadPath(jobId, "garment_" + i + ".jpg");
                if (Files.exists(p)) garmentPaths.add(p);
            }
            byte[] imageBytes = inference.generate(personPath, garmentPaths);
            String ext = ".png";
            storage.saveOutput(jobId, imageBytes, ext);
            String url = serverContextPath + "/api/output/" + jobId + ".png";
            setStatus(jobId, JobStatus.COMPLETED, url, null);
        } catch (Exception e) {
            setStatus(jobId, JobStatus.FAILED, null, e.getMessage());
        }
    }

    private void setStatus(String jobId, JobStatus status, String resultUrl, String error) {
        OutfitJob prev = jobs.get(jobId);
        if (prev == null) return;
        jobs.put(jobId, OutfitJob.builder()
            .jobId(jobId)
            .status(status)
            .resultImageUrl(resultUrl)
            .errorMessage(error)
            .createdAt(prev.getCreatedAt())
            .updatedAt(Instant.now())
            .build());
    }

    public JobResponse getJob(String jobId) {
        OutfitJob job = jobs.get(jobId);
        if (job == null) return null;
        return new JobResponse(
            job.getJobId(),
            job.getStatus(),
            job.getResultImageUrl(),
            job.getErrorMessage()
        );
    }
}
