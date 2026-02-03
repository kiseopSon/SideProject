package com.sosadworld.diary.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DiaryRequest {
    @NotBlank(message = "일기 내용은 필수입니다")
    @Size(max = 10000, message = "일기 내용은 10000자 이하여야 합니다")
    private String content;
}
