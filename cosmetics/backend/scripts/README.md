# 성분 데이터베이스 업데이트 스크립트

## 사용법

### 1. 알 수 없는 성분들 자동 업데이트
```bash
python scripts/update_ingredients.py --missing
```

### 2. 특정 성분 업데이트
```bash
python scripts/update_ingredients.py --ingredients "라즈베리추출물" "딸기추출물"
```

### 3. 여러 성분 한번에 업데이트
```bash
python scripts/update_ingredients.py -i 성분1 성분2 성분3
```

### 4. 요청 간 지연 시간 설정 (서버 부하 방지)
```bash
python scripts/update_ingredients.py --missing --delay 2.0
```

## API를 통한 업데이트

### 관리자 API 사용

1. **특정 성분 추가**
```bash
POST http://localhost:8500/api/admin/ingredient/add
{
  "name": "라즈베리추출물",
  "effect": "추출물",
  "purpose": "항산화 효과",
  "warning": null
}
```

2. **여러 성분 크롤링**
```bash
POST http://localhost:8500/api/admin/scrape
{
  "ingredient_names": ["라즈베리추출물", "딸기추출물"],
  "delay": 1.0
}
```

3. **알 수 없는 성분 자동 크롤링**
```bash
POST http://localhost:8500/api/admin/scrape/missing
```

## 주기적 자동 업데이트

스케줄러를 실행하여 주기적으로 자동 업데이트:

```bash
python -m app.services.scheduler
```

또는 백그라운드에서 실행:
```bash
nohup python -m app.services.scheduler &
```

