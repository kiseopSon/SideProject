# 배포 스크립트 (Blue-Green / Rolling)

**Docker 빌드는 반드시 프로젝트 루트에서 실행하세요.**  
`Dockerfile`과 `Dockerfile.worker`는 루트(`ci_cd_test/`)에 있습니다.

## Blue-Green 배포 (로컬)

```powershell
# 1) 프로젝트 루트로 이동
cd C:\Users\icaru\git\SideProject\ci_cd_test

# 2) 이미지 빌드 (루트에서!)
docker build -t ecommerce-mvp:v2 .
docker build -f Dockerfile.worker -t ecommerce-mvp-worker:v2 .

# 3) deploy 폴더로 이동 후 배포
cd deploy
$env:IMAGE = "ecommerce-mvp:v2"
$env:IMAGE_WORKER = "ecommerce-mvp-worker:v2"
.\deploy.ps1 green v2
```

## 최초 기동 (아직 한 번도 안 띄웠다면)

```powershell
# 루트에서
cd C:\Users\icaru\git\SideProject\ci_cd_test
.\scripts\practice-bluegreen.ps1 init
```
