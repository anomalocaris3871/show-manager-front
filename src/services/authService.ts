/**
 * 인증 서비스 - API 연동
 */
import type { Manager, LoginForm, RegisterForm, ApiResponse } from '@/types';
import { api, tokenManager } from './api';

interface AuthData {
  manager: Manager;
  token?: string;
  refreshToken?: string;
  message?: string;
  expiresAt?: string; // 이메일 인증 토큰 만료 시간 (ISO 8601)
}

export const authService = {
  // POST /api/auth/register
  // 이메일 인증 필요 - 토큰 발급하지 않음
  async register(form: RegisterForm): Promise<ApiResponse<AuthData>> {
    const result = await api.post<AuthData>('/auth/register', {
      email: form.email,
      password: form.password,
    }, { skipAuth: true });

    // 회원가입 시 토큰 발급하지 않음 (이메일 인증 필요)
    // 이메일 인증 완료 후 로그인해야 함

    return result;
  },

  // POST /api/auth/login
  async login(form: LoginForm): Promise<ApiResponse<AuthData>> {
    const result = await api.post<AuthData>('/auth/login', form, { skipAuth: true });

    if (result.success && result.data?.token) {
      tokenManager.setTokens(result.data.token, result.data.refreshToken);
    }

    return result;
  },

  // POST /api/auth/logout
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // 로그아웃 실패해도 로컬 토큰은 삭제
    }
    tokenManager.clearTokens();
  },

  // 저장된 인증 정보 조회 (토큰 유효성 확인)
  getStoredAuth(): AuthData | null {
    const token = tokenManager.getToken();
    if (!token) {
      return null;
    }

    // JWT 토큰에서 페이로드 추출 (간단한 디코딩)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      // 토큰 만료 확인
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        tokenManager.clearTokens();
        return null;
      }

      return {
        manager: {
          id: payload.sub || payload.managerId,
          email: payload.email,
          createdAt: payload.createdAt || '',
        },
        token,
      };
    } catch {
      return null;
    }
  },

  // POST /api/auth/reset-password
  async resetPassword(email: string): Promise<ApiResponse<void>> {
    return api.post<void>('/auth/reset-password', { email }, { skipAuth: true });
  },

  // GET /api/auth/me - 현재 사용자 정보 조회
  async getCurrentUser(): Promise<ApiResponse<Manager>> {
    return api.get<Manager>('/auth/me');
  },

  // POST /api/auth/verify-email - 이메일 인증 확인
  async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    return api.post<{ message: string }>('/auth/verify-email', { token }, { skipAuth: true });
  },

  // POST /api/auth/resend-verification - 인증 이메일 재발송
  async resendVerification(email: string): Promise<ApiResponse<{ message: string }>> {
    return api.post<{ message: string }>('/auth/resend-verification', { email }, { skipAuth: true });
  },

  // DELETE /api/auth/account - 회원 탈퇴
  async deleteAccount(password: string): Promise<ApiResponse<{ message: string }>> {
    const result = await api.delete<{ message: string }>('/auth/account', { password });

    if (result.success) {
      tokenManager.clearTokens();
    }

    return result;
  },
};
