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
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-black text-slate-900 tracking-tight">スタッフ管理</h2>
        <p class="text-base font-bold text-slate-500 mt-1">全{{ staffStore.activeStaff.length }}名のスタッフが登録されています</p>
      </div>
      <RouterLink to="/staff/new" class="btn btn-primary shadow-lg shadow-primary-500/20 px-6 py-3">
        スタッフ登録
      </RouterLink>
    </div>

    <!-- Pending Staff -->
    <div v-if="staffStore.pendingStaff.length > 0" class="card border-orange-100 bg-orange-50/30">
      <div class="flex items-center gap-3 mb-6">
        <div class="relative flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
        </div>
        <h3 class="font-black text-xl text-slate-900 tracking-tight">承認待ち ({{ staffStore.pendingStaff.length }}名)</h3>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="staff in staffStore.pendingStaff"
          :key="staff.id"
          class="flex items-center justify-between p-5 bg-white border border-orange-100 rounded-2xl shadow-sm"
        >
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
              <span class="text-orange-700 font-bold text-xl">{{ staff.name.charAt(0) }}</span>
            </div>
            <div>
              <div class="font-bold text-lg text-slate-900">{{ staff.name }}</div>
              <div class="text-xs font-bold text-orange-500 uppercase tracking-wider">LINE Registration</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button
              @click="handleReject(staff)"
              class="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="却下"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              @click="handleApprove(staff)"
              class="px-5 py-2.5 bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 rounded-xl shadow-sm shadow-emerald-500/20 transition-all"
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
    <div v-else-if="staffStore.activeStaff.length === 0" class="card flex flex-col items-center justify-center py-24 text-center">
      <div class="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mb-8">
        <svg class="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
      <h3 class="text-xl font-bold text-slate-900 mb-3">登録されたスタッフがいません</h3>
      <p class="text-base text-slate-500 mb-10 max-w-sm">スタッフを登録して、シフト管理や出退勤管理を始めましょう。</p>
      <RouterLink to="/staff/new" class="btn btn-primary px-10 py-3.5 text-lg">
        最初のスタッフを登録
      </RouterLink>
    </div>

    <!-- Staff List -->
    <div v-else class="card overflow-hidden !p-0">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-100">
              <th class="text-left px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                スタッフ名
              </th>
              <th class="text-left px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                LINE連携状況
              </th>
              <th class="text-right px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                アクション
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="staff in staffStore.activeStaff" :key="staff.id" class="hover:bg-slate-50/50 transition-colors group">
              <td class="px-8 py-6">
                <div class="flex items-center gap-5">
                  <div class="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                    <span class="text-slate-500 font-bold text-xl">{{ staff.name.charAt(0) }}</span>
                  </div>
                  <div class="font-bold text-lg text-slate-900">{{ staff.name }}</div>
                </div>
              </td>
              <td class="px-8 py-6">
                <span
                  v-if="staff.isLinked"
                  class="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-100 uppercase"
                >
                  <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Connected
                </span>
                <span v-else class="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100 text-slate-400 text-xs font-bold rounded-full border border-slate-200 uppercase">
                  Not Linked
                </span>
              </td>
              <td class="px-8 py-6 text-right">
                <div class="flex items-center justify-end gap-4">
                  <RouterLink
                    :to="`/staff/${staff.id}/edit`"
                    class="p-2.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                    title="編集"
                  >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </RouterLink>
                  <button
                    @click="openDeleteModal(staff)"
                    class="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="削除"
                  >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete Modal -->
    <Modal :is-open="showDeleteModal" @close="showDeleteModal = false">
      <template #header>スタッフ削除</template>
      <div class="py-6">
        <p class="text-slate-600 font-bold text-lg">
          <strong class="text-slate-900 font-black">{{ selectedStaff?.name }}</strong>さんを削除しますか？
        </p>
        <div class="mt-6 p-5 bg-red-50 rounded-2xl border border-red-100 flex gap-4">
          <svg class="w-6 h-6 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p class="text-sm font-bold text-red-600 leading-relaxed">削除されたスタッフのシフトおよび出退勤記録は保持されますが、スタッフ一覧からは消去されます。</p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-4 w-full">
          <button @click="showDeleteModal = false" class="btn btn-secondary px-6">
            キャンセル
          </button>
          <button @click="handleDelete" class="btn bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-500/20 px-6">
            削除する
          </button>
        </div>
      </template>
    </Modal>

  </div>
</template>
