import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CitationList } from './CitationMarker';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  metadata?: any;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [isCopied, setIsCopied] = useState(false);
  
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // 小于1分钟
    if (diff < 60000) {
      return '刚刚';
    }
    
    // 小于1小时
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    }
    
    // 小于24小时
    if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    }
    
    // 显示具体时间
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="px-4 py-2 bg-jarvis-panel/60 border border-jarvis-gold/20 rounded-lg text-sm text-jarvis-text-secondary">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* 头像 */}
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-gradient-to-br from-jarvis-gold to-jarvis-gold-dark' 
              : 'bg-jarvis-panel border border-jarvis-gold/30'
          }`}>
            {isUser ? (
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-jarvis-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            )}
          </div>
        </div>

        {/* 消息内容 */}
        <div className="flex-1 min-w-0">
          <div className={`rounded-2xl p-4 ${
            isUser
              ? 'bg-gradient-to-br from-jarvis-gold/20 to-jarvis-gold-dark/20 border border-jarvis-gold/30'
              : 'bg-jarvis-panel/80 border border-white/10'
          }`}>
            {/* 附件预览 */}
            {message.metadata?.attachments && message.metadata.attachments.length > 0 && (
              <div className="mb-3 space-y-2">
                {message.metadata.attachments.map((attachment: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-jarvis-text-secondary">
                    {attachment.type === 'image' ? (
                      <div className="rounded-lg overflow-hidden border border-white/10">
                        <img 
                          src={attachment.url} 
                          alt="attachment" 
                          className="max-w-xs max-h-48 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 bg-jarvis-panel/60 rounded-lg">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>{attachment.name || '文件'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 文本内容 */}
            <div className={`prose prose-invert max-w-none ${
              isUser ? 'prose-p:text-jarvis-text' : 'prose-p:text-jarvis-text'
            }`}>
              {isUser ? (
                // 用户消息直接显示
                <div className="whitespace-pre-wrap break-words text-jarvis-text">
                  {message.content}
                </div>
              ) : (
                // AI消息使用Markdown渲染
                <ReactMarkdown
                  components={{
                    code({ className, children, ...props }: any) {
                      const inline = !className;
                      const match = /language-(\w+)/.exec(className || '');
                      const codeString = String(children).replace(/\n$/, '');
                      
                      return !inline && match ? (
                        <div className="relative group/code">
                          <div className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleCopy(codeString)}
                              className="px-2 py-1 bg-jarvis-panel/80 hover:bg-jarvis-gold/20 border border-jarvis-gold/30 rounded text-xs text-jarvis-gold transition-colors"
                            >
                              {isCopied ? '已复制' : '复制'}
                            </button>
                          </div>
                          <SyntaxHighlighter
                            style={vscDarkPlus as any}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{
                              margin: 0,
                              borderRadius: '0.5rem',
                              background: 'rgba(15, 23, 42, 0.8)',
                              border: '1px solid rgba(255, 184, 0, 0.1)',
                            } as any}
                            {...props}
                          >
                            {codeString}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <code 
                          className="px-1.5 py-0.5 bg-jarvis-panel/60 border border-jarvis-gold/20 rounded text-jarvis-gold text-sm"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    p({ children }) {
                      return <p className="mb-2 last:mb-0 text-jarvis-text leading-relaxed">{children}</p>;
                    },
                    ul({ children }) {
                      return <ul className="list-disc list-inside mb-2 space-y-1 text-jarvis-text">{children}</ul>;
                    },
                    ol({ children }) {
                      return <ol className="list-decimal list-inside mb-2 space-y-1 text-jarvis-text">{children}</ol>;
                    },
                    li({ children }) {
                      return <li className="text-jarvis-text">{children}</li>;
                    },
                    a({ href, children }) {
                      return (
                        <a 
                          href={href} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-jarvis-gold hover:text-jarvis-gold-dark underline"
                        >
                          {children}
                        </a>
                      );
                    },
                    blockquote({ children }) {
                      return (
                        <blockquote className="border-l-4 border-jarvis-gold/50 pl-4 my-2 text-jarvis-text-secondary italic">
                          {children}
                        </blockquote>
                      );
                    },
                    h1({ children }) {
                      return <h1 className="text-2xl font-orbitron text-jarvis-gold mb-3 mt-4">{children}</h1>;
                    },
                    h2({ children }) {
                      return <h2 className="text-xl font-orbitron text-jarvis-gold mb-2 mt-3">{children}</h2>;
                    },
                    h3({ children }) {
                      return <h3 className="text-lg font-orbitron text-jarvis-gold mb-2 mt-2">{children}</h3>;
                    },
                    table({ children }) {
                      return (
                        <div className="overflow-x-auto my-4">
                          <table className="min-w-full border border-jarvis-gold/20 rounded-lg">
                            {children}
                          </table>
                        </div>
                      );
                    },
                    thead({ children }) {
                      return <thead className="bg-jarvis-panel/60">{children}</thead>;
                    },
                    tbody({ children }) {
                      return <tbody className="divide-y divide-jarvis-gold/10">{children}</tbody>;
                    },
                    tr({ children }) {
                      return <tr className="hover:bg-jarvis-panel/40 transition-colors">{children}</tr>;
                    },
                    th({ children }) {
                      return (
                        <th className="px-4 py-2 text-left text-sm font-semibold text-jarvis-gold border-b border-jarvis-gold/20">
                          {children}
                        </th>
                      );
                    },
                    td({ children }) {
                      return <td className="px-4 py-2 text-sm text-jarvis-text">{children}</td>;
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>

            {/* 引用列表 */}
            {!isUser && message.metadata?.citations && (
              <CitationList citations={message.metadata.citations} />
            )}
          </div>

          {/* 时间戳和操作 */}
          <div className={`flex items-center gap-2 mt-1 px-2 ${
            isUser ? 'justify-end' : 'justify-start'
          }`}>
            <span className="text-xs text-jarvis-text-secondary">
              {formatTime(message.created_at)}
            </span>
            
            {!isUser && (
              <button
                onClick={() => handleCopy(message.content)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-jarvis-gold/10 rounded transition-all"
                title="复制消息"
              >
                <svg className="w-3.5 h-3.5 text-jarvis-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
