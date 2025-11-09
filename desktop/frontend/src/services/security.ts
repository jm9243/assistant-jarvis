/**
 * 安全存储工具
 */
import { invoke } from '@tauri-apps/api/core';

declare global {
  interface Window {
    __TAURI_IPC__?: unknown;
    __TAURI_METADATA__?: unknown;
  }
}

const NAMESPACE = 'jarvis.desktop';
export const AUTH_TOKEN_KEY = 'auth.accessToken';
export const REFRESH_TOKEN_KEY = 'auth.refreshToken';
export const PROFILE_KEY = 'auth.profile';

const withNamespace = (key: string) => `${NAMESPACE}:${key}`;

const memoryStore = new Map<string, string>();

const isTauriRuntime = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(window.__TAURI_IPC__ || window.__TAURI_METADATA__);
};

const fallbackStorage = {
  set: (key: string, value: string) => {
    memoryStore.set(withNamespace(key), value);
  },
  get: (key: string) => {
    return memoryStore.get(withNamespace(key)) ?? null;
  },
  remove: (key: string) => {
    memoryStore.delete(withNamespace(key));
  },
};

async function tryInvoke<T>(command: string, payload: Record<string, unknown>) {
  if (!isTauriRuntime()) {
    return null;
  }
  return await invoke<T>(command, payload);
}

export const secureStorage = {
  async set(key: string, value: string) {
    const namespacedKey = withNamespace(key);
    const result = await tryInvoke('secure_store_set', { key: namespacedKey, value });
    if (result === null) {
      fallbackStorage.set(key, value);
      if (isTauriRuntime()) {
        throw new Error('安全存储命令不可用，请检查 Tauri secure_store_set');
      }
    }
  },

  async get(key: string): Promise<string | null> {
    const namespacedKey = withNamespace(key);
    const result = await tryInvoke<string>('secure_store_get', { key: namespacedKey });
    if (result === null) return fallbackStorage.get(key);
    return result;
  },

  async remove(key: string) {
    const namespacedKey = withNamespace(key);
    const result = await tryInvoke('secure_store_remove', { key: namespacedKey });
    if (result === null) {
      fallbackStorage.remove(key);
      if (isTauriRuntime()) {
        throw new Error('安全存储命令不可用，请检查 Tauri secure_store_remove');
      }
    }
  },
};
