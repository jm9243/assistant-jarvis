/**
 * Agent创建/编辑页面
 */
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAgentStore } from "../../stores/agentStore";
import { AgentTypeSelector } from "../../components/agent/AgentTypeSelector";
import { ModelConfigForm } from "../../components/agent/ModelConfigForm";
import { PromptEditor } from "../../components/agent/PromptEditor";
import { KnowledgeBaseSelector } from "../../components/agent/KnowledgeBaseSelector";
import { ToolSelector } from "../../components/agent/ToolSelector";
import { TemplateSelector } from "../../components/agent/TemplateSelector";
import { agentTemplateApi } from "../../services/agentTemplateApi";
import { Button } from "@/components/ui";
import type {
  AgentCreateRequest,
  MemoryConfig,
  AgentTemplate,
} from "../../types/agent";

const AgentFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();
  const { currentAgent, fetchAgent, createAgent, updateAgent, loading } =
    useAgentStore();

  const isEditMode = !!agentId;

  // 表单状态
  const [formData, setFormData] = useState<AgentCreateRequest>({
    name: "",
    description: "",
    type: "basic",
    tags: [],
    llm_config: {
      provider: "openai",
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 2000,
    },
    system_prompt: "你是一个有帮助的AI助手。",
    memory_config: {
      short_term: {
        enabled: true,
        window_size: 10,
      },
      long_term: {
        enabled: true,
        retention_days: 90,
      },
      working: {
        enabled: true,
      },
    },
    knowledge_base_ids: [],
    tool_ids: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<
    "basic" | "model" | "prompt" | "knowledge" | "tools" | "advanced"
  >("basic");
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false);
  const [templateData, setTemplateData] = useState({
    name: "",
    description: "",
    category: "customer_service",
    is_public: false,
  });

  // 加载Agent数据（编辑模式）
  useEffect(() => {
    if (isEditMode && agentId) {
      fetchAgent(agentId);
    }
  }, [isEditMode, agentId, fetchAgent]);

  // 填充表单数据
  useEffect(() => {
    if (isEditMode && currentAgent) {
      setFormData({
        name: currentAgent.name,
        description: currentAgent.description,
        type: currentAgent.type,
        tags: currentAgent.tags,
        llm_config: currentAgent.llm_config,
        system_prompt: currentAgent.system_prompt,
        prompt_template: currentAgent.prompt_template,
        memory_config: currentAgent.memory_config,
        knowledge_base_ids: currentAgent.knowledge_base_ids,
        tool_ids: currentAgent.tool_ids,
        react_config: currentAgent.react_config,
        research_config: currentAgent.research_config,
      });
    }
  }, [isEditMode, currentAgent]);

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "请输入Agent名称";
    }

    if (!formData.description.trim()) {
      newErrors.description = "请输入Agent描述";
    }

    // API Key 由后台统一管理，客户端不需要验证

    if (!formData.system_prompt.trim()) {
      newErrors.system_prompt = "请输入系统提示词";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (isEditMode && agentId) {
        await updateAgent(agentId, formData);
      } else {
        await createAgent(formData);
      }
      navigate("/agents");
    } catch (error) {
      console.error("保存失败:", error);
    }
  };

  // 更新表单字段
  const updateField = <K extends keyof AgentCreateRequest>(
    field: K,
    value: AgentCreateRequest[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 从模板创建Agent
  const handleTemplateSelect = (template: AgentTemplate) => {
    // 填充基础信息
    setFormData((prev) => ({
      ...prev,
      type: template.type,
      name: template.name,
      description: template.description,
      tags: template.tags,
      system_prompt: template.config.system_prompt,
      llm_config: {
        ...prev.llm_config,
        ...template.config.llm_config,
      },
      memory_config: template.config.memory_config || prev.memory_config,
      react_config: template.config.react_config,
      research_config: template.config.research_config,
    }));

    setShowTemplateSelector(false);
  };

  // 保存为模板
  const handleSaveAsTemplate = async () => {
    try {
      // 构建模板配置
      const config: AgentTemplate["config"] = {
        system_prompt: formData.system_prompt,
        llm_config: {
          provider: formData.llm_config.provider,
          model: formData.llm_config.model,
          temperature: formData.llm_config.temperature,
          max_tokens: formData.llm_config.max_tokens,
          // 不保存API密钥
        },
        memory_config: formData.memory_config,
      };

      if (formData.type === "react" && formData.react_config) {
        config.react_config = formData.react_config;
      }

      if (formData.type === "deep_research" && formData.research_config) {
        config.research_config = formData.research_config;
      }

      await agentTemplateApi.createTemplate({
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        type: formData.type,
        tags: formData.tags,
        is_public: templateData.is_public,
        config,
      });

      setShowSaveAsTemplate(false);
      setTemplateData({
        name: "",
        description: "",
        category: "customer_service",
        is_public: false,
      });

      alert("模板保存成功！");
    } catch (error) {
      console.error("保存模板失败:", error);
      alert("保存模板失败，请重试");
    }
  };

  return (
    <div className="jarvis-page">
      {/* 头部 */}
      <div className="jarvis-header">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate("/dashboard/agents")}
            variant="ghost"
            size="sm"
          >
            ← 返回
          </Button>
          <div>
            <h1 className="text-xl font-bold text-jarvis-text">
              {isEditMode ? "编辑Agent" : "创建Agent"}
            </h1>
            <p className="text-sm text-jarvis-text-secondary mt-1">
              {isEditMode
                ? "修改Agent配置和设置"
                : "配置您的AI助手，选择合适的模型和功能"}
            </p>
          </div>
        </div>
        {!isEditMode && (
          <Button
            type="button"
            onClick={() => setShowTemplateSelector(true)}
            variant="secondary"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
              />
            </svg>
            从模板创建
          </Button>
        )}
      </div>

      <div className="jarvis-content jarvis-scrollbar">
        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
          {/* 标签页导航 */}
          <div className="jarvis-section mb-6">
            <div className="border-b border-white/10">
              <nav className="flex -mb-px overflow-x-auto">
                {[
                  { id: "basic", label: "基础信息" },
                  { id: "model", label: "模型配置" },
                  { id: "prompt", label: "提示词" },
                  { id: "knowledge", label: "知识库" },
                  { id: "tools", label: "工具" },
                  { id: "advanced", label: "高级设置" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                      ? "border-jarvis-gold text-jarvis-gold"
                      : "border-transparent text-jarvis-text-secondary hover:text-jarvis-text hover:border-white/20"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* 基础信息 */}
              {activeTab === "basic" && (
                <div className="space-y-6">
                  {/* Agent类型选择 */}
                  <div>
                    <label className="block text-sm font-medium text-jarvis-text mb-2">
                      Agent类型 *
                    </label>
                    <AgentTypeSelector
                      value={formData.type}
                      onChange={(type) => updateField("type", type)}
                      disabled={isEditMode}
                    />
                    {isEditMode && (
                      <p className="mt-2 text-sm text-jarvis-text-secondary">
                        Agent类型创建后不可修改
                      </p>
                    )}
                  </div>

                  {/* 名称 */}
                  <div>
                    <label className="block text-sm font-medium text-jarvis-text mb-2">
                      名称 *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-jarvis-primary ${errors.name ? "border-red-500" : "border-white/10"
                        }`}
                      placeholder="例如：客服助手"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  {/* 描述 */}
                  <div>
                    <label className="block text-sm font-medium text-jarvis-text mb-2">
                      描述 *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      rows={3}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-jarvis-primary ${errors.description ? "border-red-500" : "border-white/10"
                        }`}
                      placeholder="描述这个Agent的用途和特点"
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.description}
                      </p>
                    )}
                  </div>

                  {/* 标签 */}
                  <div>
                    <label className="block text-sm font-medium text-jarvis-text mb-2">
                      标签
                    </label>
                    <input
                      type="text"
                      value={formData.tags?.join(", ") || ""}
                      onChange={(e) =>
                        updateField(
                          "tags",
                          e.target.value.split(",").map((t) => t.trim())
                        )
                      }
                      className="w-full px-4 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-jarvis-primary"
                      placeholder="用逗号分隔，例如：客服, 销售, 技术支持"
                    />
                  </div>
                </div>
              )}

              {/* 模型配置 */}
              {activeTab === "model" && (
                <ModelConfigForm
                  config={formData.llm_config}
                  onChange={(config) => updateField("llm_config", config)}
                  errors={errors}
                />
              )}

              {/* 提示词配置 */}
              {activeTab === "prompt" && (
                <PromptEditor
                  systemPrompt={formData.system_prompt}
                  promptTemplate={formData.prompt_template}
                  onSystemPromptChange={(value) =>
                    updateField("system_prompt", value)
                  }
                  onPromptTemplateChange={(value) =>
                    updateField("prompt_template", value)
                  }
                  errors={errors}
                />
              )}

              {/* 知识库绑定 */}
              {activeTab === "knowledge" && (
                <KnowledgeBaseSelector
                  selectedIds={formData.knowledge_base_ids || []}
                  onChange={(ids) => updateField("knowledge_base_ids", ids)}
                />
              )}

              {/* 工具绑定 */}
              {activeTab === "tools" && (
                <ToolSelector
                  selectedIds={formData.tool_ids || []}
                  onChange={(ids) => updateField("tool_ids", ids)}
                />
              )}

              {/* 高级设置 */}
              {activeTab === "advanced" && (
                <div className="space-y-6">
                  {/* 记忆配置 */}
                  <div>
                    <h3 className="text-lg font-medium text-jarvis-text mb-4">
                      记忆配置
                    </h3>
                    <div className="space-y-4">
                      {/* 短期记忆 */}
                      <div className="flex items-center justify-between p-4 bg-jarvis-panel/40 rounded-lg">
                        <div>
                          <p className="font-medium text-jarvis-text">短期记忆</p>
                          <p className="text-sm text-jarvis-text-secondary">
                            保持最近的对话上下文
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.memory_config?.short_term?.enabled}
                            onChange={(e) =>
                              updateField("memory_config", {
                                ...formData.memory_config,
                                short_term: {
                                  ...formData.memory_config?.short_term,
                                  enabled: e.target.checked,
                                  window_size:
                                    formData.memory_config?.short_term
                                      ?.window_size || 10,
                                },
                              } as MemoryConfig)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-jarvis-panel peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/10 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      {/* 长期记忆 */}
                      <div className="flex items-center justify-between p-4 bg-jarvis-panel/40 rounded-lg">
                        <div>
                          <p className="font-medium text-jarvis-text">长期记忆</p>
                          <p className="text-sm text-jarvis-text-secondary">
                            跨会话保存重要信息
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.memory_config?.long_term?.enabled}
                            onChange={(e) =>
                              updateField("memory_config", {
                                ...formData.memory_config,
                                long_term: {
                                  ...formData.memory_config?.long_term,
                                  enabled: e.target.checked,
                                  retention_days:
                                    formData.memory_config?.long_term
                                      ?.retention_days || 90,
                                },
                              } as MemoryConfig)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-jarvis-panel peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/10 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* ReAct配置 */}
                  {formData.type === "react" && (
                    <div>
                      <h3 className="text-lg font-medium text-jarvis-text mb-4">
                        ReAct配置
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-jarvis-text mb-2">
                          最大迭代次数
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={formData.react_config?.max_iterations || 5}
                          onChange={(e) =>
                            updateField("react_config", {
                              max_iterations: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-4 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-jarvis-primary"
                        />
                        <p className="mt-1 text-sm text-jarvis-text-secondary">
                          Agent在放弃前尝试解决问题的最大次数
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Research配置 */}
                  {formData.type === "deep_research" && (
                    <div>
                      <h3 className="text-lg font-medium text-jarvis-text mb-4">
                        研究配置
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-jarvis-text mb-2">
                            复杂度阈值
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            value={
                              formData.research_config?.complexity_threshold ||
                              0.7
                            }
                            onChange={(e) =>
                              updateField("research_config", {
                                complexity_threshold: parseFloat(e.target.value),
                                max_subtasks: formData.research_config?.max_subtasks || 5,
                              })
                            }
                            className="w-full px-4 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-jarvis-primary"
                          />
                          <p className="mt-1 text-sm text-jarvis-text-secondary">
                            超过此阈值的任务将被拆解为子任务
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-jarvis-text mb-2">
                            最大子任务数
                          </label>
                          <input
                            type="number"
                            min="2"
                            max="10"
                            value={formData.research_config?.max_subtasks || 5}
                            onChange={(e) =>
                              updateField("research_config", {
                                complexity_threshold: formData.research_config?.complexity_threshold || 0.7,
                                max_subtasks: parseInt(e.target.value),
                              })
                            }
                            className="w-full px-4 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-jarvis-primary"
                          />
                          <p className="mt-1 text-sm text-jarvis-text-secondary">
                            任务拆解时生成的最大子任务数量
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 底部操作按钮 */}
          <div className="flex justify-between items-center mt-6">
            <button
              type="button"
              onClick={() => setShowSaveAsTemplate(true)}
              className="px-6 py-3 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
            >
              保存为模板
            </button>
            <div className="flex gap-4">
              <Button
                type="button"
                onClick={() => navigate("/dashboard/agents")}
                variant="secondary"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={loading}
                variant="primary"
                loading={loading}
              >
                {loading ? "保存中..." : isEditMode ? "保存修改" : "创建Agent"}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* 模板选择器 */}
      {showTemplateSelector && (
        <TemplateSelector
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}

      {/* 保存为模板对话框 */}
      {showSaveAsTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-jarvis-text mb-4">
              保存为模板
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-jarvis-text mb-2">
                  模板名称 *
                </label>
                <input
                  type="text"
                  value={templateData.name}
                  onChange={(e) =>
                    setTemplateData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-jarvis-primary"
                  placeholder="例如：我的客服助手"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-jarvis-text mb-2">
                  模板描述
                </label>
                <textarea
                  value={templateData.description}
                  onChange={(e) =>
                    setTemplateData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-jarvis-primary"
                  placeholder="描述这个模板的用途和特点"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-jarvis-text mb-2">
                  分类 *
                </label>
                <select
                  value={templateData.category}
                  onChange={(e) =>
                    setTemplateData((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-jarvis-primary"
                >
                  <option value="customer_service">客服</option>
                  <option value="analysis">分析</option>
                  <option value="creation">创作</option>
                  <option value="technical_support">技术支持</option>
                  <option value="research">研究</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={templateData.is_public}
                  onChange={(e) =>
                    setTemplateData((prev) => ({
                      ...prev,
                      is_public: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-blue-600 border-white/10 rounded focus:ring-jarvis-primary"
                />
                <label
                  htmlFor="is_public"
                  className="ml-2 text-sm text-jarvis-text"
                >
                  公开模板（其他用户可以使用）
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => setShowSaveAsTemplate(false)}
                className="px-4 py-2 border border-white/10 text-jarvis-text rounded-lg hover:bg-jarvis-panel/40 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                disabled={!templateData.name}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存模板
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentFormPage;
