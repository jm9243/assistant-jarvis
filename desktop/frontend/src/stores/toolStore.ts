import { create } from 'zustand';
import type { IToolDefinition, IToolApproval, IToolAudit, IGovernanceKpi } from '@/types';
import { toolsAPI } from '@/services/api';

const SAMPLE_TOOLS: IToolDefinition[] = [
  {
    id: 'tool-order-status',
    name: '查询订单状态',
    type: 'workflow',
    description: '自动查询订单的状态、物流与预计送达时间',
    tags: ['workflow', 'commerce'],
    enabled: true,
    approval_required: false,
    metadata: { calls: 328 },
  },
  {
    id: 'tool-finance-digest',
    name: '财务日报生成器',
    type: 'mcp',
    description: '聚合 ERP 数据并生成财务摘要，供管理层审阅',
    tags: ['finance'],
    enabled: true,
    approval_required: true,
    metadata: { calls: 126 },
  },
  {
    id: 'tool-slack-broadcast',
    name: 'Slack 广播助手',
    type: 'http',
    description: '向指定频道推送公告，支持模板与变量渲染',
    tags: ['notification'],
    enabled: false,
    approval_required: false,
    metadata: { calls: 58 },
  },
];

const SAMPLE_APPROVALS: IToolApproval[] = [
  {
    id: 'approval-1',
    tool_id: 'tool-finance-digest',
    reason: 'AI助手请求生成财务日报',
    status: 'pending',
    requested_by: 'finance-agent',
  },
];

const SAMPLE_AUDITS: IToolAudit[] = [
  {
    id: 'audit-1',
    tool_id: 'tool-order-status',
    triggered_by: 'ops-bot',
    duration_ms: 340,
    status: 'success',
    created_at: new Date().toISOString(),
  },
  {
    id: 'audit-2',
    tool_id: 'tool-slack-broadcast',
    triggered_by: 'alert-service',
    duration_ms: 1200,
    status: 'failed',
    created_at: new Date().toISOString(),
  },
];

const SAMPLE_KPI: IGovernanceKpi = {
  calls: 512,
  success_rate: 0.94,
  avg_duration: 420,
};

interface ToolState {
  tools: IToolDefinition[];
  approvals: IToolApproval[];
  audits: IToolAudit[];
  kpi: IGovernanceKpi | null;
  loading: boolean;
  hydrate: () => Promise<void>;
  registerTool: (payload: Record<string, unknown>) => Promise<void>;
}

export const useToolStore = create<ToolState>((set) => ({
  tools: [],
  approvals: [],
  audits: [],
  kpi: null,
  loading: false,
  async hydrate() {
    set({ loading: true });
    const [toolRes, approvalRes, auditRes, kpiRes] = await Promise.all([
      toolsAPI.list(),
      toolsAPI.approvals(),
      toolsAPI.audits(),
      toolsAPI.kpi(),
    ]);
    set({
      tools: toolRes.success && toolRes.data ? (toolRes.data as IToolDefinition[]) : SAMPLE_TOOLS,
      approvals: approvalRes.success && approvalRes.data ? (approvalRes.data as IToolApproval[]) : SAMPLE_APPROVALS,
      audits: auditRes.success && auditRes.data ? (auditRes.data as IToolAudit[]) : SAMPLE_AUDITS,
      kpi: kpiRes.success && kpiRes.data ? (kpiRes.data as IGovernanceKpi) : SAMPLE_KPI,
      loading: false,
    });
  },
  async registerTool(payload) {
    const response = await toolsAPI.create(payload);
    if (response.success && response.data) {
      set((state) => ({ tools: [...state.tools, response.data as IToolDefinition] }));
    } else {
      set((state) => ({
        tools: [
          ...state.tools,
          {
            id: `tool-local-${Date.now()}`,
            name: String(payload.name ?? '新工具'),
            type: String(payload.type ?? 'custom'),
            description: String(payload.description ?? '未填写描述'),
            tags: [],
            enabled: true,
            approval_required: Boolean(payload.approval_required),
            metadata: { calls: 0 },
          },
        ],
      }));
    }
  },
}));
