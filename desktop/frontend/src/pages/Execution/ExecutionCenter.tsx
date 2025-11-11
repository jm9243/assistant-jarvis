import { useState } from 'react';
import { useExecutionStore } from '@/stores/executionStore';
import { ExecutionConsole } from '@/components/execution/ExecutionConsole';
import { Status } from '@/types';
import { Button } from '@/components/ui';

export function ExecutionCenter() {
  const { executions } = useExecutionStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Status | 'all'>('all');

  const filteredExecutions = executions.filter((exec) => {
    if (filter === 'all') return true;
    return exec.status === filter;
  });

  const selectedExecution = executions.find((e) => e.id === selectedId);

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'running':
        return '▶️';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      case 'cancelled':
        return '⏹️';
      default:
        return '⏸️';
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'running':
        return 'text-jarvis-info';
      case 'completed':
        return 'text-jarvis-success';
      case 'failed':
        return 'text-jarvis-danger';
      case 'cancelled':
        return 'text-jarvis-text-secondary';
      default:
        return 'text-jarvis-text-secondary';
    }
  };

  return (
    <div className="h-full flex">
      {/* 左侧执行列表 */}
      <div className="w-96 bg-jarvis-panel/30 border-r border-white/5 flex flex-col">
        {/* 头部 */}
        <div className="p-4 border-b border-white/5">
          <h2 className="text-lg font-medium text-jarvis-text mb-4">执行记录</h2>

          {/* 筛选器 */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setFilter('all')}
              variant={filter === 'all' ? 'primary' : 'ghost'}
              size="sm"
            >
              全部
            </Button>
            <Button
              onClick={() => setFilter('running')}
              variant={filter === 'running' ? 'primary' : 'ghost'}
              size="sm"
            >
              运行中
            </Button>
            <Button
              onClick={() => setFilter('completed')}
              variant={filter === 'completed' ? 'primary' : 'ghost'}
              size="sm"
            >
              已完成
            </Button>
            <Button
              onClick={() => setFilter('failed')}
              variant={filter === 'failed' ? 'primary' : 'ghost'}
              size="sm"
            >
              失败
            </Button>
          </div>
        </div>

        {/* 执行列表 */}
        <div className="flex-1 overflow-y-auto">
          {filteredExecutions.length === 0 ? (
            <div className="h-full flex items-center justify-center text-jarvis-text-secondary">
              <div className="text-center">
                <div className="text-4xl mb-2">📋</div>
                <div className="text-sm">暂无执行记录</div>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {filteredExecutions.map((execution) => (
                <button
                  key={execution.id}
                  onClick={() => setSelectedId(execution.id)}
                  className={`w-full p-4 rounded-lg text-left transition-colors ${selectedId === execution.id
                      ? 'bg-jarvis-primary/20 border-2 border-jarvis-primary'
                      : 'bg-jarvis-panel border border-white/10 hover:border-jarvis-primary/50'
                    }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getStatusIcon(execution.status)}</span>
                      <span className="text-sm font-medium text-jarvis-text">
                        工作流 {execution.workflow_id}
                      </span>
                    </div>
                    <span className={`text-xs ${getStatusColor(execution.status)}`}>
                      {execution.status}
                    </span>
                  </div>

                  <div className="text-xs text-jarvis-text-secondary space-y-1">
                    <div>开始: {new Date(execution.start_time).toLocaleString()}</div>
                    {execution.end_time && (
                      <div>结束: {new Date(execution.end_time).toLocaleString()}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 右侧执行详情 */}
      <div className="flex-1">
        {selectedExecution ? (
          <ExecutionConsole execution={selectedExecution} />
        ) : (
          <div className="h-full flex items-center justify-center text-jarvis-text-secondary">
            <div className="text-center">
              <div className="text-4xl mb-2">👈</div>
              <div className="text-sm">选择一个执行记录查看详情</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
