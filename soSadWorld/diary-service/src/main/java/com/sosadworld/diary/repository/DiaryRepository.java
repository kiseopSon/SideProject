package com.sosadworld.diary.repository;

import com.sosadworld.diary.entity.Diary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiaryRepository extends JpaRepository<Diary, Long> {
    List<Diary> findByUserIdOrderByCreatedAtDesc(String userId);
}
