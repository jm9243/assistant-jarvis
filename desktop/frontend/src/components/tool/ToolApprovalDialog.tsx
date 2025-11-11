interface ToolCall {
  id: string;
  tool_id: string;
  tool_name: string;
  agent_id: string;
  agent_name: string;
  parameters: any;
  conversation_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface ToolApprovalDialogProps {
  toolCall: ToolCall;
  onApprove: (callId: string) => void;
  onReject: (callId: string) => void;
  onClose: () => void;
}

export function ToolApprovalDialog({ toolCall, onApprove, onReject, onClose }: ToolApprovalDialogProps) {
  const handleApprove = () => {
    onApprove(toolCall.id);
    onClose();
  };

  const handleReject = () => {
    onReject(toolCall.id);
    onClose();
  };

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* 对话框 */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-jarvis-panel border border-jarvis-gold/30 rounded-xl shadow-2xl w-full max-w-lg">
          {/* 头部 */}
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-jarvis-warning/20 border border-jarvis-warning/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-jarvis-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-orbitron text-jarvis-gold">工具调用审批</h2>
                <p className="text-sm text-jarvis-text-secondary">Agent请求调用工具</p>
              </div>
            </div>
          </div>

          {/* 内容 */}
          <div className="p-6 space-y-4">
            {/* Agent信息 */}
            <div>
              <label className="text-xs text-jarvis-text-secondary mb-1 block">Agent</label>
              <div className="text-sm text-jarvis-text">{toolCall.agent_name}</div>
            </div>

            {/* 工具信息 */}
            <div>
              <label className="text-xs text-jarvis-text-secondary mb-1 block">工具</label>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-jarvis-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-jarvis-text font-medium">{toolCall.tool_name}</span>
              </div>
            </div>

            {/* 调用参数 */}
            <div>
              <label className="text-xs text-jarvis-text-secondary mb-2 block">调用参数</label>
              <div className="bg-jarvis-panel/40 border border-white/5 rounded-lg p-3">
                <pre className="text-xs text-jarvis-text overflow-x-auto">
                  {JSON.stringify(toolCall.parameters, null, 2)}
                </pre>
              </div>
            </div>

            {/* 警告提示 */}
            <div className="bg-jarvis-warning/10 border border-jarvis-warning/30 rounded-lg p-3">
              <div className="flex gap-2">
                <svg className="w-5 h-5 text-jarvis-warning flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-xs text-jarvis-warning">
                  <div className="font-medium mb-1">潜在影响</div>
                  <ul className="list-disc list-inside space-y-1 text-jarvis-warning/80">
                    <li>此工具可能会修改系统数据</li>
                    <li>请仔细检查参数是否正确</li>
                    <li>批准后将立即执行</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="flex items-center gap-3 p-6 border-t border-white/5">
            <button
              onClick={handleReject}
              className="flex-1 px-4 py-2 bg-transparent border border-jarvis-danger/30 text-jarvis-danger hover:bg-jarvis-danger/10 rounded-lg transition-colors"
            >
              拒绝
            </button>
            <button
              onClick={handleApprove}
              className="flex-1 btn-primary"
            >
              批准
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
