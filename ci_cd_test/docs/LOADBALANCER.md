# 로드밸런서 (Nginx) 설정 상세

## 1. 설정 파일 구조

```
deploy/
├── nginx.conf        ← 실제 사용 중인 설정 (blue/green 중 하나 복사됨)
├── nginx-blue.conf   ← Blue 활성용
└── nginx-green.conf  ← Green 활성용
```

배포 시 `deploy.ps1`이 `nginx-blue.conf` 또는 `nginx-green.conf`를 `nginx.conf`로 복사한 뒤 nginx를 재시작합니다.

---

## 2. nginx-blue.conf 상세 (Blue 활성 시)

```nginx
events { worker_connections 1024; }    # 동시 연결 1024개

http {
    # Docker 내부 DNS (컨테이너명 app_blue, app_green 해석)
    resolver 127.0.0.11 valid=10s;

    # 액세스 로그: 요청이 어느 백엔드로 갔는지 표시
    log_format with_upstream '$remote_addr - [$time_local] "$request" '
                             '-> $upstream_addr ($upstream_response_time)';

    # 업스트림 그룹 (로드밸런서 대상)
    upstream app_backend {
        server app_blue:3000 weight=1 max_fails=3 fail_timeout=30s;  # 활성
        server app_green:3000 backup;                                 # 대기
    }

    server {
        listen 80;                                                    # 포트 80
        access_log /var/log/nginx/access.log with_upstream;

        location / {
            proxy_pass http://app_backend;        # app_backend로 전달
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        location /health {
            proxy_pass http://app_backend;
            proxy_set_header Host $host;
        }
    }
}
```

---

## 3. 설정 항목 설명

| 항목 | 값 | 설명 |
|------|-----|------|
| `resolver` | 127.0.0.11 | Docker 내부 DNS. `app_blue`, `app_green` 호스트명 해석 |
| `upstream app_backend` | - | 트래픽을 받을 백엔드 그룹 |
| `server app_blue:3000` | weight=1, max_fails=3 | **활성** 서버. 비율 1, 3회 연속 실패 시 30초 동안 비활성 |
| `server app_green:3000` | backup | **백업** 서버. Blue가 다운되면 자동 전환 |
| `proxy_pass` | http://app_backend | 들어온 요청을 app_backend로 전달 |

### Blue vs Green 설정 차이

| 설정 파일 | 활성 (weight=1) | 대기 (backup) |
|----------|----------------|---------------|
| nginx-blue.conf | app_blue | app_green |
| nginx-green.conf | app_green | app_blue |

---

## 4. 트래픽 흐름

```
사용자 (http://localhost:80)
        │
        ▼
┌───────────────────┐
│  Nginx (포트 80)   │
│  deploy-nginx-1   │
└─────────┬─────────┘
          │ proxy_pass http://app_backend
          │
          ▼
┌───────────────────┐
│ upstream          │
│ app_backend       │
│  - app_blue (활성) │  ← weight=1, 트래픽 수신
│  - app_green(백업) │  ← backup, 대기
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ app_blue:3000     │  ← 실제 요청 처리
│ 또는 app_green    │
└───────────────────┘
```

---

## 5. 트래픽 확인 방법

### A. Nginx 액세스 로그 (업스트림 정보 포함)

```powershell
cd C:\Users\icaru\git\SideProject\ci_cd_test\deploy
docker compose -f docker-compose.deploy.yml exec nginx tail -f /var/log/nginx/access.log
```

다른 터미널에서 요청:

```powershell
curl http://localhost:80/health
curl http://localhost:80/api/products
```

로그 예시:
```
172.21.0.1 - [01/Feb/2026:12:00:00 +0000] "GET /health HTTP/1.1" -> 172.21.0.3:3000 (0.002)
172.21.0.1 - [01/Feb/2026:12:00:01 +0000] "GET /api/products HTTP/1.1" -> 172.21.0.3:3000 (0.005)
```

`-> 172.21.0.x:3000` 부분이 **실제로 요청을 처리한 백엔드**입니다.

### B. Nginx 로그 (한 줄씩 실시간)

```powershell
docker compose -f docker-compose.deploy.yml logs -f nginx
```

### C. app_blue / app_green 로그

```powershell
# Blue 컨테이너 로그
docker compose -f docker-compose.deploy.yml logs -f app_blue

# Green 컨테이너 로그
docker compose -f docker-compose.deploy.yml logs -f app_green
```

Blue가 활성이면 Blue 로그에만 요청이 찍힙니다.

### D. 반복 요청 + 로그 확인

```powershell
# 터미널 1: 로그 실시간 확인
docker compose -f docker-compose.deploy.yml exec nginx tail -f /var/log/nginx/access.log

# 터미널 2: 요청 반복
1..20 | ForEach-Object { curl -s http://localhost:80/health | Out-Null; Start-Sleep -Milliseconds 500 }
```

### E. 응답 헤더로 백엔드 확인 (선택)

앱에서 `X-Backend: blue` 또는 `X-Backend: green` 헤더를 추가하면, 응답 헤더로 어느 인스턴스가 응답했는지 바로 확인할 수 있습니다.
