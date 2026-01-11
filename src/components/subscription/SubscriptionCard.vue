<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useSubscriptionStore } from '@/stores/subscription';
import { useToast } from '@/composables/useToast';
import dayjs from 'dayjs';

const emit = defineEmits<{
  openPricing: [];
}>();

const subscriptionStore = useSubscriptionStore();
const toast = useToast();

const currentPlan = computed(() => subscriptionStore.currentPlan);
const subscription = computed(() => subscriptionStore.subscription);
const isPremium = computed(() => subscriptionStore.isPremium);

const statusLabel = computed(() => {
  if (!subscription.value || !isPremium.value) {
    return { text: '一般プラン', class: 'bg-gray-100 text-gray-700' };
  }
  switch (subscription.value.status) {
    case 'active':
      return { text: 'Premium', class: 'bg-primary-100 text-primary-700' };
    case 'trialing':
      return { text: 'トライアル中', class: 'bg-blue-100 text-blue-700' };
    case 'past_due':
      return { text: '支払い遅延', class: 'bg-red-100 text-red-700' };
    case 'canceled':
      return { text: 'キャンセル予定', class: 'bg-yellow-100 text-yellow-700' };
    default:
      return { text: '一般プラン', class: 'bg-gray-100 text-gray-700' };
  }
});

const periodEndFormatted = computed(() => {
  if (!subscription.value?.currentPeriodEnd) return null;
  return dayjs(subscription.value.currentPeriodEnd).format('YYYY年M月D日');
});

onMounted(() => {
  subscriptionStore.fetchSubscription();
});

function handleUpgrade() {
  emit('openPricing');
}

async function handleManagePayment() {
  const session = await subscriptionStore.createCustomerPortalSession();
  if (session?.url) {
    window.location.href = session.url;
  } else if (subscriptionStore.error) {
    toast.error(subscriptionStore.error);
  }
}

async function handleCancel() {
  if (
    confirm(
      '本当にサブスクリプションをキャンセルしますか？\n現在の請求期間終了までご利用いただけます。'
    )
  ) {
    const success = await subscriptionStore.cancelSubscription();
    if (success) {
      toast.success('サブスクリプションのキャンセルを予約しました。');
    } else if (subscriptionStore.error) {
      toast.error(subscriptionStore.error);
    }
  }
}

async function handleResume() {
  const success = await subscriptionStore.resumeSubscription();
  if (success) {
    toast.success('サブスクリプションを再開しました。');
  } else if (subscriptionStore.error) {
    toast.error(subscriptionStore.error);
  }
}
</script>

<template>
  <div class="card">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-semibold text-gray-900">サブスクリプション</h2>
      <span class="px-2 py-1 text-sm rounded-full" :class="statusLabel.class">
        {{ statusLabel.text }}
      </span>
    </div>

    <!-- 現在のプラン情報 -->
    <div class="p-4 bg-gray-50 rounded-lg mb-6">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-xl font-bold text-gray-900">
            {{ currentPlan.name }}プラン
          </div>
          <div class="text-sm text-gray-600 mt-1">
            {{ currentPlan.description }}
          </div>
        </div>
        <div v-if="currentPlan.monthlyPrice > 0" class="text-right">
          <div class="text-2xl font-bold text-gray-900">
            ¥{{ currentPlan.monthlyPrice.toLocaleString() }}
          </div>
          <div class="text-sm text-gray-500">/月</div>
        </div>
        <div v-else class="text-right">
          <div class="text-2xl font-bold text-green-600">無料</div>
        </div>
      </div>

      <!-- 期間情報 -->
      <div
        v-if="periodEndFormatted"
        class="mt-4 pt-4 border-t border-gray-200"
      >
        <div class="text-sm text-gray-600">
          <span v-if="subscription?.cancelAtPeriodEnd" class="text-yellow-600">
            {{ periodEndFormatted }}にキャンセルされます
          </span>
          <span v-else> 次回請求日: {{ periodEndFormatted }} </span>
        </div>
      </div>
    </div>

    <!-- Premium機能案内 -->
    <div v-if="!isPremium" class="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <div>
          <p class="text-sm font-medium text-primary-800">Premiumで給料計算機能を解放</p>
          <p class="text-sm text-primary-700 mt-1">
            月額¥500で、スタッフの給料を自動計算。月別レポートやCSVエクスポートも。
          </p>
        </div>
      </div>
    </div>

    <!-- アクションボタン -->
    <div class="space-y-3">
      <button
        v-if="!isPremium"
        @click="handleUpgrade"
        class="w-full btn btn-primary"
      >
        Premiumにアップグレード
      </button>

      <button
        v-if="isPremium"
        @click="handleManagePayment"
        class="w-full btn btn-secondary"
        :disabled="subscriptionStore.loading"
      >
        支払い方法を管理
      </button>

      <!-- キャンセル/再開ボタン -->
      <div
        v-if="subscription?.cancelAtPeriodEnd"
        class="pt-4 border-t border-gray-200"
      >
        <button
          @click="handleResume"
          class="text-sm text-primary-600 hover:text-primary-700"
          :disabled="subscriptionStore.loading"
        >
          キャンセルを取り消す
        </button>
      </div>
      <div
        v-else-if="isPremium"
        class="pt-4 border-t border-gray-200"
      >
        <button
          @click="handleCancel"
          class="text-sm text-gray-500 hover:text-red-600"
          :disabled="subscriptionStore.loading"
        >
          サブスクリプションをキャンセル
        </button>
      </div>
    </div>
  </div>
</template>
