/**
 * 连接监控服务
 * 监控后端服务的连接状态，提供友好的错误提示
 */
import { toast } from '@/components/ui/Toast';
import { API_ENDPOINTS } from '@/config/api';

export type ServiceType = 'engine' | 'cloud';

export interface ConnectionStatus {
    engine: boolean;
    cloud: boolean;
    lastCheck: Date;
}

class ConnectionMonitor {
    private status: ConnectionStatus = {
        engine: false,
        cloud: false,
        lastCheck: new Date(),
    };

    private checkInterval: number | null = null;
    private hasShownEngineError = false;
    private hasShownCloudError = false;

    /**
     * 开始监控连接状态
     */
    startMonitoring(intervalMs: number = 30000) {
        // 立即检查一次
        this.checkAllConnections();

        // 定期检查
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        this.checkInterval = window.setInterval(() => {
            this.checkAllConnections();
        }, intervalMs);
    }

    /**
     * 停止监控
     */
    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    /**
     * 检查所有连接
     */
    private async checkAllConnections() {
        const engineOk = await this.checkConnection('engine');
        const cloudOk = await this.checkConnection('cloud');

        this.status = {
            engine: engineOk,
            cloud: cloudOk,
            lastCheck: new Date(),
        };

        // 显示错误提示
        this.showConnectionErrors();
    }

    /**
     * 检查单个服务连接
     */
    async checkConnection(service: ServiceType): Promise<boolean> {
        try {
            if (service === 'engine') {
                // 使用 Tauri 命令检查引擎状态
                const { invoke } = await import('@tauri-apps/api/core');
                const isHealthy = await invoke<boolean>('check_engine_health');
                return isHealthy;
            } else {
                // 云服务仍然使用 HTTP 检查
                const url = API_ENDPOINTS.cloud.health;
                const response = await fetch(url, {
                    method: 'GET',
                    signal: AbortSignal.timeout(3000),
                });
                return response.ok;
            }
        } catch {
            return false;
        }
    }

    /**
     * 显示连接错误提示
     */
    private showConnectionErrors() {
        // Python引擎错误
        if (!this.status.engine && !this.hasShownEngineError) {
            this.hasShownEngineError = true;
            toast.error(
                '无法连接到本地引擎',
                '贾维斯的执行引擎未启动，部分功能将无法使用',
                {
                    duration: 0, // 不自动关闭
                    action: {
                        label: '查看解决方案',
                        onClick: () => {
                            this.showEngineHelp();
                        },
                    },
                }
            );
        } else if (this.status.engine && this.hasShownEngineError) {
            // 恢复连接
            this.hasShownEngineError = false;
            toast.success('本地引擎已连接', '所有功能已恢复正常');
        }

        // 云服务错误
        if (!this.status.cloud && !this.hasShownCloudError) {
            this.hasShownCloudError = true;
            toast.warning(
                '无法连接到云服务',
                '云端功能暂时不可用，本地功能不受影响',
                {
                    duration: 8000,
                }
            );
        } else if (this.status.cloud && this.hasShownCloudError) {
            // 恢复连接
            this.hasShownCloudError = false;
            toast.success('云服务已连接', '云端功能已恢复');
        }
    }

    /**
     * 显示引擎帮助信息
     */
    private showEngineHelp() {
        const helpMessage = `
请按以下步骤启动本地引擎：

1. 开发模式：
   在终端运行: npm run start:engine
   
2. 生产模式：
   引擎会自动启动，如果失败请检查：
   - 是否正确安装了Python依赖
   - 端口8000是否被占用
   - 查看日志文件: logs/engine.log

3. 需要帮助？
   查看文档: desktop/QUICK_REFERENCE.md
    `.trim();

        toast.info('启动引擎指南', helpMessage, {
            duration: 0,
        });
    }

    /**
     * 获取当前连接状态
     */
    getStatus(): ConnectionStatus {
        return { ...this.status };
    }

    /**
     * 手动触发连接检查
     */
    async recheckNow(): Promise<ConnectionStatus> {
        await this.checkAllConnections();
        return this.getStatus();
    }
}

export const connectionMonitor = new ConnectionMonitor();
