package com.mydressroom.service;

import com.mydressroom.dto.JobStatus;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class OutfitJob {
    String jobId;
    JobStatus status;
    String resultImageUrl;
    String errorMessage;
    Instant createdAt;
    Instant updatedAt;
}
