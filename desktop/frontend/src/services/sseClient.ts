/**
 * SSE (Server-Sent Events) 客户端
 * 用于处理流式响应
 */

export interface SSEMessage {
  type: 'start' | 'token' | 'done' | 'error';
  content?: string;
  message?: string;
}

export interface SSEClientOptions {
  onMessage?: (message: SSEMessage) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export class SSEClient {
  private abortController: AbortController | null = null;
  private isStreaming = false;

  /**
   * 发送流式请求
   */
  async stream(
    url: string,
    options: RequestInit & SSEClientOptions
  ): Promise<void> {
    const { onMessage, onError, onComplete, ...fetchOptions } = options;

    // 创建新的 AbortController
    this.abortController = new AbortController();
    this.isStreaming = true;

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (this.isStreaming) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // 解码数据块
        buffer += decoder.decode(value, { stream: true });

        // 按行分割
        const lines = buffer.split('\n');
        
        // 保留最后一个不完整的行
        buffer = lines.pop() || '';

        // 处理每一行
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              onMessage?.(data);
            } catch (e) {
              console.warn('Failed to parse SSE message:', line, e);
            }
          }
        }
      }

      onComplete?.();
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('Stream aborted by user');
        } else {
          console.error('Stream error:', error);
          onError?.(error);
        }
      }
    } finally {
      this.isStreaming = false;
      this.abortController = null;
    }
  }

  /**
   * 停止流式传输
   */
  stop(): void {
    if (this.abortController && this.isStreaming) {
      this.abortController.abort();
      this.isStreaming = false;
    }
  }

  /**
   * 检查是否正在流式传输
   */
  get streaming(): boolean {
    return this.isStreaming;
  }
}

/**
 * 创建 SSE 客户端实例
 */
export function createSSEClient(): SSEClient {
  return new SSEClient();
}
