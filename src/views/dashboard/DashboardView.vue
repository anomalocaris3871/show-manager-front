<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useStoreStore } from '@/stores/store';
import { useStaffStore } from '@/stores/staff';
import { useAttendanceStore } from '@/stores/attendance';
import { useShiftStore } from '@/stores/shift';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import dayjs from 'dayjs';

const router = useRouter();
const storeStore = useStoreStore();
const staffStore = useStaffStore();
const attendanceStore = useAttendanceStore();
const shiftStore = useShiftStore();

const today = dayjs().format('YYYY-MM-DD');

const todayShifts = computed(() => {
  return shiftStore.shiftsByDate(today);
});

const stats = computed(() => ({
  totalStaff: staffStore.activeStaff.length,
  linkedStaff: staffStore.linkedStaff.length,
  todayShiftCount: todayShifts.value.length,
  todayClockedIn: attendanceStore.todayAttendance.filter((a) => a.clockIn && !a.clockOut).length,
  pendingStaff: staffStore.pendingStaff.length,
}));

onMounted(async () => {
  await storeStore.fetchStore();

  // 店舗がなければ店舗設定へ移動
  if (!storeStore.currentStore) {
    router.push('/store-settings');
    return;
  }

  await Promise.all([
    staffStore.fetchStaff(),
    staffStore.fetchPendingStaff(),
    attendanceStore.fetchAttendance(),
    shiftStore.fetchShifts(),
  ]);
});

function formatTime(isoString: string | undefined): string {
  if (!isoString) return '-';
  return dayjs(isoString).format('HH:mm');
}

function getStaffName(staffId: string): string {
  const staff = staffStore.getStaffById(staffId);
  return staff?.name || '不明';
}
</script>

<template>
  <div v-if="storeStore.loading" class="flex items-center justify-center h-64">
    <LoadingSpinner size="lg" />
  </div>

  <div v-else class="space-y-10">
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <div class="card card-hover">
        <div class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">全スタッフ</div>
        <div class="text-4xl font-black text-slate-900">{{ stats.totalStaff }}<span class="text-base font-bold ml-1 text-slate-400">名</span></div>
        <div class="mt-5 flex items-center gap-2">
          <span class="px-3 py-1 bg-primary-50 text-primary-600 text-xs font-bold rounded-full border border-primary-100">
            LINE連携: {{ stats.linkedStaff }}名
          </span>
        </div>
      </div>

      <div class="card card-hover">
        <div class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">本日予定シフト</div>
        <div class="text-4xl font-black text-primary-600">{{ stats.todayShiftCount }}<span class="text-base font-bold ml-1 text-primary-400">件</span></div>
        <div class="mt-5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div class="h-full bg-primary-500" :style="{ width: '100%' }"></div>
        </div>
      </div>

      <div class="card card-hover">
        <div class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">現在勤務中</div>
        <div class="text-4xl font-black text-emerald-600">{{ stats.todayClockedIn }}<span class="text-base font-bold ml-1 text-emerald-400">名</span></div>
        <div class="mt-5 flex items-center gap-2">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span class="text-xs font-bold text-emerald-600 uppercase tracking-wide">Live Now</span>
        </div>
      </div>

      <RouterLink to="/staff" class="card card-hover group">
        <div class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">承認待ちスタッフ</div>
        <div class="text-4xl font-black text-orange-500">{{ stats.pendingStaff }}<span class="text-base font-bold ml-1 text-orange-400">名</span></div>
        <div class="mt-5 flex items-center justify-between">
          <span class="text-xs font-bold text-slate-400 group-hover:text-primary-600 transition-colors uppercase">管理画面へ</span>
          <svg class="w-5 h-5 text-slate-300 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </RouterLink>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <!-- Today's Shifts -->
      <div class="card">
        <div class="flex items-center justify-between mb-8">
          <h3 class="text-xl font-black text-slate-900 tracking-tight">本日のシフト</h3>
          <RouterLink to="/shifts" class="text-sm font-bold text-primary-600 hover:text-primary-700 uppercase tracking-widest">
            すべて見る
          </RouterLink>
        </div>

        <div v-if="todayShifts.length === 0" class="flex flex-col items-center justify-center py-16 text-slate-400">
          <svg class="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="text-base font-bold">本日予定のシフトはありません</p>
        </div>

        <ul v-else class="space-y-5">
          <li
            v-for="shift in todayShifts"
            :key="shift.id"
            class="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
          >
            <div class="flex items-center gap-5">
              <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
                <span class="text-white font-bold text-xl">
                  {{ getStaffName(shift.staffId).charAt(0) }}
                </span>
              </div>
              <div>
                <div class="font-bold text-lg text-slate-900">{{ getStaffName(shift.staffId) }}</div>
                <div class="text-sm font-bold text-slate-500">
                  {{ shift.startTime }} - {{ shift.endTime }}
                </div>
              </div>
            </div>
            <div class="px-4 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase tracking-wide">
              Scheduled
            </div>
          </li>
        </ul>
      </div>

      <!-- Recent Attendance -->
      <div class="card">
        <div class="flex items-center justify-between mb-8">
          <h3 class="text-xl font-black text-slate-900 tracking-tight">最近の出退勤</h3>
          <RouterLink to="/attendance" class="text-sm font-bold text-primary-600 hover:text-primary-700 uppercase tracking-widest">
            すべて見る
          </RouterLink>
        </div>

        <div v-if="attendanceStore.recentAttendance.length === 0" class="flex flex-col items-center justify-center py-16 text-slate-400">
          <svg class="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-base font-bold">出退勤記録がありません</p>
        </div>

        <ul v-else class="space-y-5">
          <li
            v-for="attendance in attendanceStore.recentAttendance.slice(0, 5)"
            :key="attendance.id"
            class="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
          >
            <div class="flex items-center gap-5">
              <div
                class="w-4 h-4 rounded-full shadow-sm"
                :class="attendance.clockOut ? 'bg-slate-300' : 'bg-emerald-500 ring-4 ring-emerald-50'"
              />
              <div>
                <div class="font-bold text-lg text-slate-900">{{ getStaffName(attendance.staffId) }}</div>
                <div class="text-xs font-bold text-slate-400 uppercase tracking-widest">{{ attendance.date }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm font-black text-slate-900">IN {{ formatTime(attendance.clockIn) }}</div>
              <div class="text-xs font-bold text-slate-400">
                OUT {{ formatTime(attendance.clockOut) }}
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
