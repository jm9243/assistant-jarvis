import { useState, useEffect } from 'react';
import { ToolCard } from '@/components/tool/ToolCard';
import { ToolDetailDialog } from '@/components/tool/ToolDetailDialog';
import { Button } from '@/components/ui';

interface Tool {
  id: string;
  name: string;
  description: string;
  type: 'workflow' | 'api' | 'builtin';
  is_enabled: boolean;
  usage_count: number;
  success_rate: number;
  parameters_schema: any;
  approval_policy?: 'none' | 'optional' | 'required';
}

export default function ToolStorePage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/tools');
      const data = await response.json();
      
      if (data.code === 0) {
        setTools(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load tools:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTool = async (toolId: string, enabled: boolean) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/tools/${toolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: enabled })
      });

      const data = await response.json();

      if (data.code === 0) {
        await loadTools();
      }
    } catch (err) {
      console.error('Failed to toggle tool:', err);
    }
  };

  const handleUpdatePermission = async (toolId: string, policy: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/tools/${toolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval_policy: policy })
      });

      const data = await response.json();

      if (data.code === 0) {
        await loadTools();
        // 更新当前选中的工具
        if (selectedTool && selectedTool.id === toolId) {
          setSelectedTool({ ...selectedTool, approval_policy: policy as any });
        }
      }
    } catch (err) {
      console.error('Failed to update permission:', err);
    }
  };

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || tool.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="jarvis-page">
      {/* 头部 */}
      <div className="jarvis-header">
        <div>
          <h1 className="text-xl font-bold text-jarvis-text">🛠️ 工具商店</h1>
          <p className="text-sm text-jarvis-text-secondary mt-1">
            管理和配置Agent可用的工具
          </p>
        </div>
      </div>

      <div className="jarvis-content jarvis-scrollbar space-y-6">

        {/* 筛选和搜索 */}
        <div className="jarvis-section space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={() => setFilterType('all')}
              variant={filterType === 'all' ? 'primary' : 'ghost'}
              size="sm"
            >
              全部
            </Button>
            <Button
              onClick={() => setFilterType('workflow')}
              variant={filterType === 'workflow' ? 'primary' : 'ghost'}
              size="sm"
            >
              工作流
            </Button>
            <Button
              onClick={() => setFilterType('api')}
              variant={filterType === 'api' ? 'primary' : 'ghost'}
              size="sm"
            >
              API
            </Button>
            <Button
              onClick={() => setFilterType('builtin')}
              variant={filterType === 'builtin' ? 'primary' : 'ghost'}
              size="sm"
            >
              内置
            </Button>
          </div>

          <input
            type="text"
            placeholder="搜索工具..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="jarvis-input"
          />
        </div>

        {/* 工具列表 */}
        {loading ? (
          <div className="jarvis-empty">
            <div className="jarvis-loading"></div>
            <p className="mt-4">加载中...</p>
          </div>
        ) : filteredTools.length === 0 ? (
          <div className="jarvis-empty">
            <div className="text-4xl mb-4">🛠️</div>
            <p className="text-jarvis-text-secondary">
              {searchQuery ? '未找到匹配的工具' : '暂无工具'}
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onToggle={handleToggleTool}
              onShowDetails={setSelectedTool}
            />
          ))}
        </div>
      )}

        {/* 工具详情对话框 */}
        {selectedTool && (
          <ToolDetailDialog
            tool={selectedTool}
            onClose={() => setSelectedTool(null)}
            onUpdatePermission={handleUpdatePermission}
          />
        )}
      </div>
    </div>
  );
}
