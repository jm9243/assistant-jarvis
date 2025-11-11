import { invoke } from '@tauri-apps/api/core';
import { Result } from '@/types';

// Tauri命令封装

export const tauriService = {
  // 启动Python引擎
  async startEngine(): Promise<Result<void>> {
    try {
      await invoke('start_engine');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start engine',
      };
    }
  },

  // 停止Python引擎
  async stopEngine(): Promise<Result<void>> {
    try {
      await invoke('stop_engine');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stop engine',
      };
    }
  },

  // 检查引擎状态
  async checkEngineStatus(): Promise<Result<{ running: boolean }>> {
    try {
      const running = await invoke<boolean>('check_engine_status');
      return { success: true, data: { running } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check engine status',
      };
    }
  },

  // 保存到系统密钥库
  async saveToKeychain(service: string, account: string, password: string): Promise<Result<void>> {
    try {
      await invoke('save_to_keychain', { service, account, password });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save to keychain',
      };
    }
  },

  // 从系统密钥库读取
  async getFromKeychain(service: string, account: string): Promise<Result<string>> {
    try {
      const password = await invoke<string>('get_from_keychain', { service, account });
      return { success: true, data: password };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get from keychain',
      };
    }
  },

  // 请求系统权限
  async requestPermission(permission: string): Promise<Result<boolean>> {
    try {
      const granted = await invoke<boolean>('request_permission', { permission });
      return { success: true, data: granted };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to request permission',
      };
    }
  },
};
