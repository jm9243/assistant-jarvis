import React, { useEffect, useMemo, useState } from 'react';
import SectionHeader from '@/components/common/SectionHeader';
import GlassPanel from '@/components/common/GlassPanel';
import { useKnowledgeStore } from '@/stores/knowledgeStore';

const KnowledgeHubPage: React.FC = () => {
  const {
    bases,
    documents,
    results,
    hydrate,
    loadDocuments,
    uploadDocument,
    search,
  } = useKnowledgeStore();
  const [selectedBaseId, setSelectedBaseId] = useState<string | null>(null);
  const [docForm, setDocForm] = useState({ name: '', content: '' });
  const [query, setQuery] = useState('');

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (bases.length && !selectedBaseId) {
      const first = bases[0].id;
      setSelectedBaseId(first);
      loadDocuments(first);
    }
  }, [bases, selectedBaseId, loadDocuments]);

  const activeDocuments = useMemo(() => {
    if (!selectedBaseId) return [];
    return documents[selectedBaseId] ?? [];
  }, [documents, selectedBaseId]);

  const handleUpload = async () => {
    if (!selectedBaseId || !docForm.name.trim() || !docForm.content.trim()) return;
    await uploadDocument(selectedBaseId, docForm);
    setDocForm({ name: '', content: '' });
  };

  const handleSearch = async () => {
    if (!bases.length || !query.trim()) return;
    await search({ baseIds: bases.map((base) => base.id), query });
  };

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Knowledge" title="知识库与记忆中心" description="维护文档、检索结果并观察统计" />

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassPanel>
          <p className="text-sm text-[#A8B2D1]">知识库列表</p>
          <ul className="mt-4 space-y-2 text-sm text-white">
            {bases.map((base) => (
              <li key={base.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBaseId(base.id);
                    loadDocuments(base.id);
                  }}
                  className={`w-full rounded-xl border px-4 py-3 text-left ${
                    base.id === selectedBaseId ? 'border-[#FFB800]/60 bg-[#FFB800]/10' : 'border-white/10 bg-[#050714]/40'
                  }`}
                >
                  <p>{base.name}</p>
                  <p className="text-xs text-[#6B7A99]">文档 {base.stats.documents} · 查询 {base.stats.queries}</p>
                </button>
              </li>
            ))}
          </ul>
        </GlassPanel>

        <GlassPanel className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#A8B2D1]">文档 · {activeDocuments.length}</p>
            <div className="flex gap-2 text-xs text-[#6B7A99]">
              <input
                className="rounded-xl border border-white/10 bg-[#050714] px-3 py-2 text-white"
                placeholder="标题"
                value={docForm.name}
                onChange={(event) => setDocForm((prev) => ({ ...prev, name: event.target.value }))}
              />
              <input
                className="rounded-xl border border-white/10 bg-[#050714] px-3 py-2 text-white"
                placeholder="内容"
                value={docForm.content}
                onChange={(event) => setDocForm((prev) => ({ ...prev, content: event.target.value }))}
              />
              <button type="button" className="rounded-xl border border-white/10 px-3 py-2 text-white" onClick={handleUpload}>
                上传
              </button>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {activeDocuments.map((doc) => (
              <div key={doc.id} className="rounded-xl border border-white/10 bg-[#050714]/50 px-4 py-3 text-sm text-white">
                <p className="font-semibold">{doc.name}</p>
                <p className="text-xs text-[#6B7A99] mt-1">状态：{doc.status}</p>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      <GlassPanel>
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#A8B2D1]">RAG 检索</p>
          <div className="flex gap-2">
            <input
              className="rounded-xl border border-white/10 bg-[#050714] px-3 py-2 text-sm text-white"
              placeholder="请输入查询..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button
              type="button"
              className="rounded-xl bg-gradient-to-r from-[#FFB800] to-[#FF8A00] px-4 py-2 text-sm font-semibold text-[#050714]"
              onClick={handleSearch}
            >
              检索
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {results.map((result) => (
            <div key={result.chunk_id} className="rounded-xl border border-white/10 bg-[#050714]/60 px-4 py-3 text-sm text-white">
              <p className="text-xs text-[#6B7A99]">Score {result.score}</p>
              <p className="mt-1">{result.content}</p>
            </div>
          ))}
          {results.length === 0 && <p className="text-xs text-[#6B7A99]">暂无检索结果</p>}
        </div>
      </GlassPanel>
    </div>
  );
};

export default KnowledgeHubPage;
