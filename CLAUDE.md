# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A shift management system for small retail stores (10 or fewer staff). The system helps store managers handle part-time staff scheduling and attendance tracking via:
- **Web dashboard** (PC/tablet) for store managers
- **LINE LIFF app** (future) for staff to clock in/out via QR codes

See `docs/blue-print.md` for detailed requirements specification (written in Korean).

## Development Commands

```bash
npm run dev      # Start development server (port 3000)
npm run build    # TypeScript check + production build
npm run preview  # Preview production build
npx prettier --write .  # Format code
```

## Tech Stack

- **Vue 3** - Composition API with `<script setup>`
- **TypeScript** - Strict mode, ES2020 target
- **Tailwind CSS v3** - Utility-first styling
- **Pinia** - State management
- **Vue Router** - Client-side routing
- **FullCalendar** - Shift calendar component
- **Vite** - Build tool

## Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── common/     # AppHeader, AppSidebar, Modal, LoadingSpinner
│   ├── calendar/   # Calendar-related components
│   └── qr/         # QR code components
├── views/          # Page components (route targets)
│   ├── auth/       # Login, Register, ForgotPassword
│   ├── dashboard/  # Main dashboard
│   ├── store/      # Store settings
│   ├── staff/      # Staff list, form
│   ├── shift/      # Shift calendar
│   ├── attendance/ # Attendance list
│   └── qr/         # QR display (fullscreen)
├── stores/         # Pinia stores (auth, store, staff, shift, attendance)
├── services/       # Data access layer (localStorage abstraction)
├── types/          # TypeScript type definitions
├── router/         # Vue Router configuration
└── utils/          # Utility functions
```

## API Integration

REST API 연동 완료. 서비스 레이어(`src/services/`)에서 API 호출 처리.

### 환경 설정
```bash
# .env 또는 .env.development
VITE_API_URL=http://localhost:8080/api
```

### API 클라이언트 (`src/services/api.ts`)
- JWT 토큰 자동 관리 (Access Token + Refresh Token)
- 401 에러 시 자동 토큰 갱신
- 세션 만료 시 `auth:logout` 이벤트 발생

### API 명세
상세 명세서: `docs/BACKEND_API.md`

| 서비스 | 주요 엔드포인트 |
|--------|----------------|
| Auth | `/auth/login`, `/auth/register`, `/auth/logout` |
| Store | `/stores/me`, `/stores/{id}` |
| Staff | `/stores/{storeId}/staff`, `/staff/{id}` |
| Shift | `/stores/{storeId}/shifts`, `/shifts/{id}` |
| Attendance | `/attendance/clock-in`, `/attendance/clock-out` |

## Key Features Implemented

- Manager authentication (JWT-based)
- Store settings management
- Staff CRUD with LINE link code generation
- Shift calendar (FullCalendar - monthly/weekly views)
- Attendance records with manual adjustment
- Dynamic QR code display (5-minute auto-refresh)
- Toast notification system for user feedback
