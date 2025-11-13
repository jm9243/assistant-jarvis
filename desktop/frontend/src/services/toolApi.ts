/**
 * 工具 API 服务
 * 使用 Tauri IPC 与 Python 引擎通信
 */
import { invoke } from '@tauri-apps/api/core';

export interface Tool {
    id: string;
    name: string;
    description: string;
    type: 'workflow' | 'api' | 'builtin';
    is_enabled: boolean;
    usage_count: number;
    success_rate: number;
    parameters_schema: any;
    approval_policy?: 'none' | 'optional' | 'required';
}

/**
 * 工具 API 服务类
 */
class ToolApiService {
    /**
     * 获取工具列表
     */
    async listTools(): Promise<Tool[]> {
        try {
            const result = await invoke<any>('list_tools', {
                agentId: null,
                category: null,
                enabledOnly: false,
            });
            if (result.success) {
                return result.tools || [];
            }
            throw new Error(result.error || 'Failed to list tools');
        } catch (error) {
            console.error('Failed to list tools:', error);
            throw error;
        }
    }

    /**
     * 获取工具详情
     */
    async getTool(toolId: string): Promise<Tool> {
        try {
            const result = await invoke<any>('get_tool', { toolId });
            if (result.success) {
                return result.tool;
            }
            throw new Error(result.error || 'Failed to get tool');
        } catch (error) {
            console.error('Failed to get tool:', error);
            throw error;
        }
    }

    /**
     * 更新工具
     */
    async updateTool(
        toolId: string,
        data: { is_enabled?: boolean; approval_policy?: string }
    ): Promise<Tool> {
        try {
            const result = await invoke<any>('update_tool', {
                toolId,
                isEnabled: data.is_enabled,
                approvalPolicy: data.approval_policy,
            });
            if (result.success) {
                return result.tool;
            }
            throw new Error(result.error || 'Failed to update tool');
        } catch (error) {
            console.error('Failed to update tool:', error);
            throw error;
        }
    }

    /**
     * 调用工具
     */
    async callTool(toolId: string, params: Record<string, any>): Promise<any> {
        try {
            const result = await invoke<any>('call_tool', {
                toolId,
                params,
                agentId: null,
                conversationId: null,
            });
            if (result.success) {
                return result.result;
            }
            throw new Error(result.error || 'Failed to call tool');
        } catch (error) {
            console.error('Failed to call tool:', error);
            throw error;
        }
    }
}

export const toolApi = new ToolApiService();
export default toolApi;
