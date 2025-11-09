import React, { useEffect, useMemo, useState } from 'react';
import { systemService } from '@/services/system';
import type { SoftwareItem } from '@/types';
import GlassPanel from '@/components/common/GlassPanel';

const SoftwareScannerPage: React.FC = () => {
  const [items, setItems] = useState<SoftwareItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScan = async () => {
    setLoading(true);
    const result = await systemService.scan();
    if (result.success && result.data) {
      setItems(result.data);
      setError(null);
    } else {
      setError(result.error ?? '扫描失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchScan();
  }, []);

  const summary = useMemo(() => ({
    total: items.length,
    full: items.filter((item) => item.compatibility === 'full').length,
    partial: items.filter((item) => item.compatibility === 'partial').length,
  }), [items]);

  return (
    <div className="flex h-full flex-col bg-[#050714] text-white">
      <header className="border-b border-white/5 bg-[#050714]/80 px-6 py-4">
        <p className="text-xs uppercase tracking-[0.4em] text-[#FFB800]">Software Scanner</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg">系统软件扫描</h2>
          <button
            className="rounded-xl border border-[#FFB800]/40 px-4 py-2 text-sm text-[#FFB800]"
            onClick={fetchScan}
            disabled={loading}
          >
            {loading ? '扫描中...' : '重新扫描'}
          </button>
        </div>
      </header>
      <div className="flex-1 space-y-4 overflow-auto p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <GlassPanel>
            <p className="text-xs text-[#A8B2D1]">已识别应用</p>
            <p className="text-3xl font-semibold text-white">{summary.total}</p>
          </GlassPanel>
          <GlassPanel>
            <p className="text-xs text-[#A8B2D1]">完全兼容</p>
            <p className="text-3xl font-semibold text-jarvis-success">{summary.full}</p>
          </GlassPanel>
          <GlassPanel>
            <p className="text-xs text-[#A8B2D1]">需要适配</p>
            <p className="text-3xl font-semibold text-jarvis-warning">{summary.partial}</p>
          </GlassPanel>
        </div>
        {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">{error}</p>}
        <table className="w-full table-auto rounded-2xl border border-white/5 bg-white/5 text-left text-sm text-[#A8B2D1]">
          <thead>
            <tr className="text-xs uppercase tracking-[0.2em] text-[#6B7A99]">
              <th className="px-4 py-3">应用</th>
              <th className="px-4 py-3">版本</th>
              <th className="px-4 py-3">平台</th>
              <th className="px-4 py-3">兼容性</th>
              <th className="px-4 py-3">路径</th>
              <th className="px-4 py-3">推荐能力</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-white/5">
                <td className="px-4 py-3 text-white">{item.name}</td>
                <td className="px-4 py-3">{item.version ?? '--'}</td>
                <td className="px-4 py-3">{item.platform}</td>
                <td className="px-4 py-3">{item.compatibility}</td>
                <td className="px-4 py-3 text-xs text-[#6B7A99]">{item.path ?? '--'}</td>
                <td className="px-4 py-3 text-xs text-[#6B7A99]">{item.capabilities.join(', ')}</td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr>
                <td className="px-4 py-6 text-center text-[#6B7A99]" colSpan={5}>
                  暂无扫描结果
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SoftwareScannerPage;
