<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAttendanceStore } from '@/stores/attendance';
import { useStaffStore } from '@/stores/staff';
import { useStoreStore } from '@/stores/store';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import dayjs from 'dayjs';

const attendanceStore = useAttendanceStore();
const staffStore = useStaffStore();
const storeStore = useStoreStore();

const selectedMonth = ref(dayjs().format('YYYY-MM'));

onMounted(async () => {
  if (!storeStore.currentStore) {
    await storeStore.fetchStore();
  }
  await Promise.all([
    staffStore.fetchStaff(),
    attendanceStore.fetchAttendance(),
  ]);
});

const filteredAttendance = computed(() => {
  return attendanceStore.attendanceList.filter((a) => {
    return a.date.startsWith(selectedMonth.value);
  }).sort((a, b) => b.date.localeCompare(a.date));
});

function formatTime(isoString: string | undefined): string {
  if (!isoString) return '-';
  return dayjs(isoString).format('HH:mm');
}

function getStaffName(staffId: string): string {
  const staff = staffStore.getStaffById(staffId);
  return staff?.name || '不明';
}

function calculateDuration(clockIn: string, clockOut: string | undefined): string {
  if (!clockOut) return '-';
  const start = dayjs(clockIn);
  const end = dayjs(clockOut);
  const diff = end.diff(start, 'minute');
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  return `${hours}h ${minutes}m`;
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header & Filter -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <h2 class="text-3xl font-black text-slate-900 tracking-tight">出退勤管理</h2>
        <p class="text-base font-bold text-slate-500 mt-1">スタッフの勤務記録を確認・管理します</p>
      </div>
      <div class="flex flex-col gap-2">
        <label class="label">表示月を選択</label>
        <input
          v-model="selectedMonth"
          type="month"
          class="input text-lg w-full md:w-64 shadow-sm"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="attendanceStore.loading" class="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredAttendance.length === 0" class="card flex flex-col items-center justify-center py-24 text-center">
      <div class="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mb-8">
        <svg class="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 class="text-xl font-bold text-slate-900 mb-3">記録が見つかりません</h3>
      <p class="text-base text-slate-500 max-w-sm">選択された月の出退勤記録はまだありません。</p>
    </div>

    <!-- Attendance Table -->
    <div v-else class="card overflow-hidden !p-0">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-100">
              <th class="text-left px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                日付
              </th>
              <th class="text-left px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                スタッフ
              </th>
              <th class="text-left px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                出勤
              </th>
              <th class="text-left px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                退勤
              </th>
              <th class="text-right px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                勤務時間
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="record in filteredAttendance" :key="record.id" class="hover:bg-slate-50/50 transition-colors group">
              <td class="px-8 py-6">
                <div class="font-bold text-lg text-slate-900">{{ record.date }}</div>
              </td>
              <td class="px-8 py-6">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-primary-500 transition-colors">
                    <span class="text-slate-500 font-bold text-base group-hover:text-white transition-colors">{{ getStaffName(record.staffId).charAt(0) }}</span>
                  </div>
                  <div class="font-bold text-lg text-slate-900">{{ getStaffName(record.staffId) }}</div>
                </div>
              </td>
              <td class="px-8 py-6">
                <div class="font-black text-lg text-slate-900">{{ formatTime(record.clockIn) }}</div>
              </td>
              <td class="px-8 py-6">
                <div class="font-black text-lg text-slate-900">{{ formatTime(record.clockOut) }}</div>
              </td>
              <td class="px-8 py-6 text-right">
                <span class="inline-flex items-center px-4 py-1.5 bg-primary-50 text-primary-600 text-sm font-black rounded-full border border-primary-100">
                  {{ calculateDuration(record.clockIn, record.clockOut) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
