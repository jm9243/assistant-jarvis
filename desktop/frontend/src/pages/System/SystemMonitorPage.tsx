import { useState, useEffect } from 'react';
import { useSystemStore } from '@/stores/systemStore';
import { systemApi } from '@/services/systemApi';
import { MetricCard } from '@/components/system/MetricCard';
import { Button } from '@/components/ui';

export function SystemMonitorPage() {
  const { metrics, loadSystemInfo } = useSystemStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 初始加载
    fetchSystemInfo();
    fetchLogs();

    // 定时刷新（每5秒）
    const interval = setInterval(() => {
      fetchSystemInfo();
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSystemInfo = async () => {
    try {
      await loadSystemInfo();
    } catch (err) {
      console.error('Failed to fetch system info:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const logs = await systemApi.getLogs({ limit: 50 });
      setLogs(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取日志失败');
    } finally {
      setLoading(false);
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-jarvis-danger/10 border-jarvis-danger/50 text-jarvis-danger';
      case 'warn':
        return 'bg-jarvis-warning/10 border-jarvis-warning/50 text-jarvis-warning';
      default:
        return 'bg-jarvis-info/10 border-jarvis-info/50 text-jarvis-info';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return 'text-jarvis-danger';
      case 'WARN':
        return 'text-jarvis-warning';
      case 'INFO':
        return 'text-jarvis-info';
      default:
        return 'text-jarvis-text-secondary';
    }
  };

  return (
    <div className="jarvis-page">
      {/* 头部 */}
      <div className="jarvis-header">
        <h1 className="text-xl font-bold text-jarvis-text">📊 系统监控</h1>
        <Button
          onClick={() => {
            fetchSystemInfo();
            fetchLogs();
          }}
          variant="secondary"
          size="sm"
        >
          🔄 刷新
        </Button>
      </div>

      {/* 主要内容 */}
      <div className="jarvis-content jarvis-scrollbar space-y-6">
        {/* 系统指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="CPU 使用率"
            value={`${metrics?.cpu?.toFixed(1) ?? 0}%`}
            icon="💻"
            color="blue"
            trend={(metrics?.cpu ?? 0) > 80 ? 'up' : 'stable'}
          />
          <MetricCard
            title="内存使用率"
            value={`${metrics?.memory?.toFixed(1) ?? 0}%`}
            icon="🧠"
            color="green"
            trend={(metrics?.memory ?? 0) > 80 ? 'up' : 'stable'}
          />
          <MetricCard
            title="引擎状态"
            value={metrics?.sidecarStatus || 'unknown'}
            icon="⚙️"
            color="purple"
          />
          <MetricCard
            title="告警数量"
            value={metrics?.alerts?.length || 0}
            icon="⚠️"
            color="red"
            trend={metrics?.alerts && metrics.alerts.length > 0 ? 'up' : 'stable'}
          />
        </div>

        {/* 告警列表 */}
        {metrics?.alerts && metrics.alerts.length > 0 && (
          <div className="bg-jarvis-panel/30 border border-white/5 rounded-lg p-6">
            <h2 className="text-lg font-medium text-jarvis-text mb-4">⚠️ 系统告警</h2>
            <div className="space-y-2">
              {metrics.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 border rounded-lg ${getAlertColor(alert.level)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{alert.message}</div>
                      <div className="text-xs opacity-75 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <span className="text-xs uppercase font-medium">{alert.level}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 日志查看器 */}
        <div className="bg-jarvis-panel/30 border border-white/5 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-lg font-medium text-jarvis-text">📋 系统日志</h2>
            <div className="flex items-center space-x-2">
              <select className="px-3 py-1 bg-jarvis-panel border border-white/10 rounded text-sm text-jarvis-text">
                <option value="all">全部</option>
                <option value="ERROR">错误</option>
                <option value="WARN">警告</option>
                <option value="INFO">信息</option>
              </select>
              <button
                onClick={fetchLogs}
                disabled={loading}
                className="px-3 py-1 bg-jarvis-panel hover:bg-jarvis-panel/80 border border-white/10 rounded text-sm text-jarvis-text transition-colors disabled:opacity-50"
              >
                {loading ? '加载中...' : '刷新'}
              </button>
            </div>
          </div>

          <div className="p-4 max-h-96 overflow-y-auto font-mono text-xs space-y-1">
            {error ? (
              <div className="text-center text-jarvis-danger py-8">{error}</div>
            ) : !Array.isArray(logs) || logs.length === 0 ? (
              <div className="text-center text-jarvis-text-secondary py-8">暂无日志</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="p-2 hover:bg-jarvis-panel/50 rounded">
                  <span className="text-jarvis-text-secondary">[{log.timestamp}]</span>{' '}
                  <span className={getLogLevelColor(log.level)}>[{log.level}]</span>{' '}
                  <span className="text-jarvis-text">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 系统信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-jarvis-panel/30 border border-white/5 rounded-lg p-6">
            <h2 className="text-lg font-medium text-jarvis-text mb-4">💻 系统信息</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-jarvis-text-secondary">操作系统</span>
                <span className="text-jarvis-text">{navigator.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-jarvis-text-secondary">浏览器</span>
                <span className="text-jarvis-text">{navigator.userAgent.split(' ')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-jarvis-text-secondary">语言</span>
                <span className="text-jarvis-text">{navigator.language}</span>
              </div>
            </div>
          </div>

          <div className="bg-jarvis-panel/30 border border-white/5 rounded-lg p-6">
            <h2 className="text-lg font-medium text-jarvis-text mb-4">🔗 连接状态</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-jarvis-text-secondary">后端 API</span>
                <span className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-jarvis-success rounded-full animate-pulse" />
                  <span className="text-jarvis-success">已连接</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-jarvis-text-secondary">WebSocket</span>
                <span className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-jarvis-success rounded-full animate-pulse" />
                  <span className="text-jarvis-success">已连接</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-jarvis-text-secondary">Python 引擎</span>
                <span className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${metrics?.sidecarStatus === 'running' ? 'bg-jarvis-success animate-pulse' : 'bg-jarvis-text-secondary'
                    }`} />
                  <span className={metrics?.sidecarStatus === 'running' ? 'text-jarvis-success' : 'text-jarvis-text-secondary'}>
                    {metrics?.sidecarStatus === 'running' ? '运行中' : '未运行'}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
