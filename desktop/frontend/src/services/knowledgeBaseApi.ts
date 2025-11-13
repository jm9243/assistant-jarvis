/**
 * 知识库 API 服务
 * 使用 Tauri IPC 与 Python 引擎通信
 */
import { invoke } from '@tauri-apps/api/core';

export interface KnowledgeBase {
    id: string;
    name: string;
    description: string;
    document_count: number;
    total_size: number;
    created_at: string;
    updated_at: string;
}

export interface Document {
    id: string;
    kb_id: string;
    name: string;
    type: string;
    size: number;
    chunks_count: number;
    created_at: string;
}

export interface CreateKnowledgeBaseRequest {
    name: string;
    description: string;
    embedding_model?: string;
    chunk_size?: number;
    chunk_overlap?: number;
}

/**
 * 知识库 API 服务类
 */
class KnowledgeBaseApiService {
    /**
     * 获取知识库列表
     */
    async listKnowledgeBases(): Promise<KnowledgeBase[]> {
        try {
            const result = await invoke<any>('list_knowledge_bases', { userId: null });
            if (result.success) {
                return result.knowledge_bases || [];
            }
            throw new Error(result.error || 'Failed to list knowledge bases');
        } catch (error) {
            console.error('Failed to list knowledge bases:', error);
            throw error;
        }
    }

    /**
     * 获取知识库详情
     */
    async getKnowledgeBase(kbId: string): Promise<KnowledgeBase> {
        try {
            const result = await invoke<any>('get_knowledge_base', { kbId });
            if (result.success) {
                return result.knowledge_base;
            }
            throw new Error(result.error || 'Failed to get knowledge base');
        } catch (error) {
            console.error('Failed to get knowledge base:', error);
            throw error;
        }
    }

    /**
     * 创建知识库
     */
    async createKnowledgeBase(data: CreateKnowledgeBaseRequest): Promise<KnowledgeBase> {
        try {
            const result = await invoke<any>('create_knowledge_base', {
                name: data.name,
                description: data.description,
                embeddingModel: data.embedding_model,
                chunkSize: data.chunk_size,
                chunkOverlap: data.chunk_overlap,
                userId: null,
            });
            if (result.success) {
                return result.knowledge_base;
            }
            throw new Error(result.error || 'Failed to create knowledge base');
        } catch (error) {
            console.error('Failed to create knowledge base:', error);
            throw error;
        }
    }

    /**
     * 更新知识库
     */
    async updateKnowledgeBase(
        kbId: string,
        data: { name?: string; description?: string }
    ): Promise<KnowledgeBase> {
        try {
            const result = await invoke<any>('update_knowledge_base', {
                kbId,
                name: data.name,
                description: data.description,
            });
            if (result.success) {
                return result.knowledge_base;
            }
            throw new Error(result.error || 'Failed to update knowledge base');
        } catch (error) {
            console.error('Failed to update knowledge base:', error);
            throw error;
        }
    }

    /**
     * 删除知识库
     */
    async deleteKnowledgeBase(kbId: string): Promise<void> {
        try {
            const result = await invoke<any>('delete_knowledge_base', { kbId });
            if (!result.success) {
                throw new Error(result.error || 'Failed to delete knowledge base');
            }
        } catch (error) {
            console.error('Failed to delete knowledge base:', error);
            throw error;
        }
    }

    /**
     * 搜索知识库
     */
    async search(kbId: string, query: string, topK: number = 5): Promise<any> {
        const result = await invoke<any>('kb_search', { kbId, query, topK });
        if (result.success) {
            return result;
        }
        throw new Error(result.error || 'Search failed');
    }

    /**
     * 添加文档到知识库
     */
    async addDocument(kbId: string, filePath: string): Promise<any> {
        const result = await invoke<any>('kb_add_document', { kbId, filePath });
        if (result.success) {
            return result;
        }
        throw new Error(result.error || 'Add document failed');
    }

    /**
     * 删除文档
     */
    async deleteDocument(kbId: string, docId: string): Promise<void> {
        const result = await invoke<any>('kb_delete_document', { kbId, docId });
        if (!result.success) {
            throw new Error(result.error || 'Delete document failed');
        }
    }

    /**
     * 获取知识库统计信息
     */
    async getStats(kbId: string): Promise<any> {
        const result = await invoke<any>('kb_get_stats', { kbId });
        if (result.success) {
            return result.stats;
        }
        throw new Error(result.error || 'Get stats failed');
    }

    /**
     * 获取文档列表
     */
    async listDocuments(kbId: string): Promise<Document[]> {
        try {
            const result = await invoke<any>('list_documents', { kbId });
            if (result.success) {
                return result.documents || [];
            }
            throw new Error(result.error || 'Failed to list documents');
        } catch (error) {
            console.error('Failed to list documents:', error);
            throw error;
        }
    }
}

export const knowledgeBaseApi = new KnowledgeBaseApiService();
export default knowledgeBaseApi;
