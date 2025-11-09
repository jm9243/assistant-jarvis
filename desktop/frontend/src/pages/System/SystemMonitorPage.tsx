import React, { useEffect, useState } from 'react';
import MetricCard from '@/components/system/MetricCard';
import GlassPanel from '@/components/common/GlassPanel';
import { systemService } from '@/services/system';
import type { SystemMetric } from '@/types';

const SystemMonitorPage: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetric | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchMetrics = async () => {
      const result = await systemService.metrics();
      if (result.success && result.data && mounted) {
        setMetrics(result.data);
        setLoading(false);
      }
    };
    fetchMetrics();
    const timer = setInterval(fetchMetrics, 5000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex h-full flex-col bg-[#050714] text-white">
      <header className="border-b border-white/5 bg-[#050714]/80 px-6 py-4">
        <p className="text-xs uppercase tracking-[0.4em] text-[#FFB800]">System Monitor</p>
        <h2 className="text-lg">系统监控中心</h2>
        <p className="text-xs text-[#6B7A99]">监控 Python Sidecar · FastAPI 服务 · 通知通道</p>
      </header>
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="CPU" value={metrics ? `${metrics.cpu}%` : '--'} hint="目标 < 75%" />
          <MetricCard label="内存" value={metrics ? `${metrics.memory}%` : '--'} hint="目标 < 80%" accent="#00D9FF" />
          <MetricCard label="磁盘" value={metrics ? `${metrics.disk}%` : '--'} hint="系统盘使用率" accent="#FFB800" />
          <MetricCard label="通知" value={metrics ? `${metrics.notifications}` : '--'} hint="未读提醒" accent="#00F5A0" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <GlassPanel>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#FFB800]">告警中心</p>
                <p className="text-xs text-[#6B7A99]">最近 24 小时</p>
              </div>
              <button className="text-xs text-[#00D9FF]">导出日志</button>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-[#A8B2D1]">
              {metrics?.alerts?.length ? (
                metrics.alerts.map((alert) => (
                  <li key={alert.id} className="rounded-xl border border-white/10 bg-[#050714]/40 px-4 py-3">
                    <p className="text-white">{alert.message}</p>
                    <p className="text-xs text-[#6B7A99]">{new Date(alert.created_at).toLocaleString()}</p>
                  </li>
                ))
              ) : (
                <li className="text-[#6B7A99]">{loading ? '加载中...' : '暂无告警'}</li>
              )}
            </ul>
          </GlassPanel>
          <GlassPanel>
            <p className="text-xs uppercase tracking-[0.3em] text-[#FFB800]">运行通道</p>
            <div className="mt-4 space-y-3 text-sm text-[#A8B2D1]">
              <div className="rounded-xl border border-white/10 px-4 py-3">
                <p className="text-white">WebSocket · Logger</p>
                <p className="text-xs text-[#6B7A99]">传输执行日志 & 录制事件</p>
              </div>
              <div className="rounded-xl border border-white/10 px-4 py-3">
                <p className="text-white">系统通知</p>
                <p className="text-xs text-[#6B7A99]">Slack / 邮件 / 内置中心</p>
                <p className="text-xs text-[#6B7A99]">
                  网络：
                  {metrics
                    ? `${(metrics.network.sent / 1_000_000).toFixed(1)}MB ↑ / ${(metrics.network.received / 1_000_000).toFixed(1)}MB ↓`
                    : '--'}
                </p>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitorPage;
