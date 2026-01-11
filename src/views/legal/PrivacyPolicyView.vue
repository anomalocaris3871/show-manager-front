<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goBack() {
  router.back();
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4">
    <div class="max-w-3xl mx-auto">
      <button
        @click="goBack"
        class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        戻る
      </button>

      <div class="bg-white rounded-2xl shadow-lg p-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-6">プライバシーポリシー</h1>

        <div class="prose prose-gray max-w-none">
          <p class="text-gray-600 mb-6">
            本プライバシーポリシーは、Shop Manager（以下「本サービス」）が収集する個人情報の項目、収集目的、保有期間等についてご案内します。
          </p>

          <section class="mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-3">1. 収集する個人情報の項目</h2>
            <p class="text-gray-600 mb-2">本サービスは以下の個人情報を収集します：</p>
            <ul class="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>マネージャー：メールアドレス、パスワード（暗号化）、店舗名、店舗住所</li>
              <li>スタッフ：名前、LINE ユーザーID、出退勤記録</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-3">2. 個人情報の収集目的</h2>
            <ul class="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>サービス会員登録および管理</li>
              <li>スタッフの出退勤管理</li>
              <li>シフトスケジュール管理</li>
              <li>LINE連携による本人確認</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-3">3. 個人情報の保有および利用期間</h2>
            <p class="text-gray-600">
              個人情報はサービス利用期間中保有し、退会時に速やかに削除します。
              ただし、関係法令により保存が必要な場合は、該当期間中保管します。
            </p>
          </section>

          <section class="mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-3">4. 個人情報の第三者提供</h2>
            <p class="text-gray-600">
              本サービスは原則として利用者の個人情報を第三者に提供しません。
              ただし、法令により要求される場合は例外とします。
            </p>
          </section>

          <section class="mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-3">5. 個人情報の破棄</h2>
            <p class="text-gray-600">
              個人情報の保有期間が経過した場合、または処理目的が達成された場合、該当個人情報を遅滞なく破棄します。
            </p>
          </section>

          <section class="mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-3">6. 利用者の権利</h2>
            <p class="text-gray-600 mb-2">利用者は以下の権利を行使することができます：</p>
            <ul class="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>個人情報の閲覧請求</li>
              <li>個人情報の訂正および削除請求</li>
              <li>個人情報の処理停止請求</li>
            </ul>
          </section>

          <section class="mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-3">7. 個人情報保護責任者</h2>
            <p class="text-gray-600">
              個人情報の取り扱いに関するお問い合わせは、下記連絡先までお問い合わせください。
            </p>
            <p class="text-gray-600 mt-2">
              メール：support@example.com
            </p>
          </section>

          <section>
            <h2 class="text-lg font-semibold text-gray-900 mb-3">8. プライバシーポリシーの変更</h2>
            <p class="text-gray-600">
              本プライバシーポリシーは、法令またはサービス方針の変更により修正される場合があり、
              変更時はサービス内のお知らせでご案内します。
            </p>
          </section>

          <p class="text-gray-500 text-sm mt-8">
            施行日：2024年1月1日
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
