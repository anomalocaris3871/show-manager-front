# AWS 배포 가이드 - Shop Manager

## 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud                                │
│                                                                  │
│  ┌──────────────┐     ┌──────────────────────────────────────┐  │
│  │  CloudFront  │     │           EC2 Instance               │  │
│  │    (CDN)     │     │  ┌────────────────────────────────┐  │  │
│  │      ↓       │     │  │      Docker Compose            │  │  │
│  │   S3 Bucket  │     │  │  ┌─────┐ ┌─────┐ ┌─────────┐   │  │  │
│  │  (Frontend)  │     │  │  │Nginx│ │ App │ │MySQL/RDS│   │  │  │
│  └──────────────┘     │  │  └─────┘ └─────┘ └─────────┘   │  │  │
│         ↘             │  └────────────────────────────────┘  │  │
│           ─── API 통신 ──→                                   │  │
│                       └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

| 구성 요소 | AWS 서비스 | 용도 |
|-----------|------------|------|
| 프론트엔드 | S3 + CloudFront | Vue.js 정적 파일 호스팅 |
| 백엔드 | EC2 + Docker | Laravel API 서버 |
| 데이터베이스 | RDS (또는 EC2 내 MySQL) | 데이터 저장 |
| 도메인 | Route 53 | DNS 관리 |

---

## Part 1: 프론트엔드 배포 (S3 + CloudFront)

### Step 1.1: S3 버킷 생성

1. AWS Console → S3 → **버킷 만들기**
2. 설정:
   - 버킷 이름: `shop-manager-frontend`
   - 리전: `ap-northeast-1` (도쿄) 또는 `ap-northeast-2` (서울)
   - **퍼블릭 액세스 차단**: 모두 체크 해제 (CloudFront에서 접근해야 함)
3. 버킷 생성 후 → **속성** → **정적 웹 사이트 호스팅** 활성화
   - 인덱스 문서: `index.html`
   - 오류 문서: `index.html` (SPA 라우팅용)

### Step 1.2: 버킷 정책 설정

버킷 → 권한 → 버킷 정책:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::shop-manager-frontend/*"
    }
  ]
}
```

### Step 1.3: Vue 빌드 및 업로드

```bash
# 프론트엔드 디렉토리에서
cd /Users/dong3871/WebstormProjects/shop-manager

# 프로덕션 빌드
npm run build

# AWS CLI로 S3에 업로드
aws s3 sync dist/ s3://shop-manager-frontend --delete
```

### Step 1.4: CloudFront 배포 (선택사항, 권장)

1. AWS Console → CloudFront → **배포 생성**
2. 설정:
   - 원본 도메인: S3 버킷 선택
   - 기본 캐시 동작: HTTPS로 리다이렉트
   - 대체 도메인 이름(CNAME): `shop.yourdomain.com` (선택)
3. **오류 페이지** 설정 (SPA용):
   - HTTP 403 → `/index.html` (200 반환)
   - HTTP 404 → `/index.html` (200 반환)

---

## Part 2: 백엔드 배포 (EC2 + Docker)

### Step 2.1: EC2 인스턴스 생성

1. AWS Console → EC2 → **인스턴스 시작**
2. 설정:
   - AMI: **Amazon Linux 2023** 또는 **Ubuntu 22.04**
   - 인스턴스 유형: `t3.small` (시작용, 나중에 스케일 가능)
   - 키 페어: 새로 생성 또는 기존 선택 (SSH 접속용)
3. 네트워크 설정:
   - VPC: 기본 VPC
   - 서브넷: 퍼블릭 서브넷
   - 퍼블릭 IP 자동 할당: 활성화
4. 보안 그룹:
   - SSH (22) - 내 IP에서만
   - HTTP (80) - Anywhere
   - HTTPS (443) - Anywhere

### Step 2.2: EC2에 Docker 설치

```bash
# SSH로 EC2 접속
ssh -i your-key.pem ec2-user@your-ec2-ip

# Docker 설치 (Amazon Linux 2023)
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 로그아웃 후 재접속 (그룹 적용)
exit
ssh -i your-key.pem ec2-user@your-ec2-ip
```

### Step 2.3: 프로젝트 배포

```bash
# 프로젝트 클론
git clone https://github.com/your-username/shop-manager.git
cd shop-manager

# 환경 변수 설정
cp api/.env.example api/.env
nano api/.env  # 프로덕션 설정으로 수정

# Docker Compose 실행
docker-compose up -d

# 상태 확인
docker-compose ps
```

### Step 2.4: .env 파일 주요 설정

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.com

DB_CONNECTION=mysql
DB_HOST=db  # docker-compose 내부 호스트명
DB_DATABASE=shop_manager
DB_USERNAME=shop_user
DB_PASSWORD=secure_password_here

# 프론트엔드 URL (CORS용)
FRONTEND_URL=https://shop.yourdomain.com
```

---

## Part 3: 도메인 연결 (Route 53)

### Step 3.1: 호스팅 영역 생성

1. AWS Console → Route 53 → **호스팅 영역 생성**
2. 도메인 이름 입력: `yourdomain.com`
3. 도메인 등록 업체에서 Route 53 네임서버로 변경

### Step 3.2: 레코드 생성

| 호스트 | 타입 | 대상 |
|--------|------|------|
| `shop.yourdomain.com` | A (Alias) | CloudFront 배포 |
| `api.yourdomain.com` | A | EC2 Elastic IP |

---

## Part 4: HTTPS 설정

### 프론트엔드 (CloudFront)
- AWS Certificate Manager(ACM)에서 인증서 발급
- CloudFront 배포에 인증서 연결

### 백엔드 (EC2)
```bash
# Certbot 설치 (Let's Encrypt)
sudo yum install -y certbot python3-certbot-nginx

# 인증서 발급
sudo certbot --nginx -d api.yourdomain.com
```

---

## 배포 자동화 (선택사항)

### GitHub Actions 예시

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1
      - run: aws s3 sync dist/ s3://shop-manager-frontend --delete

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to EC2
        uses: appleboy/ssh-action@v0.1.10
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ec2-user
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd shop-manager
            git pull
            docker-compose down
            docker-compose up -d --build
```

---

## 예상 비용 (월간)

| 서비스 | 사양 | 예상 비용 |
|--------|------|-----------|
| EC2 | t3.small | ~$15-20 |
| RDS | db.t3.micro | ~$15 (또는 EC2 내 MySQL 사용 시 $0) |
| S3 | 1GB 미만 | ~$0.02 |
| CloudFront | 10GB 전송 | ~$1 |
| Route 53 | 1개 도메인 | ~$0.50 |
| **합계** | | **~$15-35/월** |

> **TIP**: 처음에는 RDS 대신 EC2 내 Docker MySQL을 사용하면 비용을 절약할 수 있습니다.
