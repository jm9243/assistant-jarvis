/**
 * 模型配置表单组件
 */
import React from "react";
import type { ModelConfig } from "../../types/agent";

interface ModelConfigFormProps {
  config: ModelConfig;
  onChange: (config: ModelConfig) => void;
  errors?: Record<string, string>; // 保留以兼容现有代码，但不再使用
}

const openaiModels = [
  { value: "gpt-4", label: "GPT-4", supportsVision: false },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo", supportsVision: true },
  { value: "gpt-4-vision-preview", label: "GPT-4 Vision", supportsVision: true },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", supportsVision: false },
  { value: "gpt-3.5-turbo-16k", label: "GPT-3.5 Turbo 16K", supportsVision: false },
];

const claudeModels = [
  { value: "claude-3-opus-20240229", label: "Claude 3 Opus", supportsVision: true },
  { value: "claude-3-sonnet-20240229", label: "Claude 3 Sonnet", supportsVision: true },
  { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku", supportsVision: true },
  { value: "claude-2.1", label: "Claude 2.1", supportsVision: false },
];

export const ModelConfigForm: React.FC<ModelConfigFormProps> = ({
  config,
  onChange,
}) => {
  const updateConfig = <K extends keyof ModelConfig>(
    field: K,
    value: ModelConfig[K]
  ) => {
    onChange({ ...config, [field]: value });
  };

  const models = config.provider === "openai" ? openaiModels : claudeModels;
  const selectedModel = models.find((m) => m.value === config.model);

  return (
    <div className="space-y-6">
      {/* 提供商选择 */}
      <div>
        <label className="block text-sm font-medium text-jarvis-text mb-2">
          LLM提供商 *
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              updateConfig("provider", "openai");
              updateConfig("model", "gpt-3.5-turbo");
            }}
            className={`p-4 border-2 rounded-lg text-left transition-all ${config.provider === "openai"
              ? "border-blue-500 bg-blue-50"
              : "border-white/10 bg-jarvis-panel hover:border-white/10"
              }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">🤖</span>
              </div>
              <div>
                <p className="font-semibold text-jarvis-text">OpenAI</p>
                <p className="text-sm text-jarvis-text-secondary">GPT-3.5, GPT-4</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              updateConfig("provider", "claude");
              updateConfig("model", "claude-3-sonnet-20240229");
            }}
            className={`p-4 border-2 rounded-lg text-left transition-all ${config.provider === "claude"
              ? "border-blue-500 bg-blue-50"
              : "border-white/10 bg-jarvis-panel hover:border-white/10"
              }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">🧠</span>
              </div>
              <div>
                <p className="font-semibold text-jarvis-text">Anthropic</p>
                <p className="text-sm text-jarvis-text-secondary">Claude 2, Claude 3</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 模型选择 */}
      <div>
        <label className="block text-sm font-medium text-jarvis-text mb-2">
          模型 *
        </label>
        <select
          value={config.model}
          onChange={(e) => {
            const model = models.find((m) => m.value === e.target.value);
            updateConfig("model", e.target.value);
            updateConfig("supports_vision", model?.supportsVision || false);
          }}
          className="w-full px-4 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-jarvis-primary"
        >
          {models.map((model) => (
            <option key={model.value} value={model.value}>
              {model.label}
              {model.supportsVision ? " (支持视觉)" : ""}
            </option>
          ))}
        </select>
        {selectedModel?.supportsVision && (
          <p className="mt-1 text-sm text-green-600">
            ✓ 此模型支持图片输入
          </p>
        )}
      </div>

      {/* 提示信息 */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-900">
              模型服务由系统统一管理
            </p>
            <p className="text-sm text-blue-700 mt-1">
              您无需配置 API Key，系统会自动使用后台配置的模型服务。所有调用都会记录用量。
            </p>
          </div>
        </div>
      </div>

      {/* 高级参数 */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-jarvis-text mb-4">高级参数</h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-jarvis-text mb-2">
              Temperature
            </label>
            <input
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature}
              onChange={(e) =>
                updateConfig("temperature", parseFloat(e.target.value))
              }
              className="w-full px-4 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-jarvis-primary"
            />
            <p className="mt-1 text-sm text-jarvis-text-secondary">
              控制输出的随机性 (0-2)
            </p>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-sm font-medium text-jarvis-text mb-2">
              最大Token数
            </label>
            <input
              type="number"
              min="100"
              max="8000"
              step="100"
              value={config.max_tokens}
              onChange={(e) =>
                updateConfig("max_tokens", parseInt(e.target.value))
              }
              className="w-full px-4 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-jarvis-primary"
            />
            <p className="mt-1 text-sm text-jarvis-text-secondary">
              单次响应的最大长度
            </p>
          </div>

          {/* Top P */}
          <div>
            <label className="block text-sm font-medium text-jarvis-text mb-2">
              Top P
            </label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={config.top_p}
              onChange={(e) =>
                updateConfig("top_p", parseFloat(e.target.value))
              }
              className="w-full px-4 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-jarvis-primary"
            />
            <p className="mt-1 text-sm text-jarvis-text-secondary">
              核采样参数 (0-1)
            </p>
          </div>

          {/* Frequency Penalty */}
          <div>
            <label className="block text-sm font-medium text-jarvis-text mb-2">
              Frequency Penalty
            </label>
            <input
              type="number"
              min="-2"
              max="2"
              step="0.1"
              value={config.frequency_penalty}
              onChange={(e) =>
                updateConfig("frequency_penalty", parseFloat(e.target.value))
              }
              className="w-full px-4 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-jarvis-primary"
            />
            <p className="mt-1 text-sm text-jarvis-text-secondary">
              降低重复内容 (-2 到 2)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
