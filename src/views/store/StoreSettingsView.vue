<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStoreStore } from '@/stores/store';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import type { StoreForm } from '@/types';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Modal from '@/components/common/Modal.vue';

const router = useRouter();
const storeStore = useStoreStore();
const authStore = useAuthStore();
const toast = useToast();

const form = ref<StoreForm>({
  name: '',
  address: '',
});

const isEdit = ref(false);

// 탈퇴 관련
const showDeleteModal = ref(false);
const deletePassword = ref('');
const deleteLoading = ref(false);

watch(
  () => storeStore.currentStore,
  (store) => {
    if (store) {
      form.value = {
        name: store.name,
        address: store.address,
      };
      isEdit.value = true;
    }
  },
  { immediate: true }
);

onMounted(async () => {
  await storeStore.fetchStore();
});

async function handleSubmit() {
  let success: boolean;

  if (isEdit.value) {
    success = await storeStore.updateStore(form.value);
  } else {
    success = await storeStore.createStore(form.value);
  }

  if (success) {
    toast.success(isEdit.value ? '매장 정보가 수정되었습니다.' : '매장이 등록되었습니다.');
  } else if (storeStore.error) {
    toast.error(storeStore.error);
  }
}

function openDeleteModal() {
  deletePassword.value = '';
  showDeleteModal.value = true;
}

async function handleDeleteAccount() {
  if (!deletePassword.value) {
    toast.error('비밀번호를 입력해주세요.');
    return;
  }

  deleteLoading.value = true;

  try {
    const success = await authStore.deleteAccount(deletePassword.value);

    if (success) {
      toast.success('회원 탈퇴가 완료되었습니다.');
      router.push('/login');
    } else {
      toast.error(authStore.error || '회원 탈퇴에 실패했습니다.');
    }
  } finally {
    deleteLoading.value = false;
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <div v-if="storeStore.loading && !storeStore.currentStore" class="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>

    <div v-else class="card">
      <h2 class="text-lg font-semibold text-gray-900 mb-6">
        {{ isEdit ? '매장 정보 수정' : '매장 등록' }}
      </h2>

      <form @submit.prevent="handleSubmit" class="space-y-5">
        <div>
          <label class="label">매장명</label>
          <input
            v-model="form.name"
            type="text"
            class="input"
            placeholder="매장 이름을 입력하세요"
            required
          />
        </div>

        <div>
          <label class="label">주소</label>
          <input
            v-model="form.address"
            type="text"
            class="input"
            placeholder="매장 주소를 입력하세요"
            required
          />
        </div>

        <div class="pt-4">
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="storeStore.loading"
          >
            {{ storeStore.loading ? '저장 중...' : (isEdit ? '수정하기' : '등록하기') }}
          </button>
        </div>
      </form>
    </div>

    <!-- 회원 탈퇴 섹션 -->
    <div class="card mt-6 border-red-200">
      <h2 class="text-lg font-semibold text-red-600 mb-4">계정 삭제</h2>
      <p class="text-sm text-gray-600 mb-4">
        계정을 삭제하면 매장, 직원, 근무, 출퇴근 기록 등 모든 데이터가 영구적으로 삭제됩니다.
        이 작업은 되돌릴 수 없습니다.
      </p>
      <button
        type="button"
        class="btn bg-red-600 text-white hover:bg-red-700"
        @click="openDeleteModal"
      >
        회원 탈퇴
      </button>
    </div>

    <!-- 탈퇴 확인 모달 -->
    <Modal :show="showDeleteModal" @close="showDeleteModal = false">
      <template #header>
        <h3 class="text-lg font-semibold text-red-600">회원 탈퇴</h3>
      </template>

      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          정말로 탈퇴하시겠습니까? 모든 데이터가 삭제되며 복구할 수 없습니다.
        </p>
        <div>
          <label class="label">비밀번호 확인</label>
          <input
            v-model="deletePassword"
            type="password"
            class="input"
            placeholder="비밀번호를 입력하세요"
            @keyup.enter="handleDeleteAccount"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="btn btn-secondary"
            @click="showDeleteModal = false"
            :disabled="deleteLoading"
          >
            취소
          </button>
          <button
            type="button"
            class="btn bg-red-600 text-white hover:bg-red-700"
            @click="handleDeleteAccount"
            :disabled="deleteLoading || !deletePassword"
          >
            {{ deleteLoading ? '처리 중...' : '탈퇴하기' }}
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>
