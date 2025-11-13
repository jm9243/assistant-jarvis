import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { useAgentStore } from '@/stores/agentStore';
import { SSEClient } from '@/services/sseClient';
import { Button } from '@/components/ui';
import { pythonEngine } from '@/services/python';
import { backend } from '@/services/backend';

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

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    // 从localStorage恢复会话列表
    const saved = localStorage.getItem(`conversations_${agentId}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    // 从localStorage恢复当前会话ID
    return localStorage.getItem(`current_conversation_${agentId}`);
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    // 从localStorage恢复消息
    const saved = localStorage.getItem(`messages_${currentConversationId}`);
    return saved ? JSON.parse(saved) : [];
  });
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
      // 保存当前会话ID
      localStorage.setItem(`current_conversation_${agentId}`, currentConversationId);
    }
  }, [currentConversationId]);

  const loadConversations = async () => {
    setIsLoadingConversations(true);
    try {
      // 使用Go后台API获取会话列表（云端同步）
      const data = await backend.getConversations(agentId!);
      setConversations(data || []);

      // 保存到localStorage
      localStorage.setItem(`conversations_${agentId}`, JSON.stringify(data || []));

      // 如果有会话，自动选择第一个
      if (data && data.length > 0 && !currentConversationId) {
        setCurrentConversationId(data[0].id);
        localStorage.setItem(`current_conversation_${agentId}`, data[0].id);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      // 如果加载失败，使用localStorage中的数据
      const saved = localStorage.getItem(`conversations_${agentId}`);
      if (saved) {
        setConversations(JSON.parse(saved));
      }
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      // 使用Python引擎获取对话历史
      const messages = await pythonEngine.getConversationHistory(conversationId);
      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        created_at: msg.timestamp
      }));
      setMessages(formattedMessages);

      // 保存到localStorage
      localStorage.setItem(`messages_${conversationId}`, JSON.stringify(formattedMessages));
    } catch (error) {
      console.error('Failed to load messages:', error);
      // 如果加载失败，使用localStorage中的数据
      const saved = localStorage.getItem(`messages_${conversationId}`);
      if (saved) {
        setMessages(JSON.parse(saved));
      }
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      // 使用Python引擎创建新会话
      const conversation = await pythonEngine.createConversation(agentId!);
      await loadConversations();
      setCurrentConversationId(conversation.conversation_id);
      localStorage.setItem(`current_conversation_${agentId}`, conversation.conversation_id);
      setMessages([]);
      localStorage.removeItem(`messages_${conversation.conversation_id}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('确定要删除这个会话吗？')) return;

    try {
      // 使用Go后台API删除会话（云端同步）
      await backend.deleteConversation(conversationId);

      // 清理localStorage
      localStorage.removeItem(`messages_${conversationId}`);

      // 如果删除的是当前会话，清空选择
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        localStorage.removeItem(`current_conversation_${agentId}`);
        setMessages([]);
      }

      await loadConversations();
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

    try {
      // 使用Python引擎进行对话（非流式）
      const response = await pythonEngine.agentChat(
        currentConversationId,
        content,
        false // 暂时使用非流式，后续可以实现流式支持
      );

      // 更新助手消息
      assistantMessage.content = response.message;
      assistantMessage.id = `msg-${Date.now()}`;
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { ...assistantMessage };

        // 保存到localStorage
        localStorage.setItem(`messages_${currentConversationId}`, JSON.stringify(newMessages));

        return newMessages;
      });

      // 刷新会话列表（更新时间）
      loadConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
      assistantMessage.content = '抱歉，发送消息失败。请稍后重试。';
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { ...assistantMessage };
        return newMessages;
      });
    } finally {
      setIsStreaming(false);
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
      // 使用Go后台API导出会话
      const data = await backend.exportConversation(currentConversationId);

      // 创建下载链接
      const blob = new Blob([JSON.stringify(data, null, 2)], {
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
      // 使用Go后台API重命名会话
      await backend.updateConversation(conversationId, { title: newTitle });
      await loadConversations();
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
