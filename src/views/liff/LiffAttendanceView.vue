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
  // LIFF初期化
  const initialized = await liffComposable.init();
  if (!initialized) {
    error.value = liffComposable.error.value;
    loading.value = false;
    return;
  }

  // ログイン確認
  if (!liffComposable.isLoggedIn.value) {
    liffComposable.login();
    return;
  }

  // TODO: スタッフ情報取得 (LINEトークンで)
  // 現在はlocalStorageから一時的に取得
  const savedStaff = localStorage.getItem('liff_staff');
  if (savedStaff) {
    staffInfo.value = JSON.parse(savedStaff);
  }

  loading.value = false;
});

async function handleScan() {
  if (!liffComposable.isInClient.value) {
    error.value = 'QRスキャンはLINEアプリでのみ可能です。';
    return;
  }

  scanning.value = true;
  error.value = null;
  result.value = null;

  try {
    // LIFF QRスキャン
    const scanResult = await liff.scanCodeV2();
    if (!scanResult.value) {
      error.value = 'QRコードを認識できませんでした。';
      scanning.value = false;
      return;
    }

    // QRデータパース (例: {"storeId":"xxx","qrToken":"xxx"})
    let qrData;
    try {
      qrData = JSON.parse(scanResult.value);
    } catch (_e) {
      error.value = '無効なQRコードです。';
      scanning.value = false;
      return;
    }

    if (!qrData.storeId || !qrData.qrToken) {
      error.value = '無効なQRコードです。';
      scanning.value = false;
      return;
    }

    // 出退勤API呼び出し
    const accessToken = liffComposable.getAccessToken();
    if (!accessToken) {
      error.value = 'LINE認証情報を取得できません。';
      scanning.value = false;
      return;
    }

    // 出勤/退勤の判断はサーバーで処理
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
      error.value = response.error || '出退勤処理に失敗しました。';
    }
  } catch (e) {
    console.error('Scan error:', e);
    error.value = 'QRスキャンに失敗しました。';
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

      <!-- Error (初期化失敗) -->
      <div v-else-if="error && !staffInfo" class="bg-white rounded-2xl shadow-lg p-6 text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 class="text-lg font-semibold text-gray-900 mb-2">エラー</h2>
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
          {{ result.type === 'clock-in' ? '出勤' : '退勤' }}完了
        </h2>
        <p class="text-3xl font-mono text-gray-700 mb-6">{{ result.time }}</p>
        <div class="space-y-3">
          <button
            @click="resetState"
            class="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
          >
            再スキャン
          </button>
          <button
            v-if="liffComposable.isInClient.value"
            @click="handleClose"
            class="w-full py-3 bg-gray-200 text-gray-600 rounded-xl font-medium"
          >
            閉じる
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
          <h1 class="text-xl font-bold text-gray-900">出退勤</h1>
          <p class="text-gray-500 text-sm mt-1">QRコードをスキャンしてください</p>
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
          <span>{{ scanning ? 'スキャン中...' : 'QRスキャン' }}</span>
        </button>

        <p v-if="!liffComposable.isInClient.value" class="text-xs text-gray-400 text-center mt-4">
          LINEアプリで実行してください
        </p>
      </div>
    </div>
  </div>
</template>
