import { useState } from 'react';
import { apiService } from '@/services/api';
import { ExecutionRecord, Status } from '@/types';

interface ExecutionConsoleProps {
  execution: ExecutionRecord;
}

export function ExecutionConsole({ execution }: ExecutionConsoleProps) {
  const [activeTab, setActiveTab] = useState<'logs' | 'variables' | 'screenshots'>('logs');
  const [error, setError] = useState<string | null>(null);

  const handlePause = async () => {
    try {
      setError(null);
      const result = await apiService.pauseExecution(execution.id);
      if (!result.success) {
        setError(result.error || '暂停失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '暂停失败');
    }
  };

  const handleResume = async () => {
    try {
      setError(null);
      const result = await apiService.resumeExecution(execution.id);
      if (!result.success) {
        setError(result.error || '恢复失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '恢复失败');
    }
  };

  const handleCancel = async () => {
    try {
      setError(null);
      const result = await apiService.cancelExecution(execution.id);
      if (!result.success) {
        setError(result.error || '取消失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '取消失败');
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-jarvis-text-secondary';
      default:
        return 'bg-jarvis-text-secondary';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部信息 */}
      <div className="p-6 border-b border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-jarvis-text">
              工作流执行 #{execution.id.slice(0, 8)}
            </h2>
            <div className="text-sm text-jarvis-text-secondary mt-1">
              ID: {execution.id}
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center space-x-2">
            {execution.status === 'running' && (
              <>
                <button
                  onClick={handlePause}
                  className="px-4 py-2 bg-jarvis-warning hover:bg-jarvis-warning/80 text-jarvis-space rounded-lg transition-colors"
                >
                  ⏸ 暂停
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-jarvis-danger hover:bg-jarvis-danger/80 text-white rounded-lg transition-colors"
                >
                  ⏹ 取消
                </button>
              </>
            )}
            {execution.status === 'pending' && (
              <button
                onClick={handleResume}
                className="px-4 py-2 bg-jarvis-success hover:bg-jarvis-success/80 text-white rounded-lg transition-colors"
              >
                ▶️ 恢复
              </button>
            )}
          </div>
        </div>

        {/* 进度条 */}
        {execution.status === 'running' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-jarvis-text-secondary">执行进度</span>
              <span className="text-jarvis-text">执行中...</span>
            </div>
            <div className="h-2 bg-jarvis-space rounded-full overflow-hidden">
              <div className={`h-full ${getStatusColor(execution.status)} transition-all animate-pulse`} style={{ width: '60%' }} />
            </div>
          </div>
        )}

        {/* 时间信息 */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-jarvis-text-secondary">开始时间</div>
            <div className="text-jarvis-text mt-1">
              {new Date(execution.start_time).toLocaleString()}
            </div>
          </div>
          {execution.end_time && (
            <div>
              <div className="text-jarvis-text-secondary">结束时间</div>
              <div className="text-jarvis-text mt-1">
                {new Date(execution.end_time).toLocaleString()}
              </div>
            </div>
          )}
          <div>
            <div className="text-jarvis-text-secondary">状态</div>
            <div className={`mt-1 font-medium ${getStatusColor(execution.status).replace('bg-', 'text-')}`}>
              {execution.status}
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="p-3 bg-jarvis-danger/10 border border-jarvis-danger/50 rounded-lg text-sm text-jarvis-danger">
            {error}
          </div>
        )}
      </div>

      {/* 标签页 */}
      <div className="border-b border-white/5">
        <div className="flex space-x-1 px-6">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'logs'
              ? 'text-jarvis-primary border-b-2 border-jarvis-primary'
              : 'text-jarvis-text-secondary hover:text-jarvis-text'
              }`}
          >
            📋 日志 ({execution.logs?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('variables')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'variables'
              ? 'text-jarvis-primary border-b-2 border-jarvis-primary'
              : 'text-jarvis-text-secondary hover:text-jarvis-text'
              }`}
          >
            📦 变量 ({Object.keys(execution.variables || {}).length})
          </button>
          <button
            onClick={() => setActiveTab('screenshots')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'screenshots'
              ? 'text-jarvis-primary border-b-2 border-jarvis-primary'
              : 'text-jarvis-text-secondary hover:text-jarvis-text'
              }`}
          >
            📸 截图 ({execution.screenshots?.length || 0})
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'logs' && (
          <div className="h-full overflow-y-auto p-6 space-y-2 font-mono text-sm">
            {execution.logs && execution.logs.length > 0 ? (
              execution.logs.map((log, index) => (
                <div
                  key={index}
                  className="p-2 bg-jarvis-panel/50 border border-white/5 rounded"
                >
                  <span className="text-jarvis-text-secondary">[{log.timestamp}]</span>{' '}
                  <span className={log.status === 'failed' ? 'text-jarvis-danger' : 'text-jarvis-text'}>
                    {log.message}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-jarvis-text-secondary">
                暂无日志
              </div>
            )}
          </div>
        )}

        {activeTab === 'variables' && (
          <div className="h-full overflow-y-auto p-6">
            {execution.variables && Object.keys(execution.variables).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(execution.variables).map(([key, value]) => (
                  <div
                    key={key}
                    className="p-3 bg-jarvis-panel border border-white/10 rounded-lg"
                  >
                    <div className="text-sm font-medium text-jarvis-text mb-1">{key}</div>
                    <div className="text-xs text-jarvis-text-secondary font-mono">
                      {JSON.stringify(value, null, 2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-jarvis-text-secondary">
                暂无变量
              </div>
            )}
          </div>
        )}

        {activeTab === 'screenshots' && (
          <div className="h-full overflow-y-auto p-6">
            {execution.screenshots && execution.screenshots.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {execution.screenshots.map((screenshot, index) => (
                  <div
                    key={index}
                    className="aspect-video bg-jarvis-panel border border-white/10 rounded-lg overflow-hidden"
                  >
                    <img
                      src={screenshot}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-jarvis-text-secondary">
                暂无截图
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
