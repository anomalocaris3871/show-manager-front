import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Staff, StaffForm } from '@/types';
import { staffService } from '@/services/staffService';
import { useStoreStore } from './store';

export const useStaffStore = defineStore('staff', () => {
  const staffList = ref<Staff[]>([]);
  const pendingStaff = ref<Staff[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const activeStaff = computed(() => staffList.value.filter((s) => s.isActive));
  const linkedStaff = computed(() => staffList.value.filter((s) => s.isLinked));

  async function fetchStaff() {
    const storeStore = useStoreStore();
    if (!storeStore.currentStore) return;

    loading.value = true;
    error.value = null;

    try {
      const result = await staffService.getByStoreId(storeStore.currentStore.id);

      if (result.success && result.data) {
        staffList.value = result.data;
      } else {
        error.value = result.error || 'スタッフ一覧の取得に失敗しました。';
      }
    } finally {
      loading.value = false;
    }
  }

  async function createStaff(form: StaffForm) {
    const storeStore = useStoreStore();
    if (!storeStore.currentStore) return false;

    loading.value = true;
    error.value = null;

    try {
      const result = await staffService.create(storeStore.currentStore.id, form);

      if (result.success && result.data) {
        staffList.value.push(result.data);
        return true;
      } else {
        error.value = result.error || 'スタッフ登録に失敗しました。';
        return false;
      }
    } finally {
      loading.value = false;
    }
  }

  async function updateStaff(staffId: string, form: StaffForm) {
    loading.value = true;
    error.value = null;

    try {
      const result = await staffService.update(staffId, form);

      if (result.success && result.data) {
        const index = staffList.value.findIndex((s) => s.id === staffId);
        if (index !== -1) {
          staffList.value[index] = result.data;
        }
        return true;
      } else {
        error.value = result.error || 'スタッフ情報の更新に失敗しました。';
        return false;
      }
    } finally {
      loading.value = false;
    }
  }

  async function deleteStaff(staffId: string) {
    loading.value = true;
    error.value = null;

    try {
      const result = await staffService.delete(staffId);

      if (result.success) {
        staffList.value = staffList.value.filter((s) => s.id !== staffId);
        return true;
      } else {
        error.value = result.error || 'スタッフの削除に失敗しました。';
        return false;
      }
    } finally {
      loading.value = false;
    }
  }

  function getStaffById(staffId: string): Staff | undefined {
    return staffList.value.find((s) => s.id === staffId);
  }

  function clearStaff() {
    staffList.value = [];
    pendingStaff.value = [];
  }

  async function fetchPendingStaff() {
    const storeStore = useStoreStore();
    if (!storeStore.currentStore) return;

    try {
      const result = await staffService.getPendingStaff(storeStore.currentStore.id);

      if (result.success && result.data) {
        pendingStaff.value = result.data;
      }
    } catch (_e) {
      // 失敗しても無視（待機スタッフがいない場合がある）
    }
  }

  async function approveStaff(staffId: string) {
    loading.value = true;
    error.value = null;

    try {
      const result = await staffService.approve(staffId);

      if (result.success && result.data) {
        // 待機リストから削除
        pendingStaff.value = pendingStaff.value.filter((s) => s.id !== staffId);
        // アクティブリストに追加
        staffList.value.push(result.data);
        return true;
      } else {
        error.value = result.error || '承認に失敗しました。';
        return false;
      }
    } finally {
      loading.value = false;
    }
  }

  async function rejectStaff(staffId: string) {
    loading.value = true;
    error.value = null;

    try {
      const result = await staffService.reject(staffId);

      if (result.success) {
        // 待機リストから削除
        pendingStaff.value = pendingStaff.value.filter((s) => s.id !== staffId);
        return true;
      } else {
        error.value = result.error || '却下に失敗しました。';
        return false;
      }
    } finally {
      loading.value = false;
    }
  }

  return {
    staffList,
    pendingStaff,
    loading,
    error,
    activeStaff,
    linkedStaff,
    fetchStaff,
    fetchPendingStaff,
    createStaff,
    updateStaff,
    deleteStaff,
    approveStaff,
    rejectStaff,
    getStaffById,
    clearStaff,
  };
});
