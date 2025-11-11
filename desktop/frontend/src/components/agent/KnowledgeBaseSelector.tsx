/**
 * 知识库绑定选择器组件
 */
import React, { useEffect, useState } from "react";
import { knowledgeBaseApi } from "../../services/agentApi";
import type { KnowledgeBase } from "../../types/agent";

interface KnowledgeBaseSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export const KnowledgeBaseSelector: React.FC<KnowledgeBaseSelectorProps> = ({
  selectedIds,
  onChange,
}) => {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  const loadKnowledgeBases = async () => {
    try {
      setLoading(true);
      const data = await knowledgeBaseApi.listKnowledgeBases();
      setKnowledgeBases(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "加载知识库失败");
    } finally {
      setLoading(false);
    }
  };

  const toggleKnowledgeBase = (kbId: string) => {
    if (selectedIds.includes(kbId)) {
      onChange(selectedIds.filter((id) => id !== kbId));
    } else {
      onChange([...selectedIds, kbId]);
    }
  };

  const filteredKnowledgeBases = knowledgeBases.filter(
    (kb) =>
      kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kb.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-jarvis-text-secondary">加载知识库...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
        <button
          onClick={loadKnowledgeBases}
          className="ml-4 text-sm underline hover:no-underline"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          选择要绑定到此Agent的知识库。Agent将能够从这些知识库中检索信息来回答问题。
        </p>
      </div>

      {/* 搜索框 */}
      {knowledgeBases.length > 0 && (
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索知识库..."
            className="w-full px-4 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-jarvis-primary"
          />
        </div>
      )}

      {/* 知识库列表 */}
      {filteredKnowledgeBases.length === 0 ? (
        <div className="text-center py-8 bg-jarvis-panel/40 rounded-lg">
          <p className="text-jarvis-text-secondary">
            {searchQuery ? "未找到匹配的知识库" : "暂无知识库"}
          </p>
          {!searchQuery && (
            <button
              onClick={() => window.open("/knowledge-bases/create", "_blank")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              创建知识库
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredKnowledgeBases.map((kb) => {
            const isSelected = selectedIds.includes(kb.id);

            return (
              <div
                key={kb.id}
                onClick={() => toggleKnowledgeBase(kb.id)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-white/10 bg-jarvis-panel hover:border-white/10"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {kb.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-jarvis-text">
                          {kb.name}
                        </h4>
                        <p className="text-sm text-jarvis-text-secondary">
                          {kb.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-jarvis-text-secondary ml-13">
                      <span>📄 {kb.document_count} 个文档</span>
                      <span>🔢 {kb.vector_count} 个向量</span>
                      <span className="text-xs bg-jarvis-panel/60 px-2 py-1 rounded">
                        {kb.embedding_model}
                      </span>
                    </div>
                  </div>

                  {/* 选中标记 */}
                  <div className="ml-4">
                    {isSelected ? (
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border-2 border-white/10 rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 已选择统计 */}
      {selectedIds.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800">
            已选择 {selectedIds.length} 个知识库
          </p>
        </div>
      )}
    </div>
  );
};
