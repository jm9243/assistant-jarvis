import { useEffect, useState } from 'react';
import { useExecutionStore } from '@/stores/executionStore';
import { ExecutionRecord, Status } from '@/types';
import { cn } from '@/utils/cn';

export function ExecutionCenterPage() {
  const { executions, loadExecutionHistory, isLoading } = useExecutionStore();
  const [filter, setFilter] = useState<'all' | Status>('all');

  useEffect(() => {
    loadExecutionHistory();
  }, [loadExecutionHistory]);

  const filteredExecutions = executions.filter((exec) => {
    if (filter === 'all') return true;
    return exec.status === filter;
  });

  const getStatusText = (status: Status) => {
    switch (status) {
      case 'running':
        return '执行中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '失败';
      case 'cancelled':
        return '已取消';
      case 'pending':
        return '等待中';
      default:
        return '未知';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 顶部筛选栏 */}
      <div className="bg-jarvis-panel/30 border-b border-white/5 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-orbitron font-bold text-jarvis-text">执行中心</h1>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm transition-colors',
                filter === 'all'
                  ? 'bg-jarvis-gold text-white'
                  : 'bg-jarvis-panel-light text-jarvis-text-secondary hover:text-jarvis-text'
              )}
            >
              全部 ({executions.length})
            </button>
            <button
              onClick={() => setFilter('running')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm transition-colors',
                filter === 'running'
                  ? 'bg-jarvis-gold text-white'
                  : 'bg-jarvis-panel-light text-jarvis-text-secondary hover:text-jarvis-text'
              )}
            >
              执行中 ({executions.filter((e) => e.status === 'running').length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm transition-colors',
                filter === 'completed'
                  ? 'bg-jarvis-gold text-white'
                  : 'bg-jarvis-panel-light text-jarvis-text-secondary hover:text-jarvis-text'
              )}
            >
              已完成 ({executions.filter((e) => e.status === 'completed').length})
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm transition-colors',
                filter === 'failed'
                  ? 'bg-jarvis-gold text-white'
                  : 'bg-jarvis-panel-light text-jarvis-text-secondary hover:text-jarvis-text'
              )}
            >
              失败 ({executions.filter((e) => e.status === 'failed').length})
            </button>
          </div>
        </div>
      </div>

      {/* 执行列表 */}
      <div className="flex-1 overflow-auto scrollbar-thin p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="loading-spinner" />
          </div>
        ) : filteredExecutions.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-jarvis-text-secondary">
                {filter === 'all' ? '暂无执行记录' : `暂无${getStatusText(filter as Status)}的记录`}
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-4">
            {filteredExecutions.map((execution) => (
              <ExecutionCard key={execution.id} execution={execution} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ExecutionCard({ execution }: { execution: ExecutionRecord }) {
  const { pauseExecution, resumeExecution, cancelExecution } = useExecutionStore();

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'running':
        return 'text-jarvis-info bg-jarvis-info/10 border-jarvis-info/20';
      case 'completed':
        return 'text-jarvis-success bg-jarvis-success/10 border-jarvis-success/20';
      case 'failed':
        return 'text-jarvis-danger bg-jarvis-danger/10 border-jarvis-danger/20';
      case 'cancelled':
        return 'text-jarvis-text-secondary bg-jarvis-text-secondary/10 border-jarvis-text-secondary/20';
      case 'pending':
        return 'text-jarvis-warning bg-jarvis-warning/10 border-jarvis-warning/20';
      default:
        return 'text-jarvis-text-secondary bg-jarvis-panel-light border-white/10';
    }
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'running':
        return '🔄';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      case 'cancelled':
        return '⏹️';
      case 'pending':
        return '⏳';
      default:
        return '⚪';
    }
  };

  const getStatusText = (status: Status) => {
    switch (status) {
      case 'running':
        return '执行中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '失败';
      case 'cancelled':
        return '已取消';
      case 'pending':
        return '等待中';
      default:
        return '未知';
    }
  };

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);

    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds}秒`;
    } else {
      return `${seconds}秒`;
    }
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-medium text-jarvis-text">
              工作流执行 #{execution.id.slice(0, 8)}
            </h3>
            <span
              className={cn(
                'px-2 py-1 rounded text-xs font-medium border',
                getStatusColor(execution.status)
              )}
            >
              {getStatusIcon(execution.status)} {getStatusText(execution.status)}
            </span>
          </div>

          <div className="flex items-center space-x-4 text-sm text-jarvis-text-secondary">
            <span>开始: {new Date(execution.start_time).toLocaleString()}</span>
            {execution.end_time && (
              <span>结束: {new Date(execution.end_time).toLocaleString()}</span>
            )}
            <span>耗时: {formatDuration(execution.start_time, execution.end_time)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {execution.status === 'running' && (
            <>
              <button
                onClick={() => pauseExecution(execution.id)}
                className="btn-ghost text-xs"
              >
                ⏸ 暂停
              </button>
              <button
                onClick={() => cancelExecution(execution.id)}
                className="btn-ghost text-xs text-jarvis-danger"
              >
                ⏹ 终止
              </button>
            </>
          )}
          {execution.status === 'pending' && (
            <button
              onClick={() => resumeExecution(execution.id)}
              className="btn-ghost text-xs"
            >
              ▶️ 继续
            </button>
          )}
          <button className="btn-ghost text-xs">📊 查看详情</button>
        </div>
      </div>

      {/* 进度条（仅执行中显示） */}
      {execution.status === 'running' && (
        <div className="mb-4">
          <div className="h-2 bg-jarvis-panel-light rounded-full overflow-hidden">
            <div
              className="h-full bg-jarvis-gold transition-all duration-300"
              style={{ width: '60%' }}
            />
          </div>
          <p className="text-xs text-jarvis-text-secondary mt-1">预计剩余: 2分钟</p>
        </div>
      )}

      {/* 日志预览 */}
      {execution.logs.length > 0 && (
        <div className="bg-jarvis-panel-light rounded-lg p-3">
          <p className="text-xs font-medium text-jarvis-text mb-2">最近日志:</p>
          <div className="space-y-1">
            {execution.logs.slice(-3).map((log, index) => (
              <p key={index} className="text-xs text-jarvis-text-secondary font-mono">
                {log.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* 错误信息 */}
      {execution.error && (
        <div className="mt-3 p-3 bg-jarvis-danger/10 border border-jarvis-danger/20 rounded-lg">
          <p className="text-sm text-jarvis-danger">{execution.error.message}</p>
        </div>
      )}
    </div>
  );
}
