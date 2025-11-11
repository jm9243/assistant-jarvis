/**
 * Prompt配置编辑器组件
 */
import React, { useState } from "react";

interface PromptEditorProps {
  systemPrompt: string;
  promptTemplate?: string;
  onSystemPromptChange: (value: string) => void;
  onPromptTemplateChange: (value: string | undefined) => void;
  errors?: Record<string, string>;
}

const promptTemplates = [
  {
    name: "默认模板",
    value: "",
    description: "使用系统默认的对话模板",
  },
  {
    name: "客服助手",
    value: `你是一个专业的客服助手。请遵循以下原则：
1. 始终保持礼貌和专业
2. 快速理解客户问题
3. 提供清晰的解决方案
4. 如果无法解决，及时转接人工

当前对话：
{history}

用户问题：{input}`,
    description: "适合客户服务场景",
  },
  {
    name: "技术支持",
    value: `你是一个技术支持专家。请遵循以下原则：
1. 准确诊断技术问题
2. 提供详细的解决步骤
3. 使用清晰的技术术语
4. 必要时提供代码示例

对话历史：
{history}

技术问题：{input}`,
    description: "适合技术支持场景",
  },
  {
    name: "知识问答",
    value: `你是一个知识渊博的助手。请遵循以下原则：
1. 基于知识库提供准确答案
2. 引用信息来源
3. 承认不确定性
4. 提供相关的延伸知识

知识库检索结果：
{knowledge}

对话历史：
{history}

用户提问：{input}`,
    description: "适合知识库问答",
  },
];

export const PromptEditor: React.FC<PromptEditorProps> = ({
  systemPrompt,
  promptTemplate,
  onSystemPromptChange,
  onPromptTemplateChange,
  errors = {},
}) => {
  const [showTemplates, setShowTemplates] = useState(false);

  const handleTemplateSelect = (template: string) => {
    onPromptTemplateChange(template || undefined);
    setShowTemplates(false);
  };

  return (
    <div className="space-y-6">
      {/* 系统提示词 */}
      <div>
        <label className="block text-sm font-medium text-jarvis-text mb-2">
          系统提示词 *
        </label>
        <textarea
          value={systemPrompt}
          onChange={(e) => onSystemPromptChange(e.target.value)}
          rows={6}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-jarvis-primary font-mono text-sm ${
            errors.system_prompt ? "border-red-500" : "border-white/10"
          }`}
          placeholder="定义Agent的角色、能力和行为准则..."
        />
        {errors.system_prompt && (
          <p className="mt-1 text-sm text-red-600">{errors.system_prompt}</p>
        )}
        <p className="mt-2 text-sm text-jarvis-text-secondary">
          系统提示词定义了Agent的基本角色和行为方式
        </p>
      </div>

      {/* 提示词模板 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-jarvis-text">
            提示词模板 (可选)
          </label>
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showTemplates ? "隐藏模板" : "选择模板"}
          </button>
        </div>

        {/* 模板选择器 */}
        {showTemplates && (
          <div className="mb-4 p-4 bg-jarvis-panel/40 rounded-lg space-y-2">
            {promptTemplates.map((template) => (
              <button
                key={template.name}
                type="button"
                onClick={() => handleTemplateSelect(template.value)}
                className="w-full p-3 text-left border border-white/10 rounded-lg hover:border-blue-500 hover:bg-jarvis-panel transition-colors"
              >
                <p className="font-medium text-jarvis-text">{template.name}</p>
                <p className="text-sm text-jarvis-text-secondary">{template.description}</p>
              </button>
            ))}
          </div>
        )}

        <textarea
          value={promptTemplate || ""}
          onChange={(e) =>
            onPromptTemplateChange(e.target.value || undefined)
          }
          rows={10}
          className="w-full px-4 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-jarvis-primary font-mono text-sm"
          placeholder={`自定义对话模板，支持以下变量：
{history} - 对话历史
{input} - 用户输入
{knowledge} - 知识库检索结果
{tools} - 可用工具列表`}
        />
        <p className="mt-2 text-sm text-jarvis-text-secondary">
          提示词模板用于构建每次对话的完整上下文，留空则使用默认模板
        </p>
      </div>

      {/* 提示词预览 */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-jarvis-text mb-4">预览</h3>
        <div className="bg-jarvis-panel/40 rounded-lg p-4">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-jarvis-text mb-2">
                系统角色：
              </p>
              <div className="bg-jarvis-panel p-3 rounded border border-white/10 text-sm text-jarvis-text whitespace-pre-wrap">
                {systemPrompt || "（未设置）"}
              </div>
            </div>

            {promptTemplate && (
              <div>
                <p className="text-sm font-medium text-jarvis-text mb-2">
                  对话模板：
                </p>
                <div className="bg-jarvis-panel p-3 rounded border border-white/10 text-sm text-jarvis-text whitespace-pre-wrap font-mono">
                  {promptTemplate}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 提示词编写建议 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          💡 编写建议
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 明确定义Agent的角色和专业领域</li>
          <li>• 说明Agent应该如何回答问题</li>
          <li>• 设置必要的限制和边界</li>
          <li>• 提供具体的行为示例</li>
          <li>• 使用清晰、具体的语言</li>
        </ul>
      </div>
    </div>
  );
};
