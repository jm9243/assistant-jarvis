import { create } from 'zustand';
import { SystemMetric, SoftwareItem, Alert } from '@/types';
import { systemApi } from '@/services/systemApi';

interface SystemStore {
  metrics: SystemMetric | null;
  software: SoftwareItem[];
  logs: any[];
  isLoading: boolean;
  isScanning: boolean;

  // 系统监控
  loadSystemInfo: () => Promise<void>;
  startMonitoring: () => void;
  stopMonitoring: () => void;

  // 软件扫描
  scanSoftware: () => Promise<void>;

  // 日志管理
  loadLogs: (filter?: { level?: string; limit?: number }) => Promise<void>;
  clearLogs: () => void;

  // 告警管理
  addAlert: (alert: Alert) => void;
  clearAlert: (id: string) => void;
  clearAllAlerts: () => void;
}

let monitoringInterval: ReturnType<typeof setInterval> | null = null;

export const useSystemStore = create<SystemStore>((set, get) => ({
  metrics: null,
  software: [],
  logs: [],
  isLoading: false,
  isScanning: false,

  loadSystemInfo: async () => {
    try {
      const metrics = await systemApi.getSystemMetrics();
      set({
        metrics: {
          cpu: metrics.cpu,
          memory: metrics.memory,
          disk: metrics.disk,
          sidecarStatus: 'running', // TODO: 从引擎获取真实状态
          alerts: get().metrics?.alerts || [],
        }
      });
    } catch (error) {
      console.error('Failed to load system info:', error);
    }
  },

  startMonitoring: () => {
    // 立即加载一次
    get().loadSystemInfo();

    // 每5秒轮询一次
    if (!monitoringInterval) {
      monitoringInterval = setInterval(() => {
        get().loadSystemInfo();
      }, 5000);
    }
  },

  stopMonitoring: () => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      monitoringInterval = null;
    }
  },

  scanSoftware: async () => {
    set({ isScanning: true });
    try {
      const software = await systemApi.scanSoftware();
      set({ software });
    } catch (error) {
      console.error('Failed to scan software:', error);
    } finally {
      set({ isScanning: false });
    }
  },

  loadLogs: async (filter?: { level?: string; limit?: number }) => {
    set({ isLoading: true });
    try {
      const logs = await systemApi.getLogs(filter);
      set({ logs });
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  clearLogs: () => {
    set({ logs: [] });
  },

  addAlert: (alert: Alert) => {
    set((state) => ({
      metrics: state.metrics
        ? {
          ...state.metrics,
          alerts: [...state.metrics.alerts, alert],
        }
        : null,
    }));
  },

  clearAlert: (id: string) => {
    set((state) => ({
      metrics: state.metrics
        ? {
          ...state.metrics,
          alerts: state.metrics.alerts.filter((a) => a.id !== id),
        }
        : null,
    }));
  },

  clearAllAlerts: () => {
    set((state) => ({
      metrics: state.metrics
        ? {
          ...state.metrics,
          alerts: [],
        }
        : null,
    }));
  },
}));
