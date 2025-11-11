/**
 * 贾维斯全局搜索框组件
 * Spotlight风格的悬浮窗，支持快捷键唤出
 */
import { useState, useEffect, useRef, KeyboardEvent } from 'react';

interface JarvisSearchBoxProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (query: string) => void;
  isProcessing?: boolean;
}

export const JarvisSearchBox = ({
  isOpen,
  onClose,
  onSubmit,
  isProcessing = false,
}: JarvisSearchBoxProps) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 当打开时自动聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // 处理键盘事件
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && query.trim() && !isProcessing) {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (query.trim() && !isProcessing) {
      onSubmit(query.trim());
      setQuery('');
    }
  };

  // 点击背景关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm pt-32"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-2xl mx-4 bg-jarvis-panel dark:bg-jarvis-panel rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
        {/* 搜索框头部 */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10 dark:border-white/5">
          <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="告诉贾维斯你想做什么..."
            className="flex-1 bg-transparent text-lg outline-none placeholder:text-jarvis-text-secondary dark:placeholder:text-jarvis-text-secondary"
            disabled={isProcessing}
          />
          {isProcessing && (
            <svg className="w-5 h-5 text-purple-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-jarvis-panel/60 dark:hover:bg-jarvis-panel/80 rounded-lg transition-colors"
            disabled={isProcessing}
          >
            <svg className="w-5 h-5 text-jarvis-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 提示信息 */}
        <div className="px-6 py-4 bg-jarvis-panel/40 dark:bg-jarvis-space/50">
          <div className="flex items-center gap-2 text-sm text-jarvis-text-secondary dark:text-jarvis-text-secondary">
            <kbd className="px-2 py-1 bg-jarvis-panel dark:bg-jarvis-panel border border-white/10 dark:border-white/20 rounded text-xs">
              Enter
            </kbd>
            <span>执行任务</span>
            <span className="mx-2">·</span>
            <kbd className="px-2 py-1 bg-jarvis-panel dark:bg-jarvis-panel border border-white/10 dark:border-white/20 rounded text-xs">
              Esc
            </kbd>
            <span>关闭</span>
          </div>
        </div>

        {/* 示例任务 */}
        {!query && (
          <div className="px-6 py-4 space-y-2">
            <p className="text-sm font-medium text-jarvis-text dark:text-jarvis-text mb-3">
              试试这些：
            </p>
            {[
              '帮我创建一个新的工作流',
              '查找关于API的文档',
              '总结最近的对话记录',
              '分析系统性能数据',
            ].map((example, index) => (
              <button
                key={index}
                onClick={() => setQuery(example)}
                className="block w-full text-left px-4 py-2 text-sm text-jarvis-text-secondary dark:text-jarvis-text-secondary hover:bg-jarvis-panel/60 dark:hover:bg-jarvis-panel/80 rounded-lg transition-colors"
                disabled={isProcessing}
              >
                {example}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
