/**
 * 系统信息 API 服务
 * 使用 Tauri 命令获取真实的系统信息
 */
import { invoke } from '@tauri-apps/api/core';

export interface SystemMetrics {
    cpu: number;
    memory: number;
    disk: number;
    total_memory?: number;
    used_memory?: number;
    total_disk?: number;
    used_disk?: number;
}

export interface SystemInfo {
    os_name: string;
    os_version: string;
    kernel_version: string;
    hostname: string;
    cpu_count: number;
    cpu_brand: string;
}

export interface InstalledSoftware {
    name: string;
    version: string;
    publisher: string;
    install_date?: string;
}

/**
 * 系统 API 服务类
 */
class SystemApiService {
    /**
     * 获取系统信息
     */
    async getSystemInfo(): Promise<SystemInfo> {
        try {
            const info = await invoke<SystemInfo>('get_system_info');
            return info;
        } catch (error) {
            console.error('Failed to get system info:', error);
            throw error;
        }
    }

    /**
     * 获取系统指标
     * 使用 Tauri 命令获取真实的 CPU/内存/磁盘使用率
     */
    async getSystemMetrics(): Promise<SystemMetrics> {
        try {
            const metrics = await invoke<SystemMetrics>('get_system_metrics');
            return metrics;
        } catch (error) {
            console.error('Failed to get system metrics:', error);
            throw error;
        }
    }

    /**
     * 获取日志
     * 从本地日志文件读取
     */
    async getLogs(_options?: { limit?: number }): Promise<any[]> {
        try {
            // TODO: 实现从日志文件读取
            // 目前返回空数组
            return [];
        } catch (error) {
            console.error('Failed to get logs:', error);
            throw error;
        }
    }

    /**
     * 扫描已安装软件
     * 使用 Tauri 命令扫描系统中已安装的软件
     */
    async scanSoftware(): Promise<InstalledSoftware[]> {
        try {
            const software = await invoke<InstalledSoftware[]>('scan_installed_software');
            return software;
        } catch (error) {
            console.error('Failed to scan software:', error);
            throw error;
        }
    }
}

export const systemApi = new SystemApiService();
export default systemApi;
