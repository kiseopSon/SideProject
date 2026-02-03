package com.mydressroom.controller;

import com.mydressroom.dto.JobResponse;
import com.mydressroom.service.OutfitService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class OutfitController {

    private final OutfitService outfitService;

    public OutfitController(OutfitService outfitService) {
        this.outfitService = outfitService;
    }

    /**
     * 사람 이미지 1장 + 의류 이미지 여러 장을 받아 가상 피팅 작업을 생성합니다.
     * person: 증명사진/전신 사진
     * garments: 셔츠, 바지, 신발 등 (여러 장)
     */
    @PostMapping(value = "/outfit/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> create(
        @RequestParam("person") MultipartFile person,
        @RequestParam("garments") List<MultipartFile> garments
    ) throws IOException {
        if (person.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "person 이미지가 필요합니다."));
        }
        if (garments == null || garments.stream().allMatch(MultipartFile::isEmpty)) {
            return ResponseEntity.badRequest().body(Map.of("error", "의류 이미지가 1장 이상 필요합니다."));
        }
        List<MultipartFile> nonEmpty = garments.stream().filter(f -> !f.isEmpty()).toList();
        String jobId = outfitService.submit(person, nonEmpty);
        return ResponseEntity.accepted().body(Map.of("jobId", jobId));
    }

    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<JobResponse> getJob(@PathVariable String jobId) {
        JobResponse job = outfitService.getJob(jobId);
        if (job == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(job);
    }
}
