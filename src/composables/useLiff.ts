import { ref } from 'vue';
import liff from '@line/liff';

const isInitialized = ref(false);
const isLoggedIn = ref(false);
const isInClient = ref(false);
const error = ref<string | null>(null);

export function useLiff() {
  async function init() {
    if (isInitialized.value) return true;

    const liffId = import.meta.env.VITE_LIFF_ID;
    if (!liffId) {
      error.value = 'LIFF IDが設定されていません。';
      return false;
    }

    try {
      await liff.init({ liffId });
      isInitialized.value = true;
      isLoggedIn.value = liff.isLoggedIn();
      isInClient.value = liff.isInClient();
      return true;
    } catch (e) {
      error.value = 'LIFF初期化に失敗しました。';
      console.error('LIFF init error:', e);
      return false;
    }
  }
  function login() {
    if (!isLoggedIn.value) {
      liff.login();
    }
  }

  function logout() {
    if (isLoggedIn.value) {
      liff.logout();
      isLoggedIn.value = false;
    }
  }

  function getAccessToken(): string | null {
    if (!isLoggedIn.value) return null;
    return liff.getAccessToken();
  }

  async function getProfile() {
    if (!isLoggedIn.value) return null;
    try {
      return await liff.getProfile();
    } catch (_e) {
      return null;
    }
  }

  function closeWindow() {
    if (isInClient.value) {
      liff.closeWindow();
    }
  }

  return {
    isInitialized,
    isLoggedIn,
    isInClient,
    error,
    init,
    login,
    logout,
    getAccessToken,
    getProfile,
    closeWindow,
  };
}
