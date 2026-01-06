<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLiff } from '@/composables/useLiff';
import { staffService } from '@/services/staffService';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

const route = useRoute();
const router = useRouter();
const liff = useLiff();

const name = ref('');
const loading = ref(true);
const submitting = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

const storeId = ref<string | null>(null);

onMounted(async () => {
  // URL에서 storeId 추출
  storeId.value = route.query.storeId as string;
  if (!storeId.value) {
    error.value = '잘못된 접근입니다. QR 코드를 다시 스캔해주세요.';
    loading.value = false;
    return;
  }

  // LIFF 초기화
  const initialized = await liff.init();
  if (!initialized) {
    error.value = liff.error.value;
    loading.value = false;
    return;
  }

  // 로그인 확인
  if (!liff.isLoggedIn.value) {
    liff.login();
    return;
  }

  loading.value = false;
});

async function handleSubmit() {
  if (!name.value.trim()) {
    error.value = '이름을 입력해주세요.';
    return;
  }

  if (!storeId.value) {
    error.value = '매장 정보가 없습니다.';
    return;
  }

  const accessToken = liff.getAccessToken();
  if (!accessToken) {
    error.value = 'LINE 인증 정보를 가져올 수 없습니다.';
    return;
  }

  submitting.value = true;
  error.value = null;

  try {
    const result = await staffService.registerRequest(
      storeId.value,
      name.value.trim(),
      accessToken
    );

    if (result.success) {
      success.value = true;
    } else {
      error.value = result.error || '등록 요청에 실패했습니다.';
    }
  } catch {
    error.value = '서버 오류가 발생했습니다.';
  } finally {
    submitting.value = false;
  }
}

function handleClose() {
  liff.closeWindow();
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center">
        <LoadingSpinner size="lg" />
      </div>

      <!-- Error (초기화 실패) -->
      <div v-else-if="error && !name" class="bg-white rounded-2xl shadow-lg p-6 text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 class="text-lg font-semibold text-gray-900 mb-2">오류</h2>
        <p class="text-gray-600">{{ error }}</p>
      </div>

      <!-- Success -->
      <div v-else-if="success" class="bg-white rounded-2xl shadow-lg p-6 text-center">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-lg font-semibold text-gray-900 mb-2">등록 요청 완료</h2>
        <p class="text-gray-600 mb-6">
          매니저의 승인을 기다려주세요.<br />
          승인 후 출퇴근이 가능합니다.
        </p>
        <button
          v-if="liff.isInClient.value"
          @click="handleClose"
          class="w-full py-3 bg-green-500 text-white rounded-xl font-medium"
        >
          닫기
        </button>
      </div>

      <!-- Register Form -->
      <div v-else class="bg-white rounded-2xl shadow-lg p-6">
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 class="text-xl font-bold text-gray-900">직원 등록</h1>
          <p class="text-gray-500 text-sm mt-1">이름을 입력해주세요</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <input
              v-model="name"
              type="text"
              placeholder="이름"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              :disabled="submitting"
            />
          </div>

          <div v-if="error" class="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
            {{ error }}
          </div>

          <button
            type="submit"
            class="w-full py-3 bg-blue-500 text-white rounded-xl font-medium disabled:bg-gray-300"
            :disabled="submitting || !name.trim()"
          >
            {{ submitting ? '요청 중...' : '등록 요청' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
