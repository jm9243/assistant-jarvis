import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useSystemStore } from '@/stores/systemStore';
import { Button } from '@/components/ui';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { metrics, startMonitoring, stopMonitoring } = useSystemStore();

  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, [startMonitoring, stopMonitoring]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  const stats = [
    { label: '今日执行', value: '12', change: '+2 ↑', icon: '📊', color: 'text-blue-400' },
    { label: '成功率', value: '95%', change: '+3% ↑', icon: '⚡', color: 'text-green-400' },
    { label: 'Agent', value: '-', change: '即将到来', icon: '🤖', color: 'text-purple-400' },
    { label: '通知', value: '5', change: '未读', icon: '🔔', color: 'text-yellow-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="jarvis-card relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-jarvis-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <h1 className="text-3xl font-orbitron font-bold text-jarvis-text mb-2">
            👋 {getGreeting()}，{user?.username || '指挥官'}
          </h1>
          <p className="text-jarvis-text-secondary mb-6">贾维斯随时待命，请告诉我您需要什么</p>

          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => navigate('/dashboard/workflows')}>
              🎤 快速对话
            </Button>
            <Button variant="secondary" onClick={() => navigate('/dashboard/recorder')}>
              🎙️ 录制工作流
            </Button>
            <Button variant="secondary" onClick={() => navigate('/dashboard/executions')}>
              📊 查看任务
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="jarvis-card">
            <div className="flex items-start justify-between mb-3">
              <span className={`text-3xl ${stat.color}`}>{stat.icon}</span>
              <span className="text-xs text-jarvis-text-secondary">{stat.change}</span>
            </div>
            <p className="text-sm text-jarvis-text-secondary mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-jarvis-text">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 主要内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左列 - 最近任务和活跃工作流 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 最近任务 */}
          <div className="jarvis-section">
            <h2 className="text-lg font-orbitron font-bold text-jarvis-text mb-4">▼ 最近任务</h2>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-jarvis-panel-light rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-jarvis-gold/20 rounded-lg flex items-center justify-center">
                      <span>📋</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-jarvis-text">数据采集工作流 #{i}</p>
                      <p className="text-xs text-jarvis-text-secondary">2分钟前 · 已完成</p>
                    </div>
                  </div>
                  <span className="text-jarvis-success">✅</span>
                </div>
              ))}
            </div>
          </div>

          {/* 活跃工作流 */}
          <div className="jarvis-section">
            <h2 className="text-lg font-orbitron font-bold text-jarvis-text mb-4">▼ 活跃工作流</h2>
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-jarvis-panel-light rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-jarvis-info/20 rounded-lg flex items-center justify-center">
                      <span>🔄</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-jarvis-text">自动化工作流 {i}</p>
                      <p className="text-xs text-jarvis-text-secondary">最后执行: 1小时前</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">查看</Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右列 - 快速操作和系统状态 */}
        <div className="space-y-6">
          {/* 快速操作 */}
          <div className="jarvis-section">
            <h2 className="text-lg font-orbitron font-bold text-jarvis-text mb-4">▼ 快速操作</h2>
            <div className="space-y-2">
              <button
                className="w-full p-3 bg-jarvis-panel-light hover:bg-jarvis-gold/10 rounded-lg text-left transition-colors"
                onClick={() => navigate('/dashboard/workflows')}
              >
                <span className="text-jarvis-gold mr-2">+</span>
                <span className="text-sm text-jarvis-text">新建工作流</span>
              </button>
              <button
                className="w-full p-3 bg-jarvis-panel-light hover:bg-jarvis-gold/10 rounded-lg text-left transition-colors"
                onClick={() => navigate('/dashboard/recorder')}
              >
                <span className="text-jarvis-gold mr-2">🎙️</span>
                <span className="text-sm text-jarvis-text">录制工作流</span>
              </button>
            </div>
          </div>

          {/* 系统状态 */}
          <div className="jarvis-section">
            <h2 className="text-lg font-orbitron font-bold text-jarvis-text mb-4">▼ 系统状态</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-jarvis-text-secondary">CPU</span>
                  <span className="text-jarvis-text">{metrics?.cpu || 0}%</span>
                </div>
                <div className="h-2 bg-jarvis-panel-light rounded-full overflow-hidden">
                  <div
                    className="h-full bg-jarvis-gold transition-all"
                    style={{ width: `${metrics?.cpu || 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-jarvis-text-secondary">内存</span>
                  <span className="text-jarvis-text">{metrics?.memory || 0}%</span>
                </div>
                <div className="h-2 bg-jarvis-panel-light rounded-full overflow-hidden">
                  <div
                    className="h-full bg-jarvis-info transition-all"
                    style={{ width: `${metrics?.memory || 0}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-jarvis-text-secondary">引擎状态</span>
                  <span className="flex items-center text-sm">
                    <span className="w-2 h-2 bg-jarvis-success rounded-full mr-2" />
                    <span className="text-jarvis-success">运行中</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
