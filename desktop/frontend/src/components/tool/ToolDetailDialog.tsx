interface Tool {
  id: string;
  name: string;
  description: string;
  type: 'workflow' | 'api' | 'builtin';
  is_enabled: boolean;
  usage_count: number;
  success_rate: number;
  parameters_schema: any;
  approval_policy?: 'none' | 'optional' | 'required';
}

interface ToolDetailDialogProps {
  tool: Tool;
  onClose: () => void;
  onUpdatePermission: (toolId: string, policy: string) => void;
}

export function ToolDetailDialog({ tool, onClose, onUpdatePermission }: ToolDetailDialogProps) {
  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* 对话框 */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-jarvis-panel border border-jarvis-gold/30 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-jarvis-gold/20 border border-jarvis-gold/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-jarvis-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-orbitron text-jarvis-gold">{tool.name}</h2>
                <span className="text-sm text-jarvis-text-secondary">{tool.type}</span>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-jarvis-gold/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-jarvis-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 内容 */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin space-y-6">
            {/* 描述 */}
            <div>
              <h3 className="text-sm font-semibold text-jarvis-text mb-2">描述</h3>
              <p className="text-sm text-jarvis-text-secondary leading-relaxed">
                {tool.description}
              </p>
            </div>

            {/* 统计信息 */}
            <div>
              <h3 className="text-sm font-semibold text-jarvis-text mb-3">使用统计</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-jarvis-panel/40 border border-white/5 rounded-lg p-4">
                  <div className="text-2xl font-bold text-jarvis-gold mb-1">
                    {tool.usage_count || 0}
                  </div>
                  <div className="text-xs text-jarvis-text-secondary">使用次数</div>
                </div>
                <div className="bg-jarvis-panel/40 border border-white/5 rounded-lg p-4">
                  <div className="text-2xl font-bold text-jarvis-gold mb-1">
                    {((tool.success_rate || 0) * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-jarvis-text-secondary">成功率</div>
                </div>
              </div>
            </div>

            {/* 参数说明 */}
            {tool.parameters_schema && (
              <div>
                <h3 className="text-sm font-semibold text-jarvis-text mb-2">参数说明</h3>
                <div className="bg-jarvis-panel/40 border border-white/5 rounded-lg p-4">
                  <pre className="text-xs text-jarvis-text overflow-x-auto">
                    {JSON.stringify(tool.parameters_schema, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* 权限配置 */}
            <div>
              <h3 className="text-sm font-semibold text-jarvis-text mb-3">权限配置</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 bg-jarvis-panel/40 border border-white/5 rounded-lg cursor-pointer hover:border-jarvis-gold/30 transition-colors">
                  <input
                    type="radio"
                    name="approval_policy"
                    value="none"
                    checked={tool.approval_policy === 'none' || !tool.approval_policy}
                    onChange={(e) => onUpdatePermission(tool.id, e.target.value)}
                    className="w-4 h-4 text-jarvis-gold"
                  />
                  <div className="flex-1">
                    <div className="text-sm text-jarvis-text font-medium">无需审批</div>
                    <div className="text-xs text-jarvis-text-secondary">Agent可以直接调用此工具</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-jarvis-panel/40 border border-white/5 rounded-lg cursor-pointer hover:border-jarvis-gold/30 transition-colors">
                  <input
                    type="radio"
                    name="approval_policy"
                    value="optional"
                    checked={tool.approval_policy === 'optional'}
                    onChange={(e) => onUpdatePermission(tool.id, e.target.value)}
                    className="w-4 h-4 text-jarvis-gold"
                  />
                  <div className="flex-1">
                    <div className="text-sm text-jarvis-text font-medium">可选审批</div>
                    <div className="text-xs text-jarvis-text-secondary">Agent会请求审批，但可以跳过</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-jarvis-panel/40 border border-white/5 rounded-lg cursor-pointer hover:border-jarvis-gold/30 transition-colors">
                  <input
                    type="radio"
                    name="approval_policy"
                    value="required"
                    checked={tool.approval_policy === 'required'}
                    onChange={(e) => onUpdatePermission(tool.id, e.target.value)}
                    className="w-4 h-4 text-jarvis-gold"
                  />
                  <div className="flex-1">
                    <div className="text-sm text-jarvis-text font-medium">必须审批</div>
                    <div className="text-xs text-jarvis-text-secondary">Agent必须获得用户批准才能调用</div>
                  </div>
                </label>
              </div>
            </div>

            {/* 使用示例 */}
            <div>
              <h3 className="text-sm font-semibold text-jarvis-text mb-2">使用示例</h3>
              <div className="bg-jarvis-panel/40 border border-white/5 rounded-lg p-4">
                <p className="text-xs text-jarvis-text-secondary mb-2">Agent可以这样调用此工具：</p>
                <pre className="text-xs text-jarvis-gold">
{`Action: ${tool.name}
Action Input: ${JSON.stringify(tool.parameters_schema?.properties ? 
  Object.keys(tool.parameters_schema.properties).reduce((acc: any, key) => {
    acc[key] = '<value>';
    return acc;
  }, {}) : {}, null, 2)}`}
                </pre>
              </div>
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="p-6 border-t border-white/5">
            <button
              onClick={onClose}
              className="btn-primary w-full"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
