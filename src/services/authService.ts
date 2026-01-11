/**
 * 認証サービス - API連携
 */
import type { Manager, LoginForm, RegisterForm, ApiResponse } from '@/types';
import { api, tokenManager } from './api';

interface AuthData {
  manager: Manager;
  token?: string;
  refreshToken?: string;
  message?: string;
  expiresAt?: string; // メール認証トークン有効期限 (ISO 8601)
}

export const authService = {
  // POST /api/auth/register
  // メール認証が必要 - トークンは発行しない
  async register(form: RegisterForm): Promise<ApiResponse<AuthData>> {
    const result = await api.post<AuthData>('/auth/register', {
      email: form.email,
      password: form.password,
    }, { skipAuth: true });

    // 会員登録時はトークンを発行しない（メール認証が必要）
    // メール認証完了後にログインが必要

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
    } catch (_e) {
      // ログアウト失敗してもローカルトークンは削除
    }
    tokenManager.clearTokens();
  },

  // 保存された認証情報を取得（トークン有効性確認）
  getStoredAuth(): AuthData | null {
    const token = tokenManager.getToken();
    if (!token) {
      return null;
    }

    // JWTトークンからペイロードを抽出（簡易デコード）
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      // トークン有効期限確認
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
    } catch (_e) {
      return null;
    }
  },

  // POST /api/auth/reset-password
  async resetPassword(email: string): Promise<ApiResponse<void>> {
    return api.post<void>('/auth/reset-password', { email }, { skipAuth: true });
  },

  // GET /api/auth/me - 現在のユーザー情報取得
  async getCurrentUser(): Promise<ApiResponse<Manager>> {
    return api.get<Manager>('/auth/me');
  },

  // POST /api/auth/verify-email - メール認証確認
  async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    return api.post<{ message: string }>('/auth/verify-email', { token }, { skipAuth: true });
  },

  // POST /api/auth/resend-verification - 認証メール再送信
  async resendVerification(email: string): Promise<ApiResponse<{ message: string }>> {
    return api.post<{ message: string }>('/auth/resend-verification', { email }, { skipAuth: true });
  },

  // DELETE /api/auth/me - 退会
  async deleteAccount(password: string): Promise<ApiResponse<{ message: string }>> {
    const result = await api.delete<{ message: string }>('/auth/me', { password });

    if (result.success) {
      tokenManager.clearTokens();
    }

    return result;
  },
};
