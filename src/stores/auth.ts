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
        error.value = result.error || 'ログインに失敗しました。';
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
        // 会員登録時はトークンを発行しない（メール認証必要）
        // メール認証完了後にログインが必要
        return {
          success: true,
          expiresAt: result.data?.expiresAt,
        };
      } else {
        error.value = result.error || '会員登録に失敗しました。';
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

  // セッション満了イベント処理（APIでトークン更新失敗時）
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
        error.value = result.error || 'パスワードリセットに失敗しました。';
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
        error.value = result.error || '退会に失敗しました。';
        errorCode.value = result.code || null;
        return false;
      }
    } finally {
      loading.value = false;
    }
  }

  // 初期化
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
