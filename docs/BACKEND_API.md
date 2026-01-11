# Shop Manager Backend API 명세서

## 개요

이 문서는 Shop Manager 프론트엔드에서 필요로 하는 백엔드 API 명세입니다.
현재 프론트엔드는 localStorage를 사용한 목업 구현이며, 실제 백엔드 연동 시 `src/services/` 디렉토리의 서비스 파일들만 수정하면 됩니다.

## 기술 스택 권장사항

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
      "createdAt": "2024-01-15T09:00:00.000Z"
    },
    "token": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "이미 등록된 이메일입니다."
}
```

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

**Response (200):**
```json
{
  "success": true,
  "data": {
    "manager": {
      "id": "mgr_123",
      "email": "manager@example.com",
      "createdAt": "2024-01-15T09:00:00.000Z"
    },
    "token": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

### 1.3 로그아웃
```
POST /api/auth/logout
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true
}
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

**Response (200):**
```json
{
  "success": true
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

### 1.6 계정 삭제
```
DELETE /api/auth/me
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
    "message": "계정이 성공적으로 삭제되었습니다."
  }
}
```

**Error Response (400) - 비밀번호 불일치:**
```json
{
  "success": false,
  "error": "비밀번호가 일치하지 않습니다.",
  "code": "INVALID_PASSWORD"
}
```

> **주의**: 계정 삭제 시 매장, 직원, 시프트, 출퇴근 기록 등 모든 관련 데이터가 함께 삭제됩니다.

---

## 2. 매장 API (Store)

> 모든 매장 API는 인증 필요: `Authorization: Bearer {token}`

### 2.1 내 매장 조회
```
GET /api/stores/me
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "store_123",
    "managerId": "mgr_123",
    "name": "카페 샵",
    "address": "서울시 강남구 역삼동 123-45",
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-15T09:00:00.000Z"
  }
}
```

**Response (매장 미등록 시):**
```json
{
  "success": true,
  "data": null
}
```

### 2.2 매장 등록
```
POST /api/stores
```

**Request Body:**
```json
{
  "name": "카페 샵",
  "address": "서울시 강남구 역삼동 123-45"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "store_123",
    "managerId": "mgr_123",
    "name": "카페 샵",
    "address": "서울시 강남구 역삼동 123-45",
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-15T09:00:00.000Z"
  }
}
```

### 2.3 매장 정보 수정
```
PUT /api/stores/{storeId}
```

**Request Body:**
```json
{
  "name": "카페 샵 (수정)",
  "address": "서울시 강남구 삼성동 456-78"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "store_123",
    "managerId": "mgr_123",
    "name": "카페 샵 (수정)",
    "address": "서울시 강남구 삼성동 456-78",
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-16T10:00:00.000Z"
  }
}
```

---

## 3. 스태프 API (Staff)

> 모든 스태프 API는 인증 필요: `Authorization: Bearer {token}`

### 3.1 스태프 목록 조회
```
GET /api/stores/{storeId}/staff
```

**Query Parameters:**
- `active` (optional): `true` | `false` - 활성 스태프만 조회 (기본값: true)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "staff_123",
      "storeId": "store_123",
      "name": "김철수",
      "hourlyWage": 9860,
      "lineUserId": "U1234567890",
      "isLinked": true,
      "isActive": true,
      "createdAt": "2024-01-15T09:00:00.000Z",
      "updatedAt": "2024-01-15T09:00:00.000Z"
    },
    {
      "id": "staff_456",
      "storeId": "store_123",
      "name": "박영희",
      "hourlyWage": 10000,
      "isLinked": false,
      "isActive": true,
      "createdAt": "2024-01-16T09:00:00.000Z",
      "updatedAt": "2024-01-16T09:00:00.000Z"
    }
  ]
}
```

### 3.2 스태프 상세 조회
```
GET /api/staff/{staffId}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "staff_123",
    "storeId": "store_123",
    "name": "김철수",
    "hourlyWage": 9860,
    "lineUserId": "U1234567890",
    "isLinked": true,
    "isActive": true,
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-15T09:00:00.000Z"
  }
}
```

### 3.3 스태프 등록
```
POST /api/stores/{storeId}/staff
```

**Request Body:**
```json
{
  "name": "김철수",
  "hourlyWage": 9860
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "staff_123",
    "storeId": "store_123",
    "name": "김철수",
    "hourlyWage": 9860,
    "isLinked": false,
    "isActive": true,
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-15T09:00:00.000Z"
  }
}
```

### 3.4 스태프 정보 수정
```
PUT /api/staff/{staffId}
```

**Request Body:**
```json
{
  "name": "김철수",
  "hourlyWage": 10000
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "staff_123",
    "storeId": "store_123",
    "name": "김철수",
    "hourlyWage": 10000,
    "isLinked": true,
    "isActive": true,
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-16T10:00:00.000Z"
  }
}
```

### 3.5 스태프 삭제 (논리 삭제)
```
DELETE /api/staff/{staffId}
```

**Response (200):**
```json
{
  "success": true
}
```

---

## 4. 시프트 API (Shift)

> 모든 시프트 API는 인증 필요: `Authorization: Bearer {token}`

### 4.1 시프트 목록 조회
```
GET /api/stores/{storeId}/shifts
```

**Query Parameters:**
- `startDate` (optional): `YYYY-MM-DD` - 시작일
- `endDate` (optional): `YYYY-MM-DD` - 종료일
- `staffId` (optional): 특정 스태프의 시프트만 조회

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "shift_123",
      "storeId": "store_123",
      "staffId": "staff_123",
      "date": "2024-01-15",
      "startTime": "09:00",
      "endTime": "18:00",
      "createdAt": "2024-01-14T09:00:00.000Z",
      "updatedAt": "2024-01-14T09:00:00.000Z"
    }
  ]
}
```

### 4.2 시프트 상세 조회
```
GET /api/shifts/{shiftId}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "shift_123",
    "storeId": "store_123",
    "staffId": "staff_123",
    "date": "2024-01-15",
    "startTime": "09:00",
    "endTime": "18:00",
    "createdAt": "2024-01-14T09:00:00.000Z",
    "updatedAt": "2024-01-14T09:00:00.000Z"
  }
}
```

### 4.3 시프트 등록
```
POST /api/stores/{storeId}/shifts
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

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "shift_123",
    "storeId": "store_123",
    "staffId": "staff_123",
    "date": "2024-01-15",
    "startTime": "09:00",
    "endTime": "18:00",
    "createdAt": "2024-01-14T09:00:00.000Z",
    "updatedAt": "2024-01-14T09:00:00.000Z"
  }
}
```

**Error Response (중복 시프트):**
```json
{
  "success": false,
  "error": "해당 스태프는 이미 이 날짜에 시프트가 있습니다."
}
```

### 4.4 시프트 수정
```
PUT /api/shifts/{shiftId}
```

**Request Body:**
```json
{
  "staffId": "staff_123",
  "date": "2024-01-15",
  "startTime": "10:00",
  "endTime": "19:00"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "shift_123",
    "storeId": "store_123",
    "staffId": "staff_123",
    "date": "2024-01-15",
    "startTime": "10:00",
    "endTime": "19:00",
    "createdAt": "2024-01-14T09:00:00.000Z",
    "updatedAt": "2024-01-15T08:00:00.000Z"
  }
}
```

### 4.5 시프트 삭제
```
DELETE /api/shifts/{shiftId}
```

**Response (200):**
```json
{
  "success": true
}
```

---

## 5. 출퇴근 API (Attendance)

### 5.1 출퇴근 기록 목록 조회 (점장용)
```
GET /api/stores/{storeId}/attendance
Authorization: Bearer {token}
```

**Query Parameters:**
- `startDate` (optional): `YYYY-MM-DD`
- `endDate` (optional): `YYYY-MM-DD`
- `staffId` (optional): 특정 스태프 필터

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "att_123",
      "storeId": "store_123",
      "staffId": "staff_123",
      "date": "2024-01-15",
      "clockIn": "2024-01-15T09:05:00.000Z",
      "clockOut": "2024-01-15T18:10:00.000Z",
      "manuallyAdjusted": false,
      "createdAt": "2024-01-15T09:05:00.000Z",
      "updatedAt": "2024-01-15T18:10:00.000Z"
    }
  ]
}
```

### 5.2 출근 처리 (QR 스캔 / LINE Bot)
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

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "att_123",
    "storeId": "store_123",
    "staffId": "staff_123",
    "date": "2024-01-15",
    "clockIn": "2024-01-15T09:05:00.000Z",
    "manuallyAdjusted": false,
    "createdAt": "2024-01-15T09:05:00.000Z",
    "updatedAt": "2024-01-15T09:05:00.000Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "이미 오늘 출근 기록이 있습니다."
}
```

### 5.3 퇴근 처리 (QR 스캔 / LINE Bot)
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

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "att_123",
    "storeId": "store_123",
    "staffId": "staff_123",
    "date": "2024-01-15",
    "clockIn": "2024-01-15T09:05:00.000Z",
    "clockOut": "2024-01-15T18:10:00.000Z",
    "manuallyAdjusted": false,
    "createdAt": "2024-01-15T09:05:00.000Z",
    "updatedAt": "2024-01-15T18:10:00.000Z"
  }
}
```

### 5.4 출퇴근 기록 수동 수정 (점장용)
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

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "att_123",
    "storeId": "store_123",
    "staffId": "staff_123",
    "date": "2024-01-15",
    "clockIn": "2024-01-15T09:00:00.000Z",
    "clockOut": "2024-01-15T18:00:00.000Z",
    "manuallyAdjusted": true,
    "adjustedBy": "mgr_123",
    "note": "시스템 오류로 인한 수정",
    "createdAt": "2024-01-15T09:05:00.000Z",
    "updatedAt": "2024-01-16T10:00:00.000Z"
  }
}
```

---

## 6. QR 토큰 API

### 6.1 QR 토큰 생성/갱신
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

### 6.2 QR 토큰 검증 (출퇴근 시 사용)
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

## 7. 대시보드 API

### 7.1 대시보드 통계 조회
```
GET /api/stores/{storeId}/dashboard
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "todayWorkers": [
      {
        "staffId": "staff_123",
        "staffName": "김철수",
        "shiftStart": "09:00",
        "shiftEnd": "18:00",
        "clockIn": "2024-01-15T09:05:00.000Z",
        "clockOut": null
      }
    ],
    "recentClockIns": [
      {
        "staffId": "staff_123",
        "staffName": "김철수",
        "clockIn": "2024-01-15T09:05:00.000Z",
        "type": "clockIn"
      }
    ],
    "totalStaff": 5,
    "linkedStaff": 3
  }
}
```

---

## 에러 코드

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | 입력값 유효성 검사 실패 |
| 401 | `UNAUTHORIZED` | 인증 토큰 없음 또는 만료 |
| 403 | `FORBIDDEN` | 권한 없음 (다른 매장 데이터 접근 등) |
| 404 | `NOT_FOUND` | 리소스를 찾을 수 없음 |
| 409 | `CONFLICT` | 중복 데이터 (이메일, 시프트 등) |
| 500 | `INTERNAL_ERROR` | 서버 내부 오류 |

## 공통 에러 응답 형식

```json
{
  "success": false,
  "error": "에러 메시지",
  "code": "ERROR_CODE"
}
```

---

## 데이터베이스 스키마 제안

### managers
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| email | VARCHAR(255) | Unique, 이메일 |
| password_hash | VARCHAR(255) | 암호화된 비밀번호 |
| created_at | TIMESTAMP | 생성일시 |

### stores
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| manager_id | UUID | FK -> managers.id |
| name | VARCHAR(100) | 매장명 |
| address | VARCHAR(255) | 주소 |
| created_at | TIMESTAMP | 생성일시 |
| updated_at | TIMESTAMP | 수정일시 |

### staff
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| store_id | UUID | FK -> stores.id |
| name | VARCHAR(50) | 이름 |
| hourly_wage | INTEGER | 시급 |
| line_user_id | VARCHAR(50) | LINE User ID (nullable) |
| is_linked | BOOLEAN | LINE 연동 여부 |
| is_active | BOOLEAN | 활성 상태 |
| created_at | TIMESTAMP | 생성일시 |
| updated_at | TIMESTAMP | 수정일시 |

### shifts
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| store_id | UUID | FK -> stores.id |
| staff_id | UUID | FK -> staff.id |
| date | DATE | 근무일 |
| start_time | TIME | 시작 시간 |
| end_time | TIME | 종료 시간 |
| created_at | TIMESTAMP | 생성일시 |
| updated_at | TIMESTAMP | 수정일시 |

**Unique Constraint:** (store_id, staff_id, date)

### attendance
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| store_id | UUID | FK -> stores.id |
| staff_id | UUID | FK -> staff.id |
| date | DATE | 근무일 |
| clock_in | TIMESTAMP | 출근 시간 (nullable) |
| clock_out | TIMESTAMP | 퇴근 시간 (nullable) |
| manually_adjusted | BOOLEAN | 수동 수정 여부 |
| adjusted_by | UUID | 수정한 점장 ID (nullable) |
| note | TEXT | 수정 사유 (nullable) |
| created_at | TIMESTAMP | 생성일시 |
| updated_at | TIMESTAMP | 수정일시 |

### qr_tokens
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| store_id | UUID | FK -> stores.id |
| token | VARCHAR(100) | Unique, QR 토큰 |
| expires_at | TIMESTAMP | 만료 시간 |
| created_at | TIMESTAMP | 생성일시 |

---

## 프론트엔드 연동 가이드

백엔드 API 연동 시 `src/services/` 디렉토리의 서비스 파일만 수정하면 됩니다.

### 예시: authService.ts 수정

```typescript
// Before (localStorage)
async login(form: LoginForm): Promise<ApiResponse<AuthData>> {
  const managers = getManagers();
  // ... localStorage 로직
}

// After (실제 API)
async login(form: LoginForm): Promise<ApiResponse<AuthData>> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  });
  return response.json();
}
```

각 서비스 파일에 `// TODO: [API]` 주석으로 변환 포인트가 표시되어 있습니다.
