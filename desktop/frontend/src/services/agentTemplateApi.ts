/**
 * Agent模板API服务
 */
import type {
  AgentTemplate,
  AgentTemplateCreateRequest,
  AgentTemplateQueryParams,
} from "../types/agent";

import { API_ENDPOINTS } from '@/config/api';

const API_BASE_URL = API_ENDPOINTS.cloud.base.replace('/api/v1', '');

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface ListResponse<T> {
  list: T[];
  total: number;
}

export const agentTemplateApi = {
  /**
   * 获取模板列表
   */
  async listTemplates(
    params?: AgentTemplateQueryParams
  ): Promise<ListResponse<AgentTemplate>> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append("category", params.category);
    if (params?.type) queryParams.append("type", params.type);
    if (params?.tags) params.tags.forEach((tag) => queryParams.append("tags", tag));
    if (params?.search) queryParams.append("search", params.search);
    if (params?.is_system !== undefined)
      queryParams.append("is_system", String(params.is_system));
    if (params?.is_public !== undefined)
      queryParams.append("is_public", String(params.is_public));
    if (params?.page) queryParams.append("page", String(params.page));
    if (params?.page_size) queryParams.append("page_size", String(params.page_size));

    const response = await fetch(
      `${API_BASE_URL}/api/v1/agent-templates?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch templates");
    }

    const result: ApiResponse<ListResponse<AgentTemplate>> = await response.json();
    return result.data;
  },

  /**
   * 获取模板详情
   */
  async getTemplate(id: string): Promise<AgentTemplate> {
    const response = await fetch(`${API_BASE_URL}/api/v1/agent-templates/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch template");
    }

    const result: ApiResponse<AgentTemplate> = await response.json();
    return result.data;
  },

  /**
   * 创建模板
   */
  async createTemplate(data: AgentTemplateCreateRequest): Promise<AgentTemplate> {
    const response = await fetch(`${API_BASE_URL}/api/v1/agent-templates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to create template");
    }

    const result: ApiResponse<AgentTemplate> = await response.json();
    return result.data;
  },

  /**
   * 更新模板
   */
  async updateTemplate(
    id: string,
    data: Partial<AgentTemplateCreateRequest>
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/agent-templates/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update template");
    }
  },

  /**
   * 删除模板
   */
  async deleteTemplate(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/agent-templates/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete template");
    }
  },

  /**
   * 使用模板（增加使用次数）
   */
  async useTemplate(id: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/agent-templates/${id}/use`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to use template");
    }
  },
};
