<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const email = ref('');
const sent = ref(false);

async function handleSubmit() {
  const success = await authStore.resetPassword(email.value);
  if (success) {
    sent.value = true;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
    <div class="max-w-md w-full">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-12 h-12 bg-primary-600 rounded-xl mx-auto flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900">パスワード再設定</h1>
        <p class="text-gray-600 mt-2">登録したメールアドレスを入力してください</p>
      </div>

      <!-- Form -->
      <div class="card">
        <template v-if="!sent">
          <form @submit.prevent="handleSubmit" class="space-y-5">
            <div>
              <label class="label">メールアドレス</label>
              <input
                v-model="email"
                type="email"
                class="input"
                placeholder="email@example.com"
                required
              />
            </div>

            <div v-if="authStore.error" class="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
              {{ authStore.error }}
            </div>

            <button
              type="submit"
              class="btn btn-primary w-full"
              :disabled="authStore.loading"
            >
              {{ authStore.loading ? '送信中...' : '再設定リンクを送信' }}
            </button>
          </form>
        </template>

        <template v-else>
          <div class="text-center py-4">
            <div class="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">メールを確認してください</h3>
            <p class="text-gray-600 text-sm">
              {{ email }}にパスワード再設定リンクを送信しました。
            </p>
          </div>
        </template>

        <div class="mt-6 text-center text-sm">
          <RouterLink to="/login" class="text-primary-600 hover:text-primary-700">
            ログインに戻る
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
