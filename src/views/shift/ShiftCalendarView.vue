<script setup lang="ts">
import { ref, onMounted } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { CalendarOptions, EventClickArg, DateSelectArg } from '@fullcalendar/core';
import { useShiftStore } from '@/stores/shift';
import { useStaffStore } from '@/stores/staff';
import { useStoreStore } from '@/stores/store';
import { useToast } from '@/composables/useToast';
import Modal from '@/components/common/Modal.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import type { ShiftForm, Shift } from '@/types';
import dayjs from 'dayjs';

const shiftStore = useShiftStore();
const staffStore = useStaffStore();
const storeStore = useStoreStore();
const toast = useToast();

const showModal = ref(false);
const isEdit = ref(false);
const selectedShiftId = ref<string | null>(null);

const form = ref<ShiftForm>({
  staffId: '',
  date: dayjs().format('YYYY-MM-DD'),
  startTime: '09:00',
  endTime: '18:00',
});

const calendarOptions: CalendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: 'ko',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek',
  },
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  displayEventTime: false,
  slotEventOverlap: false,
  events: [],
  select: handleDateSelect,
  eventClick: handleEventClick,
  height: 'auto',
  buttonText: {
    today: '오늘',
    month: '월간',
    week: '주간',
  },
};

const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null);

onMounted(async () => {
  if (!storeStore.currentStore) {
    await storeStore.fetchStore();
  }
  await Promise.all([staffStore.fetchStaff(), shiftStore.fetchShifts()]);

  // 캘린더에 이벤트 업데이트
  updateCalendarEvents();
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
  form.value = {
    staffId: staffStore.activeStaff[0]?.id || '',
    date: selectInfo.startStr,
    startTime: '09:00',
    endTime: '18:00',
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
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
    };
    showModal.value = true;
  }
}

async function handleSubmit() {
  let success: boolean;

  if (isEdit.value && selectedShiftId.value) {
    success = await shiftStore.updateShift(selectedShiftId.value, form.value);
  } else {
    success = await shiftStore.createShift(form.value);
  }

  if (success) {
    toast.success(isEdit.value ? '시프트가 수정되었습니다.' : '시프트가 등록되었습니다.');
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
      toast.success('시프트가 삭제되었습니다.');
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
  <div>
    <div v-if="shiftStore.loading && shiftStore.shifts.length === 0" class="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>

    <div v-else>
      <!-- Calendar -->
      <div class="card">
        <FullCalendar ref="calendarRef" :options="calendarOptions" />
      </div>
    </div>

    <!-- Shift Modal -->
    <Modal
      :is-open="showModal"
      :title="isEdit ? '시프트 수정' : '시프트 등록'"
      @close="closeModal"
    >
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="label">스태프</label>
          <select v-model="form.staffId" class="input" required>
            <option value="" disabled>스태프를 선택하세요</option>
            <option
              v-for="staff in staffStore.activeStaff"
              :key="staff.id"
              :value="staff.id"
            >
              {{ staff.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="label">날짜</label>
          <input v-model="form.date" type="date" class="input" required />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">시작 시간</label>
            <input v-model="form.startTime" type="time" class="input" required />
          </div>
          <div>
            <label class="label">종료 시간</label>
            <input v-model="form.endTime" type="time" class="input" required />
          </div>
        </div>

        <div v-if="shiftStore.error" class="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
          {{ shiftStore.error }}
        </div>
      </form>

      <template #footer>
        <div class="flex justify-between items-center">
          <button
            v-if="isEdit"
            @click="handleDelete"
            class="btn btn-danger"
          >
            삭제
          </button>
          <div v-else></div>
          <div class="flex gap-3">
            <button @click="closeModal" class="btn btn-secondary">
              취소
            </button>
            <button @click="handleSubmit" class="btn btn-primary" :disabled="shiftStore.loading">
              {{ shiftStore.loading ? '저장 중...' : (isEdit ? '수정' : '등록') }}
            </button>
          </div>
        </div>
      </template>
    </Modal>
  </div>
</template>

<style>
/* FullCalendar 스타일 커스터마이징 */
.fc {
  --fc-border-color: #e5e7eb;
  --fc-button-bg-color: #3b82f6;
  --fc-button-border-color: #3b82f6;
  --fc-button-hover-bg-color: #2563eb;
  --fc-button-hover-border-color: #2563eb;
  --fc-button-active-bg-color: #1d4ed8;
  --fc-button-active-border-color: #1d4ed8;
  --fc-today-bg-color: #eff6ff;
}

.fc .fc-button {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.fc .fc-toolbar-title {
  font-size: 1.25rem;
  font-weight: 600;
}

.fc .fc-daygrid-day-number {
  padding: 0.5rem;
  font-size: 0.875rem;
}

.fc .fc-event {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 0.25rem;
  cursor: pointer;
}
</style>
