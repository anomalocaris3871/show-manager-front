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

// 인증 링크 만료 시간 (5분 = 300초)
const EXPIRY_SECONDS = 5 * 60;
const expiryRemaining = ref(0);
const isExpired = computed(() => expiryRemaining.value <= 0);

let cooldownInterval: number | null = null;
let expiryInterval: number | null = null;
let authChannel: BroadcastChannel | null = null;

// 만료 시간 포맷 (MM:SS)
const formattedExpiry = computed(() => {
  const minutes = Math.floor(expiryRemaining.value / 60);
  const seconds = expiryRemaining.value % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// 진행률 (프로그레스 바용)
const expiryProgress = computed(() => {
  return (expiryRemaining.value / EXPIRY_SECONDS) * 100;
});

function startExpiryTimer(seconds?: number) {
  // 기존 타이머 정리
  if (expiryInterval) {
    clearInterval(expiryInterval);
  }

  // 초기값 설정 (query에서 받거나 기본 5분)
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
      toast.success('인증 이메일이 재발송되었습니다.');
      startCooldown();
      // 만료 타이머 재시작
      startExpiryTimer();
    } else {
      toast.error(result.error || '이메일 발송에 실패했습니다.');
    }
  } finally {
    loading.value = false;
  }
}

function startCooldown() {
  cooldown.value = 60; // 60초 대기

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
  toast.success('이메일 인증 완료! 로그인해주세요.');
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
  } catch {
    // BroadcastChannel 미지원 - localStorage 폴백
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

  // 다른 탭에서 인증 완료 시 알림 수신
  setupAuthListener();

  // query에서 expiresAt이 있으면 남은 시간 계산
  const expiresAt = route.query.expiresAt as string;
  if (expiresAt) {
    const expiryTime = new Date(expiresAt).getTime();
    const now = Date.now();
    const remainingMs = expiryTime - now;
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    startExpiryTimer(remainingSeconds);
  } else {
    // expiresAt이 없으면 기본 5분으로 시작
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
        <h1 class="text-2xl font-bold text-gray-900 mb-3">이메일을 확인하세요</h1>

        <!-- Description -->
        <p class="text-gray-600 mb-2">
          <strong class="text-gray-900">{{ email }}</strong>
        </p>
        <p class="text-gray-600 mb-6">
          위 주소로 인증 이메일을 보냈습니다.<br>
          이메일의 인증 링크를 클릭해주세요.
        </p>

        <!-- Expiry Timer -->
        <div class="mb-8">
          <div v-if="!isExpired" class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center justify-center gap-2 mb-2">
              <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-sm text-gray-600">인증 링크 유효 시간</span>
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
              <span class="font-medium">인증 링크가 만료되었습니다</span>
            </div>
            <p class="text-sm text-red-600 mt-1">아래 버튼을 눌러 새 인증 이메일을 받으세요.</p>
          </div>
        </div>

        <!-- Help Section -->
        <div class="bg-gray-50 rounded-lg p-4 text-left mb-6">
          <h3 class="font-medium text-gray-900 mb-3">이메일이 오지 않나요?</h3>
          <ul class="text-sm text-gray-600 space-y-2">
            <li class="flex items-start gap-2">
              <svg class="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <span>스팸/정크 메일함을 확인해주세요</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <span>이메일 주소가 정확한지 확인해주세요</span>
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
            발송 중...
          </template>
          <template v-else-if="cooldown > 0">
            {{ cooldown }}초 후 재발송 가능
          </template>
          <template v-else>
            인증 이메일 다시 보내기
          </template>
        </button>
      </div>

      <!-- Back to Login -->
      <button
        @click="goToLogin"
        class="text-sm text-gray-600 hover:text-gray-900 font-medium"
      >
        로그인 페이지로 돌아가기
      </button>
    </div>
  </div>
</template>
