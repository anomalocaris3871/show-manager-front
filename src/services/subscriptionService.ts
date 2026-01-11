/**
 * サブスクリプションサービス - API連携
 */
import { api } from './api';
import type { ApiResponse } from '@/types';
import type {
  Subscription,
  SubscriptionPlan,
  BillingCycle,
  PaymentMethod,
  Invoice,
  CheckoutSession,
  PortalSession,
} from '@/types/subscription';

// テストモード: localStorage に 'subscription_test_mode' を設定するとモックデータを使用
// 使用方法: ブラウザコンソールで localStorage.setItem('subscription_test_mode', 'premium') または 'free'
function isTestMode(): SubscriptionPlan | null {
  const testMode = localStorage.getItem('subscription_test_mode');
  if (testMode === 'premium' || testMode === 'free') {
    return testMode;
  }
  return null;
}

// テスト用モックデータ
function getMockSubscription(plan: SubscriptionPlan): Subscription | null {
  if (plan === 'free') {
    return null;
  }

  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return {
    id: 'test_sub_001',
    storeId: 'test_store_001',
    plan: 'premium',
    status: 'active',
    billingCycle: 'monthly',
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: nextMonth.toISOString(),
    cancelAtPeriodEnd: false,
    stripeCustomerId: 'cus_test_xxxxx',
    stripeSubscriptionId: 'sub_test_xxxxx',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export const subscriptionService = {
  // GET /api/stores/{storeId}/subscription - サブスクリプション情報取得
  async getSubscription(storeId: string): Promise<ApiResponse<Subscription | null>> {
    // テストモード
    const testPlan = isTestMode();
    if (testPlan !== null) {
      console.log(`[Subscription] テストモード: ${testPlan}`);
      return {
        success: true,
        data: getMockSubscription(testPlan),
      };
    }

    return api.get<Subscription | null>(`/stores/${storeId}/subscription`);
  },

  // POST /api/stores/{storeId}/subscription/checkout - Stripe Checkoutセッション作成
  async createCheckoutSession(
    storeId: string,
    plan: SubscriptionPlan,
    billingCycle: BillingCycle
  ): Promise<ApiResponse<CheckoutSession>> {
    // テストモード: Premiumに即時切り替え
    const testPlan = isTestMode();
    if (testPlan !== null) {
      localStorage.setItem('subscription_test_mode', 'premium');
      alert('テストモード: Premiumに切り替えました。ページをリロードしてください。');
      return {
        success: true,
        data: {
          sessionId: 'test_session_001',
          url: window.location.href,
        },
      };
    }

    return api.post<CheckoutSession>(`/stores/${storeId}/subscription/checkout`, {
      plan,
      billingCycle,
      successUrl: `${window.location.origin}/store-settings?subscription=success`,
      cancelUrl: `${window.location.origin}/store-settings?subscription=canceled`,
    });
  },

  // POST /api/stores/{storeId}/subscription/portal - Stripe Customer Portalセッション作成
  async createPortalSession(storeId: string): Promise<ApiResponse<PortalSession>> {
    const testPlan = isTestMode();
    if (testPlan !== null) {
      alert('テストモード: Customer Portalは利用できません。\n一般プランに戻すには: localStorage.setItem("subscription_test_mode", "free")');
      return {
        success: true,
        data: { url: window.location.href },
      };
    }

    return api.post<PortalSession>(`/stores/${storeId}/subscription/portal`, {
      returnUrl: `${window.location.origin}/store-settings`,
    });
  },

  // POST /api/subscriptions/{subscriptionId}/cancel - サブスクリプションキャンセル（期間終了時）
  async cancelSubscription(subscriptionId: string): Promise<ApiResponse<Subscription>> {
    const testPlan = isTestMode();
    if (testPlan !== null) {
      localStorage.setItem('subscription_test_mode', 'free');
      alert('テストモード: 一般プランに戻しました。ページをリロードしてください。');
      return {
        success: true,
        data: getMockSubscription('free') as Subscription,
      };
    }

    return api.post<Subscription>(`/subscriptions/${subscriptionId}/cancel`);
  },

  // POST /api/subscriptions/{subscriptionId}/resume - キャンセル取り消し
  async resumeSubscription(subscriptionId: string): Promise<ApiResponse<Subscription>> {
    const testPlan = isTestMode();
    if (testPlan !== null) {
      localStorage.setItem('subscription_test_mode', 'premium');
      return {
        success: true,
        data: getMockSubscription('premium') as Subscription,
      };
    }

    return api.post<Subscription>(`/subscriptions/${subscriptionId}/resume`);
  },

  // GET /api/stores/{storeId}/payment-methods - 支払い方法一覧取得
  async getPaymentMethods(storeId: string): Promise<ApiResponse<PaymentMethod[]>> {
    const testPlan = isTestMode();
    if (testPlan !== null) {
      return {
        success: true,
        data: testPlan === 'premium' ? [
          {
            id: 'pm_test_001',
            type: 'card',
            card: {
              brand: 'visa',
              last4: '4242',
              expMonth: 12,
              expYear: 2026,
            },
            isDefault: true,
          },
        ] : [],
      };
    }

    return api.get<PaymentMethod[]>(`/stores/${storeId}/payment-methods`);
  },

  // GET /api/stores/{storeId}/invoices - 請求書一覧取得
  async getInvoices(storeId: string, limit = 10): Promise<ApiResponse<Invoice[]>> {
    const testPlan = isTestMode();
    if (testPlan !== null) {
      return {
        success: true,
        data: testPlan === 'premium' ? [
          {
            id: 'inv_test_001',
            subscriptionId: 'test_sub_001',
            amount: 500,
            currency: 'jpy',
            status: 'paid',
            periodStart: new Date().toISOString(),
            periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            paidAt: new Date().toISOString(),
            invoicePdf: '#',
            createdAt: new Date().toISOString(),
          },
        ] : [],
      };
    }

    return api.get<Invoice[]>(`/stores/${storeId}/invoices?limit=${limit}`);
  },
};
