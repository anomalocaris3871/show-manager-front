<script setup lang="ts">
import { useToast } from '@/composables/useToast';

const { toasts, remove } = useToast();

const typeStyles = {
  success: {
    bg: 'bg-green-50 border-green-200',
    icon: 'text-green-500',
    text: 'text-green-800',
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    icon: 'text-red-500',
    text: 'text-red-800',
  },
  warning: {
    bg: 'bg-yellow-50 border-yellow-200',
    icon: 'text-yellow-500',
    text: 'text-yellow-800',
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-500',
    text: 'text-blue-800',
  },
};
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-4 left-4 z-50 flex flex-col-reverse gap-2 max-w-sm">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="flex items-start gap-3 p-4 rounded-lg border shadow-lg"
          :class="typeStyles[toast.type].bg"
        >
          <!-- Icon -->
          <div class="flex-shrink-0 mt-0.5">
            <!-- Success -->
            <svg
              v-if="toast.type === 'success'"
              class="w-5 h-5"
              :class="typeStyles[toast.type].icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <!-- Error -->
            <svg
              v-else-if="toast.type === 'error'"
              class="w-5 h-5"
              :class="typeStyles[toast.type].icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <!-- Warning -->
            <svg
              v-else-if="toast.type === 'warning'"
              class="w-5 h-5"
              :class="typeStyles[toast.type].icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <!-- Info -->
            <svg
              v-else
              class="w-5 h-5"
              :class="typeStyles[toast.type].icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <!-- Message -->
          <p class="flex-1 text-sm font-medium" :class="typeStyles[toast.type].text">
            {{ toast.message }}
          </p>

          <!-- Close Button -->
          <button
            @click="remove(toast.id)"
            class="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
            :class="typeStyles[toast.type].text"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.3s ease-out;
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
.toast-move {
  transition: transform 0.3s ease;
}
</style>
