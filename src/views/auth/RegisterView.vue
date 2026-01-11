<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import type { RegisterForm } from '@/types';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const form = ref<RegisterForm>({
  email: '',
  password: '',
  confirmPassword: '',
});

async function handleSubmit() {
  const result = await authStore.register(form.value);
  if (result.success) {
    toast.success('認証メールを送信しました。');
    router.push({
      name: 'email-pending',
      query: {
        email: form.value.email,
        ...(result.expiresAt && { expiresAt: result.expiresAt }),
      }
    });
  } else if (authStore.error) {
    toast.error(authStore.error);
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
        <h1 class="text-2xl font-bold text-gray-900">新規登録</h1>
        <p class="text-gray-600 mt-2">Shop Managerアカウントを作成</p>
      </div>

      <!-- Form -->
      <div class="card">
        <form @submit.prevent="handleSubmit" class="space-y-5">
          <div>
            <label class="label">メールアドレス</label>
            <input
              v-model="form.email"
              type="email"
              class="input"
              placeholder="email@example.com"
              required
            />
          </div>

          <div>
            <label class="label">パスワード</label>
            <input
              v-model="form.password"
              type="password"
              class="input"
              placeholder="6文字以上で入力してください"
              required
              minlength="6"
            />
          </div>

          <div>
            <label class="label">パスワード確認</label>
            <input
              v-model="form.confirmPassword"
              type="password"
              class="input"
              placeholder="パスワードを再入力してください"
              required
            />
          </div>

          <button
            type="submit"
            class="btn btn-primary w-full"
            :disabled="authStore.loading"
          >
            {{ authStore.loading ? '登録中...' : '新規登録' }}
          </button>
        </form>

        <div class="mt-6 text-center text-sm text-gray-600">
          すでにアカウントをお持ちですか？
          <RouterLink to="/login" class="text-primary-600 hover:text-primary-700 font-medium">
            ログイン
          </RouterLink>
        </div>
      </div>

      <!-- Footer Links -->
      <div class="mt-8 text-center text-xs text-gray-500">
        <RouterLink to="/privacy-policy" class="hover:text-gray-700">
          プライバシーポリシー
        </RouterLink>
      </div>
    </div>
  </div>
</template>
