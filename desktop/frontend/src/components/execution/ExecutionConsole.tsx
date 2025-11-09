import React from 'react';
import type { ExecutionLog, IExecutionRun } from '@/types';
import { Status } from '@/types';

interface ExecutionConsoleProps {
  run: IExecutionRun | null;
  logs: ExecutionLog[];
  onAction: (action: 'pause' | 'resume' | 'cancel') => void;
}

const statusColor: Record<Status, string> = {
  [Status.Pending]: '#6B7A99',
  [Status.Running]: '#00D9FF',
  [Status.Completed]: '#00F5A0',
  [Status.Failed]: '#FF6B35',
  [Status.Cancelled]: '#6B7A99',
  [Status.Paused]: '#FFB800',
};

const ExecutionConsole: React.FC<ExecutionConsoleProps> = ({ run, logs, onAction }) => {
  if (!run) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-[#6B7A99]">
        选择一个执行记录以查看详情
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[#FFB800]">执行详情</p>
          <h3 className="text-white">{run.workflowName}</h3>
          <p className="text-xs text-[#6B7A99]">触发：{run.trigger}</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-2" style={{ color: statusColor[run.status] }}>
            <span className="h-2 w-2 rounded-full" style={{ background: statusColor[run.status] }} />
            {run.status}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 text-sm text-[#A8B2D1] lg:grid-cols-2">
        <div>
          <p>开始时间</p>
          <p className="text-white">{new Date(run.startedAt).toLocaleString()}</p>
        </div>
        <div>
          <p>结束时间</p>
          <p className="text-white">{run.finishedAt ? new Date(run.finishedAt).toLocaleString() : '--'}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs text-[#6B7A99]">进度 {Math.round((run.progress ?? 0) * 100)}%</p>
        <div className="mt-1 h-2 rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-[#00D9FF] to-[#FFB800]" style={{ width: `${(run.progress ?? 0) * 100}%` }} />
        </div>
        {run.currentNode && <p className="text-xs text-[#6B7A99] mt-1">当前节点：{run.currentNode}</p>}
      </div>

      <div className="mt-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[#FFB800]">实时日志</p>
        <div className="mt-3 max-h-80 overflow-y-auto rounded-2xl border border-white/10 bg-[#050714]/60 p-4 text-sm text-[#A8B2D1]">
          {logs.length === 0 && <p className="text-[#6B7A99]">暂无日志</p>}
          {logs.map((log) => (
            <div key={`${log.runId}-${log.timestamp}-${log.nodeId}`} className="border-b border-white/5 py-2 last:border-none">
              <p className="text-xs text-[#6B7A99]">{new Date(log.timestamp).toLocaleTimeString()} · 节点 {log.nodeId}</p>
              <p className="text-white">{log.message}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-3 text-xs">
        <button className="rounded-lg border border-white/10 px-4 py-2" onClick={() => onAction('pause')}>
          暂停
        </button>
        <button className="rounded-lg border border-white/10 px-4 py-2" onClick={() => onAction('resume')}>
          恢复
        </button>
        <button className="rounded-lg border border-[#FF6B35]/40 bg-[#FF6B35]/10 px-4 py-2 text-[#FF6B35]" onClick={() => onAction('cancel')}>
          终止
        </button>
      </div>
    </div>
  );
};

export default ExecutionConsole;
