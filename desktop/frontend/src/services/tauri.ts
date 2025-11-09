/**
 * Tauri命令调用服务
 */
import { invoke } from '@tauri-apps/api/core';

const isServer = typeof window === 'undefined';

const shouldSkipError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('has not been initialized') || message.includes('__TAURI_IPC__');
};

async function invokeSafely(command: string): Promise<boolean> {
  if (isServer) return false;
  try {
    await invoke(command);
    return true;
  } catch (error) {
    if (shouldSkipError(error)) {
      console.info(`[tauri] ${command} skipped，当前非 Tauri 运行环境`);
      return false;
    }
    console.error(`[tauri] 调用 ${command} 失败`, error);
    throw error;
  }
}

export async function startEngine(): Promise<void> {
  await invokeSafely('start_engine');
}

export async function stopEngine(): Promise<void> {
  await invokeSafely('stop_engine');
}
