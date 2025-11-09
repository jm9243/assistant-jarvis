import React, { useEffect, useMemo, useState } from 'react';
import { useExecutionStore } from '@/stores/executionStore';
import ExecutionConsole from '@/components/execution/ExecutionConsole';
import { Status } from '@/types';
import GlassPanel from '@/components/common/GlassPanel';

const ExecutionCenter: React.FC = () => {
  const {
    runs,
    logs,
    selectedRunId,
    selectRun,
    hydrate,
    pauseRun,
    resumeRun,
    cancelRun,
    templates,
    loadTemplates,
    saveTemplate,
  } = useExecutionStore();
  const selectedRun = runs.find((run) => run.id === selectedRunId) ?? runs[0] ?? null;
  const [templateForm, setTemplateForm] = useState({ name: '', params: '{}' });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!selectedRun) return;
    const workflowKey = (selectedRun as unknown as { workflowId?: string; workflow_id?: string }).workflowId
      ?? (selectedRun as unknown as { workflowId?: string; workflow_id?: string }).workflow_id;
    if (workflowKey) {
      loadTemplates(workflowKey);
    }
  }, [selectedRun, loadTemplates]);

  const workflowKey = useMemo(() => {
    if (!selectedRun) return null;
    const runAny = selectedRun as unknown as { workflowId?: string; workflow_id?: string };
    return runAny.workflowId ?? runAny.workflow_id ?? null;
  }, [selectedRun]);

  const activeTemplates = workflowKey ? templates[workflowKey] ?? [] : [];

  return (
    <div className="flex h-full flex-col bg-[#050714] text-white">
      <header className="flex items-center justify-between border-b border-white/5 bg-[#050714]/80 px-6 py-3 text-sm text-[#A8B2D1]">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[#FFB800]">Execution Center</p>
          <h2 className="text-lg text-white">工作流执行 & 任务管理</h2>
          <p className="text-xs text-[#6B7A99]">实时查看执行状态、队列与日志</p>
        </div>
        <div className="flex gap-2">
          {[Status.Pending, Status.Running, Status.Failed].map((status) => (
            <span key={status} className="rounded-full border border-white/10 px-3 py-1 text-xs">
              {status}
            </span>
          ))}
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-[#FFB800]">任务队列</p>
            <ul className="mt-3 space-y-2 text-sm text-[#A8B2D1]">
              {runs.length === 0 && <li className="text-[#6B7A99]">暂无执行记录</li>}
              {runs.map((run) => (
                <li key={run.id}>
                  <button
                    type="button"
                    onClick={() => selectRun(run.id)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      run.id === selectedRun?.id
                        ? 'border-[#FFB800]/60 bg-[#FFB800]/10'
                        : 'border-white/10 bg-[#050714]/40 hover:border-[#FFB800]/40'
                    }`}
                  >
                    <p className="text-white">{run.workflowName}</p>
                    <p className="text-xs text-[#6B7A99]">状态：{run.status}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/5 p-5 text-xs text-[#6B7A99]">
            <p className="text-[#FFB800]">触发器</p>
            <p className="mt-2 text-white">Slack 通知 · 每日 09:00</p>
            <p className="mt-1">Studio 会根据触发器自动执行，并推送到执行中心。</p>
          </div>
        </div>
        <div className="lg:col-span-2">
          <ExecutionConsole
            run={selectedRun}
            logs={logs.filter((log) => !selectedRun || log.runId === selectedRun.id)}
            onAction={(action) => {
              if (!selectedRun) return;
              if (action === 'pause') pauseRun(selectedRun.id);
              if (action === 'resume') resumeRun(selectedRun.id);
              if (action === 'cancel') cancelRun(selectedRun.id);
            }}
          />
          {workflowKey && (
            <GlassPanel className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-[#FFB800]">参数模板</p>
                <div className="flex gap-2 text-xs">
                  <input
                    className="rounded-xl border border-white/10 bg-[#050714] px-2 py-1 text-white"
                    placeholder="模板名称"
                    value={templateForm.name}
                    onChange={(event) => setTemplateForm((prev) => ({ ...prev, name: event.target.value }))}
                  />
                  <input
                    className="rounded-xl border border-white/10 bg-[#050714] px-2 py-1 text-white"
                    placeholder='{"变量": "值"}'
                    value={templateForm.params}
                    onChange={(event) => setTemplateForm((prev) => ({ ...prev, params: event.target.value }))}
                  />
                  <button
                    type="button"
                    className="rounded-xl border border-white/10 px-3 py-1 text-white"
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(templateForm.params || '{}');
                        saveTemplate(workflowKey, { name: templateForm.name || '模板', params: parsed });
                        setTemplateForm({ name: '', params: '{}' });
                      } catch (error) {
                        console.warn('模板JSON解析失败', error);
                      }
                    }}
                  >
                    保存
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-white">
                {activeTemplates.map((template) => (
                  <span key={template.id} className="rounded-full border border-white/10 px-3 py-1">
                    {template.name}
                  </span>
                ))}
                {activeTemplates.length === 0 && <span className="text-[#6B7A99]">暂无模板</span>}
              </div>
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutionCenter;
