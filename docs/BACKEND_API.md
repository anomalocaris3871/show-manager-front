# Shop Manager Backend API 명세서

## 개요

프론트엔드에서 필요로 하는 백엔드 REST API 명세입니다.

## 기술 요구사항

- **인증**: JWT (Access Token + Refresh Token)
- **API 형식**: REST API (JSON)
- **날짜 형식**: ISO 8601 (예: `2024-01-15T09:00:00.000Z`)

---

## 1. 인증 API (Auth)

### 1.1 회원가입
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "manager@example.com",
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
      "email": "manager@example.com",
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

### 1.2 로그인
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "manager@example.com",
  "password": "password123"
}
```

**Response (200) - 인증된 사용자:**
```json
{
  "success": true,
  "data": {
    "manager": {
      "id": "mgr_123",
      "email": "manager@example.com",
      "emailVerified": true,
      "createdAt": "2024-01-15T09:00:00.000Z"
    },
    "token": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

**Response (403) - 이메일 미인증:**
```json
{
  "success": false,
  "error": "이메일 인증이 필요합니다.",
  "code": "EMAIL_NOT_VERIFIED",
  "data": {
    "email": "manager@example.com"
  }
}
```

### 1.3 로그아웃
```
POST /api/auth/logout
Authorization: Bearer {token}
```

### 1.4 비밀번호 재설정 요청
```
POST /api/auth/reset-password
```

**Request Body:**
```json
{
  "email": "manager@example.com"
}
```

### 1.5 토큰 갱신
```
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_access_token",
    "refreshToken": "new_jwt_refresh_token"
  }
}
```

### 1.6 현재 사용자 정보
```
GET /api/auth/me
Authorization: Bearer {token}
```

### 1.7 이메일 인증 확인
```
POST /api/auth/verify-email
```

**Request Body:**
```json
{
  "token": "verification_token_abc123"
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

### 1.8 인증 이메일 재발송
```
POST /api/auth/resend-verification
```

**Request Body:**
```json
{
  "email": "manager@example.com"
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

### 1.9 회원 탈퇴
```
DELETE /api/auth/account
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "회원 탈퇴가 완료되었습니다."
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "비밀번호가 일치하지 않습니다.",
  "code": "INVALID_PASSWORD"
}
```

> **Note:**
> - 탈퇴 시 연관된 모든 데이터(매장, 직원, 시프트, 출퇴근 기록) 완전 삭제 (Hard Delete)
> - 비밀번호 확인 필수
> - 탈퇴 후 동일 이메일로 재가입 가능

---

## 2. 매장 API (Store)

### 2.1 내 매장 조회
```
GET /api/stores/me
Authorization: Bearer {token}
```

### 2.2 매장 등록
```
POST /api/stores
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "카페 샵",
  "address": "서울시 강남구 역삼동 123-45"
}
```

### 2.3 매장 정보 수정
```
PUT /api/stores/{storeId}
Authorization: Bearer {token}
```

---

## 3. 스태프 API (Staff)

### 3.1 스태프 목록 조회
```
GET /api/stores/{storeId}/staff?active=true
Authorization: Bearer {token}
```

### 3.2 스태프 상세 조회
```
GET /api/staff/{staffId}
Authorization: Bearer {token}
```

### 3.3 스태프 등록
```
POST /api/stores/{storeId}/staff
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "김철수",
  "hourlyWage": 9860
}
```

### 3.4 스태프 정보 수정
```
PUT /api/staff/{staffId}
Authorization: Bearer {token}
```

### 3.5 스태프 삭제 (논리 삭제)
```
DELETE /api/staff/{staffId}
Authorization: Bearer {token}
```

### 3.6 LINE 연동 코드 재발급
```
POST /api/staff/{staffId}/regenerate-link-code
Authorization: Bearer {token}
```

### 3.7 LINE 연동 (LINE Bot에서 호출)
```
POST /api/staff/link
```

**Request Body:**
```json
{
  "linkCode": "ABC123",
  "lineUserId": "U1234567890"
}
```

---

## 4. 시프트 API (Shift)

### 4.1 시프트 목록 조회
```
GET /api/stores/{storeId}/shifts
GET /api/stores/{storeId}/shifts?startDate=2024-01-01&endDate=2024-01-31
GET /api/stores/{storeId}/shifts?staffId={staffId}
Authorization: Bearer {token}
```

### 4.2 시프트 상세 조회
```
GET /api/shifts/{shiftId}
Authorization: Bearer {token}
```

### 4.3 시프트 등록
```
POST /api/stores/{storeId}/shifts
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "staffId": "staff_123",
  "date": "2024-01-15",
  "startTime": "09:00",
  "endTime": "18:00"
}
```

### 4.4 시프트 수정
```
PUT /api/shifts/{shiftId}
Authorization: Bearer {token}
```

### 4.5 시프트 삭제
```
DELETE /api/shifts/{shiftId}
Authorization: Bearer {token}
```

---

## 5. 출퇴근 API (Attendance)

### 5.1 출퇴근 기록 목록 조회
```
GET /api/stores/{storeId}/attendance
GET /api/stores/{storeId}/attendance?startDate=2024-01-01&endDate=2024-01-31
GET /api/stores/{storeId}/attendance?staffId={staffId}
GET /api/stores/{storeId}/attendance?staffId={staffId}&date=2024-01-15
Authorization: Bearer {token}
```

### 5.2 출근 처리
```
POST /api/attendance/clock-in
```

**Request Body:**
```json
{
  "storeId": "store_123",
  "staffId": "staff_123",
  "qrToken": "qr_token_123"
}
```

### 5.3 퇴근 처리
```
POST /api/attendance/clock-out
```

**Request Body:**
```json
{
  "staffId": "staff_123",
  "qrToken": "qr_token_123"
}
```

### 5.4 출퇴근 기록 수동 수정
```
PUT /api/attendance/{attendanceId}
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "clockIn": "2024-01-15T09:00:00.000Z",
  "clockOut": "2024-01-15T18:00:00.000Z",
  "note": "시스템 오류로 인한 수정"
}
```

---

## 6. QR 토큰 API

### 6.1 QR 토큰 생성
```
POST /api/stores/{storeId}/qr-token
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "qr_abc123xyz",
    "storeId": "store_123",
    "createdAt": "2024-01-15T09:00:00.000Z",
    "expiresAt": "2024-01-15T09:05:00.000Z"
  }
}
```

### 6.2 QR 토큰 검증
```
POST /api/qr-token/verify
```

**Request Body:**
```json
{
  "token": "qr_abc123xyz"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "storeId": "store_123",
    "valid": true
  }
}
```

---

## 공통 에러 응답

```json
{
  "success": false,
  "error": "에러 메시지"
}
```

| HTTP Status | 설명 |
|-------------|------|
| 400 | 입력값 유효성 검사 실패 |
| 401 | 인증 토큰 없음 또는 만료 |
| 403 | 권한 없음 |
| 404 | 리소스를 찾을 수 없음 |
| 409 | 중복 데이터 |
| 500 | 서버 내부 오류 |

---

## 데이터베이스 스키마 제안

### managers
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- email_verified (BOOLEAN, DEFAULT FALSE)
- email_verified_at (TIMESTAMP, nullable)
- created_at (TIMESTAMP)

### email_verifications
- id (UUID, PK)
- manager_id (UUID, FK)
- token (VARCHAR, UNIQUE)
- expires_at (TIMESTAMP)
- used_at (TIMESTAMP, nullable)
- created_at (TIMESTAMP)

### stores
- id (UUID, PK)
- manager_id (UUID, FK)
- name (VARCHAR)
- address (VARCHAR)
- created_at, updated_at (TIMESTAMP)

### staff
- id (UUID, PK)
- store_id (UUID, FK)
- name (VARCHAR)
- hourly_wage (INTEGER)
- line_user_id (VARCHAR, nullable)
- link_code (VARCHAR, nullable)
- is_linked (BOOLEAN)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMP)

### shifts
- id (UUID, PK)
- store_id (UUID, FK)
- staff_id (UUID, FK)
- date (DATE)
- start_time (TIME)
- end_time (TIME)
- created_at, updated_at (TIMESTAMP)
- UNIQUE (store_id, staff_id, date)

### attendance
- id (UUID, PK)
- store_id (UUID, FK)
- staff_id (UUID, FK)
- date (DATE)
- clock_in (TIMESTAMP, nullable)
- clock_out (TIMESTAMP, nullable)
- manually_adjusted (BOOLEAN)
- adjusted_by (UUID, nullable)
- note (TEXT, nullable)
- created_at, updated_at (TIMESTAMP)

### qr_tokens
- id (UUID, PK)
- store_id (UUID, FK)
- token (VARCHAR, UNIQUE)
- expires_at (TIMESTAMP)
- created_at (TIMESTAMP)
