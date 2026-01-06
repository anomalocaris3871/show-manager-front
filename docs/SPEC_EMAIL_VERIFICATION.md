# 이메일 확인 기능 스펙

## 개요

회원가입 시 이메일 인증을 통해 실제 소유한 이메일인지 확인하는 기능.

**구현 방식:** 링크 클릭 방식 (옵션 A)
**이메일 서비스:** Gmail SMTP (Nodemailer)

---

## 1. 사용자 흐름 (User Flow)

### 회원가입 흐름
```
1. 사용자가 이메일/비밀번호 입력 후 "회원가입" 클릭
2. 서버에서 인증 이메일 발송 (Gmail SMTP)
3. 프론트엔드에서 "이메일 확인" 안내 화면으로 이동 (/email-pending)
4. 사용자가 이메일 확인 후 인증 링크 클릭
5. 인증 완료 화면 표시 (/verify-email?token=xxx)
6. 로그인 페이지로 이동
```

### 이메일 미인증 로그인 시도 흐름
```
1. 사용자가 미인증 상태로 로그인 시도
2. 서버에서 EMAIL_NOT_VERIFIED 에러 반환
3. 프론트엔드에서 이메일 확인 안내 화면으로 이동
4. 인증 이메일 재발송 가능
```

---

## 2. 데이터베이스 스키마

### managers 테이블 수정
```sql
ALTER TABLE managers ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE managers ADD COLUMN email_verified_at TIMESTAMP NULL;
```

### email_verifications 테이블 (신규)
```sql
CREATE TABLE email_verifications (
  id UUID PRIMARY KEY,
  manager_id UUID REFERENCES managers(id),
  token VARCHAR(100) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_verifications_token ON email_verifications(token);
CREATE INDEX idx_email_verifications_manager_id ON email_verifications(manager_id);
```

---

## 3. Backend API

### 3.1 회원가입 API
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "manager": {
      "id": "mgr_123",
      "email": "user@example.com",
      "emailVerified": false,
      "createdAt": "2024-01-15T09:00:00.000Z"
    },
    "message": "인증 이메일이 발송되었습니다.",
    "expiresAt": "2024-01-15T09:05:00.000Z"
  }
}
```

> **Note:**
> - 회원가입 시 토큰을 발급하지 않음. 이메일 인증 완료 후 로그인해야 함.
> - `expiresAt`: 인증 링크 만료 시간 (5분 후). 프론트엔드에서 카운트다운 표시에 사용.

### 3.2 이메일 인증 확인 API
```
POST /api/auth/verify-email
```

**Request Body:**
```json
{
  "token": "abc123xyz..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "이메일 인증이 완료되었습니다."
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "인증 링크가 만료되었습니다.",
  "code": "TOKEN_EXPIRED"
}
```

### 3.3 인증 이메일 재발송 API
```
POST /api/auth/resend-verification
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "인증 이메일이 재발송되었습니다.",
    "expiresAt": "2024-01-15T09:05:00.000Z"
  }
}
```

> **Note:** `expiresAt`: 새 인증 링크 만료 시간 (5분 후)

**Rate Limit:** 1분에 1회

### 3.4 로그인 API (이메일 미인증 시)
```
POST /api/auth/login
```

**이메일 미인증 시 Response (403):**
```json
{
  "success": false,
  "error": "이메일 인증이 필요합니다.",
  "code": "EMAIL_NOT_VERIFIED",
  "data": {
    "email": "user@example.com"
  }
}
```

---

## 4. Frontend 구현

### 4.1 생성된 화면

#### EmailPendingView.vue
- **경로:** `src/views/auth/EmailPendingView.vue`
- **라우트:** `/email-pending?email=user@example.com&expiresAt=2024-01-15T09:05:00.000Z`
- **기능:**
  - 이메일 확인 안내 메시지 표시
  - **5분 카운트다운 타이머** (MM:SS 형식)
  - 프로그레스 바로 남은 시간 시각화
  - 만료 시 "인증 링크가 만료되었습니다" 메시지 표시
  - 60초 쿨다운 후 이메일 재발송 버튼
  - 스팸 폴더 확인 등 도움말 표시

```
┌─────────────────────────────────┐
│                                 │
│         ✉️ 이메일을 확인하세요   │
│                                 │
│  user@example.com               │
│  위 주소로 인증 이메일을 보냈습니다. │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 이메일이 오지 않나요?    │   │
│  │ • 스팸 폴더 확인         │   │
│  │ • 이메일 주소 확인       │   │
│  │ • 몇 분 정도 기다려주세요 │   │
│  └─────────────────────────┘   │
│                                 │
│  [ 인증 이메일 다시 보내기 ]     │
│  [ 로그인 페이지로 돌아가기 ]    │
│                                 │
└─────────────────────────────────┘
```

#### EmailVerificationView.vue
- **경로:** `src/views/auth/EmailVerificationView.vue`
- **라우트:** `/verify-email?token=abc123xyz`
- **기능:**
  - 토큰으로 이메일 인증 API 호출
  - 로딩/성공/실패 상태 표시
  - 성공 시 로그인 페이지로 이동 버튼

```
성공 시:
┌─────────────────────────────────┐
│                                 │
│         ✅ 인증 완료!           │
│                                 │
│  이메일 인증이 완료되었습니다.  │
│                                 │
│       [ 로그인하기 ]            │
│                                 │
└─────────────────────────────────┘

실패 시:
┌─────────────────────────────────┐
│                                 │
│         ❌ 인증 실패            │
│                                 │
│  인증 링크가 만료되었습니다.    │
│                                 │
│    [ 다시 회원가입하기 ]        │
│    [ 로그인 페이지로 ]          │
│                                 │
└─────────────────────────────────┘
```

### 4.2 라우터 설정
```typescript
// src/router/index.ts
{
  path: '/email-pending',
  name: 'email-pending',
  component: () => import('@/views/auth/EmailPendingView.vue'),
  meta: { requiresAuth: false },
},
{
  path: '/verify-email',
  name: 'verify-email',
  component: () => import('@/views/auth/EmailVerificationView.vue'),
  meta: { requiresAuth: false },
}
```

### 4.3 서비스 구현
```typescript
// src/services/authService.ts

// 이메일 인증 확인
async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
  return api.post<{ message: string }>('/auth/verify-email', { token }, { skipAuth: true });
}

// 인증 이메일 재발송
async resendVerification(email: string): Promise<ApiResponse<{ message: string }>> {
  return api.post<{ message: string }>('/auth/resend-verification', { email }, { skipAuth: true });
}
```

### 4.4 스토어 변경
```typescript
// src/stores/auth.ts

// errorCode 상태 추가
const errorCode = ref<string | null>(null);

// register: 토큰 저장하지 않음 (이메일 인증 필요)
async function register(form: RegisterForm) {
  const result = await authService.register(form);
  if (result.success) {
    return true; // 토큰 저장 안함
  }
  errorCode.value = result.code || null;
  return false;
}

// login: errorCode 설정
async function login(form: LoginForm) {
  const result = await authService.login(form);
  if (!result.success) {
    errorCode.value = result.code || null;
  }
  return result.success;
}
```

### 4.5 회원가입 흐름
```typescript
// src/views/auth/RegisterView.vue
async function handleSubmit() {
  const success = await authStore.register(form.value);
  if (success) {
    toast.success('인증 이메일이 발송되었습니다.');
    router.push({
      name: 'email-pending',
      query: { email: form.value.email }
    });
  }
}
```

### 4.6 로그인 흐름
```typescript
// src/views/auth/LoginView.vue
async function handleSubmit() {
  const success = await authStore.login(form.value);
  if (success) {
    router.push('/');
  } else if (authStore.errorCode === 'EMAIL_NOT_VERIFIED') {
    toast.warning('이메일 인증이 필요합니다.');
    router.push({
      name: 'email-pending',
      query: { email: form.value.email }
    });
  } else if (authStore.error) {
    toast.error(authStore.error);
  }
}
```

---

## 5. 이메일 템플릿

### 인증 이메일
```
제목: [Shop Manager] 이메일 주소를 확인해주세요

안녕하세요,

Shop Manager 회원가입을 환영합니다!
아래 버튼을 클릭하여 이메일 주소를 확인해주세요.

[이메일 인증하기]
https://your-domain.com/verify-email?token=abc123xyz

이 링크는 5분 동안 유효합니다.

본인이 요청하지 않은 경우 이 이메일을 무시해주세요.

감사합니다.
Shop Manager 팀
```

---

## 6. 보안 고려사항

### 토큰 보안
- 토큰: 최소 32자 랜덤 문자열 (URL-safe)
- 만료 시간: **5분**
- 1회 사용 후 무효화

### Rate Limiting
- 이메일 발송: 1분에 1회, 1시간에 5회
- 인증 시도: 5회 실패 시 10분 대기

### 기타
- 이메일 존재 여부 노출 방지 (재발송 시 항상 성공 응답)
- HTTPS 필수
- 토큰은 DB에 해시하여 저장 (권장)

---

## 7. 구현 상태

### 완료됨 (Frontend)
- [x] 이메일 인증 대기 화면 (`EmailPendingView.vue`)
- [x] 이메일 인증 완료 화면 (`EmailVerificationView.vue`)
- [x] 라우터 설정 (`/email-pending`, `/verify-email`)
- [x] authService API 메서드 (`verifyEmail`, `resendVerification`)
- [x] 회원가입 흐름 수정 (이메일 대기 페이지로 이동, `expiresAt` 전달)
- [x] 로그인 흐름 수정 (`EMAIL_NOT_VERIFIED` 처리)
- [x] 이메일 재발송 기능 (60초 쿨다운)
- [x] auth store `errorCode` 상태 추가
- [x] **5분 카운트다운 타이머** (프로그레스 바 포함)
- [x] 만료 시 알림 UI 표시

### Backend 구현 필요
- [ ] 이메일 인증 API (`POST /api/auth/verify-email`)
- [ ] 인증 이메일 재발송 API (`POST /api/auth/resend-verification`)
- [ ] 회원가입 시 인증 이메일 발송 + `expiresAt` 반환
- [ ] 이메일 재발송 시 `expiresAt` 반환
- [ ] 로그인 시 `EMAIL_NOT_VERIFIED` 에러 반환
- [ ] Gmail SMTP 설정 (Nodemailer)
- [ ] 토큰 만료 시간 5분 설정
- [ ] Rate limiting

---

## 8. Gmail SMTP 설정 (Backend)

### 환경 변수
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Shop Manager <your-email@gmail.com>"
```

### Gmail 앱 비밀번호 생성
1. Google 계정 → 보안 → 2단계 인증 활성화
2. 앱 비밀번호 생성 (메일 용도)
3. 생성된 16자리 비밀번호를 `SMTP_PASS`에 설정

### 일일 발송 한도
- Gmail SMTP: 500통/일 (개인 계정)
- Google Workspace: 2,000통/일
