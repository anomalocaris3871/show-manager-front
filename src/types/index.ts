// 店長（管理者）
export interface Manager {
  id: string;
  email: string;
  password?: string; // 保存時のみ使用、通常は除外
  emailVerified?: boolean;
  emailVerifiedAt?: string;
  createdAt: string;
}

// 店舗
export interface Store {
  id: string;
  managerId: string;
  name: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

// スタッフ（アルバイト）
export interface Staff {
  id: string;
  storeId: string;
  name: string;
  hourlyWage: number;
  nightWage: number; // 深夜時給（22:00-05:00）
  lineUserId?: string; // LINE連携時に設定
  linkCode?: string; // LINE連携コード
  isLinked: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// シフト（勤務予定）
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

// 出退勤記録
export interface Attendance {
  id: string;
  storeId: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  clockIn?: string; // ISO datetime
  clockOut?: string; // ISO datetime
  manuallyAdjusted: boolean;
  adjustedBy?: string; // 修正した店長ID
  note?: string; // 修正理由
  createdAt: string;
  updatedAt: string;
}

// QRトークン
export interface QRToken {
  token: string;
  storeId: string;
  createdAt: string;
  expiresAt: string;
}

// 認証状態
export interface AuthState {
  manager: Manager | null;
  token: string | null;
  isAuthenticated: boolean;
}

// APIレスポンス型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string; // エラーコード (EMAIL_NOT_VERIFIED など)
}

// フォームデータ型
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
  nightWage: number; // 深夜時給
}

export interface ShiftForm {
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
}

// FullCalendarイベント型
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

// サブスクリプション関連の型をre-export
export * from './subscription';
