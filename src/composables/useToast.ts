import { ref } from 'vue';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration: number;
}

const toasts = ref<Toast[]>([]);
let nextId = 0;

export function useToast() {
  function show(
    message: string,
    type: Toast['type'] = 'info',
    duration = 3000
  ) {
    const id = nextId++;
    const toast: Toast = { id, type, message, duration };

    toasts.value.push(toast);

    if (duration > 0) {
      setTimeout(() => {
        remove(id);
      }, duration);
    }

    return id;
  }

  function remove(id: number) {
    const index = toasts.value.findIndex((t) => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  }

  function success(message: string, duration?: number) {
    return show(message, 'success', duration);
  }

  function error(message: string, duration?: number) {
    return show(message, 'error', duration ?? 5000); // 에러는 더 오래 표시
  }

  function warning(message: string, duration?: number) {
    return show(message, 'warning', duration);
  }

  function info(message: string, duration?: number) {
    return show(message, 'info', duration);
  }

  return {
    toasts,
    show,
    remove,
    success,
    error,
    warning,
    info,
  };
}
