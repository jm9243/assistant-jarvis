interface Tool {
  id: string;
  name: string;
  description: string;
  type: 'workflow' | 'api' | 'builtin';
  is_enabled: boolean;
  usage_count: number;
  success_rate: number;
  parameters_schema: any;
}

interface ToolCardProps {
  tool: Tool;
  onToggle: (toolId: string, enabled: boolean) => void;
  onShowDetails: (tool: Tool) => void;
}

export function ToolCard({ tool, onToggle, onShowDetails }: ToolCardProps) {
  return (
    <div className="card group">
      {/* 头部 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-jarvis-gold/20 border border-jarvis-gold/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-jarvis-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-jarvis-text truncate">{tool.name}</h3>
            <span className="text-xs text-jarvis-text-secondary">{tool.type}</span>
          </div>
        </div>

        {/* 启用开关 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(tool.id, !tool.is_enabled);
          }}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
            tool.is_enabled ? 'bg-jarvis-gold' : 'bg-jarvis-panel'
          }`}
          title={tool.is_enabled ? '点击禁用' : '点击启用'}
        >
          <div
            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
              tool.is_enabled ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>

      {/* 描述 */}
      <p className="text-sm text-jarvis-text-secondary mb-4 line-clamp-2 min-h-[40px]">
        {tool.description}
      </p>

      {/* 统计 */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-jarvis-text-secondary">使用次数</span>
          <span className="text-jarvis-text">{tool.usage_count || 0}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-jarvis-text-secondary">成功率</span>
          <span className="text-jarvis-gold">{((tool.success_rate || 0) * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* 查看详情按钮 */}
      <button
        onClick={() => onShowDetails(tool)}
        className="w-full py-2 text-sm text-jarvis-gold hover:bg-jarvis-gold/10 border border-jarvis-gold/30 rounded-lg transition-colors"
      >
        查看详情
      </button>
    </div>
  );
}
