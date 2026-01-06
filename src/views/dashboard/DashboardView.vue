<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
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
}));

onMounted(async () => {
  await storeStore.fetchStore();

  // 매장이 없으면 매장 설정으로 이동
  if (!storeStore.currentStore) {
    router.push('/store-settings');
    return;
  }

  await Promise.all([
    staffStore.fetchStaff(),
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
  return staff?.name || '알 수 없음';
}
</script>

<template>
  <div v-if="storeStore.loading" class="flex items-center justify-center h-64">
    <LoadingSpinner size="lg" />
  </div>

  <div v-else class="space-y-6">
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card">
        <div class="text-sm text-gray-600">전체 스태프</div>
        <div class="text-3xl font-bold text-gray-900 mt-1">{{ stats.totalStaff }}명</div>
        <div class="text-xs text-gray-500 mt-1">LINE 연동: {{ stats.linkedStaff }}명</div>
      </div>

      <div class="card">
        <div class="text-sm text-gray-600">오늘 예정 시프트</div>
        <div class="text-3xl font-bold text-primary-600 mt-1">{{ stats.todayShiftCount }}건</div>
      </div>

      <div class="card">
        <div class="text-sm text-gray-600">현재 근무 중</div>
        <div class="text-3xl font-bold text-green-600 mt-1">{{ stats.todayClockedIn }}명</div>
      </div>

      <div class="card">
        <div class="text-sm text-gray-600">오늘 날짜</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">
          {{ dayjs().format('MM월 DD일 (ddd)') }}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Today's Shifts -->
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">오늘의 시프트</h3>

        <div v-if="todayShifts.length === 0" class="text-gray-500 text-center py-8">
          오늘 예정된 시프트가 없습니다
        </div>

        <ul v-else class="space-y-3">
          <li
            v-for="shift in todayShifts"
            :key="shift.id"
            class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span class="text-primary-700 font-medium">
                  {{ getStaffName(shift.staffId).charAt(0) }}
                </span>
              </div>
              <div>
                <div class="font-medium text-gray-900">{{ getStaffName(shift.staffId) }}</div>
                <div class="text-sm text-gray-500">
                  {{ shift.startTime }} - {{ shift.endTime }}
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <!-- Recent Attendance -->
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">최근 출퇴근</h3>

        <div v-if="attendanceStore.recentAttendance.length === 0" class="text-gray-500 text-center py-8">
          출퇴근 기록이 없습니다
        </div>

        <ul v-else class="space-y-3">
          <li
            v-for="attendance in attendanceStore.recentAttendance.slice(0, 5)"
            :key="attendance.id"
            class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-2 h-2 rounded-full"
                :class="attendance.clockOut ? 'bg-gray-400' : 'bg-green-500'"
              />
              <div>
                <div class="font-medium text-gray-900">{{ getStaffName(attendance.staffId) }}</div>
                <div class="text-sm text-gray-500">{{ attendance.date }}</div>
              </div>
            </div>
            <div class="text-right text-sm">
              <div class="text-gray-900">출근 {{ formatTime(attendance.clockIn) }}</div>
              <div class="text-gray-500">
                퇴근 {{ formatTime(attendance.clockOut) }}
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
