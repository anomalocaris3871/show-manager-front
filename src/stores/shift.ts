import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Shift, ShiftForm, CalendarEvent } from '@/types';
import { shiftService } from '@/services/shiftService';
import { useStoreStore } from './store';
import { useStaffStore } from './staff';
import dayjs from 'dayjs';

// 스태프별 색상 매핑
const COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

export const useShiftStore = defineStore('shift', () => {
  const shifts = ref<Shift[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const selectedDate = ref(dayjs().format('YYYY-MM-DD'));
  const viewMode = ref<'dayGridMonth' | 'timeGridWeek'>('dayGridMonth');

  const calendarEvents = computed((): CalendarEvent[] => {
    const staffStore = useStaffStore();
    const colorMap = new Map<string, string>();

    staffStore.activeStaff.forEach((staff, index) => {
      colorMap.set(staff.id, COLORS[index % COLORS.length]);
    });

    return shifts.value.map((shift) => {
      const staff = staffStore.getStaffById(shift.staffId);
      const color = colorMap.get(shift.staffId) || '#6B7280';

      return {
        id: shift.id,
        title: staff?.name || '알 수 없음',
        start: `${shift.date}T${shift.startTime}`,
        end: `${shift.date}T${shift.endTime}`,
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
          staffId: shift.staffId,
          staffName: staff?.name || '알 수 없음',
          shiftId: shift.id,
        },
      };
    });
  });

  const shiftsByDate = computed(() => {
    return (date: string) => shifts.value.filter((s) => s.date === date);
  });

  const shiftsByStaff = computed(() => {
    return (staffId: string) => shifts.value.filter((s) => s.staffId === staffId);
  });

  async function fetchShifts(startDate?: string, endDate?: string) {
    const storeStore = useStoreStore();
    if (!storeStore.currentStore) return;

    loading.value = true;
    error.value = null;

    try {
      let result;

      if (startDate && endDate) {
        result = await shiftService.getByDateRange(
          storeStore.currentStore.id,
          startDate,
          endDate
        );
      } else {
        result = await shiftService.getByStoreId(storeStore.currentStore.id);
      }

      if (result.success && result.data) {
        shifts.value = result.data;
      } else {
        error.value = result.error || '시프트 목록을 불러오는데 실패했습니다.';
      }
    } finally {
      loading.value = false;
    }
  }

  async function createShift(form: ShiftForm) {
    const storeStore = useStoreStore();
    if (!storeStore.currentStore) return false;

    loading.value = true;
    error.value = null;

    try {
      const result = await shiftService.create(storeStore.currentStore.id, form);

      if (result.success && result.data) {
        shifts.value.push(result.data);
        return true;
      } else {
        error.value = result.error || '시프트 등록에 실패했습니다.';
        return false;
      }
    } finally {
      loading.value = false;
    }
  }

  async function updateShift(shiftId: string, form: ShiftForm) {
    loading.value = true;
    error.value = null;

    try {
      const result = await shiftService.update(shiftId, form);

      if (result.success && result.data) {
        const index = shifts.value.findIndex((s) => s.id === shiftId);
        if (index !== -1) {
          shifts.value[index] = result.data;
        }
        return true;
      } else {
        error.value = result.error || '시프트 수정에 실패했습니다.';
        return false;
      }
    } finally {
      loading.value = false;
    }
  }

  async function deleteShift(shiftId: string) {
    loading.value = true;
    error.value = null;

    try {
      const result = await shiftService.delete(shiftId);

      if (result.success) {
        shifts.value = shifts.value.filter((s) => s.id !== shiftId);
        return true;
      } else {
        error.value = result.error || '시프트 삭제에 실패했습니다.';
        return false;
      }
    } finally {
      loading.value = false;
    }
  }

  function setSelectedDate(date: string) {
    selectedDate.value = date;
  }

  function setViewMode(mode: 'dayGridMonth' | 'timeGridWeek') {
    viewMode.value = mode;
  }

  function getShiftById(shiftId: string): Shift | undefined {
    return shifts.value.find((s) => s.id === shiftId);
  }

  function clearShifts() {
    shifts.value = [];
  }

  return {
    shifts,
    loading,
    error,
    selectedDate,
    viewMode,
    calendarEvents,
    shiftsByDate,
    shiftsByStaff,
    fetchShifts,
    createShift,
    updateShift,
    deleteShift,
    setSelectedDate,
    setViewMode,
    getShiftById,
    clearShifts,
  };
});
