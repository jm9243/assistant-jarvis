/**
 * 执行进度实时反馈组件
 * 显示当前执行步骤、进度百分比和中间结果
 */
import type { ExecutionPlan, ExecutionStep } from '@/stores/jarvisStore';

interface ExecutionProgressProps {
  plan: ExecutionPlan;
  onCancel: () => void;
}

export const ExecutionProgress = ({ plan, onCancel }: ExecutionProgressProps) => {
  // 计算进度百分比
  const completedSteps = plan.steps.filter(
    (step) => step.status === 'completed'
  ).length;
  const totalSteps = plan.steps.length;
  const progress = Math.round((completedSteps / totalSteps) * 100);

  // 获取当前执行的步骤
  const currentStep = plan.steps.find((step) => step.status === 'running');

  // 获取步骤图标
  const getStepIcon = (step: ExecutionStep) => {
    switch (step.status) {
      case 'completed':
        return (
          <svg className="w-5 h-5 text-jarvis-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'running':
        return (
          <svg className="w-5 h-5 text-jarvis-primary animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-5 h-5 text-jarvis-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <div className="w-5 h-5 rounded-full border-2 border-white/10 dark:border-white/20" />
        );
    }
  };

  // 获取步骤状态颜色
  const getStepColor = (step: ExecutionStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-jarvis-success';
      case 'running':
        return 'text-jarvis-primary';
      case 'failed':
        return 'text-jarvis-danger';
      default:
        return 'text-jarvis-text-secondary';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-jarvis-panel dark:bg-jarvis-panel rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-white/10 dark:border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-jarvis-text dark:text-white">
                正在执行任务
              </h2>
              <p className="mt-1 text-sm text-jarvis-text-secondary dark:text-jarvis-text-secondary">
                {plan.query}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {progress}%
              </div>
              <div className="text-xs text-jarvis-text-secondary dark:text-jarvis-text-secondary">
                {completedSteps} / {totalSteps} 步骤
              </div>
            </div>
          </div>

          {/* 进度条 */}
          <div className="mt-4 h-2 bg-jarvis-panel dark:bg-jarvis-panel/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 执行步骤列表 */}
        <div className="px-6 py-4 space-y-3 max-h-96 overflow-y-auto">
          {plan.steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-4 rounded-lg transition-all duration-300 ${
                step.status === 'running'
                  ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'
                  : step.status === 'completed'
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : step.status === 'failed'
                  ? 'bg-red-50 dark:bg-red-900/20'
                  : 'bg-jarvis-panel/40 dark:bg-jarvis-space/50'
              }`}
            >
              {/* 步骤图标 */}
              <div className="flex-shrink-0 mt-0.5">{getStepIcon(step)}</div>

              {/* 步骤内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-jarvis-text-secondary dark:text-jarvis-text-secondary">
                    步骤 {index + 1}
                  </span>
                  {step.status === 'running' && (
                    <span className="px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                      执行中
                    </span>
                  )}
                </div>
                <p className={`mt-1 text-sm font-medium ${getStepColor(step)}`}>
                  {step.description}
                </p>

                {/* 步骤结果 */}
                {step.result && (
                  <div className="mt-2 p-2 bg-jarvis-panel dark:bg-jarvis-panel rounded border border-white/10 dark:border-white/5">
                    <p className="text-xs text-jarvis-text-secondary dark:text-jarvis-text-secondary">
                      {step.result}
                    </p>
                  </div>
                )}

                {/* 错误信息 */}
                {step.error && (
                  <div className="mt-2 flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                    <svg className="flex-shrink-0 w-4 h-4 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-red-700 dark:text-red-300">
                      {step.error}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 当前执行步骤提示 */}
        {currentStep && (
          <div className="px-6 py-3 bg-purple-50 dark:bg-purple-900/20 border-t border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>正在执行：{currentStep.description}</span>
            </div>
          </div>
        )}

        {/* 底部操作按钮 */}
        <div className="px-6 py-4 bg-jarvis-panel/40 dark:bg-jarvis-space/50 border-t border-white/10 dark:border-white/5 flex items-center justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-jarvis-text dark:text-jarvis-text hover:bg-jarvis-panel/60 dark:hover:bg-jarvis-panel rounded-lg transition-colors"
          >
            取消执行
          </button>
        </div>
      </div>
    </div>
  );
};
