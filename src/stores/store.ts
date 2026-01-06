import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Store, StoreForm } from '@/types';
import { storeService } from '@/services/storeService';
import { useAuthStore } from './auth';

export const useStoreStore = defineStore('store', () => {
  const currentStore = ref<Store | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchStore() {
    const authStore = useAuthStore();
    if (!authStore.manager) return;

    loading.value = true;
    error.value = null;

    try {
      const result = await storeService.getByManagerId(authStore.manager.id);

      if (result.success) {
        currentStore.value = result.data || null;
      } else {
        error.value = result.error || '매장 정보를 불러오는데 실패했습니다.';
      }
    } finally {
      loading.value = false;
    }
  }

  async function createStore(form: StoreForm) {
    const authStore = useAuthStore();
    if (!authStore.manager) return false;

    loading.value = true;
    error.value = null;

    try {
      const result = await storeService.create(authStore.manager.id, form);

      if (result.success && result.data) {
        currentStore.value = result.data;
        return true;
      } else {
        error.value = result.error || '매장 등록에 실패했습니다.';
        return false;
      }
    } finally {
      loading.value = false;
    }
  }

  async function updateStore(form: StoreForm) {
    if (!currentStore.value) return false;

    loading.value = true;
    error.value = null;

    try {
      const result = await storeService.update(currentStore.value.id, form);

      if (result.success && result.data) {
        currentStore.value = result.data;
        return true;
      } else {
        error.value = result.error || '매장 정보 수정에 실패했습니다.';
        return false;
      }
    } finally {
      loading.value = false;
    }
  }

  function clearStore() {
    currentStore.value = null;
  }

  return {
    currentStore,
    loading,
    error,
    fetchStore,
    createStore,
    updateStore,
    clearStore,
  };
});
