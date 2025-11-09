import React from 'react';
import type { RecorderMode } from '@/services/recorder';
import type { RecorderStatus } from '@/types';

interface RecorderOverlayProps {
  visible: boolean;
  status: RecorderStatus;
  mode: RecorderMode;
  hoveredElement?: string;
}

const statusColor: Record<RecorderStatus, string> = {
  idle: '#6B7A99',
  recording: '#FF4D4F',
  paused: '#FFB800',
  processing: '#00D9FF',
  error: '#FF004D',
};

const RecorderOverlay: React.FC<RecorderOverlayProps> = ({ visible, status, mode, hoveredElement }) => {
  if (!visible) return null;
  return (
    <div className="fixed left-1/2 top-4 z-20 -translate-x-1/2 rounded-2xl border border-white/10 bg-[#050714]/90 px-6 py-3 shadow-xl backdrop-blur">
      <div className="flex items-center gap-4 text-sm text-white">
        <span className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[#6B7A99]">
          RECORDER · {mode === 'auto' ? '自动模式' : '手动模式'}
        </span>
        <span className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: statusColor[status] }} />
          {status === 'recording' && '录制中'}
          {status === 'paused' && '已暂停'}
          {status === 'processing' && '处理中'}
          {status === 'error' && '异常'}
          {status === 'idle' && '待机'}
        </span>
        {hoveredElement && (
          <span className="text-xs text-[#A8B2D1]">元素：{hoveredElement}</span>
        )}
      </div>
    </div>
  );
};

export default RecorderOverlay;
