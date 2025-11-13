import { create } from 'zustand';
import { AuthState, User } from '@/types';
import { tauriService } from '@/services/tauri';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/v1';

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

  login: async (emailOrUsername: string, password: string) => {
    try {
      // 调用真实的云服务 API
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: emailOrUsername,
        password: password,
      });

      if (response.data.code === 0 && response.data.data) {
        const { token, user } = response.data.data;

        const userObj: User = {
          id: user.id || user.user_id,
          email: user.email,
          username: user.username || user.name,
          membership: user.membership || 'free',
        };

        // 保存到系统密钥库
        try {
          await tauriService.saveToKeychain('jarvis', 'auth_token', token);
        } catch (e) {
          console.warn('Failed to save to keychain:', e);
        }

        // 保存到localStorage作为备份
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(userObj));

        set({
          user: userObj,
          token: token,
          isAuthenticated: true,
        });

        return { success: true };
      } else {
        return {
          success: false,
          error: response.data.message || '登录失败',
        };
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.message || '登录失败，请检查用户名和密码',
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : '登录失败，请稍后重试',
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
      // 尝试从密钥库获取token
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
