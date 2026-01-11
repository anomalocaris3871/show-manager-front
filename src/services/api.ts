/**
 * APIクライアント
 *
 * - JWTトークン自動追加
 * - トークン更新処理
 * - エラーハンドリング
 */
import type { ApiResponse } from '@/types';

// APIベースURL（環境変数またはデフォルト値）
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// トークン保存キー
const TOKEN_KEY = 'shop-manager:token';
const REFRESH_TOKEN_KEY = 'shop-manager:refresh-token';

// トークン管理
export const tokenManager = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens(token: string, refreshToken?: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// トークン更新中かどうか追跡
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

// トークン更新
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      tokenManager.clearTokens();
      return null;
    }

    const data = await response.json();
    if (data.success && data.data) {
      tokenManager.setTokens(data.data.token, data.data.refreshToken);
      return data.data.token;
    }

    return null;
  } catch (_e) {
    tokenManager.clearTokens();
    return null;
  }
}

// APIリクエスト関数
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {}, skipAuth = false } = options;

  const url = `${API_BASE_URL}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // 認証トークン追加
  if (!skipAuth) {
    const token = tokenManager.getToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== 'GET') {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    let response = await fetch(url, requestOptions);

    // 401エラー時トークン更新を試行
    if (response.status === 401 && !skipAuth) {
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await refreshAccessToken();
        isRefreshing = false;

        if (newToken) {
          onTokenRefreshed(newToken);
          // 新しいトークンで再リクエスト
          requestHeaders['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, {
            ...requestOptions,
            headers: requestHeaders,
          });
        } else {
          // トークン更新失敗 - ログアウト処理
          window.dispatchEvent(new CustomEvent('auth:logout'));
          return { success: false, error: 'セッションが切れました。再度ログインしてください。' };
        }
      } else {
        // すでに更新中なら待機
        return new Promise((resolve) => {
          subscribeTokenRefresh(async (token) => {
            requestHeaders['Authorization'] = `Bearer ${token}`;
            const retryResponse = await fetch(url, {
              ...requestOptions,
              headers: requestHeaders,
            });
            const data = await retryResponse.json();
            resolve(data);
          });
        });
      }
    }

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `リクエスト失敗 (${response.status})`,
      };
    }

    return data;
  } catch (error) {
    console.error('APIリクエストエラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ネットワークエラーが発生しました。',
    };
  }
}

// ユーティリティメソッド
export const api = {
  get<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return apiRequest<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return apiRequest<T>(endpoint, { ...options, method: 'POST', body });
  },

  put<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return apiRequest<T>(endpoint, { ...options, method: 'PUT', body });
  },

  delete<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return apiRequest<T>(endpoint, { ...options, method: 'DELETE', body });
  },

  patch<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return apiRequest<T>(endpoint, { ...options, method: 'PATCH', body });
  },
};
