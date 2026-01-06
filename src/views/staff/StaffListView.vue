<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { useStaffStore } from '@/stores/staff';
import { useStoreStore } from '@/stores/store';
import { useToast } from '@/composables/useToast';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Modal from '@/components/common/Modal.vue';
import type { Staff } from '@/types';

const staffStore = useStaffStore();
const storeStore = useStoreStore();
const toast = useToast();

const showDeleteModal = ref(false);
const showLinkCodeModal = ref(false);
const selectedStaff = ref<Staff | null>(null);

onMounted(async () => {
  if (!storeStore.currentStore) {
    await storeStore.fetchStore();
  }
  await Promise.all([
    staffStore.fetchStaff(),
    staffStore.fetchPendingStaff(),
  ]);
});

function openDeleteModal(staff: Staff) {
  selectedStaff.value = staff;
  showDeleteModal.value = true;
}

function openLinkCodeModal(staff: Staff) {
  selectedStaff.value = staff;
  showLinkCodeModal.value = true;
}

async function handleDelete() {
  if (selectedStaff.value) {
    const success = await staffStore.deleteStaff(selectedStaff.value.id);
    if (success) {
      toast.success('스태프가 삭제되었습니다.');
    } else if (staffStore.error) {
      toast.error(staffStore.error);
    }
    showDeleteModal.value = false;
    selectedStaff.value = null;
  }
}

async function handleRegenerateLinkCode() {
  if (selectedStaff.value) {
    const success = await staffStore.regenerateLinkCode(selectedStaff.value.id);
    if (success) {
      toast.success('연동 코드가 재발급되었습니다.');
      // 선택된 스태프 정보 업데이트
      selectedStaff.value = staffStore.getStaffById(selectedStaff.value.id) || null;
    } else if (staffStore.error) {
      toast.error(staffStore.error);
    }
  }
}

function formatWage(wage: number): string {
  return new Intl.NumberFormat('ko-KR').format(wage);
}

async function handleApprove(staff: Staff) {
  const success = await staffStore.approveStaff(staff.id);
  if (success) {
    toast.success(`${staff.name}님이 승인되었습니다.`);
  } else if (staffStore.error) {
    toast.error(staffStore.error);
  }
}

async function handleReject(staff: Staff) {
  const success = await staffStore.rejectStaff(staff.id);
  if (success) {
    toast.success(`${staff.name}님의 등록 요청이 거절되었습니다.`);
  } else if (staffStore.error) {
    toast.error(staffStore.error);
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="text-sm text-gray-600">
        총 {{ staffStore.activeStaff.length }}명의 스태프
      </div>
      <RouterLink to="/staff/new" class="btn btn-primary">
        스태프 등록
      </RouterLink>
    </div>

    <!-- Pending Staff -->
    <div v-if="staffStore.pendingStaff.length > 0" class="card mb-6">
      <div class="flex items-center gap-2 mb-4">
        <div class="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
        <h3 class="font-semibold text-gray-900">승인 대기 중 ({{ staffStore.pendingStaff.length }}명)</h3>
      </div>
      <div class="space-y-3">
        <div
          v-for="staff in staffStore.pendingStaff"
          :key="staff.id"
          class="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <span class="text-orange-700 font-medium">{{ staff.name.charAt(0) }}</span>
            </div>
            <div>
              <div class="font-medium text-gray-900">{{ staff.name }}</div>
              <div class="text-sm text-gray-500">LINE으로 등록 요청</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="handleReject(staff)"
              class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              거절
            </button>
            <button
              @click="handleApprove(staff)"
              class="px-3 py-1.5 text-sm bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors"
            >
              승인
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="staffStore.loading" class="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Empty State -->
    <div v-else-if="staffStore.activeStaff.length === 0" class="card text-center py-12">
      <div class="text-gray-500 mb-4">등록된 스태프가 없습니다</div>
      <RouterLink to="/staff/new" class="btn btn-primary">
        첫 스태프 등록하기
      </RouterLink>
    </div>

    <!-- Staff List -->
    <div v-else class="card overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              이름
            </th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              시급
            </th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              LINE 연동
            </th>
            <th class="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              관리
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="staff in staffStore.activeStaff" :key="staff.id">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span class="text-primary-700 font-medium">{{ staff.name.charAt(0) }}</span>
                </div>
                <div class="font-medium text-gray-900">{{ staff.name }}</div>
              </div>
            </td>
            <td class="px-6 py-4 text-gray-600">
              {{ formatWage(staff.hourlyWage) }}원
            </td>
            <td class="px-6 py-4">
              <span
                v-if="staff.isLinked"
                class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-sm rounded-full"
              >
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                연동됨
              </span>
              <button
                v-else
                @click="openLinkCodeModal(staff)"
                class="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                연동 코드 보기
              </button>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <RouterLink
                  :to="`/staff/${staff.id}/edit`"
                  class="text-gray-600 hover:text-gray-900"
                >
                  수정
                </RouterLink>
                <button
                  @click="openDeleteModal(staff)"
                  class="text-red-600 hover:text-red-700"
                >
                  삭제
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete Modal -->
    <Modal :is-open="showDeleteModal" title="스태프 삭제" @close="showDeleteModal = false">
      <p class="text-gray-600">
        <strong class="text-gray-900">{{ selectedStaff?.name }}</strong> 스태프를 삭제하시겠습니까?
      </p>
      <p class="text-sm text-gray-500 mt-2">삭제된 스태프의 시프트 및 출퇴근 기록은 유지됩니다.</p>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button @click="showDeleteModal = false" class="btn btn-secondary">
            취소
          </button>
          <button @click="handleDelete" class="btn btn-danger">
            삭제
          </button>
        </div>
      </template>
    </Modal>

    <!-- Link Code Modal -->
    <Modal :is-open="showLinkCodeModal" title="LINE 연동 코드" @close="showLinkCodeModal = false">
      <div class="text-center">
        <p class="text-gray-600 mb-4">
          아래 코드를 스태프에게 전달하세요
        </p>
        <div class="bg-gray-100 rounded-lg py-6 px-4">
          <div class="text-4xl font-mono font-bold text-primary-600 tracking-widest">
            {{ selectedStaff?.linkCode }}
          </div>
        </div>
        <p class="text-sm text-gray-500 mt-4">
          스태프가 LINE 앱에서 이 코드를 입력하면 연동이 완료됩니다
        </p>
      </div>

      <template #footer>
        <div class="flex justify-between items-center">
          <button
            @click="handleRegenerateLinkCode"
            class="text-sm text-gray-600 hover:text-gray-900"
          >
            코드 재발급
          </button>
          <button @click="showLinkCodeModal = false" class="btn btn-primary">
            확인
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>
