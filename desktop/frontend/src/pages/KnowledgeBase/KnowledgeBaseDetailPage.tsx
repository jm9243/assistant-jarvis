import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DocumentUpload } from '@/components/knowledge-base/DocumentUpload';
import { Button } from '@/components/ui';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  chunk_count: number;
  created_at: string;
  error_message?: string;
}

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  document_count: number;
  total_size: number;
  created_at: string;
  updated_at: string;
}

export default function KnowledgeBaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);

  useEffect(() => {
    if (id) {
      loadKnowledgeBase();
      loadDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadKnowledgeBase = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/knowledge-bases/${id}`);
      const data = await response.json();
      
      if (data.code === 0) {
        setKnowledgeBase(data.data);
      } else {
        setError(data.message || '加载失败');
      }
    } catch (err) {
      setError('网络错误');
      console.error('Failed to load knowledge base:', err);
    }
  };

  const loadDocuments = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/knowledge-bases/${id}/documents`);
      const data = await response.json();
      
      if (data.code === 0) {
        setDocuments(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('确定要删除这个文档吗？')) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/knowledge-bases/${id}/documents/${docId}`,
        { method: 'DELETE' }
      );
      
      const data = await response.json();
      
      if (data.code === 0) {
        await loadDocuments();
        await loadKnowledgeBase();
      } else {
        alert(data.message || '删除失败');
      }
    } catch (err) {
      alert('删除失败');
      console.error('Failed to delete document:', err);
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
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-jarvis-success bg-jarvis-success/20 border-jarvis-success/30';
      case 'processing':
        return 'text-jarvis-info bg-jarvis-info/20 border-jarvis-info/30';
      case 'failed':
        return 'text-jarvis-danger bg-jarvis-danger/20 border-jarvis-danger/30';
      default:
        return 'text-jarvis-text-secondary bg-jarvis-panel/60 border-white/10';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'processing':
        return '处理中';
      case 'failed':
        return '失败';
      default:
        return '等待中';
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) {
      return (
        <svg className="w-6 h-6 text-jarvis-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else if (type.includes('word') || type.includes('doc')) {
      return (
        <svg className="w-6 h-6 text-jarvis-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-6 h-6 text-jarvis-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
  };

  if (error) {
    return (
      <div className="jarvis-page">
        <div className="jarvis-content">
          <div className="jarvis-error">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!knowledgeBase) {
    return (
      <div className="jarvis-empty">
        <div className="jarvis-loading"></div>
      </div>
    );
  }

  return (
    <div className="jarvis-page">
      {/* 头部 */}
      <div className="jarvis-header">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/dashboard/knowledge-bases')}
            variant="ghost"
            size="sm"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            }
          />
          
          <div>
            <h1 className="text-xl font-bold text-jarvis-text">{knowledgeBase.name}</h1>
            <p className="text-sm text-jarvis-text-secondary mt-1">
              {knowledgeBase.description || '暂无描述'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-4 text-sm mr-4">
            <div className="flex items-center gap-2">
              <span className="text-jarvis-text-secondary">文档:</span>
              <span className="text-jarvis-gold font-medium">{knowledgeBase.document_count || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-jarvis-text-secondary">大小:</span>
              <span className="text-jarvis-text">{formatSize(knowledgeBase.total_size || 0)}</span>
            </div>
          </div>

          <Button
            onClick={() => setShowSearchDialog(true)}
            variant="secondary"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          >
            测试检索
          </Button>
          
          <Button
            onClick={() => setShowUploadDialog(true)}
            variant="primary"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            }
          >
            上传文档
          </Button>
        </div>
      </div>

      <div className="jarvis-content jarvis-scrollbar space-y-6">
        {/* 文档列表 */}
        <div className="jarvis-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-jarvis-text">文档列表</h2>
            <span className="text-sm text-jarvis-text-secondary">
              共 {documents.length} 个文档
            </span>
          </div>

          {loading ? (
            <div className="jarvis-empty">
              <div className="jarvis-loading"></div>
              <p className="mt-4">加载中...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="jarvis-empty">
              <svg className="w-16 h-16 mb-4 text-jarvis-text-secondary opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg mb-4">暂无文档</p>
              <Button
                onClick={() => setShowUploadDialog(true)}
                variant="primary"
              >
                上传第一个文档
              </Button>
            </div>
          ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 p-4 bg-jarvis-panel/40 hover:bg-jarvis-panel/60 border border-white/5 rounded-lg transition-colors group"
              >
                {/* 文件图标 */}
                <div className="flex-shrink-0">
                  {getFileIcon(doc.type)}
                </div>

                {/* 文件信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-jarvis-text truncate">
                      {doc.name}
                    </h3>
                    <span className={`px-2 py-0.5 text-xs rounded border ${getStatusColor(doc.status)}`}>
                      {getStatusText(doc.status)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-jarvis-text-secondary">
                    <span>{formatSize(doc.size)}</span>
                    {doc.status === 'completed' && (
                      <span>{doc.chunk_count} 个片段</span>
                    )}
                    <span>{formatDate(doc.created_at)}</span>
                  </div>

                  {doc.status === 'failed' && doc.error_message && (
                    <p className="text-xs text-jarvis-danger mt-1">{doc.error_message}</p>
                  )}
                </div>

                {/* 操作按钮 */}
                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg transition-all"
                  title="删除文档"
                >
                  <svg className="w-4 h-4 text-jarvis-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>

      {/* 上传对话框 */}
      {showUploadDialog && (
        <DocumentUpload
          knowledgeBaseId={id!}
          onClose={() => setShowUploadDialog(false)}
          onSuccess={() => {
            setShowUploadDialog(false);
            loadDocuments();
            loadKnowledgeBase();
          }}
        />
      )}

      {/* 检索测试对话框 */}
      {showSearchDialog && (
        <SearchTestDialog
          knowledgeBaseId={id!}
          onClose={() => setShowSearchDialog(false)}
        />
      )}
    </div>
  );
}

// 检索测试对话框
function SearchTestDialog({
  knowledgeBaseId,
  onClose
}: {
  knowledgeBaseId: string;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTime, setSearchTime] = useState(0);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    const startTime = Date.now();

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/knowledge-bases/${knowledgeBaseId}/search`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: query.trim(),
            top_k: 5
          })
        }
      );

      const data = await response.json();
      const endTime = Date.now();
      
      setSearchTime(endTime - startTime);

      if (data.code === 0) {
        setResults(data.data || []);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-jarvis-panel border border-jarvis-gold/30 rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <h2 className="text-xl font-orbitron text-jarvis-gold">检索测试</h2>
            <button onClick={onClose} className="p-2 hover:bg-jarvis-gold/10 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-jarvis-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 搜索框 */}
          <div className="p-6 border-b border-white/5">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="输入查询内容..."
                className="input flex-1"
                autoFocus
              />
              <button
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                className="btn-primary"
              >
                {loading ? '搜索中...' : '搜索'}
              </button>
            </div>
            
            {searchTime > 0 && (
              <p className="text-xs text-jarvis-text-secondary mt-2">
                搜索耗时: {searchTime}ms
              </p>
            )}
          </div>

          {/* 结果列表 */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            {results.length === 0 ? (
              <div className="text-center py-12 text-jarvis-text-secondary">
                {loading ? '搜索中...' : '输入查询内容开始搜索'}
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="bg-jarvis-panel/40 border border-white/5 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-medium text-jarvis-gold">
                        {result.document_name}
                      </h3>
                      <span className="text-xs text-jarvis-text-secondary">
                        相似度: {(result.similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-jarvis-text leading-relaxed">
                      {result.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
