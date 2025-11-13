import { useState, useEffect } from 'react';
import { systemApi, InstalledSoftware } from '@/services/systemApi';
import { Button } from '@/components/ui';

export function SoftwareScannerPage() {
  const [software, setSoftware] = useState<InstalledSoftware[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    scanSoftware();
  }, []);

  const scanSoftware = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Starting software scan...');
      const result = await systemApi.scanSoftware();
      console.log('Scan result:', result);
      setSoftware(result);
    } catch (err) {
      console.error('Scan error:', err);
      setError(err instanceof Error ? err.message : '扫描失败');
    } finally {
      setLoading(false);
    }
  };

  const filteredSoftware = Array.isArray(software)
    ? software.filter((item) => {
      if (!searchTerm) return true;
      return item.name.toLowerCase().includes(searchTerm.toLowerCase());
    })
    : [];

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

      {/* 搜索框 */}
      <div className="p-4 border-b border-white/5">
        <input
          type="text"
          placeholder="搜索软件名称..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input w-full max-w-md"
        />
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
              <div className="text-sm">
                {searchTerm ? '未找到匹配的软件' : '未找到软件'}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSoftware.map((item, index) => (
              <div
                key={index}
                className="bg-jarvis-panel border border-white/10 rounded-lg p-6 hover:border-jarvis-primary/50 transition-colors"
              >
                {/* 软件信息 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-jarvis-text truncate">
                      {item.name}
                    </h3>
                    {item.version && item.version !== 'Unknown' && (
                      <div className="text-sm text-jarvis-text-secondary mt-1">
                        版本: {item.version}
                      </div>
                    )}
                    {item.publisher && item.publisher !== 'Unknown' && (
                      <div className="text-sm text-jarvis-text-secondary mt-1">
                        发布者: {item.publisher}
                      </div>
                    )}
                    {item.install_date && item.install_date !== 'Unknown' && (
                      <div className="text-xs text-jarvis-text-secondary mt-2">
                        安装日期: {item.install_date}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <span className="text-2xl">📦</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
