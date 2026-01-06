<script setup lang="ts">
import { ref, onMounted } from 'vue';
import liff from '@line/liff';
import { useLiff } from '@/composables/useLiff';
import { attendanceService } from '@/services/attendanceService';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

const liffComposable = useLiff();

const loading = ref(true);
const scanning = ref(false);
const error = ref<string | null>(null);
const result = ref<{ type: 'clock-in' | 'clock-out'; time: string } | null>(null);
const staffInfo = ref<{ id: string; name: string } | null>(null);

onMounted(async () => {
  // LIFF 초기화
  const initialized = await liffComposable.init();
  if (!initialized) {
    error.value = liffComposable.error.value;
    loading.value = false;
    return;
  }

  // 로그인 확인
  if (!liffComposable.isLoggedIn.value) {
    liffComposable.login();
    return;
  }

  // TODO: 직원 정보 조회 (LINE 토큰으로)
  // 현재는 localStorage에서 임시로 가져옴
  const savedStaff = localStorage.getItem('liff_staff');
  if (savedStaff) {
    staffInfo.value = JSON.parse(savedStaff);
  }

  loading.value = false;
});

async function handleScan() {
  if (!liffComposable.isInClient.value) {
    error.value = 'QR 스캔은 LINE 앱에서만 가능합니다.';
    return;
  }

  scanning.value = true;
  error.value = null;
  result.value = null;

  try {
    // LIFF QR 스캔
    const scanResult = await liff.scanCodeV2();
    if (!scanResult.value) {
      error.value = 'QR 코드를 인식하지 못했습니다.';
      scanning.value = false;
      return;
    }

    // QR 데이터 파싱 (예: {"storeId":"xxx","qrToken":"xxx"})
    let qrData;
    try {
      qrData = JSON.parse(scanResult.value);
    } catch {
      error.value = '유효하지 않은 QR 코드입니다.';
      scanning.value = false;
      return;
    }

    if (!qrData.storeId || !qrData.qrToken) {
      error.value = '유효하지 않은 QR 코드입니다.';
      scanning.value = false;
      return;
    }

    // 출퇴근 API 호출
    const accessToken = liffComposable.getAccessToken();
    if (!accessToken) {
      error.value = 'LINE 인증 정보를 가져올 수 없습니다.';
      scanning.value = false;
      return;
    }

    // 출근/퇴근 판단은 서버에서 처리
    const response = await attendanceService.clockInWithToken(
      qrData.storeId,
      qrData.qrToken,
      accessToken
    );

    if (response.success && response.data) {
      result.value = {
        type: response.data.clockOutTime ? 'clock-out' : 'clock-in',
        time: response.data.clockOutTime || response.data.clockInTime,
      };
    } else {
      error.value = response.error || '출퇴근 처리에 실패했습니다.';
    }
  } catch (e) {
    console.error('Scan error:', e);
    error.value = 'QR 스캔에 실패했습니다.';
  } finally {
    scanning.value = false;
  }
}

function handleClose() {
  liffComposable.closeWindow();
}

function resetState() {
  error.value = null;
  result.value = null;
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
      <div v-else-if="error && !staffInfo" class="bg-white rounded-2xl shadow-lg p-6 text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 class="text-lg font-semibold text-gray-900 mb-2">오류</h2>
        <p class="text-gray-600">{{ error }}</p>
      </div>

      <!-- Success Result -->
      <div v-else-if="result" class="bg-white rounded-2xl shadow-lg p-6 text-center">
        <div
          class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
          :class="result.type === 'clock-in' ? 'bg-blue-100' : 'bg-orange-100'"
        >
          <svg
            v-if="result.type === 'clock-in'"
            class="w-10 h-10 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          <svg
            v-else
            class="w-10 h-10 text-orange-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-1">
          {{ result.type === 'clock-in' ? '출근' : '퇴근' }} 완료
        </h2>
        <p class="text-3xl font-mono text-gray-700 mb-6">{{ result.time }}</p>
        <div class="space-y-3">
          <button
            @click="resetState"
            class="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
          >
            다시 스캔
          </button>
          <button
            v-if="liffComposable.isInClient.value"
            @click="handleClose"
            class="w-full py-3 bg-gray-200 text-gray-600 rounded-xl font-medium"
          >
            닫기
          </button>
        </div>
      </div>

      <!-- Main Scan UI -->
      <div v-else class="bg-white rounded-2xl shadow-lg p-6">
        <div class="text-center mb-6">
          <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <h1 class="text-xl font-bold text-gray-900">출퇴근</h1>
          <p class="text-gray-500 text-sm mt-1">QR 코드를 스캔해주세요</p>
        </div>

        <div v-if="error" class="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl mb-4">
          {{ error }}
        </div>

        <button
          @click="handleScan"
          class="w-full py-4 bg-green-500 text-white rounded-xl font-medium text-lg disabled:bg-gray-300 flex items-center justify-center gap-2"
          :disabled="scanning"
        >
          <LoadingSpinner v-if="scanning" size="sm" />
          <span>{{ scanning ? '스캔 중...' : 'QR 스캔하기' }}</span>
        </button>

        <p v-if="!liffComposable.isInClient.value" class="text-xs text-gray-400 text-center mt-4">
          LINE 앱에서 실행해주세요
        </p>
      </div>
    </div>
  </div>
</template>
