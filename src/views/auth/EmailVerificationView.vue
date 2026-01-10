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
    errorMessage.value = '유효하지 않은 인증 링크입니다.';
    return;
  }

  try {
    const result = await authService.verifyEmail(token);

    if (result.success) {
      status.value = 'success';
      // 다른 탭에 인증 완료 알림
      notifyOtherTabs();
    } else {
      status.value = 'error';
      errorMessage.value = result.error || '이메일 인증에 실패했습니다.';
    }
  } catch {
    status.value = 'error';
    errorMessage.value = '이메일 인증 중 오류가 발생했습니다.';
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
  } catch {
    // BroadcastChannel 미지원 브라우저 - localStorage 폴백
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
          <h1 class="text-2xl font-bold text-gray-900 mb-3">이메일 인증 중...</h1>
          <p class="text-gray-600">잠시만 기다려주세요.</p>
        </template>

        <!-- Success -->
        <template v-else-if="status === 'success'">
          <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-3">인증 완료!</h1>
          <p class="text-gray-600 mb-8">
            이메일 인증이 완료되었습니다.<br>
            이제 로그인하여 서비스를 이용할 수 있습니다.
          </p>
          <button
            @click="goToLogin"
            class="btn btn-primary w-full"
          >
            로그인하기
          </button>
        </template>

        <!-- Error -->
        <template v-else>
          <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-3">인증 실패</h1>
          <p class="text-gray-600 mb-8">{{ errorMessage }}</p>

          <div class="space-y-3">
            <button
              @click="goToRegister"
              class="btn btn-primary w-full"
            >
              다시 회원가입하기
            </button>
            <button
              @click="goToLogin"
              class="btn btn-secondary w-full"
            >
              로그인 페이지로
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
