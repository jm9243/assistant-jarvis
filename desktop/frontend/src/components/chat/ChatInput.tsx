import { useState, useRef, KeyboardEvent, DragEvent } from 'react';

interface Attachment {
  id: string;
  type: 'image' | 'file';
  name: string;
  url?: string;
  path?: string;
  file?: File;
}

interface ChatInputProps {
  onSend: (content: string, attachments: any[]) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!content.trim() && attachments.length === 0) return;
    if (disabled) return;

    // 准备附件数据
    const attachmentData = attachments.map(att => ({
      type: att.type,
      name: att.name,
      url: att.url,
      path: att.path
    }));

    onSend(content.trim(), attachmentData);
    
    // 清空输入
    setContent('');
    setAttachments([]);
    
    // 重置textarea高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + Enter 发送
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
    // Enter 发送（Shift + Enter 换行）
    else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    
    // 自动调整高度
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newAttachments: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith('image/');

      // 创建预览URL
      const url = isImage ? URL.createObjectURL(file) : undefined;

      newAttachments.push({
        id: `${Date.now()}-${i}`,
        type: isImage ? 'image' : 'file',
        name: file.name,
        url,
        file
      });
    }

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => {
      const attachment = prev.find(a => a.id === id);
      // 释放URL对象
      if (attachment?.url) {
        URL.revokeObjectURL(attachment.url);
      }
      return prev.filter(a => a.id !== id);
    });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  return (
    <div
      className={`relative rounded-xl border-2 transition-all ${
        isDragging
          ? 'border-jarvis-gold bg-jarvis-gold/10'
          : 'border-jarvis-gold/20 bg-jarvis-panel/60'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 拖拽提示 */}
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-jarvis-gold/20 rounded-xl z-10 pointer-events-none">
          <div className="text-jarvis-gold font-medium">
            释放以上传文件
          </div>
        </div>
      )}

      {/* 附件预览 */}
      {attachments.length > 0 && (
        <div className="p-3 border-b border-jarvis-gold/20">
          <div className="flex flex-wrap gap-2">
            {attachments.map(attachment => (
              <div
                key={attachment.id}
                className="relative group"
              >
                {attachment.type === 'image' ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-jarvis-gold/30">
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      className="absolute top-1 right-1 p-1 bg-jarvis-danger/80 hover:bg-jarvis-danger rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-jarvis-panel/80 border border-jarvis-gold/30 rounded-lg group-hover:border-jarvis-gold/50 transition-colors">
                    <svg className="w-4 h-4 text-jarvis-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm text-jarvis-text truncate max-w-[120px]">
                      {attachment.name}
                    </span>
                    <button
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      className="p-0.5 hover:bg-jarvis-danger/20 rounded transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 text-jarvis-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <div className="flex items-end gap-2 p-3">
        {/* 附件按钮 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex-shrink-0 p-2 hover:bg-jarvis-gold/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="上传文件"
        >
          <svg className="w-5 h-5 text-jarvis-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        {/* 文本输入 */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? '正在生成回复...' : '输入消息... (Enter发送，Shift+Enter换行)'}
          className="flex-1 bg-transparent text-jarvis-text placeholder:text-jarvis-text-secondary outline-none resize-none min-h-[40px] max-h-[200px] disabled:cursor-not-allowed"
          rows={1}
        />

        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          disabled={disabled || (!content.trim() && attachments.length === 0)}
          className="flex-shrink-0 p-2 bg-gradient-to-br from-jarvis-gold to-jarvis-gold-dark text-white rounded-lg hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          title="发送 (Cmd/Ctrl + Enter)"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt,.md"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* 提示文本 */}
      <div className="px-3 pb-2 text-xs text-jarvis-text-secondary">
        支持拖拽上传图片和文件
      </div>
    </div>
  );
}
