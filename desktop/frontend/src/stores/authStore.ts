/**
 * 认证状态管理
 */
import { create } from 'zustand';
import { authAPI } from '@/services/auth';
import { secureStorage, AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, PROFILE_KEY } from '@/services/security';
import type { IAuthCredentials, IUserProfile } from '@/types';

export type AuthStatus = 'hydrating' | 'idle' | 'authenticating' | 'authenticated' | 'error';

interface AuthState {
  user: IUserProfile | null;
  token: string | null;
  refreshToken: string | null;
  status: AuthStatus;
  error?: string;
  login: (payload: IAuthCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

const persistProfile = async (profile: IUserProfile | null) => {
  if (!profile) {
    await secureStorage.remove(PROFILE_KEY);
    return;
  }
  await secureStorage.set(PROFILE_KEY, JSON.stringify(profile));
};

const mapAuthError = (message?: string) => {
  if (!message) return '登录失败，请稍后重试';
  if (message.includes('Failed to fetch')) {
    return '无法连接本地引擎，请在 Tauri 中运行或启动 Python sidecar (默认 http://localhost:8000)';
  }
  return message;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  status: 'hydrating',
  async login(payload) {
    set({ status: 'authenticating', error: undefined });
    const result = await authAPI.login(payload);

    if (!result.success || !result.data) {
      set({ status: 'error', error: mapAuthError(result.error) });
      return false;
    }

    const { tokens, profile } = result.data;
    await secureStorage.set(AUTH_TOKEN_KEY, tokens.accessToken);

    if (tokens.refreshToken) {
      await secureStorage.set(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }

    await persistProfile(profile);

    set({
      user: profile,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? null,
      status: 'authenticated',
      error: undefined,
    });
    return true;
  },
  async logout() {
    await Promise.all([
      secureStorage.remove(AUTH_TOKEN_KEY),
      secureStorage.remove(REFRESH_TOKEN_KEY),
      secureStorage.remove(PROFILE_KEY),
    ]);

    set({
      user: null,
      token: null,
      refreshToken: null,
      status: 'idle',
      error: undefined,
    });
  },
  async restoreSession() {
    const { status } = get();
    if (status !== 'hydrating') return;

    try {
      const [token, refreshToken, rawProfile] = await Promise.all([
        secureStorage.get(AUTH_TOKEN_KEY),
        secureStorage.get(REFRESH_TOKEN_KEY),
        secureStorage.get(PROFILE_KEY),
      ]);

      if (!token || !rawProfile) {
        set({ status: 'idle' });
        return;
      }

      const profile: IUserProfile = JSON.parse(rawProfile);
      set({
        token,
        refreshToken,
        user: profile,
        status: 'authenticated',
      });
    } catch (error) {
      console.error('[authStore] restoreSession failed', error);
      set({ status: 'idle' });
    }
  },
}));
