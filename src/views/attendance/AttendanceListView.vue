<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAttendanceStore } from '@/stores/attendance';
import { useStaffStore } from '@/stores/staff';
import { useStoreStore } from '@/stores/store';
import { useToast } from '@/composables/useToast';
import Modal from '@/components/common/Modal.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import type { Attendance } from '@/types';
import dayjs from 'dayjs';

const attendanceStore = useAttendanceStore();
const staffStore = useStaffStore();
const storeStore = useStoreStore();
const toast = useToast();

const selectedMonth = ref(dayjs().format('YYYY-MM'));
const selectedStaffId = ref<string | null>(null);

const showEditModal = ref(false);
const editingAttendance = ref<Attendance | null>(null);
const editForm = ref({
  clockIn: '',
  clockOut: '',
  note: '',
});

const filteredAttendance = computed(() => {
  let list = [...attendanceStore.attendanceList];

  // 월 필터
  list = list.filter((a) => a.date.startsWith(selectedMonth.value));

  // 스태프 필터
  if (selectedStaffId.value) {
    list = list.filter((a) => a.staffId === selectedStaffId.value);
  }

  // 날짜 내림차순 정렬
  return list.sort((a, b) => b.date.localeCompare(a.date));
});

onMounted(async () => {
  if (!storeStore.currentStore) {
    await storeStore.fetchStore();
  }
  await Promise.all([staffStore.fetchStaff(), attendanceStore.fetchAttendance()]);
});

function getStaffName(staffId: string): string {
  const staff = staffStore.getStaffById(staffId);
  return staff?.name || '알 수 없음';
}

function formatDateTime(isoString: string | undefined): string {
  if (!isoString) return '-';
  return dayjs(isoString).format('HH:mm');
}

function formatDuration(clockIn?: string, clockOut?: string): string {
  if (!clockIn || !clockOut) return '-';
  const start = dayjs(clockIn);
  const end = dayjs(clockOut);
  const minutes = end.diff(start, 'minute');
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}시간 ${mins}분`;
}

function openEditModal(attendance: Attendance) {
  editingAttendance.value = attendance;
  editForm.value = {
    clockIn: attendance.clockIn ? dayjs(attendance.clockIn).format('HH:mm') : '',
    clockOut: attendance.clockOut ? dayjs(attendance.clockOut).format('HH:mm') : '',
    note: attendance.note || '',
  };
  showEditModal.value = true;
}

async function handleSaveEdit() {
  if (!editingAttendance.value) return;

  const clockIn = editForm.value.clockIn
    ? dayjs(`${editingAttendance.value.date}T${editForm.value.clockIn}`).toISOString()
    : undefined;
  const clockOut = editForm.value.clockOut
    ? dayjs(`${editingAttendance.value.date}T${editForm.value.clockOut}`).toISOString()
    : undefined;

  const success = await attendanceStore.manualAdjust(
    editingAttendance.value.id,
    clockIn,
    clockOut,
    editForm.value.note || undefined
  );

  if (success) {
    toast.success('출퇴근 기록이 수정되었습니다.');
    showEditModal.value = false;
    editingAttendance.value = null;
  } else if (attendanceStore.error) {
    toast.error(attendanceStore.error);
  }
}
</script>

<template>
  <div>
    <!-- Filters -->
    <div class="card mb-6">
      <div class="flex flex-wrap gap-4">
        <div>
          <label class="label">월 선택</label>
          <input
            v-model="selectedMonth"
            type="month"
            class="input w-auto"
          />
        </div>
        <div>
          <label class="label">스태프</label>
          <select v-model="selectedStaffId" class="input w-auto">
            <option :value="null">전체</option>
            <option
              v-for="staff in staffStore.activeStaff"
              :key="staff.id"
              :value="staff.id"
            >
              {{ staff.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="attendanceStore.loading" class="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredAttendance.length === 0" class="card text-center py-12">
      <div class="text-gray-500">출퇴근 기록이 없습니다</div>
    </div>

    <!-- Attendance List -->
    <div v-else class="card overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              날짜
            </th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              스태프
            </th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              출근
            </th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              퇴근
            </th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              근무시간
            </th>
            <th class="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              관리
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="attendance in filteredAttendance" :key="attendance.id">
            <td class="px-6 py-4 text-gray-900">
              {{ dayjs(attendance.date).format('MM/DD (ddd)') }}
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900">
                  {{ getStaffName(attendance.staffId) }}
                </span>
                <span
                  v-if="attendance.manuallyAdjusted"
                  class="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded"
                >
                  수정됨
                </span>
              </div>
            </td>
            <td class="px-6 py-4 text-gray-600">
              {{ formatDateTime(attendance.clockIn) }}
            </td>
            <td class="px-6 py-4 text-gray-600">
              {{ formatDateTime(attendance.clockOut) }}
            </td>
            <td class="px-6 py-4 text-gray-600">
              {{ formatDuration(attendance.clockIn, attendance.clockOut) }}
            </td>
            <td class="px-6 py-4 text-right">
              <button
                @click="openEditModal(attendance)"
                class="text-primary-600 hover:text-primary-700 text-sm"
              >
                수정
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit Modal -->
    <Modal :is-open="showEditModal" title="출퇴근 수정" @close="showEditModal = false">
      <form @submit.prevent="handleSaveEdit" class="space-y-4">
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <div class="text-sm text-gray-600">
            {{ editingAttendance?.date }} -
            {{ getStaffName(editingAttendance?.staffId || '') }}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">출근 시간</label>
            <input v-model="editForm.clockIn" type="time" class="input" />
          </div>
          <div>
            <label class="label">퇴근 시간</label>
            <input v-model="editForm.clockOut" type="time" class="input" />
          </div>
        </div>

        <div>
          <label class="label">수정 사유</label>
          <textarea
            v-model="editForm.note"
            class="input"
            rows="2"
            placeholder="수정 사유를 입력하세요 (선택)"
          />
        </div>

        <div v-if="attendanceStore.error" class="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
          {{ attendanceStore.error }}
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button @click="showEditModal = false" class="btn btn-secondary">
            취소
          </button>
          <button @click="handleSaveEdit" class="btn btn-primary" :disabled="attendanceStore.loading">
            {{ attendanceStore.loading ? '저장 중...' : '저장' }}
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>
