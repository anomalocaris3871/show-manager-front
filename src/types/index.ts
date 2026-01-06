// 점장 (관리자)
export interface Manager {
  id: string;
  email: string;
  password?: string; // 저장 시에만 사용, 일반적으로 제외
  emailVerified?: boolean;
  emailVerifiedAt?: string;
  createdAt: string;
}

// 매장
export interface Store {
  id: string;
  managerId: string;
  name: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

// 스태프 (아르바이트)
export interface Staff {
  id: string;
  storeId: string;
  name: string;
  hourlyWage: number;
  lineUserId?: string; // LINE 연동 시 설정
  linkCode?: string; // LINE 연동 코드
  isLinked: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 시프트 (근무 예정)
export interface Shift {
  id: string;
  storeId: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  createdAt: string;
  updatedAt: string;
}

// 출퇴근 기록
export interface Attendance {
  id: string;
  storeId: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  clockIn?: string; // ISO datetime
  clockOut?: string; // ISO datetime
  manuallyAdjusted: boolean;
  adjustedBy?: string; // 수정한 점장 ID
  note?: string; // 수정 사유
  createdAt: string;
  updatedAt: string;
}

// QR 토큰
export interface QRToken {
  token: string;
  storeId: string;
  createdAt: string;
  expiresAt: string;
}

// 인증 상태
export interface AuthState {
  manager: Manager | null;
  token: string | null;
  isAuthenticated: boolean;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string; // 에러 코드 (EMAIL_NOT_VERIFIED 등)
}

// 폼 데이터 타입
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface StoreForm {
  name: string;
  address: string;
}

export interface StaffForm {
  name: string;
  hourlyWage: number;
}

export interface ShiftForm {
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
}

// FullCalendar 이벤트 타입
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: {
    staffId: string;
    staffName: string;
    shiftId: string;
  };
}
