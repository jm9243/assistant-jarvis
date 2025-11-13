import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
import { knowledgeBaseApi, type KnowledgeBase } from '@/services/knowledgeBaseApi';

export default function KnowledgeBaseListPage() {
  const navigate = useNavigate();
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  const loadKnowledgeBases = async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: 使用 Tauri IPC 调用
      // const kbs = await invoke('list_knowledge_bases');
      const kbs = await knowledgeBaseApi.listKnowledgeBases();
      setKnowledgeBases(kbs);
    } catch (err) {
      setError('加载失败，请稍后重试');
      console.error('Failed to load knowledge bases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个知识库吗？这将删除所有相关文档。')) return;

    try {
      await knowledgeBaseApi.deleteKnowledgeBase(id);
      await loadKnowledgeBases();
    } catch (err) {
      alert('删除失败，请稍后重试');
      console.error('Failed to delete knowledge base:', err);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredKnowledgeBases = knowledgeBases.filter(kb =>
    kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kb.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="jarvis-page">
      {/* 头部 */}
      <div className="jarvis-header">
        <div>
          <h1 className="text-xl font-bold text-jarvis-text">📚 知识库管理</h1>
          <p className="text-sm text-jarvis-text-secondary mt-1">
            管理文档和向量数据库
          </p>
        </div>

        <Button
          onClick={() => setShowCreateDialog(true)}
          variant="primary"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          创建知识库
        </Button>
      </div>

      <div className="jarvis-content jarvis-scrollbar space-y-6">
        {/* 搜索栏 */}
        <div className="jarvis-section">
          <input
            type="text"
            placeholder="搜索知识库..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="jarvis-input"
          />
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="jarvis-error">
            {error}
          </div>
        )}

        {/* 知识库列表 */}
        {loading ? (
          <div className="jarvis-empty">
            <div className="jarvis-loading"></div>
            <p className="mt-4">加载中...</p>
          </div>
        ) : filteredKnowledgeBases.length === 0 ? (
          <div className="jarvis-empty">
            <svg className="w-16 h-16 mb-4 text-jarvis-text-secondary opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-lg mb-4">
              {searchQuery ? '未找到匹配的知识库' : '暂无知识库'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setShowCreateDialog(true)}
                variant="primary"
              >
                创建第一个知识库
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredKnowledgeBases.map((kb) => (
              <div
                key={kb.id}
                className="card group cursor-pointer"
                onClick={() => navigate(`/dashboard/knowledge-bases/${kb.id}`)}
              >
                {/* 图标 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-jarvis-gold/20 to-jarvis-gold-dark/20 border border-jarvis-gold/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-jarvis-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(kb.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg transition-all"
                    title="删除知识库"
                  >
                    <svg className="w-4 h-4 text-jarvis-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* 名称和描述 */}
                <h3 className="text-lg font-semibold text-jarvis-text mb-2 truncate">
                  {kb.name}
                </h3>
                <p className="text-sm text-jarvis-text-secondary mb-4 line-clamp-2 min-h-[40px]">
                  {kb.description || '暂无描述'}
                </p>

                {/* 统计信息 */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-jarvis-text-secondary">文档数量</span>
                    <span className="text-jarvis-gold font-medium">{kb.document_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-jarvis-text-secondary">总大小</span>
                    <span className="text-jarvis-text">{formatSize(kb.total_size || 0)}</span>
                  </div>
                </div>

                {/* 时间 */}
                <div className="pt-4 border-t border-white/5 text-xs text-jarvis-text-secondary">
                  更新于 {formatDate(kb.updated_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 创建对话框 */}
      {showCreateDialog && (
        <CreateKnowledgeBaseDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false);
            loadKnowledgeBases();
          }}
        />
      )}
    </div>
  );
}

// 创建知识库对话框组件
function CreateKnowledgeBaseDialog({
  onClose,
  onSuccess
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('请输入知识库名称');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await knowledgeBaseApi.createKnowledgeBase({
        name: name.trim(),
        description: description.trim()
      });
      onSuccess();
    } catch (err) {
      setError('创建失败，请稍后重试');
      console.error('Failed to create knowledge base:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* 对话框 */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-jarvis-panel border border-jarvis-gold/30 rounded-xl shadow-2xl shadow-jarvis-gold/20 w-full max-w-md">
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <h2 className="text-xl font-orbitron text-jarvis-gold">创建知识库</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-jarvis-gold/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-jarvis-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-jarvis-danger/10 border border-jarvis-danger/30 text-jarvis-danger px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-jarvis-text mb-2">
                名称 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：产品文档库"
                className="input w-full"
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-jarvis-text mb-2">
                描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简要描述这个知识库的用途..."
                className="textarea w-full h-24"
                disabled={loading}
              />
            </div>

            {/* 按钮 */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost flex-1"
                disabled={loading}
              >
                取消
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={loading}
              >
                {loading ? '创建中...' : '创建'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
