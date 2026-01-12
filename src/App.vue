<script setup lang="ts">
import { ref, computed, provide } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from '@/components/common/AppHeader.vue';
import AppSidebar from '@/components/common/AppSidebar.vue';
import ToastContainer from '@/components/common/ToastContainer.vue';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const authStore = useAuthStore();

const sidebarCollapsed = ref(false);

const isAuthPage = computed(() => {
  return (
    route.name === 'login' ||
    route.name === 'register' ||
    route.name === 'forgot-password'
  );
});

const isLiffPage = computed(() => {
  return route.path.startsWith('/liff');
});

const isLegalPage = computed(() => {
  return route.name === 'privacy-policy';
});

const showLayout = computed(() => {
  return authStore.isLoggedIn && !isAuthPage.value && !isLiffPage.value && !isLegalPage.value;
});

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

// Provide sidebar state to child components
provide('sidebarCollapsed', sidebarCollapsed);
provide('toggleSidebar', toggleSidebar);
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <template v-if="showLayout">
      <!-- Sidebar with collapse transition -->
      <AppSidebar :collapsed="sidebarCollapsed" @toggle="toggleSidebar" />

      <!-- Main content area -->
      <div
        class="transition-all duration-300"
        :class="sidebarCollapsed ? 'lg:pl-0' : 'lg:pl-64'"
      >
        <AppHeader :sidebar-collapsed="sidebarCollapsed" @toggle-sidebar="toggleSidebar" />
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
