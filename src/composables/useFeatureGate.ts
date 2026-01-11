/**
 * 機能制限ゲート composable
 * プランに応じた機能アクセス制御（シンプル版）
 */
import { computed } from 'vue';
import { useSubscriptionStore } from '@/stores/subscription';
import { useToast } from './useToast';

export function useFeatureGate() {
  const subscriptionStore = useSubscriptionStore();
  const toast = useToast();

  const isPremium = computed(() => subscriptionStore.isPremium);
  const currentPlan = computed(() => subscriptionStore.currentPlan);

  /**
   * 給料計算機能へのアクセス権をチェック
   */
  function canCalculateSalary(): boolean {
    return subscriptionStore.featureLimits.canCalculateSalary;
  }

  /**
   * Premium機能へのアクセス権をチェックし、なければ警告を表示
   * @param message カスタムメッセージ（省略時はデフォルト）
   * @returns アクセス可能かどうか
   */
  function requirePremium(message?: string): boolean {
    if (!isPremium.value) {
      toast.warning(
        message || '給料計算機能はPremiumプランでご利用いただけます。'
      );
      return false;
    }
    return true;
  }

  /**
   * アップグレードプロンプトを表示
   */
  function showUpgradePrompt() {
    toast.info('給料計算機能を利用するにはPremiumプランへのアップグレードが必要です。');
    window.dispatchEvent(new CustomEvent('show-pricing-modal'));
  }

  return {
    isPremium,
    currentPlan,
    canCalculateSalary,
    requirePremium,
    showUpgradePrompt,
  };
}
