/**
 * 执行计划确认对话框
 * 显示贾维斯生成的执行计划，并请求用户确认
 */
import type { ExecutionPlan } from '@/stores/jarvisStore';

interface ExecutionPlanDialogProps {
  plan: ExecutionPlan;
  onApprove: () => void;
  onReject: () => void;
  isExecuting?: boolean;
}

export const ExecutionPlanDialog = ({
  plan,
  onApprove,
  onReject,
  isExecuting = false,
}: ExecutionPlanDialogProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-jarvis-panel dark:bg-jarvis-panel rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-white/10 dark:border-white/5">
          <h2 className="text-xl font-semibold text-jarvis-text dark:text-white">
            执行计划确认
          </h2>
          <p className="mt-1 text-sm text-jarvis-text-secondary dark:text-jarvis-text-secondary">
            贾维斯已为您生成以下执行计划
          </p>
        </div>

        {/* 内容 */}
        <div className="px-6 py-4 space-y-4 max-h-96 overflow-y-auto">
          {/* 查询和意图 */}
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-jarvis-text dark:text-jarvis-text">
                您的请求：
              </span>
              <p className="mt-1 text-jarvis-text dark:text-white">{plan.query}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-jarvis-text dark:text-jarvis-text">
                识别意图：
              </span>
              <p className="mt-1 text-jarvis-text dark:text-white">{plan.intent}</p>
            </div>
          </div>

          {/* 执行步骤 */}
          <div>
            <h3 className="text-sm font-medium text-jarvis-text dark:text-jarvis-text mb-3">
              执行步骤：
            </h3>
            <div className="space-y-2">
              {plan.steps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-start gap-3 p-3 bg-jarvis-panel/40 dark:bg-jarvis-space/50 rounded-lg"
                >
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-jarvis-text dark:text-white">
                      {step.description}
                    </p>
                  </div>
                  <svg className="flex-shrink-0 w-5 h-5 text-jarvis-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              ))}
            </div>
          </div>

          {/* 预估时间 */}
          {plan.estimatedTime && (
            <div className="flex items-center gap-2 text-sm text-jarvis-text-secondary dark:text-jarvis-text-secondary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>预计耗时：约 {plan.estimatedTime} 秒</span>
            </div>
          )}

          {/* 警告信息 */}
          {plan.requiresApproval && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <svg className="flex-shrink-0 w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  需要您的确认
                </p>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  此操作可能会修改系统设置或数据，请仔细确认后再执行。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 底部操作按钮 */}
        <div className="px-6 py-4 bg-jarvis-panel/40 dark:bg-jarvis-space/50 border-t border-white/10 dark:border-white/5 flex items-center justify-end gap-3">
          <button
            onClick={onReject}
            disabled={isExecuting}
            className="px-4 py-2 text-sm font-medium text-jarvis-text dark:text-jarvis-text hover:bg-jarvis-panel/60 dark:hover:bg-jarvis-panel rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            取消
          </button>
          <button
            onClick={onApprove}
            disabled={isExecuting}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExecuting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                执行中...
              </>
            ) : (
              '确认执行'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
