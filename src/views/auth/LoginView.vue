<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import type { LoginForm } from '@/types';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const form = ref<LoginForm>({
  email: '',
  password: '',
});

async function handleSubmit() {
  const success = await authStore.login(form.value);
  if (success) {
    toast.success('로그인되었습니다.');
    router.push('/');
  } else if (authStore.errorCode === 'EMAIL_NOT_VERIFIED') {
    // 이메일 미인증 시 인증 대기 페이지로 이동
    toast.warning('이메일 인증이 필요합니다.');
    router.push({
      name: 'email-pending',
      query: { email: form.value.email }
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
        <h1 class="text-2xl font-bold text-gray-900">Shop Manager</h1>
        <p class="text-gray-600 mt-2">시프트 관리 시스템에 로그인하세요</p>
      </div>

      <!-- Form -->
      <div class="card">
        <form @submit.prevent="handleSubmit" class="space-y-5">
          <div>
            <label class="label">이메일</label>
            <input
              v-model="form.email"
              type="email"
              class="input"
              placeholder="email@example.com"
              required
            />
          </div>

          <div>
            <label class="label">비밀번호</label>
            <input
              v-model="form.password"
              type="password"
              class="input"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            class="btn btn-primary w-full"
            :disabled="authStore.loading"
          >
            {{ authStore.loading ? '로그인 중...' : '로그인' }}
          </button>
        </form>

        <div class="mt-6 text-center text-sm">
          <RouterLink to="/forgot-password" class="text-primary-600 hover:text-primary-700">
            비밀번호를 잊으셨나요?
          </RouterLink>
        </div>

        <div class="mt-4 text-center text-sm text-gray-600">
          계정이 없으신가요?
          <RouterLink to="/register" class="text-primary-600 hover:text-primary-700 font-medium">
            회원가입
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
