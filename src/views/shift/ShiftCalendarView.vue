<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { CalendarOptions, EventClickArg, DateSelectArg } from '@fullcalendar/core';
import { useShiftStore } from '@/stores/shift';
import { useStaffStore } from '@/stores/staff';
import { useStoreStore } from '@/stores/store';
import { useToast } from '@/composables/useToast';
import Modal from '@/components/common/Modal.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import type { ShiftForm } from '@/types';
import dayjs from 'dayjs';

const shiftStore = useShiftStore();
const staffStore = useStaffStore();
const storeStore = useStoreStore();
const toast = useToast();

const showModal = ref(false);
const isEdit = ref(false);
const selectedShiftId = ref<string | null>(null);

const form = ref({
  staffId: '',
  startDate: dayjs().format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD'),
  startTime: '09:00',
  endTime: '18:00',
});

const calendarOptions: CalendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
  initialView: window.innerWidth < 768 ? 'listWeek' : 'dayGridMonth',
  locale: 'ja',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,listWeek',
  },
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  displayEventTime: false,
  slotEventOverlap: false,
  eventOverlap: false,
  events: [],
  select: handleDateSelect,
  eventClick: handleEventClick,
  height: 'auto',
  buttonText: {
    today: '今日',
    month: '月',
    week: '週',
    list: 'リスト',
  },
};

const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null);

function handleResize() {
  if (calendarRef.value) {
    const calendarApi = calendarRef.value.getApi();
    if (window.innerWidth < 768) {
      calendarApi.changeView('listWeek');
    } else {
      calendarApi.changeView('dayGridMonth');
    }
  }
}

onMounted(async () => {
  window.addEventListener('resize', handleResize);

  if (!storeStore.currentStore) {
    await storeStore.fetchStore();
  }
  await Promise.all([staffStore.fetchStaff(), shiftStore.fetchShifts()]);

  // カレンダーにイベント更新
  updateCalendarEvents();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

function updateCalendarEvents() {
  if (calendarRef.value) {
    const calendarApi = calendarRef.value.getApi();
    calendarApi.removeAllEvents();
    shiftStore.calendarEvents.forEach((event) => {
      calendarApi.addEvent(event);
    });
  }
}

function handleDateSelect(selectInfo: DateSelectArg) {
  isEdit.value = false;
  selectedShiftId.value = null;

  // 週間ビューで時間スロットクリック時にその時間を使用
  const startDate = dayjs(selectInfo.start);
  // FullCalendar returns exclusive end date, so subtract 1 day for all-day selection
  const endDate = selectInfo.allDay
    ? dayjs(selectInfo.end).subtract(1, 'day')
    : dayjs(selectInfo.end);
  const isTimeSlotSelect = !selectInfo.allDay;

  form.value = {
    staffId: staffStore.activeStaff[0]?.id || '',
    startDate: startDate.format('YYYY-MM-DD'),
    endDate: endDate.format('YYYY-MM-DD'),
    startTime: isTimeSlotSelect ? startDate.format('HH:mm') : '09:00',
    endTime: isTimeSlotSelect ? endDate.format('HH:mm') : '18:00',
  };
  showModal.value = true;
  selectInfo.view.calendar.unselect();
}

function handleEventClick(clickInfo: EventClickArg) {
  const shiftId = clickInfo.event.extendedProps.shiftId;
  const shift = shiftStore.getShiftById(shiftId);

  if (shift) {
    isEdit.value = true;
    selectedShiftId.value = shiftId;
    form.value = {
      staffId: shift.staffId,
      startDate: shift.date,
      endDate: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
    };
    showModal.value = true;
  }
}

async function handleSubmit() {
  const start = dayjs(form.value.startDate);
  const end = dayjs(form.value.endDate);
  const daysDiff = end.diff(start, 'day') + 1;

  if (daysDiff > 31) {
    toast.error('一度に登録できるのは31日までです。');
    return;
  }

  const shiftForm: ShiftForm = {
    staffId: form.value.staffId,
    startDate: form.value.startDate,
    endDate: form.value.endDate,
    startTime: form.value.startTime,
    endTime: form.value.endTime,
  };

  let success: boolean;

  if (isEdit.value && selectedShiftId.value) {
    success = await shiftStore.updateShift(selectedShiftId.value, shiftForm);
    if (success) {
      toast.success('シフトを更新しました。');
    }
  } else {
    success = await shiftStore.createShift(shiftForm);
    if (success) {
      const msg = daysDiff > 1 ? `${daysDiff}件のシフトを登録しました。` : 'シフトを登録しました。';
      toast.success(msg);
    }
  }

  if (success) {
    showModal.value = false;
    updateCalendarEvents();
  } else if (shiftStore.error) {
    toast.error(shiftStore.error);
  }
}

async function handleDelete() {
  if (selectedShiftId.value) {
    const success = await shiftStore.deleteShift(selectedShiftId.value);
    if (success) {
      toast.success('シフトを削除しました。');
      showModal.value = false;
      updateCalendarEvents();
    } else if (shiftStore.error) {
      toast.error(shiftStore.error);
    }
  }
}

function closeModal() {
  showModal.value = false;
  selectedShiftId.value = null;
}
</script>

<template>
  <div class="space-y-8">
    <div v-if="shiftStore.loading && shiftStore.shifts.length === 0" class="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>

    <div v-else>
      <!-- Calendar -->
      <div class="card overflow-hidden !p-0">
        <FullCalendar ref="calendarRef" :options="calendarOptions" />
      </div>
    </div>

    <!-- Shift Modal -->
    <Modal :is-open="showModal" @close="closeModal">
      <template #header>{{ isEdit ? 'シフト編集' : 'シフト登録' }}</template>
      <form @submit.prevent="handleSubmit" class="space-y-8 py-4">
        <div>
          <label class="label">スタッフ</label>
          <select v-model="form.staffId" class="input text-lg" required>
            <option value="" disabled>スタッフを選択してください</option>
            <option
              v-for="staff in staffStore.activeStaff"
              :key="staff.id"
              :value="staff.id"
            >
              {{ staff.name }}
            </option>
          </select>
        </div>

        <div v-if="isEdit">
          <label class="label">日付</label>
          <input v-model="form.startDate" type="date" class="input text-lg" required />
        </div>

        <div v-else class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">開始日</label>
            <input v-model="form.startDate" type="date" class="input text-lg" required />
          </div>
          <div>
            <label class="label">終了日</label>
            <input v-model="form.endDate" type="date" class="input text-lg" :min="form.startDate" required />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-8">
          <div>
            <label class="label">開始時間</label>
            <input v-model="form.startTime" type="time" class="input text-lg" required />
          </div>
          <div>
            <label class="label">終了時間</label>
            <input v-model="form.endTime" type="time" class="input text-lg" required />
          </div>
        </div>

        <div v-if="shiftStore.error" class="text-sm font-bold text-red-600 bg-red-50 px-5 py-4 rounded-xl border border-red-100">
          {{ shiftStore.error }}
        </div>
      </form>

      <template #footer>
        <div class="flex justify-between items-center w-full">
          <button
            v-if="isEdit"
            @click="handleDelete"
            class="btn btn-danger px-6 py-3"
          >
            削除
          </button>
          <div v-else></div>
          <div class="flex gap-4">
            <button @click="closeModal" class="btn btn-secondary px-6 py-3">
              キャンセル
            </button>
            <button @click="handleSubmit" class="btn btn-primary px-8 py-3" :disabled="shiftStore.loading">
              {{ shiftStore.loading ? '保存中...' : (isEdit ? '更新' : '登録') }}
            </button>
          </div>
        </div>
      </template>
    </Modal>
  </div>
</template>

<style>
/* FullCalendar スタイルカスタマイズ */
.fc {
  --fc-border-color: #f1f5f9;
  --fc-button-bg-color: #435ef1;
  --fc-button-border-color: #435ef1;
  --fc-button-hover-bg-color: #2c3ee6;
  --fc-button-hover-border-color: #2c3ee6;
  --fc-button-active-bg-color: #232ecf;
  --fc-button-active-border-color: #232ecf;
  --fc-today-bg-color: #f5f7ff;
  --fc-event-bg-color: #435ef1;
  --fc-event-border-color: #435ef1;
}

.fc .fc-button {
  padding: 0.8rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 800;
  border-radius: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.2s;
}

.fc .fc-button:focus {
  box-shadow: 0 0 0 4px rgba(67, 94, 241, 0.1) !important;
}

.fc .fc-toolbar-title {
  font-size: 1.5rem;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.02em;
  padding: 1rem 0;
}

.fc .fc-col-header-cell {
  padding: 1.25rem 0;
  background: #f8fafc;
}

.fc .fc-col-header-cell-cushion {
  font-size: 0.875rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.fc .fc-daygrid-day-number {
  padding: 1rem;
  font-size: 1rem;
  font-weight: 700;
  color: #475569;
}

.fc .fc-event {
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 800;
  border-radius: 0.6rem;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(67, 94, 241, 0.15);
  border: none;
}

.fc .fc-list-event {
  cursor: pointer;
}

.fc .fc-list-day-cushion {
  background: #f8fafc;
  padding: 1rem 1.5rem;
}

.fc .fc-list-event-title {
  font-weight: 700;
  font-size: 1rem;
  padding: 1rem !important;
}

.fc .fc-list-event-time {
  font-weight: 800;
  font-size: 1rem;
  padding: 1rem !important;
}
</style>
