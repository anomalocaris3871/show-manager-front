<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useStoreStore } from '@/stores/store';
import { useStaffStore } from '@/stores/staff';
import { useShiftStore } from '@/stores/shift';
import { useAttendanceStore } from '@/stores/attendance';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const storeStore = useStoreStore();
const staffStore = useStaffStore();
const shiftStore = useShiftStore();
const attendanceStore = useAttendanceStore();

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    dashboard: '대시보드',
    'store-settings': '매장 설정',
    'staff-list': '스태프 관리',
    'staff-new': '스태프 등록',
    'staff-edit': '스태프 수정',
    'shift-calendar': '시프트 관리',
    'attendance-list': '출퇴근 관리',
    'qr-display': 'QR코드 표시',
  };
  return titles[route.name as string] || '';
});

async function handleLogout() {
  await authStore.logout();
  storeStore.clearStore();
  staffStore.clearStaff();
  shiftStore.clearShifts();
  attendanceStore.clearAttendance();
  router.push('/login');
}
</script>

<template>
  <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
    <div class="flex items-center justify-between px-6 py-4">
      <h1 class="text-xl font-semibold text-gray-900">
        {{ pageTitle }}
      </h1>

      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-600">
          {{ authStore.manager?.email }}
        </span>
        <button
          @click="handleLogout"
          class="text-sm text-gray-500 hover:text-gray-700"
        >
          로그아웃
        </button>
      </div>
    </div>
  </header>
</template>
