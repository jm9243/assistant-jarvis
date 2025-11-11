/**
 * Agent模板选择器组件
 */
import React, { useEffect, useState } from "react";
import type { AgentTemplate } from "../../types/agent";
import { agentTemplateApi } from "../../services/agentTemplateApi";

interface TemplateSelectorProps {
  onSelect: (template: AgentTemplate) => void;
  onClose: () => void;
}

const CATEGORIES = [
  { id: "all", name: "全部", icon: "📦" },
  { id: "customer_service", name: "客服", icon: "🤖" },
  { id: "analysis", name: "分析", icon: "📊" },
  { id: "creation", name: "创作", icon: "✍️" },
  { id: "technical_support", name: "技术支持", icon: "🔧" },
  { id: "research", name: "研究", icon: "🔍" },
];

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelect,
  onClose,
}) => {
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<AgentTemplate | null>(
    null
  );

  // 加载模板列表
  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchQuery]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: 1,
        page_size: 50,
      };

      if (selectedCategory !== "all") {
        params.category = selectedCategory;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await agentTemplateApi.listTemplates(params);
      setTemplates(response.list);
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = async (template: AgentTemplate) => {
    try {
      // 增加使用次数
      await agentTemplateApi.useTemplate(template.id);
      onSelect(template);
    } catch (error) {
      console.error("Failed to use template:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-jarvis-panel rounded-lg shadow-xl w-full max-w-6xl h-[80vh] flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-jarvis-text">选择Agent模板</h2>
            <button
              onClick={onClose}
              className="text-jarvis-text-secondary hover:text-jarvis-text-secondary transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 搜索框 */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索模板..."
              className="w-full px-4 py-2 pl-10 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-jarvis-primary"
            />
            <svg
              className="absolute left-3 top-2.5 w-5 h-5 text-jarvis-text-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧分类 */}
          <div className="w-48 border-r border-white/10 overflow-y-auto">
            <div className="p-4 space-y-1">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? "bg-blue-50 text-blue-600"
                      : "text-jarvis-text hover:bg-jarvis-panel/40"
                  }`}
                >
                  <span className="text-xl">{category.icon}</span>
                  <span className="font-medium">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 中间模板列表 */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-jarvis-text-secondary">加载中...</div>
              </div>
            ) : templates.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-jarvis-text-secondary mb-2">没有找到模板</p>
                  <p className="text-sm text-jarvis-text-secondary">
                    尝试更改搜索条件或分类
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      previewTemplate?.id === template.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-white/10 hover:border-blue-300"
                    }`}
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-3xl">{template.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-jarvis-text mb-1">
                          {template.name}
                        </h3>
                        <p className="text-sm text-jarvis-text-secondary line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {template.is_system && (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                            系统
                          </span>
                        )}
                        <span className="px-2 py-1 text-xs bg-jarvis-panel/60 text-jarvis-text rounded">
                          {template.type}
                        </span>
                      </div>
                      <span className="text-xs text-jarvis-text-secondary">
                        {template.usage_count} 次使用
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 右侧预览 */}
          {previewTemplate && (
            <div className="w-96 border-l border-white/10 overflow-y-auto p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{previewTemplate.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold text-jarvis-text">
                      {previewTemplate.name}
                    </h3>
                    <p className="text-sm text-jarvis-text-secondary">
                      {previewTemplate.type}
                    </p>
                  </div>
                </div>

                <p className="text-jarvis-text mb-4">
                  {previewTemplate.description}
                </p>

                {/* 标签 */}
                {previewTemplate.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {previewTemplate.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 配置预览 */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-jarvis-text mb-2">
                      系统提示词
                    </h4>
                    <div className="bg-jarvis-panel/40 rounded p-3 text-sm text-jarvis-text-secondary max-h-40 overflow-y-auto">
                      {previewTemplate.config.system_prompt}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-jarvis-text mb-2">
                      模型配置
                    </h4>
                    <div className="bg-jarvis-panel/40 rounded p-3 text-sm text-jarvis-text-secondary">
                      <p>
                        模型: {previewTemplate.config.llm_config.model || "未设置"}
                      </p>
                      <p>
                        温度:{" "}
                        {previewTemplate.config.llm_config.temperature || 0.7}
                      </p>
                      <p>
                        最大Token:{" "}
                        {previewTemplate.config.llm_config.max_tokens || 2000}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 使用按钮 */}
              <button
                onClick={() => handleSelectTemplate(previewTemplate)}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                使用此模板
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
