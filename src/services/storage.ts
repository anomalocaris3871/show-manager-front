const PREFIX = 'shop-manager:';

export const storage = {
  get<T>(key: string): T | null {
    const item = localStorage.getItem(PREFIX + key);
    if (!item) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  },

  remove(key: string): void {
    localStorage.removeItem(PREFIX + key);
  },

  clear(): void {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  },
};

// 유틸리티 함수
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function getCurrentISOString(): string {
  return new Date().toISOString();
}
