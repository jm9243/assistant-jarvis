import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { SoftwareItem } from '@/types';
import { Button } from '@/components/ui';

export function SoftwareScannerPage() {
  const [software, setSoftware] = useState<SoftwareItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'full' | 'partial' | 'unknown'>('all');

  useEffect(() => {
    scanSoftware();
  }, []);

  const scanSoftware = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Starting software scan...');
      const result = await apiService.scanSoftware();
      console.log('Scan result:', result);

      if (result.success && result.data) {
        console.log('Software found:', result.data.length);
        setSoftware(result.data);
      } else {
        console.error('Scan failed:', result.error);
        setError(result.error || '扫描失败');
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError(err instanceof Error ? err.message : '扫描失败');
    } finally {
      setLoading(false);
    }
  };

  const filteredSoftware = Array.isArray(software) 
    ? software.filter((item) => {
        if (filter === 'all') return true;
        return item.compatibility === filter;
      })
    : [];

  const getCompatibilityColor = (compatibility: string) => {
    switch (compatibility) {
      case 'full':
        return 'text-jarvis-success bg-jarvis-success/10 border-jarvis-success/30';
      case 'partial':
        return 'text-jarvis-warning bg-jarvis-warning/10 border-jarvis-warning/30';
      default:
        return 'text-jarvis-text-secondary bg-jarvis-text-secondary/10 border-jarvis-text-secondary/30';
    }
  };

  const getCompatibilityLabel = (compatibility: string) => {
    switch (compatibility) {
      case 'full':
        return '完全兼容';
      case 'partial':
        return '部分兼容';
      default:
        return '未知';
    }
  };

  return (
    <div className="h-full flex flex-col bg-jarvis-space">
      {/* 头部 */}
      <div className="h-16 bg-jarvis-panel/30 border-b border-white/5 flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-jarvis-text">🔍 软件扫描</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-jarvis-text-secondary">已扫描:</span>
            <span className="text-sm font-medium text-jarvis-text">{software.length}</span>
          </div>
        </div>

        <Button
          onClick={scanSoftware}
          disabled={loading}
          variant="primary"
          loading={loading}
        >
          {loading ? '扫描中...' : '🔄 重新扫描'}
        </Button>
      </div>

      {/* 筛选器 */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'primary' : 'ghost'}
            size="sm"
          >
            全部 ({software.length})
          </Button>
          <Button
            onClick={() => setFilter('full')}
            variant={filter === 'full' ? 'primary' : 'ghost'}
            size="sm"
          >
            完全兼容 ({Array.isArray(software) ? software.filter((s) => s.compatibility === 'full').length : 0})
          </Button>
          <Button
            onClick={() => setFilter('partial')}
            variant={filter === 'partial' ? 'primary' : 'ghost'}
            size="sm"
          >
            部分兼容 ({Array.isArray(software) ? software.filter((s) => s.compatibility === 'partial').length : 0})
          </Button>
          <Button
            onClick={() => setFilter('unknown')}
            variant={filter === 'unknown' ? 'primary' : 'ghost'}
            size="sm"
          >
            未知 ({Array.isArray(software) ? software.filter((s) => s.compatibility === 'unknown').length : 0})
          </Button>
        </div>
      </div>

      {/* 软件列表 */}
      <div className="flex-1 overflow-y-auto p-6">
        {error ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <div className="text-jarvis-danger mb-4">{error}</div>
              <Button
                onClick={scanSoftware}
                variant="primary"
              >
                重试
              </Button>
            </div>
          </div>
        ) : loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4 animate-spin">🔄</div>
              <div className="text-jarvis-text-secondary">正在扫描系统软件...</div>
            </div>
          </div>
        ) : filteredSoftware.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-jarvis-text-secondary">
              <div className="text-4xl mb-2">📦</div>
              <div className="text-sm">未找到软件</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSoftware.map((item) => (
              <div
                key={item.id}
                className="bg-jarvis-panel border border-white/10 rounded-lg p-6 hover:border-jarvis-primary/50 transition-colors"
              >
                {/* 软件信息 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-jarvis-text truncate">
                      {item.name}
                    </h3>
                    {item.version && (
                      <div className="text-sm text-jarvis-text-secondary mt-1">
                        版本: {item.version}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <span className="text-2xl">
                      {item.platform === 'macos' ? '🍎' : '🪟'}
                    </span>
                  </div>
                </div>

                {/* 兼容性标签 */}
                <div className="mb-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getCompatibilityColor(
                      item.compatibility
                    )}`}
                  >
                    {getCompatibilityLabel(item.compatibility)}
                  </span>
                </div>

                {/* 能力列表 */}
                {item.capabilities && item.capabilities.length > 0 && (
                  <div>
                    <div className="text-xs text-jarvis-text-secondary mb-2">支持的能力:</div>
                    <div className="flex flex-wrap gap-1">
                      {item.capabilities.map((capability, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-jarvis-space text-xs text-jarvis-text rounded"
                        >
                          {capability}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
