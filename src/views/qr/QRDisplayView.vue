<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import QRCode from 'qrcode';
import { useStoreStore } from '@/stores/store';
import { qrService } from '@/services/qrService';
import dayjs from 'dayjs';

const router = useRouter();
const storeStore = useStoreStore();

type QRMode = 'attendance' | 'register';
const currentMode = ref<QRMode>('attendance');

const qrCodeDataUrl = ref('');
const registerQrDataUrl = ref('');
const currentToken = ref('');
const expiresAt = ref('');
const remainingSeconds = ref(300); // 5分
const isLoading = ref(true);
const hasStore = ref(false);
const error = ref<string | null>(null);

const QR_REFRESH_INTERVAL = 5 * 60 * 1000; // 5分
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
      error.value = result.error || 'QRトークンの生成に失敗しました。';
      return;
    }

    currentToken.value = result.data.token;
    expiresAt.value = result.data.expiresAt;

    // 残り時間を計算
    const expiresAtDate = dayjs(result.data.expiresAt);
    const now = dayjs();
    remainingSeconds.value = Math.max(0, expiresAtDate.diff(now, 'second'));

    // QRコードに含めるデータ
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
    console.error('QRコード生成エラー:', err);
    error.value = 'QRコード生成中にエラーが発生しました。';
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

async function generateRegisterQR() {
  if (!storeStore.currentStore) return;

  const liffId = import.meta.env.VITE_LIFF_ID;
  const baseUrl = liffId
    ? `https://liff.line.me/${liffId}`
    : `${window.location.origin}/liff/register`;

  const registerUrl = `${baseUrl}?storeId=${storeStore.currentStore.id}`;

  registerQrDataUrl.value = await QRCode.toDataURL(registerUrl, {
    width: 400,
    margin: 2,
    color: {
      dark: '#16a34a',
      light: '#ffffff',
    },
  });
}

function setMode(mode: QRMode) {
  currentMode.value = mode;
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
  await Promise.all([generateQRCode(), generateRegisterQR()]);
  startCountdown();

  // 5分ごとに自動更新（出退勤QRのみ）
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
  <div class="relative bg-white flex flex-col items-center justify-center p-8 min-h-[calc(100vh-8rem)] rounded-2xl shadow-sm border border-gray-100">
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center">
      <div class="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p class="text-gray-600">読み込み中...</p>
    </div>

    <!-- No Store Registered -->
    <div v-else-if="!hasStore" class="text-center max-w-md">
      <div class="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg class="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-gray-900 mb-3">店舗登録が必要です</h2>
      <p class="text-gray-600 mb-6">
        QRコードを表示するには、まず店舗情報を登録する必要があります。<br>
        店舗名と住所を入力してください。
      </p>
      <button
        @click="router.push('/store-settings')"
        class="btn btn-primary"
      >
        店舗登録へ
      </button>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center max-w-md">
      <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-gray-900 mb-3">エラー発生</h2>
      <p class="text-gray-600 mb-6">{{ error }}</p>
      <button @click="generateQRCode" class="btn btn-primary">
        再試行
      </button>
    </div>

    <!-- QR Code Display -->
    <template v-else>
      <!-- Store Name -->
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          {{ storeStore.currentStore?.name }}
        </h1>
      </div>

      <!-- Mode Tabs -->
      <div class="flex bg-gray-100 rounded-lg p-1 mb-6">
        <button
          @click="setMode('attendance')"
          class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors"
          :class="currentMode === 'attendance'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'"
        >
          出退勤QR
        </button>
        <button
          @click="setMode('register')"
          class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors"
          :class="currentMode === 'register'
            ? 'bg-white text-green-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'"
        >
          スタッフ登録QR
        </button>
      </div>

      <!-- Attendance QR -->
      <template v-if="currentMode === 'attendance'">
        <p class="text-gray-600 text-center mb-4">出退勤時に下のQRコードをスキャンしてください</p>
        <div class="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <img
            v-if="qrCodeDataUrl"
            :src="qrCodeDataUrl"
            alt="出退勤QRコード"
            class="w-80 h-80"
          />
          <div v-else class="w-80 h-80 flex items-center justify-center bg-gray-100 rounded-lg">
            <span class="text-gray-500">QRコード生成中...</span>
          </div>
        </div>

        <!-- Timer -->
        <div class="mt-8 text-center">
          <div class="flex items-center justify-center gap-2 text-gray-600 mb-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>自動更新まで</span>
          </div>
          <div class="text-4xl font-mono font-bold text-primary-600">
            {{ formattedTime }}
          </div>
        </div>
      </template>

      <!-- Register QR -->
      <template v-else>
        <p class="text-gray-600 text-center mb-4">スタッフ登録時に下のQRコードをスキャンしてください</p>
        <div class="bg-white p-8 rounded-2xl shadow-lg border border-green-200">
          <img
            v-if="registerQrDataUrl"
            :src="registerQrDataUrl"
            alt="スタッフ登録QRコード"
            class="w-80 h-80"
          />
          <div v-else class="w-80 h-80 flex items-center justify-center bg-gray-100 rounded-lg">
            <span class="text-gray-500">QRコード生成中...</span>
          </div>
        </div>

        <!-- Info -->
        <div class="mt-8 text-center max-w-sm">
          <p class="text-sm text-gray-500">
            新しいスタッフがLINEアプリでこのQRをスキャンすると、<br />
            スタッフ一覧で承認後に出退勤が可能になります。
          </p>
        </div>
      </template>

      <!-- Current Time -->
      <div class="absolute bottom-8 text-gray-500 text-sm">
        {{ dayjs().format('YYYY年MM月DD日 (ddd)') }}
      </div>
    </template>
  </div>
</template>
