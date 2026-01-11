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

  // 月フィルター
  list = list.filter((a) => a.date.startsWith(selectedMonth.value));

  // スタッフフィルター
  if (selectedStaffId.value) {
    list = list.filter((a) => a.staffId === selectedStaffId.value);
  }

  // 日付降順ソート
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
  return staff?.name || '不明';
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
  return `${hours}時間${mins}分`;
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
    toast.success('出退勤記録を更新しました。');
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
          <label class="label">月選択</label>
          <input
            v-model="selectedMonth"
            type="month"
            class="input w-auto"
          />
        </div>
        <div>
          <label class="label">スタッフ</label>
          <select v-model="selectedStaffId" class="input w-auto">
            <option :value="null">全員</option>
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
      <div class="text-gray-500">出退勤記録がありません</div>
    </div>

    <!-- Attendance List -->
    <div v-else class="card overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              日付
            </th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              スタッフ
            </th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              出勤
            </th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              退勤
            </th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              勤務時間
            </th>
            <th class="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              管理
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
                  修正済み
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
                編集
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit Modal -->
    <Modal :is-open="showEditModal" @close="showEditModal = false">
      <template #header>出退勤編集</template>
      <form @submit.prevent="handleSaveEdit" class="space-y-4">
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <div class="text-sm text-gray-600">
            {{ editingAttendance?.date }} -
            {{ getStaffName(editingAttendance?.staffId || '') }}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">出勤時間</label>
            <input v-model="editForm.clockIn" type="time" class="input" />
          </div>
          <div>
            <label class="label">退勤時間</label>
            <input v-model="editForm.clockOut" type="time" class="input" />
          </div>
        </div>

        <div>
          <label class="label">修正理由</label>
          <textarea
            v-model="editForm.note"
            class="input"
            rows="2"
            placeholder="修正理由を入力してください（任意）"
          />
        </div>

        <div v-if="attendanceStore.error" class="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
          {{ attendanceStore.error }}
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button @click="showEditModal = false" class="btn btn-secondary">
            キャンセル
          </button>
          <button @click="handleSaveEdit" class="btn btn-primary" :disabled="attendanceStore.loading">
            {{ attendanceStore.loading ? '保存中...' : '保存' }}
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>
