<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import QRCode from 'qrcode';
import { useStoreStore } from '@/stores/store';
import { qrService } from '@/services/qrService';
import dayjs from 'dayjs';

const router = useRouter();
const storeStore = useStoreStore();

const qrCodeDataUrl = ref('');
const currentToken = ref('');
const expiresAt = ref('');
const remainingSeconds = ref(300); // 5분
const isLoading = ref(true);
const hasStore = ref(false);
const error = ref<string | null>(null);

const QR_REFRESH_INTERVAL = 5 * 60 * 1000; // 5분
let refreshInterval: number | null = null;
let countdownInterval: number | null = null;

const formattedTime = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60);
  const seconds = remainingSeconds.value % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

async function generateQRCode() {
  if (!storeStore.currentStore) return;

  error.value = null;

  try {
    const result = await qrService.generateToken(storeStore.currentStore.id);

    if (!result.success || !result.data) {
      error.value = result.error || 'QR 토큰 생성에 실패했습니다.';
      return;
    }

    currentToken.value = result.data.token;
    expiresAt.value = result.data.expiresAt;

    // 남은 시간 계산
    const expiresAtDate = dayjs(result.data.expiresAt);
    const now = dayjs();
    remainingSeconds.value = Math.max(0, expiresAtDate.diff(now, 'second'));

    // QR 코드에 포함될 데이터
    const qrData = JSON.stringify({
      storeId: storeStore.currentStore.id,
      token: result.data.token,
      expiresAt: result.data.expiresAt,
    });

    qrCodeDataUrl.value = await QRCode.toDataURL(qrData, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1e3a8a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('QR 코드 생성 오류:', err);
    error.value = 'QR 코드 생성 중 오류가 발생했습니다.';
  }
}

function startCountdown() {
  countdownInterval = window.setInterval(() => {
    remainingSeconds.value--;
    if (remainingSeconds.value <= 0) {
      generateQRCode();
    }
  }, 1000);
}

function goBack() {
  router.push('/');
}

onMounted(async () => {
  if (!storeStore.currentStore) {
    await storeStore.fetchStore();
  }

  isLoading.value = false;

  if (!storeStore.currentStore) {
    hasStore.value = false;
    return;
  }

  hasStore.value = true;
  await generateQRCode();
  startCountdown();

  // 5분마다 자동 갱신
  refreshInterval = window.setInterval(generateQRCode, QR_REFRESH_INTERVAL);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});
</script>

<template>
  <div class="fixed inset-0 bg-white flex flex-col items-center justify-center p-8">
    <!-- Back Button -->
    <button
      @click="goBack"
      class="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      돌아가기
    </button>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center">
      <div class="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p class="text-gray-600">로딩 중...</p>
    </div>

    <!-- No Store Registered -->
    <div v-else-if="!hasStore" class="text-center max-w-md">
      <div class="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg class="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-gray-900 mb-3">매장 등록이 필요합니다</h2>
      <p class="text-gray-600 mb-6">
        QR코드를 표시하려면 먼저 매장 정보를 등록해야 합니다.<br>
        매장명과 주소를 입력해 주세요.
      </p>
      <button
        @click="router.push('/store-settings')"
        class="btn btn-primary"
      >
        매장 등록하러 가기
      </button>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center max-w-md">
      <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-gray-900 mb-3">오류 발생</h2>
      <p class="text-gray-600 mb-6">{{ error }}</p>
      <button @click="generateQRCode" class="btn btn-primary">
        다시 시도
      </button>
    </div>

    <!-- QR Code Display -->
    <template v-else>
      <!-- Store Name -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          {{ storeStore.currentStore?.name }}
        </h1>
        <p class="text-gray-600">출퇴근 시 아래 QR코드를 스캔하세요</p>
      </div>

      <!-- QR Code -->
      <div class="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        <img
          v-if="qrCodeDataUrl"
          :src="qrCodeDataUrl"
          alt="QR Code"
          class="w-80 h-80"
        />
        <div v-else class="w-80 h-80 flex items-center justify-center bg-gray-100 rounded-lg">
          <span class="text-gray-500">QR 코드 생성 중...</span>
        </div>
      </div>

      <!-- Timer -->
      <div class="mt-8 text-center">
        <div class="flex items-center justify-center gap-2 text-gray-600 mb-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>자동 갱신까지</span>
        </div>
        <div class="text-4xl font-mono font-bold text-primary-600">
          {{ formattedTime }}
        </div>
      </div>

      <!-- Current Time -->
      <div class="absolute bottom-8 text-gray-500 text-sm">
        {{ dayjs().format('YYYY년 MM월 DD일 (ddd)') }}
      </div>
    </template>
  </div>
</template>
