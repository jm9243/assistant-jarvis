import { create } from 'zustand';
import { AuthState, User } from '@/types';
import { tauriService } from '@/services/tauri';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (email: string, _password: string) => {
    try {
      // TODO: 调用Supabase Auth API
      // 这里先模拟登录
      const mockUser: User = {
        id: '1',
        email,
        username: email.split('@')[0],
        membership: 'free',
      };

      const mockToken = 'mock_jwt_token_' + Date.now();

      // 保存到系统密钥库
      await tauriService.saveToKeychain('jarvis', 'auth_token', mockToken);

      // 保存到localStorage作为备份
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      set({
        user: mockUser,
        token: mockToken,
        isAuthenticated: true,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  refreshToken: async () => {
    try {
      // TODO: 实现Token刷新逻辑
      const result = await tauriService.getFromKeychain('jarvis', 'auth_token');
      if (result.success && result.data) {
        set({ token: result.data });
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
    }
  },

  setUser: (user: User) => {
    set({ user, isAuthenticated: true });
  },

  setToken: (token: string) => {
    set({ token });
    localStorage.setItem('auth_token', token);
  },
}));

// 初始化：从localStorage恢复状态
const storedToken = localStorage.getItem('auth_token');
const storedUser = localStorage.getItem('user');

if (storedToken && storedUser) {
  try {
    const user = JSON.parse(storedUser);
    useAuthStore.setState({
      user,
      token: storedToken,
      isAuthenticated: true,
    });
  } catch (error) {
    console.error('Failed to restore auth state:', error);
  }
}
