package com.mydressroom.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record JobResponse(
    String jobId,
    JobStatus status,
    String resultImageUrl,
    String errorMessage
) {}
