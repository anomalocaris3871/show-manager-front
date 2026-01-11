<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { authService } from '@/services/authService';
import { useToast } from '@/composables/useToast';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const email = computed(() => route.query.email as string || '');
const loading = ref(false);
const cooldown = ref(0);

// 認証リンク有効期限 (5分 = 300秒)
const EXPIRY_SECONDS = 5 * 60;
const expiryRemaining = ref(0);
const isExpired = computed(() => expiryRemaining.value <= 0);

let cooldownInterval: number | null = null;
let expiryInterval: number | null = null;
let authChannel: BroadcastChannel | null = null;

// 有効期限フォーマット (MM:SS)
const formattedExpiry = computed(() => {
  const minutes = Math.floor(expiryRemaining.value / 60);
  const seconds = expiryRemaining.value % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// 進捗率 (プログレスバー用)
const expiryProgress = computed(() => {
  return (expiryRemaining.value / EXPIRY_SECONDS) * 100;
});

function startExpiryTimer(seconds?: number) {
  // 既存タイマーをクリア
  if (expiryInterval) {
    clearInterval(expiryInterval);
  }

  // 初期値設定 (queryから取得または5分)
  expiryRemaining.value = seconds ?? EXPIRY_SECONDS;

  expiryInterval = window.setInterval(() => {
    if (expiryRemaining.value > 0) {
      expiryRemaining.value--;
    } else if (expiryInterval) {
      clearInterval(expiryInterval);
    }
  }, 1000);
}

async function handleResend() {
  if (cooldown.value > 0 || !email.value) return;

  loading.value = true;

  try {
    const result = await authService.resendVerification(email.value);

    if (result.success) {
      toast.success('認証メールを再送信しました。');
      startCooldown();
      // 有効期限タイマー再開
      startExpiryTimer();
    } else {
      toast.error(result.error || 'メール送信に失敗しました。');
    }
  } finally {
    loading.value = false;
  }
}

function startCooldown() {
  cooldown.value = 60; // 60秒待機

  cooldownInterval = window.setInterval(() => {
    cooldown.value--;
    if (cooldown.value <= 0 && cooldownInterval) {
      clearInterval(cooldownInterval);
    }
  }, 1000);
}

function goToLogin() {
  router.push('/login');
}

function handleEmailVerified() {
  toast.success('メール認証完了！ログインしてください。');
  router.push('/login');
}

function setupAuthListener() {
  try {
    authChannel = new BroadcastChannel('auth');
    authChannel.onmessage = (event) => {
      if (event.data?.type === 'email-verified') {
        handleEmailVerified();
      }
    };
  } catch (error) {
    // BroadcastChannel非対応 - localStorageフォールバック
    window.addEventListener('storage', handleStorageChange);
  }
}

function handleStorageChange(event: StorageEvent) {
  if (event.key === 'email-verified' && event.newValue) {
    handleEmailVerified();
    localStorage.removeItem('email-verified');
  }
}

onMounted(() => {
  if (!email.value) {
    router.push('/register');
    return;
  }

  // 他タブでの認証完了時に通知を受信
  setupAuthListener();

  // queryにexpiresAtがあれば残り時間を計算
  const expiresAt = route.query.expiresAt as string;
  if (expiresAt) {
    const expiryTime = new Date(expiresAt).getTime();
    const now = Date.now();
    const remainingMs = expiryTime - now;
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    startExpiryTimer(remainingSeconds);
  } else {
    // expiresAtがなければ5分で開始
    startExpiryTimer();
  }
});

onUnmounted(() => {
  if (cooldownInterval) {
    clearInterval(cooldownInterval);
  }
  if (expiryInterval) {
    clearInterval(expiryInterval);
  }
  if (authChannel) {
    authChannel.close();
  }
  window.removeEventListener('storage', handleStorageChange);
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
    <div class="max-w-md w-full text-center">
      <div class="card shadow-lg border-0 p-8 mb-6">
        <!-- Icon -->
        <div class="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <!-- Title -->
        <h1 class="text-2xl font-bold text-gray-900 mb-3">メールを確認してください</h1>

        <!-- Description -->
        <p class="text-gray-600 mb-2">
          <strong class="text-gray-900">{{ email }}</strong>
        </p>
        <p class="text-gray-600 mb-6">
          上記アドレスに認証メールを送信しました。<br>
          メール内の認証リンクをクリックしてください。
        </p>

        <!-- Expiry Timer -->
        <div class="mb-8">
          <div v-if="!isExpired" class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center justify-center gap-2 mb-2">
              <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-sm text-gray-600">認証リンク有効時間</span>
            </div>
            <div class="text-3xl font-bold text-primary-600 mb-2">{{ formattedExpiry }}</div>
            <!-- Progress Bar -->
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-primary-600 h-2 rounded-full transition-all duration-1000"
                :style="{ width: `${expiryProgress}%` }"
              ></div>
            </div>
          </div>

          <div v-else class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex items-center justify-center gap-2 text-red-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="font-medium">認証リンクが期限切れです</span>
            </div>
            <p class="text-sm text-red-600 mt-1">下のボタンを押して新しい認証メールを受け取ってください。</p>
          </div>
        </div>

        <!-- Help Section -->
        <div class="bg-gray-50 rounded-lg p-4 text-left mb-6">
          <h3 class="font-medium text-gray-900 mb-3">メールが届きませんか？</h3>
          <ul class="text-sm text-gray-600 space-y-2">
            <li class="flex items-start gap-2">
              <svg class="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <span>迷惑メールフォルダを確認してください</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <span>メールアドレスが正しいか確認してください</span>
            </li>
          </ul>
        </div>

        <!-- Resend Button -->
        <button
          @click="handleResend"
          :disabled="loading || cooldown > 0"
          class="btn btn-primary w-full"
        >
          <template v-if="loading">
            送信中...
          </template>
          <template v-else-if="cooldown > 0">
            {{ cooldown }}秒後に再送信可能
          </template>
          <template v-else>
            認証メールを再送信
          </template>
        </button>
      </div>

      <!-- Back to Login -->
      <button
        @click="goToLogin"
        class="text-sm text-gray-600 hover:text-gray-900 font-medium"
      >
        ログインページに戻る
      </button>
    </div>
  </div>
</template>
