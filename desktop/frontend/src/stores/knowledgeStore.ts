import { create } from 'zustand';
import type { IKnowledgeBase, IKnowledgeDocument, IRetrievalResult } from '@/types';
import { knowledgeAPI } from '@/services/api';

interface KnowledgeState {
  bases: IKnowledgeBase[];
  documents: Record<string, IKnowledgeDocument[]>;
  results: IRetrievalResult[];
  loading: boolean;
  hydrate: () => Promise<void>;
  loadDocuments: (baseId: string) => Promise<void>;
  uploadDocument: (baseId: string, payload: { name: string; content: string; mime?: string }) => Promise<void>;
  search: (payload: { baseIds: string[]; query: string }) => Promise<void>;
}

export const useKnowledgeStore = create<KnowledgeState>((set) => ({
  bases: [],
  documents: {},
  results: [],
  loading: false,
  async hydrate() {
    set({ loading: true });
    const response = await knowledgeAPI.bases();
    if (response.success && response.data) {
      set({ bases: response.data as IKnowledgeBase[], loading: false });
    } else {
      set({ loading: false });
    }
  },
  async uploadDocument(baseId, payload) {
    const response = await knowledgeAPI.uploadDocument(baseId, payload);
    if (response.success && response.data) {
      set((state) => ({
        documents: {
          ...state.documents,
          [baseId]: [response.data as IKnowledgeDocument, ...(state.documents[baseId] ?? [])],
        },
      }));
    }
  },
  async loadDocuments(baseId) {
    const response = await knowledgeAPI.documents(baseId);
    if (response.success && response.data) {
      set((state) => ({
        documents: {
          ...state.documents,
          [baseId]: response.data as IKnowledgeDocument[],
        },
      }));
    }
  },
  async search(payload) {
    const response = await knowledgeAPI.search({ base_ids: payload.baseIds, query: payload.query });
    if (response.success && response.data) {
      set({ results: response.data as IRetrievalResult[] });
    }
  },
}));
