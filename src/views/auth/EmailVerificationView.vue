<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { authService } from '@/services/authService';

const route = useRoute();
const router = useRouter();

const status = ref<'loading' | 'success' | 'error'>('loading');
const errorMessage = ref('');

async function verifyEmail() {
  const token = route.query.token as string;

  if (!token) {
    status.value = 'error';
    errorMessage.value = '無効な認証リンクです。';
    return;
  }

  try {
    const result = await authService.verifyEmail(token);

    if (result.success) {
      status.value = 'success';
      // 他タブに認証完了を通知
      notifyOtherTabs();
    } else {
      status.value = 'error';
      errorMessage.value = result.error || 'メール認証に失敗しました。';
    }
  } catch (error) {
    status.value = 'error';
    errorMessage.value = 'メール認証中にエラーが発生しました。';
  }
}

function goToLogin() {
  router.push('/login');
}

function goToRegister() {
  router.push('/register');
}

function notifyOtherTabs() {
  try {
    const channel = new BroadcastChannel('auth');
    channel.postMessage({ type: 'email-verified' });
    channel.close();
  } catch (error) {
    // BroadcastChannel非対応ブラウザ - localStorageフォールバック
    localStorage.setItem('email-verified', Date.now().toString());
  }
}

onMounted(() => {
  verifyEmail();
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
    <div class="max-w-md w-full text-center">
      <div class="card shadow-lg border-0 p-8">
        <!-- Loading -->
        <template v-if="status === 'loading'">
          <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-10 h-10 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-3">メール認証中...</h1>
          <p class="text-gray-600">しばらくお待ちください。</p>
        </template>

        <!-- Success -->
        <template v-else-if="status === 'success'">
          <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-3">認証完了！</h1>
          <p class="text-gray-600 mb-8">
            メール認証が完了しました。<br>
            ログインしてサービスをご利用いただけます。
          </p>
          <button
            @click="goToLogin"
            class="btn btn-primary w-full"
          >
            ログインする
          </button>
        </template>

        <!-- Error -->
        <template v-else>
          <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-3">認証失敗</h1>
          <p class="text-gray-600 mb-8">{{ errorMessage }}</p>

          <div class="space-y-3">
            <button
              @click="goToRegister"
              class="btn btn-primary w-full"
            >
              再度新規登録する
            </button>
            <button
              @click="goToLogin"
              class="btn btn-secondary w-full"
            >
              ログインページへ
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
