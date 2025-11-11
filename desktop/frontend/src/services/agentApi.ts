/**
 * Agent API服务
 * 使用Python Engine后端
 */
import axios from 'axios';
import { API_ENDPOINTS, API_TIMEOUT } from '@/config/api';
import type {
  AgentConfig,
  AgentCreateRequest,
  AgentUpdateRequest,
  Conversation,
  Message,
  MessageSendRequest,
  KnowledgeBase,
  Document,
  SearchResult,
  Tool,
  ToolCall,
} from "../types/agent";

// 创建专门用于Agent API的axios实例，连接到Python引擎后台
const agentClient = axios.create({
  baseURL: API_ENDPOINTS.engine.base,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
agentClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const API_BASE = "";

/**
 * Agent管理API
 */
export const agentApi = {
  // 创建Agent
  async createAgent(data: AgentCreateRequest): Promise<AgentConfig> {
    const response = await agentClient.post(`${API_BASE}/agents`, data);
    return response.data.data;
  },

  // 获取Agent列表
  async listAgents(params?: {
    user_id?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: AgentConfig[]; total: number }> {
    const response = await agentClient.get(`${API_BASE}/agents`, { params });
    return response.data.data;
  },

  // 获取Agent详情
  async getAgent(agentId: string): Promise<AgentConfig> {
    const response = await agentClient.get(`${API_BASE}/agents/${agentId}`);
    return response.data.data;
  },

  // 更新Agent
  async updateAgent(
    agentId: string,
    data: AgentUpdateRequest
  ): Promise<AgentConfig> {
    const response = await agentClient.patch(`${API_BASE}/agents/${agentId}`, data);
    return response.data.data;
  },

  // 删除Agent
  async deleteAgent(agentId: string): Promise<void> {
    await agentClient.delete(`${API_BASE}/agents/${agentId}`);
  },
};

/**
 * 对话API
 */
export const conversationApi = {
  // 创建会话
  async createConversation(data: {
    agent_id: string;
    title?: string;
  }): Promise<Conversation> {
    const response = await agentClient.post(`${API_BASE}/conversations`, data);
    return response.data.data;
  },

  // 获取会话列表
  async listConversations(params?: {
    user_id?: string;
    agent_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<Conversation[]> {
    const response = await agentClient.get(`${API_BASE}/conversations`, { params });
    return response.data.data;
  },

  // 获取会话详情
  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await agentClient.get(
      `${API_BASE}/conversations/${conversationId}`
    );
    return response.data.data;
  },

  // 获取消息历史
  async getMessages(
    conversationId: string,
    params?: { limit?: number; before_id?: string }
  ): Promise<Message[]> {
    const response = await agentClient.get(
      `${API_BASE}/conversations/${conversationId}/messages`,
      { params }
    );
    return response.data.data;
  },

  // 发送消息（非流式）
  async sendMessage(
    conversationId: string,
    data: MessageSendRequest
  ): Promise<Message> {
    const response = await agentClient.post(
      `${API_BASE}/conversations/${conversationId}/messages`,
      { ...data, stream: false }
    );
    return response.data.data;
  },

  // 发送消息（流式）- 返回EventSource
  createMessageStream(
    conversationId: string,
    _data: MessageSendRequest
  ): EventSource {
    const url = `${API_BASE}/conversations/${conversationId}/messages`;
    // 注意：这里需要使用SSE，实际实现可能需要调整
    return new EventSource(url);
  },

  // 更新会话
  async updateConversation(
    conversationId: string,
    data: { title?: string; summary?: string }
  ): Promise<Conversation> {
    const response = await agentClient.patch(
      `${API_BASE}/conversations/${conversationId}`,
      data
    );
    return response.data.data;
  },

  // 删除会话
  async deleteConversation(conversationId: string): Promise<void> {
    await agentClient.delete(`${API_BASE}/conversations/${conversationId}`);
  },

  // 导出会话
  async exportConversation(
    conversationId: string,
    format: "json" | "txt" | "md" = "json"
  ): Promise<any> {
    const response = await agentClient.get(
      `${API_BASE}/conversations/${conversationId}/export`,
      { params: { format } }
    );
    return response.data.data;
  },
};

/**
 * 知识库API
 */
export const knowledgeBaseApi = {
  // 创建知识库
  async createKnowledgeBase(data: {
    name: string;
    description: string;
    embedding_model?: string;
    chunk_size?: number;
    chunk_overlap?: number;
  }): Promise<KnowledgeBase> {
    const response = await agentClient.post(`${API_BASE}/knowledge-bases`, data);
    return response.data.data;
  },

  // 获取知识库列表
  async listKnowledgeBases(params?: {
    user_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<KnowledgeBase[]> {
    const response = await agentClient.get(`${API_BASE}/knowledge-bases`, { params });
    return response.data.data;
  },

  // 获取知识库详情
  async getKnowledgeBase(kbId: string): Promise<KnowledgeBase> {
    const response = await agentClient.get(`${API_BASE}/knowledge-bases/${kbId}`);
    return response.data.data;
  },

  // 更新知识库
  async updateKnowledgeBase(
    kbId: string,
    data: { name?: string; description?: string }
  ): Promise<KnowledgeBase> {
    const response = await agentClient.patch(
      `${API_BASE}/knowledge-bases/${kbId}`,
      data
    );
    return response.data.data;
  },

  // 删除知识库
  async deleteKnowledgeBase(kbId: string): Promise<void> {
    await agentClient.delete(`${API_BASE}/knowledge-bases/${kbId}`);
  },

  // 上传文档
  async uploadDocument(kbId: string, file: File): Promise<Document> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await agentClient.post(
      `${API_BASE}/knowledge-bases/${kbId}/documents`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  },

  // 获取文档列表
  async listDocuments(
    kbId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<Document[]> {
    const response = await agentClient.get(
      `${API_BASE}/knowledge-bases/${kbId}/documents`,
      { params }
    );
    return response.data.data;
  },

  // 删除文档
  async deleteDocument(kbId: string, docId: string): Promise<void> {
    await agentClient.delete(`${API_BASE}/knowledge-bases/${kbId}/documents/${docId}`);
  },

  // 检索知识库
  async search(
    kbId: string,
    data: {
      query: string;
      top_k?: number;
      min_similarity?: number;
    }
  ): Promise<{ query: string; results: SearchResult[] }> {
    const response = await agentClient.post(
      `${API_BASE}/knowledge-bases/${kbId}/search`,
      data
    );
    return response.data.data;
  },

  // 获取统计信息
  async getStats(kbId: string): Promise<any> {
    const response = await agentClient.get(`${API_BASE}/knowledge-bases/${kbId}/stats`);
    return response.data.data;
  },
};

/**
 * 贾维斯AI助理API
 */
export const jarvisApi = {
  // 处理自然语言查询，返回执行计划
  async processQuery(data: {
    query: string;
    context?: Record<string, any>;
  }): Promise<any> {
    const response = await agentClient.post(`${API_BASE}/jarvis/process`, data);
    return response.data.data;
  },

  // 执行计划
  async executePlan(data: {
    plan_id: string;
    approved: boolean;
  }): Promise<any> {
    const response = await agentClient.post(`${API_BASE}/jarvis/execute`, data);
    return response.data.data;
  },

  // 取消执行
  async cancelExecution(executionId: string): Promise<void> {
    await agentClient.post(`${API_BASE}/jarvis/executions/${executionId}/cancel`);
  },

  // 获取执行历史
  async getExecutionHistory(params?: {
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const response = await agentClient.get(`${API_BASE}/jarvis/executions`, { params });
    return response.data.data;
  },
};

/**
 * 工具API
 */
export const toolApi = {
  // 注册工具
  async registerTool(data: any): Promise<Tool> {
    const response = await agentClient.post(`${API_BASE}/tools`, data);
    return response.data.data;
  },

  // 获取工具列表
  async listTools(params?: {
    agent_id?: string;
    category?: string;
    enabled_only?: boolean;
  }): Promise<Tool[]> {
    const response = await agentClient.get(`${API_BASE}/tools`, { params });
    return response.data.data;
  },

  // 获取工具详情
  async getTool(toolId: string): Promise<Tool> {
    const response = await agentClient.get(`${API_BASE}/tools/${toolId}`);
    return response.data.data;
  },

  // 更新工具
  async updateTool(toolId: string, data: any): Promise<Tool> {
    const response = await agentClient.patch(`${API_BASE}/tools/${toolId}`, data);
    return response.data.data;
  },

  // 注销工具
  async unregisterTool(toolId: string): Promise<void> {
    await agentClient.delete(`${API_BASE}/tools/${toolId}`);
  },

  // 调用工具
  async callTool(
    toolId: string,
    data: {
      params: Record<string, any>;
      agent_id?: string;
      conversation_id?: string;
    }
  ): Promise<any> {
    const response = await agentClient.post(`${API_BASE}/tools/${toolId}/call`, data);
    return response.data.data;
  },

  // 获取调用历史
  async getCallHistory(params?: {
    agent_id?: string;
    tool_id?: string;
    status?: string;
    limit?: number;
  }): Promise<ToolCall[]> {
    const response = await agentClient.get(`${API_BASE}/tools/calls/history`, {
      params,
    });
    return response.data.data;
  },

  // 获取待审批列表
  async getPendingApprovals(params?: {
    agent_id?: string;
    conversation_id?: string;
  }): Promise<any[]> {
    const response = await agentClient.get(`${API_BASE}/tools/approvals/pending`, {
      params,
    });
    return response.data.data;
  },

  // 批准工具调用
  async approveTool(requestId: string): Promise<void> {
    await agentClient.post(`${API_BASE}/tools/approvals/${requestId}/approve`);
  },

  // 拒绝工具调用
  async rejectTool(requestId: string, reason?: string): Promise<void> {
    await agentClient.post(`${API_BASE}/tools/approvals/${requestId}/reject`, {
      reason,
    });
  },
};
