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

async function handleDelete() {
  if (selectedStaff.value) {
    const success = await staffStore.deleteStaff(selectedStaff.value.id);
    if (success) {
      toast.success('スタッフを削除しました。');
    } else if (staffStore.error) {
      toast.error(staffStore.error);
    }
    showDeleteModal.value = false;
    selectedStaff.value = null;
  }
}

async function handleApprove(staff: Staff) {
  const success = await staffStore.approveStaff(staff.id);
  if (success) {
    toast.success(`${staff.name}さんを承認しました。`);
  } else if (staffStore.error) {
    toast.error(staffStore.error);
  }
}

async function handleReject(staff: Staff) {
  const success = await staffStore.rejectStaff(staff.id);
  if (success) {
    toast.success(`${staff.name}さんの登録申請を却下しました。`);
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
        全{{ staffStore.activeStaff.length }}名のスタッフ
      </div>
      <RouterLink to="/staff/new" class="btn btn-primary">
        スタッフ登録
      </RouterLink>
    </div>

    <!-- Pending Staff -->
    <div v-if="staffStore.pendingStaff.length > 0" class="card mb-6">
      <div class="flex items-center gap-2 mb-4">
        <div class="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
        <h3 class="font-semibold text-gray-900">承認待ち ({{ staffStore.pendingStaff.length }}名)</h3>
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
              <div class="text-sm text-gray-500">LINEから登録申請</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="handleReject(staff)"
              class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              却下
            </button>
            <button
              @click="handleApprove(staff)"
              class="px-3 py-1.5 text-sm bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors"
            >
              承認
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
      <div class="text-gray-500 mb-4">登録されたスタッフがいません</div>
      <RouterLink to="/staff/new" class="btn btn-primary">
        最初のスタッフを登録
      </RouterLink>
    </div>

    <!-- Staff List -->
    <div v-else class="card overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              名前
            </th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              LINE連携
            </th>
            <th class="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              管理
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
            <td class="px-6 py-4">
              <span
                v-if="staff.isLinked"
                class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-sm rounded-full"
              >
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                連携済み
              </span>
              <span v-else class="text-gray-400 text-sm">未連携</span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <RouterLink
                  :to="`/staff/${staff.id}/edit`"
                  class="text-gray-600 hover:text-gray-900"
                >
                  編集
                </RouterLink>
                <button
                  @click="openDeleteModal(staff)"
                  class="text-red-600 hover:text-red-700"
                >
                  削除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete Modal -->
    <Modal :is-open="showDeleteModal" @close="showDeleteModal = false">
      <template #header>スタッフ削除</template>
      <p class="text-gray-600">
        <strong class="text-gray-900">{{ selectedStaff?.name }}</strong>さんを削除しますか？
      </p>
      <p class="text-sm text-gray-500 mt-2">削除されたスタッフのシフトおよび出退勤記録は保持されます。</p>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button @click="showDeleteModal = false" class="btn btn-secondary">
            キャンセル
          </button>
          <button @click="handleDelete" class="btn btn-danger">
            削除
          </button>
        </div>
      </template>
    </Modal>

  </div>
</template>
