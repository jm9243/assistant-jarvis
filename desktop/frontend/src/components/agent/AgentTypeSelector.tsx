/**
 * Agent类型选择组件
 */
import React from "react";
import type { AgentType } from "../../types/agent";

interface AgentTypeSelectorProps {
  value: AgentType;
  onChange: (type: AgentType) => void;
  disabled?: boolean;
}

const agentTypes = [
  {
    type: "basic" as AgentType,
    name: "基础对话",
    description: "简单的问答助手，适合日常对话和信息查询",
    icon: "💬",
    features: ["快速响应", "上下文记忆", "知识库检索"],
    color: "blue",
  },
  {
    type: "react" as AgentType,
    name: "推理行动",
    description: "能够调用工具执行任务的智能助手",
    icon: "🔧",
    features: ["工具调用", "多步推理", "任务执行"],
    color: "green",
  },
  {
    type: "deep_research" as AgentType,
    name: "深度研究",
    description: "自动拆解复杂任务，进行深度研究和分析",
    icon: "🔬",
    features: ["任务拆解", "并行执行", "研究报告"],
    color: "purple",
  },
];

export const AgentTypeSelector: React.FC<AgentTypeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors = {
      blue: {
        border: isSelected ? "border-blue-500" : "border-white/10",
        bg: isSelected ? "bg-blue-50" : "bg-jarvis-panel",
        text: isSelected ? "text-blue-700" : "text-jarvis-text",
        badge: "bg-blue-100 text-blue-800",
      },
      green: {
        border: isSelected ? "border-green-500" : "border-white/10",
        bg: isSelected ? "bg-green-50" : "bg-jarvis-panel",
        text: isSelected ? "text-green-700" : "text-jarvis-text",
        badge: "bg-green-100 text-green-800",
      },
      purple: {
        border: isSelected ? "border-purple-500" : "border-white/10",
        bg: isSelected ? "bg-purple-50" : "bg-jarvis-panel",
        text: isSelected ? "text-purple-700" : "text-jarvis-text",
        badge: "bg-purple-100 text-purple-800",
      },
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {agentTypes.map((agentType) => {
        const isSelected = value === agentType.type;
        const colors = getColorClasses(agentType.color, isSelected);

        return (
          <button
            key={agentType.type}
            type="button"
            onClick={() => !disabled && onChange(agentType.type)}
            disabled={disabled}
            className={`relative p-6 border-2 rounded-lg text-left transition-all ${
              colors.border
            } ${colors.bg} ${
              disabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:shadow-md cursor-pointer"
            }`}
          >
            {/* 选中标记 */}
            {isSelected && (
              <div className="absolute top-4 right-4">
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
              </div>
            )}

            {/* 图标和标题 */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{agentType.icon}</span>
              <h3 className={`text-lg font-semibold ${colors.text}`}>
                {agentType.name}
              </h3>
            </div>

            {/* 描述 */}
            <p className="text-sm text-jarvis-text-secondary mb-4">
              {agentType.description}
            </p>

            {/* 特性标签 */}
            <div className="flex flex-wrap gap-2">
              {agentType.features.map((feature) => (
                <span
                  key={feature}
                  className={`px-2 py-1 text-xs rounded-full ${colors.badge}`}
                >
                  {feature}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
};
