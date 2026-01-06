import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes: RouteRecordRaw[] = [
  // Auth routes
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/views/auth/ForgotPasswordView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/email-pending',
    name: 'email-pending',
    component: () => import('@/views/auth/EmailPendingView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/verify-email',
    name: 'verify-email',
    component: () => import('@/views/auth/EmailVerificationView.vue'),
    meta: { requiresAuth: false },
  },

  // Main routes
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/dashboard/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/store-settings',
    name: 'store-settings',
    component: () => import('@/views/store/StoreSettingsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/staff',
    name: 'staff-list',
    component: () => import('@/views/staff/StaffListView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/staff/new',
    name: 'staff-new',
    component: () => import('@/views/staff/StaffFormView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/staff/:id/edit',
    name: 'staff-edit',
    component: () => import('@/views/staff/StaffFormView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/shifts',
    name: 'shift-calendar',
    component: () => import('@/views/shift/ShiftCalendarView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/attendance',
    name: 'attendance-list',
    component: () => import('@/views/attendance/AttendanceListView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/qr',
    name: 'qr-display',
    component: () => import('@/views/qr/QRDisplayView.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next({ name: 'login' });
  } else if (!to.meta.requiresAuth && authStore.isLoggedIn && to.name !== 'qr-display') {
    next({ name: 'dashboard' });
  } else {
    next();
  }
});

export default router;
