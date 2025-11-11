import { useState } from 'react';

interface Citation {
  id: string;
  document_name: string;
  content: string;
  similarity: number;
  metadata?: any;
}

interface CitationMarkerProps {
  citations: Citation[];
  index: number;
}

export function CitationMarker({ citations, index }: CitationMarkerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const citation = citations[index];

  if (!citation) return null;

  return (
    <span className="relative inline-block">
      {/* 引用标记 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-jarvis-gold bg-jarvis-gold/20 border border-jarvis-gold/50 rounded hover:bg-jarvis-gold/30 transition-colors mx-0.5"
        title="查看引用来源"
      >
        {index + 1}
      </button>

      {/* 引用详情弹窗 */}
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* 弹窗内容 */}
          <div className="absolute bottom-full left-0 mb-2 z-50 w-80 max-w-[90vw]">
            <div className="bg-jarvis-panel border border-jarvis-gold/30 rounded-lg shadow-xl shadow-jarvis-gold/10 p-4">
              {/* 头部 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="text-sm font-medium text-jarvis-gold mb-1">
                    {citation.document_name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-jarvis-text-secondary">
                    <span>相似度:</span>
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-1.5 bg-jarvis-panel/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-jarvis-gold to-jarvis-gold-dark rounded-full"
                          style={{ width: `${citation.similarity * 100}%` }}
                        />
                      </div>
                      <span>{(citation.similarity * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-jarvis-gold/10 rounded transition-colors"
                >
                  <svg className="w-4 h-4 text-jarvis-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 内容 */}
              <div className="text-sm text-jarvis-text bg-jarvis-panel/40 rounded-lg p-3 mb-3 max-h-40 overflow-y-auto scrollbar-thin">
                {citation.content}
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // TODO: 跳转到知识库文档
                    alert('跳转到知识库功能开发中');
                  }}
                  className="flex-1 px-3 py-1.5 text-xs text-jarvis-gold hover:bg-jarvis-gold/10 border border-jarvis-gold/30 rounded transition-colors"
                >
                  查看完整文档
                </button>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(citation.content);
                      alert('已复制到剪贴板');
                    } catch (error) {
                      console.error('Failed to copy:', error);
                    }
                  }}
                  className="p-1.5 hover:bg-jarvis-gold/10 rounded transition-colors"
                  title="复制内容"
                >
                  <svg className="w-4 h-4 text-jarvis-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 箭头 */}
            <div className="absolute top-full left-4 -mt-px">
              <div className="w-3 h-3 bg-jarvis-panel border-b border-r border-jarvis-gold/30 transform rotate-45" />
            </div>
          </div>
        </>
      )}
    </span>
  );
}

/**
 * 引用列表组件
 * 显示消息底部的所有引用
 */
interface CitationListProps {
  citations: Citation[];
}

export function CitationList({ citations }: CitationListProps) {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-jarvis-gold/20">
      <div className="text-xs text-jarvis-text-secondary mb-2">引用来源:</div>
      <div className="space-y-1.5">
        {citations.map((citation, index) => (
          <div
            key={citation.id}
            className="flex items-start gap-2 text-xs"
          >
            <span className="flex-shrink-0 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-jarvis-gold bg-jarvis-gold/20 border border-jarvis-gold/50 rounded">
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-jarvis-gold truncate">
                {citation.document_name}
              </div>
              <div className="text-jarvis-text-secondary line-clamp-2">
                {citation.content}
              </div>
            </div>
            <div className="flex-shrink-0 text-jarvis-text-secondary">
              {(citation.similarity * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
