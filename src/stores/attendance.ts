import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Attendance } from '@/types';
import { attendanceService } from '@/services/attendanceService';
import { useStoreStore } from './store';
import { useAuthStore } from './auth';
import dayjs from 'dayjs';

export const useAttendanceStore = defineStore('attendance', () => {
  const attendanceList = ref<Attendance[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const todayAttendance = computed(() => {
    const today = dayjs().format('YYYY-MM-DD');
    return attendanceList.value.filter((a) => a.date === today);
  });

  const recentAttendance = computed(() => {
    return [...attendanceList.value]
      .sort((a, b) => {
        const dateA = a.clockIn || a.createdAt;
        const dateB = b.clockIn || b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      })
      .slice(0, 10);
  });

  async function fetchAttendance(startDate?: string, endDate?: string) {
    const storeStore = useStoreStore();
    if (!storeStore.currentStore) return;

    loading.value = true;
    error.value = null;

    try {
      let result;

      if (startDate && endDate) {
        result = await attendanceService.getByDateRange(
          storeStore.currentStore.id,
          startDate,
          endDate
        );
      } else {
        result = await attendanceService.getByStoreId(storeStore.currentStore.id);
      }

      if (result.success && result.data) {
        attendanceList.value = result.data;
      } else {
        error.value = result.error || '出退勤記録の取得に失敗しました。';
      }
    } finally {
      loading.value = false;
    }
  }

  async function clockIn(staffId: string) {
    const storeStore = useStoreStore();
    if (!storeStore.currentStore) return false;

    loading.value = true;
    error.value = null;

    try {
      const result = await attendanceService.clockIn(
        storeStore.currentStore.id,
        staffId
      );

      if (result.success && result.data) {
        attendanceList.value.push(result.data);
        return true;
      } else {
        error.value = result.error || '出勤処理に失敗しました。';
        return false;
      }
    } finally {
      loading.value = false;
    }
  }

  async function clockOut(staffId: string) {
    loading.value = true;
    error.value = null;

    try {
      const result = await attendanceService.clockOut(staffId);

      if (result.success && result.data) {
        const index = attendanceList.value.findIndex((a) => a.id === result.data!.id);
        if (index !== -1) {
          attendanceList.value[index] = result.data;
        }
        return true;
      } else {
        error.value = result.error || '退勤処理に失敗しました。';
        return false;
      }
    } finally {
      loading.value = false;
    }
  }

  async function manualAdjust(
    attendanceId: string,
    clockIn?: string,
    clockOut?: string,
    note?: string
  ) {
    const authStore = useAuthStore();
    if (!authStore.manager) return false;

    loading.value = true;
    error.value = null;

    try {
      const result = await attendanceService.manualAdjust(
        attendanceId,
        authStore.manager.id,
        clockIn,
        clockOut,
        note
      );

      if (result.success && result.data) {
        const index = attendanceList.value.findIndex((a) => a.id === attendanceId);
        if (index !== -1) {
          attendanceList.value[index] = result.data;
        }
        return true;
      } else {
        error.value = result.error || '出退勤記録の更新に失敗しました。';
        return false;
      }
    } finally {
      loading.value = false;
    }
  }

  function getAttendanceByStaffId(staffId: string): Attendance[] {
    return attendanceList.value.filter((a) => a.staffId === staffId);
  }

  function getAttendanceByDate(date: string): Attendance[] {
    return attendanceList.value.filter((a) => a.date === date);
  }

  function clearAttendance() {
    attendanceList.value = [];
  }

  return {
    attendanceList,
    loading,
    error,
    todayAttendance,
    recentAttendance,
    fetchAttendance,
    clockIn,
    clockOut,
    manualAdjust,
    getAttendanceByStaffId,
    getAttendanceByDate,
    clearAttendance,
  };
});
