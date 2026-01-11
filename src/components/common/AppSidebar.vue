<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { useStoreStore } from '@/stores/store';
import { useSubscriptionStore } from '@/stores/subscription';

const route = useRoute();
const storeStore = useStoreStore();
const subscriptionStore = useSubscriptionStore();

interface MenuItem {
  name: string;
  path: string;
  icon: string;
  routeName: string;
  isPremium?: boolean;
}

const menuItems: MenuItem[] = [
  { name: 'ダッシュボード', path: '/', icon: 'home', routeName: 'dashboard' },
  { name: 'スタッフ管理', path: '/staff', icon: 'users', routeName: 'staff-list' },
  { name: 'シフト管理', path: '/shifts', icon: 'calendar', routeName: 'shift-calendar' },
  { name: '出退勤管理', path: '/attendance', icon: 'clock', routeName: 'attendance-list' },
  { name: '給料計算', path: '/salary', icon: 'currency', routeName: 'salary', isPremium: true },
  { name: 'QRコード表示', path: '/qr', icon: 'qr', routeName: 'qr-display' },
  { name: '店舗設定', path: '/store-settings', icon: 'settings', routeName: 'store-settings' },
];

const storeName = computed(() => storeStore.currentStore?.name || '店舗未登録');
const isPremium = computed(() => subscriptionStore.isPremium);

function isActive(routeName: string): boolean {
  return route.name === routeName;
}
</script>

<template>
  <aside class="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white z-20">
    <!-- Logo -->
    <div class="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
      <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <div>
        <div class="font-semibold">Shop Manager</div>
        <div class="text-xs text-gray-400 truncate">{{ storeName }}</div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="mt-6 px-3">
      <ul class="space-y-1">
        <li v-for="item in menuItems" :key="item.routeName">
          <RouterLink
            :to="item.path"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
            :class="[
              isActive(item.routeName)
                ? 'bg-primary-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            ]"
          >
            <!-- Icons -->
            <svg v-if="item.icon === 'home'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <svg v-else-if="item.icon === 'users'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else-if="item.icon === 'calendar'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <svg v-else-if="item.icon === 'clock'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg v-else-if="item.icon === 'currency'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg v-else-if="item.icon === 'qr'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <svg v-else-if="item.icon === 'settings'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span class="flex-1">{{ item.name }}</span>
            <!-- Premium Badge -->
            <span
              v-if="item.isPremium && !isPremium"
              class="px-1.5 py-0.5 text-xs font-medium bg-yellow-500 text-yellow-900 rounded"
            >
              Premium
            </span>
          </RouterLink>
        </li>
      </ul>
    </nav>
  </aside>
</template>
