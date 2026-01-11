/**
 * サブスクリプションストア
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  Subscription,
  SubscriptionPlan,
  BillingCycle,
  PaymentMethod,
  Invoice,
  FeatureLimits,
  PlanInfo,
  CheckoutSession,
  PortalSession,
} from '@/types/subscription';
import { subscriptionService } from '@/services/subscriptionService';
import { useStoreStore } from './store';

// プラン情報定数（シンプル2プラン構成）
export const PLANS: PlanInfo[] = [
  {
    id: 'free',
    name: '一般',
    description: '基本機能をすべて無料で',
    monthlyPrice: 0,
    yearlyPrice: 0,
    staffLimit: null,
    features: [
      'スタッフ管理',
      'シフト管理',
      '出退勤記録',
      'QRコード打刻',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: '給料計算機能付き',
    monthlyPrice: 500,
    yearlyPrice: 5000,
    staffLimit: null,
    highlighted: true,
    features: [
      'すべての一般機能',
      '給料計算',
      '月別給料レポート',
      'CSVエクスポート',
    ],
  },
];

export const useSubscriptionStore = defineStore('subscription', () => {
  // State
  const subscription = ref<Subscription | null>(null);
  const paymentMethods = ref<PaymentMethod[]>([]);
  const invoices = ref<Invoice[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const currentPlan = computed((): PlanInfo => {
    const planId = subscription.value?.plan || 'free';
    return PLANS.find((p) => p.id === planId) || PLANS[0];
  });

  const isActive = computed(() => {
    const status = subscription.value?.status;
    return status === 'active' || status === 'trialing';
  });

  const isPastDue = computed(() => {
    return subscription.value?.status === 'past_due';
  });

  const isCanceled = computed(() => {
    return subscription.value?.cancelAtPeriodEnd === true;
  });

  const daysUntilExpiry = computed(() => {
    if (!subscription.value?.currentPeriodEnd) return null;
    const end = new Date(subscription.value.currentPeriodEnd);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  });

  const featureLimits = computed((): FeatureLimits => {
    const plan = currentPlan.value;
    return {
      canCalculateSalary: plan?.id === 'premium',
    };
  });

  const isPremium = computed(() => {
    return currentPlan.value?.id === 'premium';
  });

  const defaultPaymentMethod = computed(() => {
    return paymentMethods.value.find((pm) => pm.isDefault);
  });

  // Actions
  async function fetchSubscription() {
    const storeStore = useStoreStore();
    if (!storeStore.currentStore) return;

    loading.value = true;
    error.value = null;

    try {
      const result = await subscriptionService.getSubscription(
        storeStore.currentStore.id
      );
      if (result.success) {
        subscription.value = result.data || null;
      } else {
        error.value = result.error || 'サブスクリプション情報の取得に失敗しました。';
      }
    } finally {
      loading.value = false;
    }
  }

  async function createCheckoutSession(
    plan: SubscriptionPlan,
    billingCycle: BillingCycle
  ): Promise<CheckoutSession | null> {
    const storeStore = useStoreStore();
    if (!storeStore.currentStore) return null;

    loading.value = true;
    error.value = null;

    try {
      const result = await subscriptionService.createCheckoutSession(
        storeStore.currentStore.id,
        plan,
        billingCycle
      );
      if (result.success && result.data) {
        return result.data;
      } else {
        error.value = result.error || 'チェックアウトセッションの作成に失敗しました。';
        return null;
      }
    } finally {
      loading.value = false;
    }
  }

  async function createCustomerPortalSession(): Promise<PortalSession | null> {
    const storeStore = useStoreStore();
    if (!storeStore.currentStore) return null;

    loading.value = true;
    error.value = null;

    try {
      const result = await subscriptionService.createPortalSession(
        storeStore.currentStore.id
      );
      if (result.success && result.data) {
        return result.data;
      } else {
        error.value = result.error || 'ポータルセッションの作成に失敗しました。';
        return null;
      }
    } finally {
      loading.value = false;
    }
  }

  async function cancelSubscription(): Promise<boolean> {
    if (!subscription.value) return false;

    loading.value = true;
    error.value = null;

    try {
      const result = await subscriptionService.cancelSubscription(
        subscription.value.id
      );
      if (result.success && result.data) {
        subscription.value = result.data;
        return true;
      } else {
        error.value = result.error || 'サブスクリプションのキャンセルに失敗しました。';
        return false;
      }
    } finally {
      loading.value = false;
    }
  }

  async function resumeSubscription(): Promise<boolean> {
    if (!subscription.value) return false;

    loading.value = true;
    error.value = null;

    try {
      const result = await subscriptionService.resumeSubscription(
        subscription.value.id
      );
      if (result.success && result.data) {
        subscription.value = result.data;
        return true;
      } else {
        error.value = result.error || 'サブスクリプションの再開に失敗しました。';
        return false;
      }
    } finally {
      loading.value = false;
    }
  }

  async function fetchPaymentMethods() {
    const storeStore = useStoreStore();
    if (!storeStore.currentStore) return;

    try {
      const result = await subscriptionService.getPaymentMethods(
        storeStore.currentStore.id
      );
      if (result.success) {
        paymentMethods.value = result.data || [];
      }
    } catch (_e) {
      // Silent fail for payment methods
    }
  }

  async function fetchInvoices() {
    const storeStore = useStoreStore();
    if (!storeStore.currentStore) return;

    try {
      const result = await subscriptionService.getInvoices(
        storeStore.currentStore.id
      );
      if (result.success) {
        invoices.value = result.data || [];
      }
    } catch (_e) {
      // Silent fail for invoices
    }
  }

  function canUpgradeTo(plan: SubscriptionPlan): boolean {
    const currentIndex = PLANS.findIndex(
      (p) => p.id === (subscription.value?.plan || 'free')
    );
    const targetIndex = PLANS.findIndex((p) => p.id === plan);
    return targetIndex > currentIndex;
  }

  function getPlanById(planId: SubscriptionPlan): PlanInfo | undefined {
    return PLANS.find((p) => p.id === planId);
  }

  function clear() {
    subscription.value = null;
    paymentMethods.value = [];
    invoices.value = [];
    error.value = null;
  }

  return {
    // State
    subscription,
    paymentMethods,
    invoices,
    loading,
    error,
    // Computed
    currentPlan,
    isActive,
    isPastDue,
    isCanceled,
    isPremium,
    daysUntilExpiry,
    featureLimits,
    defaultPaymentMethod,
    // Actions
    fetchSubscription,
    createCheckoutSession,
    createCustomerPortalSession,
    cancelSubscription,
    resumeSubscription,
    fetchPaymentMethods,
    fetchInvoices,
    canUpgradeTo,
    getPlanById,
    clear,
  };
});
