/**
 * 工具绑定选择器组件
 */
import React, { useEffect, useState } from "react";
import { toolApi } from "../../services/agentApi";
import type { Tool } from "../../types/agent";

interface ToolSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

const toolIcons: Record<string, string> = {
  workflow: "⚙️",
  mcp: "🔌",
  http: "🌐",
  system: "💻",
  builtin: "🛠️",
};

const toolTypeLabels: Record<string, string> = {
  workflow: "工作流",
  mcp: "MCP工具",
  http: "HTTP API",
  system: "系统工具",
  builtin: "内置工具",
};

export const ToolSelector: React.FC<ToolSelectorProps> = ({
  selectedIds,
  onChange,
}) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      setLoading(true);
      const data = await toolApi.listTools({ enabled_only: true });
      setTools(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "加载工具失败");
    } finally {
      setLoading(false);
    }
  };

  const toggleTool = (toolId: string) => {
    if (selectedIds.includes(toolId)) {
      onChange(selectedIds.filter((id) => id !== toolId));
    } else {
      onChange([...selectedIds, toolId]);
    }
  };

  const categories = Array.from(new Set(tools.map((t) => t.category)));

  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || tool.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-jarvis-text-secondary">加载工具...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
        <button
          onClick={loadTools}
          className="ml-4 text-sm underline hover:no-underline"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          选择要绑定到此Agent的工具。Agent将能够调用这些工具来执行任务。
        </p>
      </div>

      {/* 搜索和筛选 */}
      {tools.length > 0 && (
        <div className="flex gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索工具..."
            className="flex-1 px-4 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-jarvis-primary"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-jarvis-primary"
          >
            <option value="all">全部分类</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 工具列表 */}
      {filteredTools.length === 0 ? (
        <div className="text-center py-8 bg-jarvis-panel/40 rounded-lg">
          <p className="text-jarvis-text-secondary">
            {searchQuery || filterCategory !== "all"
              ? "未找到匹配的工具"
              : "暂无可用工具"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTools.map((tool) => {
            const isSelected = selectedIds.includes(tool.id);

            return (
              <div
                key={tool.id}
                onClick={() => toggleTool(tool.id)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-white/10 bg-jarvis-panel hover:border-white/10"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">
                        {toolIcons[tool.type] || "🔧"}
                      </span>
                      <div>
                        <h4 className="font-semibold text-jarvis-text">
                          {tool.name}
                        </h4>
                        <p className="text-sm text-jarvis-text-secondary">
                          {tool.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-11">
                      <span className="text-xs bg-jarvis-panel/60 px-2 py-1 rounded">
                        {toolTypeLabels[tool.type] || tool.type}
                      </span>
                      <span className="text-xs bg-jarvis-panel/60 px-2 py-1 rounded">
                        {tool.category}
                      </span>
                      {tool.approval_policy === "required" && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          需要审批
                        </span>
                      )}
                      {tool.approval_policy === "auto" && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          自动执行
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 选中标记 */}
                  <div className="ml-4">
                    {isSelected ? (
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border-2 border-white/10 rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 已选择统计 */}
      {selectedIds.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800">
            已选择 {selectedIds.length} 个工具
          </p>
        </div>
      )}
    </div>
  );
};
