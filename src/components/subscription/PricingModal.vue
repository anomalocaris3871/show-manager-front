<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSubscriptionStore, PLANS } from '@/stores/subscription';
import { useToast } from '@/composables/useToast';
import Modal from '@/components/common/Modal.vue';
import type { SubscriptionPlan, BillingCycle, PlanInfo } from '@/types/subscription';

interface Props {
  isOpen: boolean;
}

defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

const subscriptionStore = useSubscriptionStore();
const toast = useToast();

const billingCycle = ref<BillingCycle>('monthly');
const processingPlan = ref<SubscriptionPlan | null>(null);

const currentPlanId = computed(
  () => subscriptionStore.subscription?.plan || 'free'
);

function getPrice(plan: PlanInfo): number {
  return billingCycle.value === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
}

function getMonthlyEquivalent(plan: PlanInfo): number {
  if (billingCycle.value === 'yearly' && plan.yearlyPrice > 0) {
    return Math.round(plan.yearlyPrice / 12);
  }
  return plan.monthlyPrice;
}

function getSavings(plan: PlanInfo): number {
  if (plan.monthlyPrice === 0) return 0;
  const yearlySavings = plan.monthlyPrice * 12 - plan.yearlyPrice;
  return Math.round((yearlySavings / (plan.monthlyPrice * 12)) * 100);
}

async function handleSelectPlan(plan: PlanInfo) {
  if (plan.id === currentPlanId.value) return;
  if (plan.id === 'free') {
    toast.info('無料プランへの変更は、現在のプランをキャンセルしてください。');
    emit('close');
    return;
  }

  processingPlan.value = plan.id;

  const session = await subscriptionStore.createCheckoutSession(
    plan.id,
    billingCycle.value
  );

  if (session?.url) {
    window.location.href = session.url;
  } else if (subscriptionStore.error) {
    toast.error(subscriptionStore.error);
  }

  processingPlan.value = null;
}

function isCurrentPlan(planId: SubscriptionPlan): boolean {
  return planId === currentPlanId.value;
}

function getButtonText(plan: PlanInfo): string {
  if (processingPlan.value === plan.id) return '処理中...';
  if (isCurrentPlan(plan.id)) return '現在のプラン';
  if (plan.id === 'premium') return 'アップグレード';
  return '選択する';
}
</script>

<template>
  <Modal :is-open="isOpen" size="lg" @close="emit('close')">
    <template #header>プランを選択</template>

    <!-- 課金サイクル切り替え -->
    <div class="flex justify-center mb-6">
      <div class="inline-flex items-center p-1 bg-gray-100 rounded-lg">
        <button
          @click="billingCycle = 'monthly'"
          class="px-4 py-2 text-sm font-medium rounded-md transition-colors"
          :class="
            billingCycle === 'monthly'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          "
        >
          月額
        </button>
        <button
          @click="billingCycle = 'yearly'"
          class="px-4 py-2 text-sm font-medium rounded-md transition-colors"
          :class="
            billingCycle === 'yearly'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          "
        >
          年額
          <span class="ml-1 text-xs text-green-600">17%OFF</span>
        </button>
      </div>
    </div>

    <!-- プランカードグリッド -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="plan in PLANS"
        :key="plan.id"
        class="relative p-5 border-2 rounded-xl transition-all"
        :class="[
          plan.highlighted ? 'border-primary-500' : 'border-gray-200',
          isCurrentPlan(plan.id) ? 'bg-gray-50' : 'bg-white',
        ]"
      >
        <!-- おすすめバッジ -->
        <div
          v-if="plan.highlighted"
          class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-500 text-white text-xs font-medium rounded-full"
        >
          おすすめ
        </div>

        <!-- 現在のプランバッジ -->
        <div
          v-if="isCurrentPlan(plan.id)"
          class="absolute -top-3 right-4 px-3 py-1 bg-gray-800 text-white text-xs font-medium rounded-full"
        >
          現在のプラン
        </div>

        <div class="text-center mb-4">
          <h3 class="text-xl font-bold text-gray-900">{{ plan.name }}</h3>
          <p class="text-sm text-gray-600 mt-1">{{ plan.description }}</p>
        </div>

        <div class="text-center mb-5">
          <div class="text-4xl font-bold text-gray-900">
            <template v-if="plan.monthlyPrice === 0">無料</template>
            <template v-else>
              ¥{{ getMonthlyEquivalent(plan).toLocaleString() }}
            </template>
          </div>
          <div v-if="plan.monthlyPrice > 0" class="text-sm text-gray-500">
            /月
          </div>
          <!-- 高さを固定するためにmin-heightを設定 -->
          <div class="h-5 mt-1">
            <span
              v-if="billingCycle === 'yearly' && plan.monthlyPrice > 0"
              class="text-xs text-green-600"
            >
              年間{{ getSavings(plan) }}%お得 (¥{{
                getPrice(plan).toLocaleString()
              }}/年)
            </span>
          </div>
        </div>

        <ul class="space-y-3 mb-5">
          <li
            v-for="feature in plan.features"
            :key="feature"
            class="flex items-center gap-2 text-sm text-gray-600"
          >
            <svg
              class="w-5 h-5 text-green-500 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            {{ feature }}
          </li>
        </ul>

        <button
          @click="handleSelectPlan(plan)"
          :disabled="isCurrentPlan(plan.id) || processingPlan !== null"
          class="w-full btn"
          :class="[
            plan.highlighted && !isCurrentPlan(plan.id)
              ? 'btn-primary'
              : 'btn-secondary',
            isCurrentPlan(plan.id) ? 'opacity-50 cursor-not-allowed' : '',
          ]"
        >
          {{ getButtonText(plan) }}
        </button>
      </div>
    </div>

    <template #footer>
      <div class="text-center text-sm text-gray-500">
        いつでもキャンセル可能です。
      </div>
    </template>
  </Modal>
</template>
