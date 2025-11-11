/**
 * Agent列表页面
 */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAgentStore } from "../../stores/agentStore";
import type { AgentType } from "../../types/agent";
import { Button } from "@/components/ui";

const AgentListPage: React.FC = () => {
  const navigate = useNavigate();
  const { agents, loading, error, fetchAgents, deleteAgent } = useAgentStore();
  const [filterType, setFilterType] = useState<AgentType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const filteredAgents = agents.filter((agent) => {
    const matchesType = filterType === "all" || agent.type === filterType;
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleDelete = async (agentId: string) => {
    if (window.confirm("确定要删除这个Agent吗？")) {
      try {
        await deleteAgent(agentId);
      } catch (error) {
        console.error("删除失败:", error);
      }
    }
  };

  const getAgentTypeLabel = (type: AgentType) => {
    const labels = {
      basic: "基础对话",
      react: "推理行动",
      deep_research: "深度研究",
    };
    return labels[type];
  };

  return (
    <div className="h-full flex flex-col bg-jarvis-space">
      {/* 头部 */}
      <div className="h-16 bg-jarvis-panel/30 border-b border-white/5 flex items-center justify-between px-6">
        <div>
          <h1 className="text-xl font-bold text-jarvis-text">🤖 Agent中心</h1>
          <p className="text-sm text-jarvis-text-secondary mt-1">管理和创建您的AI助手</p>
        </div>
        <Button
          onClick={() => navigate("/dashboard/agents/create")}
          variant="primary"
        >
          + 创建Agent
        </Button>
      </div>

      {/* 筛选和搜索 */}
      <div className="p-4 border-b border-white/5">
        <div className="flex gap-4">
          {/* 类型筛选 */}
          <div className="flex gap-2">
            <Button
              onClick={() => setFilterType("all")}
              variant={filterType === "all" ? "primary" : "ghost"}
              size="sm"
            >
              全部
            </Button>
            <Button
              onClick={() => setFilterType("basic")}
              variant={filterType === "basic" ? "primary" : "ghost"}
              size="sm"
            >
              基础对话
            </Button>
            <Button
              onClick={() => setFilterType("react")}
              variant={filterType === "react" ? "primary" : "ghost"}
              size="sm"
            >
              推理行动
            </Button>
            <Button
              onClick={() => setFilterType("deep_research")}
              variant={filterType === "deep_research" ? "primary" : "ghost"}
              size="sm"
            >
              深度研究
            </Button>
          </div>

          {/* 搜索框 */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索Agent名称或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-jarvis-panel border border-white/10 rounded-lg text-jarvis-text placeholder-jarvis-text-secondary focus:outline-none focus:ring-2 focus:ring-jarvis-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mx-6 mt-6 bg-jarvis-danger/10 border border-jarvis-danger/50 text-jarvis-danger px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Agent列表 */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-jarvis-primary"></div>
              <p className="mt-4 text-jarvis-text-secondary">加载中...</p>
            </div>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-jarvis-text-secondary text-lg mb-4">暂无Agent</p>
              <Button
                onClick={() => navigate("/dashboard/agents/create")}
                variant="primary"
              >
                创建第一个Agent
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <div
                key={agent.id}
                className="bg-jarvis-panel border border-white/10 rounded-lg hover:border-jarvis-primary/50 transition-all p-6"
              >
                {/* Agent头部 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-jarvis-primary to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                      {agent.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-jarvis-text">
                        {agent.name}
                      </h3>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full border ${
                          agent.type === 'basic' 
                            ? 'bg-jarvis-info/10 text-jarvis-info border-jarvis-info/30'
                            : agent.type === 'react'
                            ? 'bg-jarvis-success/10 text-jarvis-success border-jarvis-success/30'
                            : 'bg-jarvis-primary/10 text-jarvis-primary border-jarvis-primary/30'
                        }`}
                      >
                        {getAgentTypeLabel(agent.type)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Agent描述 */}
                <p className="text-jarvis-text-secondary text-sm mb-4 line-clamp-2">
                  {agent.description}
                </p>

                {/* Agent信息 */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-jarvis-text-secondary">
                    <span>模型:</span>
                    <span className="font-medium text-jarvis-text">
                      {agent.llm_config.model}
                    </span>
                  </div>
                  {agent.knowledge_base_ids.length > 0 && (
                    <div className="flex items-center gap-2 text-jarvis-text-secondary">
                      <span>知识库:</span>
                      <span className="font-medium text-jarvis-text">
                        {agent.knowledge_base_ids.length}个
                      </span>
                    </div>
                  )}
                  {agent.tool_ids.length > 0 && (
                    <div className="flex items-center gap-2 text-jarvis-text-secondary">
                      <span>工具:</span>
                      <span className="font-medium text-jarvis-text">
                        {agent.tool_ids.length}个
                      </span>
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate(`/dashboard/agents/chat/${agent.id}`)}
                    variant="primary"
                    className="flex-1"
                  >
                    开始对话
                  </Button>
                  <Button
                    onClick={() => navigate(`/dashboard/agents/edit/${agent.id}`)}
                    variant="secondary"
                  >
                    编辑
                  </Button>
                  <Button
                    onClick={() => handleDelete(agent.id)}
                    variant="danger"
                  >
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentListPage;
