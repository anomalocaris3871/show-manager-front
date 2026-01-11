<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useStoreStore } from '@/stores/store';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import type { StoreForm } from '@/types';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import Modal from '@/components/common/Modal.vue';
import SubscriptionCard from '@/components/subscription/SubscriptionCard.vue';
import PricingModal from '@/components/subscription/PricingModal.vue';

const router = useRouter();
const route = useRoute();
const storeStore = useStoreStore();
const authStore = useAuthStore();
const toast = useToast();

const form = ref<StoreForm>({
  name: '',
  address: '',
});

// currentStore 존재 여부로 편집/등록 모드 결정 (computed로 항상 동기화)
const isEdit = computed(() => !!storeStore.currentStore);

// サブスクリプション関連
const showPricingModal = ref(false);

// 退会関連
const showDeleteModal = ref(false);
const deletePassword = ref('');
const deleteLoading = ref(false);

// 初期化完了フラグ
const initialized = ref(false);

// フォームデータ同期
watch(
  () => storeStore.currentStore,
  (store) => {
    if (store) {
      form.value = {
        name: store.name,
        address: store.address,
      };
    }
  },
  { immediate: true }
);

onMounted(async () => {
  await storeStore.fetchStore();
  initialized.value = true;

  // サブスクリプション結果処理
  const subscriptionResult = route.query.subscription;
  if (subscriptionResult === 'success') {
    toast.success('サブスクリプションの登録が完了しました。');
    router.replace({ query: {} });
  } else if (subscriptionResult === 'canceled') {
    toast.info('サブスクリプションの登録がキャンセルされました。');
    router.replace({ query: {} });
  }
});

async function handleSubmit() {
  let success: boolean;

  if (isEdit.value) {
    success = await storeStore.updateStore(form.value);
  } else {
    success = await storeStore.createStore(form.value);
  }

  if (success) {
    toast.success(isEdit.value ? '店舗情報を更新しました。' : '店舗を登録しました。');
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
    toast.error('パスワードを入力してください。');
    return;
  }

  deleteLoading.value = true;

  try {
    const success = await authStore.deleteAccount(deletePassword.value);

    if (success) {
      toast.success('退会が完了しました。');
      router.push('/login');
    } else {
      toast.error(authStore.error || '退会に失敗しました。');
    }
  } finally {
    deleteLoading.value = false;
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <div v-if="!initialized" class="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>

    <template v-else>
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 mb-6">
          {{ isEdit ? '店舗情報編集' : '店舗登録' }}
        </h2>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <div>
            <label class="label">店舗名</label>
            <input
              v-model="form.name"
              type="text"
              class="input"
              placeholder="店舗名を入力してください"
              required
            />
          </div>

          <div>
            <label class="label">住所</label>
            <input
              v-model="form.address"
              type="text"
              class="input"
              placeholder="店舗住所を入力してください"
              required
            />
          </div>

          <div class="pt-4">
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="storeStore.loading"
            >
              {{ storeStore.loading ? '保存中...' : (isEdit ? '更新する' : '登録する') }}
            </button>
          </div>
        </form>
      </div>

      <!-- サブスクリプションセクション -->
      <div class="mt-6">
        <SubscriptionCard @open-pricing="showPricingModal = true" />
      </div>

      <!-- 退会セクション -->
      <div class="card mt-6 border-red-200">
      <h2 class="text-lg font-semibold text-red-600 mb-4">アカウント削除</h2>
      <p class="text-sm text-gray-600 mb-4">
        アカウントを削除すると、店舗、スタッフ、シフト、出退勤記録などすべてのデータが完全に削除されます。
        この操作は元に戻せません。
      </p>
      <button
        type="button"
        class="btn bg-red-600 text-white hover:bg-red-700"
        @click="openDeleteModal"
      >
        退会する
      </button>
      </div>
    </template>

    <!-- 退会確認モーダル -->
    <Modal :is-open="showDeleteModal" @close="showDeleteModal = false">
      <template #header>
        <span class="text-red-600">退会確認</span>
      </template>
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          本当に退会しますか？すべてのデータが削除され、復元できません。
        </p>
        <div>
          <label class="label">パスワード確認</label>
          <input
            v-model="deletePassword"
            type="password"
            class="input"
            placeholder="パスワードを入力してください"
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
            キャンセル
          </button>
          <button
            type="button"
            class="btn bg-red-600 text-white hover:bg-red-700"
            @click="handleDeleteAccount"
            :disabled="deleteLoading || !deletePassword"
          >
            {{ deleteLoading ? '処理中...' : '退会する' }}
          </button>
        </div>
      </template>
    </Modal>

    <!-- プラン選択モーダル -->
    <PricingModal
      :is-open="showPricingModal"
      @close="showPricingModal = false"
    />
  </div>
</template>
