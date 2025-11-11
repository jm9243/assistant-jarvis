/**
 * 贾维斯容器组件
 * 整合搜索框、执行计划和进度反馈
 */
import { useEffect } from 'react';
import { useJarvisStore } from '@/stores/jarvisStore';
import { JarvisSearchBox } from './JarvisSearchBox';
import { ExecutionPlanDialog } from './ExecutionPlanDialog';
import { ExecutionProgress } from './ExecutionProgress';

export const JarvisContainer = () => {
  const {
    isOpen,
    isProcessing,
    currentPlan,
    error,
    close,
    processQuery,
    approvePlan,
    rejectPlan,
    cancelExecution,
    clearError,
  } = useJarvisStore();

  // 监听全局快捷键 Cmd/Ctrl + Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.code === 'Space') {
        e.preventDefault();
        useJarvisStore.getState().toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 处理查询提交
  const handleSubmit = async (query: string) => {
    await processQuery(query);
  };

  // 处理计划批准
  const handleApprovePlan = async () => {
    await approvePlan();
  };

  // 处理计划拒绝
  const handleRejectPlan = () => {
    rejectPlan();
  };

  // 处理取消执行
  const handleCancelExecution = () => {
    cancelExecution();
  };

  // 显示错误提示
  useEffect(() => {
    if (error) {
      // 可以使用 toast 或其他通知组件
      console.error('Jarvis Error:', error);
      setTimeout(() => {
        clearError();
      }, 3000);
    }
  }, [error, clearError]);

  // 判断是否正在执行
  const isExecuting =
    currentPlan &&
    currentPlan.steps.some(
      (step) => step.status === 'running' || step.status === 'completed'
    );

  return (
    <>
      {/* 搜索框 - 初始状态 */}
      {isOpen && !currentPlan && (
        <JarvisSearchBox
          isOpen={isOpen}
          onClose={close}
          onSubmit={handleSubmit}
          isProcessing={isProcessing}
        />
      )}

      {/* 执行计划确认对话框 */}
      {currentPlan && !isExecuting && (
        <ExecutionPlanDialog
          plan={currentPlan}
          onApprove={handleApprovePlan}
          onReject={handleRejectPlan}
          isExecuting={isProcessing}
        />
      )}

      {/* 执行进度反馈 */}
      {currentPlan && isExecuting && (
        <ExecutionProgress plan={currentPlan} onCancel={handleCancelExecution} />
      )}
    </>
  );
};
