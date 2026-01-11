/**
 * サブスクリプション関連の型定義
 */

// サブスクリプションプラン
export type SubscriptionPlan = 'free' | 'premium';

// サブスクリプションステータス
export type SubscriptionStatus =
  | 'active' // 有効
  | 'trialing' // トライアル中
  | 'past_due' // 支払い遅延
  | 'canceled' // キャンセル予定（期間終了まで利用可能）
  | 'incomplete' // 支払い未完了
  | 'expired'; // 期限切れ

// 課金サイクル
export type BillingCycle = 'monthly' | 'yearly';

// プラン情報（UI表示用）
export interface PlanInfo {
  id: SubscriptionPlan;
  name: string;
  description: string;
  monthlyPrice: number; // 円
  yearlyPrice: number; // 円（年間）
  staffLimit: number | null; // null = 無制限
  features: string[];
  highlighted?: boolean; // おすすめプラン表示
}

// サブスクリプション情報
export interface Subscription {
  id: string;
  storeId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: string; // ISO datetime
  currentPeriodEnd: string; // ISO datetime
  cancelAtPeriodEnd: boolean; // 期間終了時にキャンセル予定
  trialEnd?: string; // トライアル終了日
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

// 支払い方法情報
export interface PaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: string; // visa, mastercard, etc.
    last4: string; // 下4桁
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

// 請求書/支払い履歴
export interface Invoice {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  periodStart: string;
  periodEnd: string;
  paidAt?: string;
  invoicePdf?: string; // PDFダウンロードURL
  createdAt: string;
}

// Stripe Checkoutセッションレスポンス
export interface CheckoutSession {
  sessionId: string;
  url: string; // Stripe Checkoutリダイレクト先URL
}

// Stripe Customer Portalセッションレスポンス
export interface PortalSession {
  url: string;
}

// 機能制限状態
export interface FeatureLimits {
  canCalculateSalary: boolean; // 給料計算機能（Premium専用）
}
