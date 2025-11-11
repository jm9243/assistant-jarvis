import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { useAgentStore } from '@/stores/agentStore';
import { createSSEClient, SSEClient } from '@/services/sseClient';
import { Button } from '@/components/ui';

interface Conversation {
  id: string;
  agent_id: string;
  title: string;
  updated_at: string;
  message_count: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  metadata?: any;
}

export default function ChatPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const { agents, fetchAgents } = useAgentStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);

  const currentAgent = agents.find(a => a.id === agentId);
  const sseClientRef = useRef<SSEClient | null>(null);

  // 加载会话列表
  useEffect(() => {
    if (!agentId) return;

    loadConversations();

    // 如果没有agents，加载一下
    if (agents.length === 0) {
      fetchAgents();
    }
  }, [agentId]);

  // 加载消息
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    }

  }, [currentConversationId]);

  const loadConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/conversations?agent_id=${agentId}`);
      const data = await response.json();

      if (data.code === 0) {
        setConversations(data.data || []);

        // 如果有会话，自动选择第一个
        if (data.data && data.data.length > 0 && !currentConversationId) {
          setCurrentConversationId(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/conversations/${conversationId}/messages`);
      const data = await response.json();

      if (data.code === 0) {
        setMessages(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          title: '新对话'
        })
      });

      const data = await response.json();

      if (data.code === 0) {
        await loadConversations();
        setCurrentConversationId(data.data.id);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('确定要删除这个会话吗？')) return;

    try {
      const response = await fetch(`http://localhost:8000/api/v1/conversations/${conversationId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.code === 0) {
        // 如果删除的是当前会话，清空选择
        if (currentConversationId === conversationId) {
          setCurrentConversationId(null);
          setMessages([]);
        }

        await loadConversations();
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleSendMessage = async (content: string, attachments: any[]) => {
    if (!currentConversationId) {
      // 如果没有当前会话，先创建一个
      await handleNewConversation();
      // 等待会话创建完成后再发送
      setTimeout(() => handleSendMessage(content, attachments), 500);
      return;
    }

    // 添加用户消息到UI
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
      metadata: { attachments }
    };

    setMessages(prev => [...prev, userMessage]);

    // 创建助手消息占位符
    const assistantMessage: Message = {
      id: `temp-assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsStreaming(true);

    // 创建SSE客户端
    const sseClient = createSSEClient();
    sseClientRef.current = sseClient;

    try {
      await sseClient.stream(
        `http://localhost:8000/api/v1/conversations/${currentConversationId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            attachments,
            stream: true
          }),
          onMessage: (data) => {
            if (data.type === 'token' && data.content) {
              // 实时更新消息内容（打字机效果）
              assistantMessage.content += data.content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { ...assistantMessage };
                return newMessages;
              });
            } else if (data.type === 'done' && data.content) {
              // 完成时设置最终内容
              assistantMessage.content = data.content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { ...assistantMessage };
                return newMessages;
              });
            } else if (data.type === 'error') {
              console.error('Stream error:', data.message);
              assistantMessage.content = `抱歉，发生错误：${data.message}`;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { ...assistantMessage };
                return newMessages;
              });
            }
          },
          onError: (error) => {
            console.error('Failed to send message:', error);
            assistantMessage.content = '抱歉，发送消息失败。请稍后重试。';
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = { ...assistantMessage };
              return newMessages;
            });
          },
          onComplete: () => {
            setIsStreaming(false);
            sseClientRef.current = null;
            // 刷新会话列表（更新时间）
            loadConversations();
          }
        }
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsStreaming(false);
      sseClientRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (sseClientRef.current) {
      sseClientRef.current.stop();
      setIsStreaming(false);
      sseClientRef.current = null;
    }
  };

  const handleExportConversation = async () => {
    if (!currentConversationId) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/conversations/${currentConversationId}/export?format=json`
      );
      const data = await response.json();

      if (data.code === 0) {
        // 创建下载链接
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversation-${currentConversationId}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export conversation:', error);
      alert('导出失败，请稍后重试');
    }
  };

  const handleRenameConversation = async (conversationId: string) => {
    const currentConv = conversations.find(c => c.id === conversationId);
    if (!currentConv) return;

    const newTitle = prompt('请输入新的会话标题:', currentConv.title);
    if (!newTitle || newTitle === currentConv.title) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/conversations/${conversationId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle })
        }
      );

      const data = await response.json();

      if (data.code === 0) {
        await loadConversations();
      }
    } catch (error) {
      console.error('Failed to rename conversation:', error);
      alert('重命名失败，请稍后重试');
    }
  };

  if (!agentId) {
    return (
      <div className="jarvis-empty">
        <div className="text-4xl mb-4">🤖</div>
        <div className="text-jarvis-text-secondary">请选择一个Agent</div>
      </div>
    );
  }

  return (
    <div className="jarvis-page flex-row">
      {/* 左侧会话列表 */}
      <div
        className={`${isSidebarOpen ? 'w-80' : 'w-0'
          } transition-all duration-300 border-r border-white/5 bg-jarvis-panel/40 flex flex-col overflow-hidden`}
      >
        {/* 头部 */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-orbitron text-jarvis-gold">会话列表</h2>
            <Button
              onClick={handleNewConversation}
              variant="ghost"
              size="sm"
              title="新建会话"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            />
          </div>

          {currentAgent && (
            <div className="flex items-center gap-2 text-sm text-jarvis-text-secondary">
              <div className="w-8 h-8 rounded-full bg-jarvis-gold/20 flex items-center justify-center">
                {currentAgent.avatar_url ? (
                  <img src={currentAgent.avatar_url} alt="" className="w-full h-full rounded-full" />
                ) : (
                  <span className="text-jarvis-gold font-bold">{currentAgent.name[0]}</span>
                )}
              </div>
              <span>{currentAgent.name}</span>
            </div>
          )}
        </div>

        {/* 会话列表 */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {isLoadingConversations ? (
            <div className="jarvis-empty">
              <div className="jarvis-loading"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="jarvis-empty">
              <div className="text-4xl mb-4">💬</div>
              <p className="text-sm">暂无会话</p>
              <p className="text-xs mt-2">点击右上角 + 创建新会话</p>
            </div>
          ) : (
            <div className="p-2">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`p-3 mb-2 rounded-lg cursor-pointer transition-all group ${currentConversationId === conv.id
                    ? 'bg-jarvis-gold/20 border border-jarvis-gold/30'
                    : 'hover:bg-jarvis-panel/60 border border-transparent'
                    }`}
                  onClick={() => setCurrentConversationId(conv.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-jarvis-text font-medium truncate">
                        {conv.title}
                      </div>
                      <div className="text-xs text-jarvis-text-secondary mt-1">
                        {conv.message_count || 0} 条消息
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                      title="删除会话"
                    >
                      <svg className="w-4 h-4 text-jarvis-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 右侧对话区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部工具栏 */}
        <div className="h-16 border-b border-white/5 bg-jarvis-panel/40 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-jarvis-gold/10 rounded-lg transition-colors"
              title={isSidebarOpen ? '隐藏侧边栏' : '显示侧边栏'}
            >
              <svg className="w-5 h-5 text-jarvis-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {currentConversationId && (
              <div className="text-jarvis-text font-medium">
                {conversations.find(c => c.id === currentConversationId)?.title || '对话'}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentConversationId && (
              <>
                <button
                  onClick={handleExportConversation}
                  className="px-3 py-1.5 text-sm text-jarvis-gold hover:bg-jarvis-gold/10 rounded-lg transition-colors flex items-center gap-1"
                  title="导出会话"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  导出
                </button>
                <button
                  onClick={() => handleRenameConversation(currentConversationId)}
                  className="p-2 hover:bg-jarvis-gold/10 rounded-lg transition-colors"
                  title="重命名会话"
                >
                  <svg className="w-4 h-4 text-jarvis-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {!currentConversationId ? (
            <div className="flex flex-col items-center justify-center h-full text-jarvis-text-secondary">
              <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-lg mb-2">开始新对话</p>
              <p className="text-sm">选择或创建一个会话开始聊天</p>
            </div>
          ) : isLoadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message, index) => (
                <MessageBubble key={message.id || index} message={message} />
              ))}
            </div>
          )}
        </div>

        {/* 输入区域 */}
        {currentConversationId && (
          <div className="border-t border-white/5 bg-jarvis-panel/40 p-4">
            <div className="max-w-4xl mx-auto">
              {isStreaming && (
                <div className="mb-3 flex items-center justify-center">
                  <button
                    onClick={handleStopStreaming}
                    className="px-4 py-2 bg-jarvis-danger/20 hover:bg-jarvis-danger/30 border border-jarvis-danger/50 text-jarvis-danger rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                    停止生成
                  </button>
                </div>
              )}
              <ChatInput onSend={handleSendMessage} disabled={isStreaming} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
