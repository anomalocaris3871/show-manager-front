<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStaffStore } from '@/stores/staff';
import { useSubscriptionStore } from '@/stores/subscription';
import { useToast } from '@/composables/useToast';
import { staffService } from '@/services/staffService';
import type { StaffForm } from '@/types';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import PricingModal from '@/components/subscription/PricingModal.vue';

const route = useRoute();
const router = useRouter();
const staffStore = useStaffStore();
const subscriptionStore = useSubscriptionStore();
const toast = useToast();

const staffId = computed(() => route.params.id as string | undefined);
const isEdit = computed(() => !!staffId.value);
const isPremium = computed(() => subscriptionStore.isPremium);

const form = ref<StaffForm>({
  name: '',
  hourlyWage: 1113, // 2024年東京都最低賃金基準
  nightWage: 1392, // 深夜時給（1113 × 1.25）
});

const loading = ref(true); // 초기 로딩 상태로 시작
const showPricingModal = ref(false);

// 深夜時給の自動計算（基本時給 × 1.25）
function calculateNightWage() {
  form.value.nightWage = Math.round(form.value.hourlyWage * 1.25);
}

onMounted(async () => {
  loading.value = true;

  await subscriptionStore.fetchSubscription();

  if (isEdit.value && staffId.value) {
    const result = await staffService.getById(staffId.value);
    if (result.success && result.data) {
      form.value = {
        name: result.data.name,
        hourlyWage: result.data.hourlyWage,
        nightWage: result.data.nightWage || Math.round(result.data.hourlyWage * 1.25),
      };
    }
  }

  loading.value = false;
});

async function handleSubmit() {
  // Free プランの場合は時給を0に設定
  if (!isPremium.value) {
    form.value.hourlyWage = 0;
    form.value.nightWage = 0;
  }

  let success: boolean;

  if (isEdit.value && staffId.value) {
    success = await staffStore.updateStaff(staffId.value, form.value);
  } else {
    success = await staffStore.createStaff(form.value);
  }

  if (success) {
    toast.success(isEdit.value ? 'スタッフ情報を更新しました。' : 'スタッフを登録しました。');
    router.push('/staff');
  } else if (staffStore.error) {
    toast.error(staffStore.error);
  }
}

function handleCancel() {
  router.push('/staff');
}
</script>

<template>
  <div class="max-w-2xl">
    <div v-if="loading" class="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>

    <div v-else class="card">
      <h2 class="text-lg font-semibold text-gray-900 mb-6">
        {{ isEdit ? 'スタッフ情報編集' : 'スタッフ登録' }}
      </h2>

      <form @submit.prevent="handleSubmit" class="space-y-5">
        <div>
          <label class="label">名前</label>
          <input
            v-model="form.name"
            type="text"
            class="input"
            placeholder="スタッフ名を入力してください"
            required
          />
        </div>

        <!-- 時給入力 (Premium専用) -->
        <div>
          <label class="label flex items-center gap-2">
            給料設定
            <span v-if="!isPremium" class="px-1.5 py-0.5 text-xs font-medium bg-yellow-500 text-yellow-900 rounded">
              Premium
            </span>
          </label>

          <template v-if="isPremium">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm text-gray-600 mb-1 block">基本時給 (円)</label>
                <input
                  v-model.number="form.hourlyWage"
                  type="number"
                  class="input"
                  placeholder="1113"
                  min="0"
                  required
                  @change="calculateNightWage"
                />
              </div>
              <div>
                <label class="text-sm text-gray-600 mb-1 block">
                  深夜時給 (円)
                  <span class="text-orange-600 text-xs">22:00-05:00</span>
                </label>
                <input
                  v-model.number="form.nightWage"
                  type="number"
                  class="input"
                  placeholder="1392"
                  min="0"
                  required
                />
              </div>
            </div>
            <p class="text-sm text-gray-500 mt-2">
              2024年東京都最低賃金: 1,113円 / 深夜（+25%）: 1,392円
            </p>
            <p class="text-xs text-orange-600 mt-1">
              ※ 基本時給変更時、深夜時給は自動で25%増に設定されます（手動変更可）
            </p>
          </template>

          <template v-else>
            <div
              class="input bg-gray-100 text-gray-500 cursor-pointer hover:bg-gray-200 transition-colors"
              @click="showPricingModal = true"
            >
              Premiumプランで時給設定・給料計算が可能
            </div>
            <p class="text-sm text-primary-600 mt-1 cursor-pointer hover:underline" @click="showPricingModal = true">
              Premiumにアップグレード →
            </p>
          </template>
        </div>

        <div v-if="staffStore.error" class="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
          {{ staffStore.error }}
        </div>

        <div class="flex gap-3 pt-4">
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="staffStore.loading"
          >
            {{ staffStore.loading ? '保存中...' : (isEdit ? '更新する' : '登録する') }}
          </button>
          <button
            type="button"
            @click="handleCancel"
            class="btn btn-secondary"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>

    <!-- プラン選択モーダル -->
    <PricingModal
      :is-open="showPricingModal"
      @close="showPricingModal = false"
    />
  </div>
</template>
