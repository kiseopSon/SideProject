# 배포 자동화 & 무중단 배포 가이드

## 1. 개념 정리

### GitHub Actions + Docker CI/CD
- **CI (Continuous Integration)**: 코드 push 시 자동으로 빌드·테스트
- **CD (Continuous Deployment)**: 빌드된 이미지를 레지스트리에 푸시하고, 서버에 자동 배포
- **Docker 이미지**: 앱을 컨테이너로 패키징 → 어디서든 동일하게 실행

### 무중단 배포 (Zero-Downtime Deployment)
서비스 중단 없이 새 버전으로 교체하는 방식

| 전략 | 설명 | 장점 |
|------|------|------|
| **Blue-Green** | Blue(현재)·Green(새 버전) 2개를 띄워두고, 트래픽만 전환 | 롤백이 빠름, 구조가 단순 |
| **Rolling Update** | 여러 복제본을 순차적으로 하나씩 교체 | 리소스 절약, 점진적 배포 |

---

## 2. 로컬에서 연습하기 (클라우드 없이)

### Step 1: Blue-Green 배포 연습

```powershell
# 1) 프로젝트 루트에서 이미지 빌드
docker build -t ecommerce-mvp:latest .
docker build -f Dockerfile.worker -t ecommerce-mvp-worker:latest .

# 2) deploy 폴더로 이동
cd deploy

# 3) 초기 nginx 설정 (Blue 활성)
copy nginx-blue.conf nginx.conf

# 4) Blue-Green 환경 기동
$env:IMAGE = "ecommerce-mvp:latest"
$env:IMAGE_WORKER = "ecommerce-mvp-worker:latest"
docker compose -f docker-compose.deploy.yml up -d

# 5) http://localhost:80 접속 → 앱 동작 확인

# 6) 코드 수정 후 새 이미지 빌드 (반드시 프로젝트 루트에서!)
cd ..   # ci_cd_test 루트로
docker build -t ecommerce-mvp:v2 .
docker build -f Dockerfile.worker -t ecommerce-mvp-worker:v2 .

# 7) deploy 폴더로 이동 후 Green에 새 버전 배포
cd deploy
$env:IMAGE = "ecommerce-mvp:v2"
$env:IMAGE_WORKER = "ecommerce-mvp-worker:v2"
.\deploy.ps1 green v2

# 8) http://localhost:80 새로고침 → v2 적용 확인 (중단 없이 전환됨)
```

### Step 2: Rolling Update 연습

```powershell
cd deploy
$env:IMAGE = "ecommerce-mvp:latest"
$env:IMAGE_WORKER = "ecommerce-mvp-worker:latest"

# 앱 2개 복제본으로 기동
docker compose -f docker-compose.rolling.yml up -d --scale app=2

# 새 버전 배포: 이미지 업데이트 후 컨테이너 재생성 (하나씩 교체됨)
$env:IMAGE = "ecommerce-mvp:v2"
docker compose -f docker-compose.rolling.yml up -d --scale app=2
```

---

## 3. GitHub Actions CI/CD 연습

### 3-1. GitHub에 저장소 push

```powershell
git add .
git commit -m "Add deploy setup"
git remote add origin https://github.com/YOUR_USERNAME/ci_cd_test.git
git branch -M main
git push -u origin main
```

### 3-2. 자동 동작 확인

- `main` 또는 `master`에 push → GitHub Actions가 자동 실행
- **Actions** 탭에서 빌드 로그 확인
- **Packages**에서 `ci_cd_test-app`, `ci_cd_test-worker` 이미지 확인

### 3-3. 푸시되는 이미지 주소

- `ghcr.io/YOUR_USERNAME/ci_cd_test-app:latest`
- `ghcr.io/YOUR_USERNAME/ci_cd_test-worker:latest`

---

## 4. 실제 서버에 배포하기 (무료 VPS)

### 4-1. Oracle Cloud Free Tier (추천)

1. [Oracle Cloud](https://www.oracle.com/cloud/free/) 가입
2. Always Free VM 1대 생성 (Ubuntu)
3. SSH 키 등록 후 접속

### 4-2. 서버 초기 설정

```bash
# 서버에 SSH 접속 후
sudo apt update && sudo apt install -y docker.io docker-compose-v2 git
sudo usermod -aG docker $USER
# 로그아웃 후 재접속
```

### 4-3. 프로젝트 클론 & 배포

```bash
git clone https://github.com/YOUR_USERNAME/ci_cd_test.git
cd ci_cd_test/deploy
```

`deploy/.env` 파일 생성:

```env
IMAGE=ghcr.io/YOUR_USERNAME/ci_cd_test-app:latest
IMAGE_WORKER=ghcr.io/YOUR_USERNAME/ci_cd_test-worker:latest
```

GHCR은 기본이 private이므로, 서버에서 로그인 필요:

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

### 4-4. GitHub Actions에서 자동 배포

저장소 **Settings → Secrets and variables → Actions**에 다음 시크릿 추가:

| 시크릿 | 설명 |
|--------|------|
| `DEPLOY_HOST` | 서버 IP (예: 123.45.67.89) |
| `DEPLOY_USER` | SSH 사용자명 (예: ubuntu) |
| `DEPLOY_SSH_KEY` | 서버 SSH 개인키 전체 내용 |
| `GITHUB_TOKEN` | 배포용 PAT (Packages 읽기 권한) |

`.github/workflows/ci-cd.yml`의 deploy job 주석 해제 후, deploy script 경로와 이미지 주소를 저장소에 맞게 수정.

---

## 5. 학습 순서 요약

| 단계 | 내용 | 예상 시간 |
|------|------|-----------|
| 1 | 로컬에서 Blue-Green 전환 직접 실행 | 30분 |
| 2 | GitHub에 push → Actions에서 빌드 확인 | 15분 |
| 3 | Oracle Cloud VM 생성 및 SSH 접속 | 30분 |
| 4 | 서버에서 수동 배포 (이미지 pull → compose up) | 20분 |
| 5 | GitHub Actions + SSH로 자동 배포 연동 | 30분 |

---

## 6. 추가 학습 자료

- **GitHub Actions**: [공식 문서](https://docs.github.com/actions)
- **Docker Compose**: [공식 문서](https://docs.docker.com/compose/)
- **Blue-Green 배포**: Martin Fowler – [BlueGreenDeployment](https://martinfowler.com/bliki/BlueGreenDeployment.html)
- **Oracle Cloud Free**: [Always Free 체크리스트](https://docs.oracle.com/en-us/iaas/Content/FreeTier/resourceref.htm)
