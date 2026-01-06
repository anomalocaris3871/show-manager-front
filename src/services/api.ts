/**
 * API 클라이언트
 *
 * - JWT 토큰 자동 추가
 * - 토큰 갱신 처리
 * - 에러 핸들링
 */
import type { ApiResponse } from '@/types';

// API 베이스 URL (환경변수 또는 기본값)
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// 토큰 저장 키
const TOKEN_KEY = 'shop-manager:token';
const REFRESH_TOKEN_KEY = 'shop-manager:refresh-token';

// 토큰 관리
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

// 토큰 갱신 중인지 추적
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

// 토큰 갱신
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
  } catch {
    tokenManager.clearTokens();
    return null;
  }
}

// API 요청 함수
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

  // 인증 토큰 추가
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

    // 401 에러시 토큰 갱신 시도
    if (response.status === 401 && !skipAuth) {
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await refreshAccessToken();
        isRefreshing = false;

        if (newToken) {
          onTokenRefreshed(newToken);
          // 새 토큰으로 재요청
          requestHeaders['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, {
            ...requestOptions,
            headers: requestHeaders,
          });
        } else {
          // 토큰 갱신 실패 - 로그아웃 처리
          window.dispatchEvent(new CustomEvent('auth:logout'));
          return { success: false, error: '세션이 만료되었습니다. 다시 로그인해주세요.' };
        }
      } else {
        // 이미 갱신 중이면 대기
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
        error: data.error || data.message || `요청 실패 (${response.status})`,
      };
    }

    return data;
  } catch (error) {
    console.error('API 요청 에러:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.',
    };
  }
}

// 편의 메서드
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
