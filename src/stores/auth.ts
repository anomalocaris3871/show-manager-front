import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Manager, LoginForm, RegisterForm } from '@/types';
import { authService } from '@/services/authService';

export const useAuthStore = defineStore('auth', () => {
  const manager = ref<Manager | null>(null);
  const token = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const errorCode = ref<string | null>(null);

  const isLoggedIn = computed(() => !!token.value && !!manager.value);

  function initialize() {
    const stored = authService.getStoredAuth();
    if (stored) {
      manager.value = stored.manager;
      token.value = stored.token ?? null;
    }
  }

  async function login(form: LoginForm) {
    loading.value = true;
    error.value = null;
    errorCode.value = null;

    try {
      const result = await authService.login(form);

      if (result.success && result.data) {
        manager.value = result.data.manager;
        token.value = result.data.token ?? null;
        return true;
      } else {
        error.value = result.error || '로그인에 실패했습니다.';
        errorCode.value = result.code || null;
        return false;
      }
    } finally {
      loading.value = false;
    }
  }

  async function register(form: RegisterForm): Promise<{ success: boolean; expiresAt?: string }> {
    loading.value = true;
    error.value = null;
    errorCode.value = null;

    try {
      const result = await authService.register(form);

      if (result.success) {
        // 회원가입 시 토큰 발급하지 않음 (이메일 인증 필요)
        // 이메일 인증 완료 후 로그인해야 함
        return {
          success: true,
          expiresAt: result.data?.expiresAt,
        };
      } else {
        error.value = result.error || '회원가입에 실패했습니다.';
        errorCode.value = result.code || null;
        return { success: false };
      }
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    await authService.logout();
    manager.value = null;
    token.value = null;
  }

  // 세션 만료 이벤트 처리 (API에서 토큰 갱신 실패 시)
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:logout', () => {
      manager.value = null;
      token.value = null;
    });
  }

  async function resetPassword(email: string) {
    loading.value = true;
    error.value = null;

    try {
      const result = await authService.resetPassword(email);

      if (!result.success) {
        error.value = result.error || '비밀번호 재설정에 실패했습니다.';
        return false;
      }

      return true;
    } finally {
      loading.value = false;
    }
  }

  async function deleteAccount(password: string) {
    loading.value = true;
    error.value = null;
    errorCode.value = null;

    try {
      const result = await authService.deleteAccount(password);

      if (result.success) {
        manager.value = null;
        token.value = null;
        return true;
      } else {
        error.value = result.error || '회원 탈퇴에 실패했습니다.';
        errorCode.value = result.code || null;
        return false;
      }
    } finally {
      loading.value = false;
    }
  }

  // 초기화
  initialize();

  return {
    manager,
    token,
    loading,
    error,
    errorCode,
    isLoggedIn,
    login,
    register,
    logout,
    resetPassword,
    deleteAccount,
  };
});
