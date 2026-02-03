# Ollama 설정 가이드

## 1. Ollama 설치

### Windows
1. https://ollama.ai/download 접속
2. Windows용 설치 파일 다운로드
3. 설치 파일 실행하여 Ollama 설치

### macOS
```bash
brew install ollama
```

### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

## 2. Ollama 실행 확인

설치 후 Ollama가 자동으로 실행됩니다. 확인 방법:

```bash
ollama list
```

정상적으로 실행 중이면 빈 목록 또는 다운로드된 모델 목록이 표시됩니다.

## 3. 모델 다운로드

감정 분석에 사용할 모델을 다운로드합니다.

### 추천 모델

#### 3.1 Llama 2 (추천)
```bash
ollama pull llama2
```
- 용량: 약 3.8GB
- 영어와 다국어 지원
- 일반적인 텍스트 생성 및 분석에 적합

#### 3.2 Mistral
```bash
ollama pull mistral
```
- 용량: 약 4.1GB
- 영어에 특화
- Llama 2보다 빠른 응답 속도

#### 3.3 한국어 지원 모델 (있는 경우)
```bash
# 예: KoGPT 등 (사용 가능한 경우)
ollama pull kogpt  # 실제 모델명은 확인 필요
```

### 모델 다운로드 확인
```bash
ollama list
```

다운로드된 모델 목록이 표시됩니다.

## 4. 모델 테스트

다운로드한 모델이 정상적으로 작동하는지 테스트:

```bash
ollama run llama2 "안녕하세요, 감정을 분석해주세요"
```

또는

```bash
ollama run mistral "Hello, analyze emotions"
```

정상적으로 응답이 오면 설정이 완료된 것입니다.

## 5. 백엔드 설정

### 5.1 application.yml 설정

`ai-analysis-service/src/main/resources/application.yml` 파일에서 모델명 확인:

```yaml
ollama:
  base-url: http://localhost:11434
  model: llama2  # 다운로드한 모델명으로 변경
```

**중요:** 다운로드한 모델명과 일치시켜야 합니다.

### 5.2 모델명 확인 방법

```bash
ollama list
```

출력 예시:
```
NAME            ID              SIZE    MODIFIED
llama2          7e...           3.8 GB  2 hours ago
mistral         ab...           4.1 GB  1 day ago
```

"NAME" 컬럼의 값이 모델명입니다.

## 6. API 테스트

### 6.1 Ollama API 직접 테스트

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama2",
  "prompt": "안녕하세요",
  "stream": false
}'
```

정상적으로 응답이 오면 Ollama가 정상 작동 중입니다.

### 6.2 백엔드 서비스 테스트

1. AI Analysis Service 실행
2. Health check:
```bash
curl http://localhost:8082/actuator/health
```

## 7. 문제 해결

### Ollama가 실행되지 않음

**Windows:**
- 작업 관리자에서 "Ollama" 프로세스 확인
- 없으면 Ollama 재시작
- 서비스 관리자에서 Ollama 서비스 상태 확인

**macOS/Linux:**
```bash
ollama serve
```

백그라운드로 실행:
```bash
nohup ollama serve > ollama.log 2>&1 &
```

### 모델 다운로드 실패

- 인터넷 연결 확인
- 디스크 공간 확인 (모델은 수 GB 크기)
- 방화벽 설정 확인

### API 연결 실패

- Ollama가 실행 중인지 확인: `ollama list`
- 포트 확인: 기본 포트는 11434
- `base-url` 설정 확인: `http://localhost:11434`

### 메모리 부족

- 큰 모델(7B, 13B)은 많은 메모리가 필요함
- 작은 모델(3B 이하) 사용 고려
- 시스템 메모리 확인

## 8. 성능 최적화

### GPU 사용 (선택사항)

Ollama는 자동으로 GPU를 사용합니다. GPU가 있으면 더 빠른 응답 속도를 얻을 수 있습니다.

### 모델 선택 가이드

- **빠른 응답이 필요한 경우:** 작은 모델 또는 Mistral
- **정확도가 중요한 경우:** Llama 2 13B 또는 더 큰 모델
- **한국어 분석이 중요한 경우:** 한국어 지원 모델 (있는 경우)

## 9. 프로덕션 환경

프로덕션 환경에서는:
- Ollama를 서비스로 등록하여 자동 시작
- 모델 캐싱 전략 수립
- API 응답 시간 모니터링
- 리소스 사용량 모니터링
