<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from '@/components/common/AppHeader.vue';
import AppSidebar from '@/components/common/AppSidebar.vue';
import ToastContainer from '@/components/common/ToastContainer.vue';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const authStore = useAuthStore();

const isAuthPage = computed(() => {
  return (
    route.name === 'login' ||
    route.name === 'register' ||
    route.name === 'forgot-password'
  );
});

const isQRPage = computed(() => route.name === 'qr-display');

const showLayout = computed(() => {
  return authStore.isLoggedIn && !isAuthPage.value && !isQRPage.value;
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <template v-if="showLayout">
      <AppSidebar />
      <div class="lg:pl-64">
        <AppHeader />
        <main class="p-6">
          <RouterView />
        </main>
      </div>
    </template>
    <template v-else>
      <RouterView />
    </template>
  </div>

  <!-- Toast Notifications -->
  <ToastContainer />
</template>
