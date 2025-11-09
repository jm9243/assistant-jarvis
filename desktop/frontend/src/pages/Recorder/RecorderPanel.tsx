import React, { useEffect } from 'react';
import RecorderOverlay from '@/components/recorder/Overlay';
import { useRecorderStore } from '@/stores/recorderStore';

const RecorderPanel: React.FC = () => {
  const {
    status,
    mode,
    steps,
    overlayVisible,
    hoveredElement,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    setOverlayVisible,
    hydrate,
  } = useRecorderStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="relative flex h-full flex-col bg-[#050714] text-white">
      <RecorderOverlay visible={overlayVisible} status={status} mode={mode} hoveredElement={hoveredElement} />
      <header className="flex items-center justify-between border-b border-white/5 bg-[#050714]/80 px-6 py-3 text-sm text-[#A8B2D1]">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-[#FFB800]">Recorder</p>
          <h2 className="text-lg text-white">智能录制器</h2>
        </div>
        <label className="flex items-center gap-2 text-xs text-[#6B7A99]">
          <input
            type="checkbox"
            checked={overlayVisible}
            onChange={(event) => setOverlayVisible(event.target.checked)}
            className="h-4 w-4 rounded border border-white/20 bg-transparent accent-[#FFB800]"
          />
          显示悬浮提示
        </label>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/5 bg-white/5 p-5 text-sm text-[#A8B2D1]">
          <p className="text-xs uppercase tracking-[0.3em] text-[#FFB800]">快捷键</p>
          <ul className="mt-3 space-y-2">
            <li>⌘ + Shift + R · 开始/停止</li>
            <li>⌘ + Shift + P · 暂停/继续</li>
            <li>⌘ + Shift + H · 显示/隐藏高亮</li>
          </ul>
          <p className="mt-6 text-xs text-[#6B7A99]">模式</p>
          <div className="mt-2 rounded-xl border border-white/10 bg-[#050714]/60 px-4 py-3 text-white">
            当前：{mode === 'auto' ? '全自动' : '手动'}
          </div>
          <p className="mt-6 text-xs text-[#6B7A99]">定位策略优先级</p>
          <div className="mt-2 space-y-2 text-xs">
            {['AXUI', 'OCR', 'Image', 'Position'].map((item, index) => (
              <div key={item} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2">
                <span>{index + 1}. {item}</span>
                <span className="text-[#FFB800]">启用</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[#FFB800]">录制控制</p>
          <div className="mt-4 flex flex-col gap-3">
            <button
              type="button"
              className="rounded-xl bg-gradient-to-r from-[#FFB800] to-[#FF8A00] px-4 py-3 text-sm font-semibold text-[#050714] disabled:opacity-50"
              disabled={status === 'recording'}
              onClick={() => startRecording('auto')}
            >
              {status === 'recording' ? '录制进行中' : '开始录制'}
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-white disabled:opacity-40"
                onClick={pauseRecording}
                disabled={status !== 'recording'}
              >
                暂停
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-white disabled:opacity-40"
                onClick={resumeRecording}
                disabled={status !== 'paused'}
              >
                恢复
              </button>
            </div>
            <button
              type="button"
              className="rounded-xl border border-[#FF6B35]/40 bg-[#FF6B35]/10 px-4 py-3 text-sm text-[#FF6B35] disabled:opacity-40"
              onClick={stopRecording}
              disabled={status === 'idle'}
            >
              停止并生成节点
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-[#FFB800]">录制步骤</p>
            <span className="text-xs text-[#6B7A99]">{steps.length} 步</span>
          </div>
          <ul className="mt-4 max-h-[320px] space-y-2 overflow-y-auto pr-2 text-sm text-[#A8B2D1]">
            {steps.length === 0 && <li className="text-[#6B7A99]">等待录制...</li>}
            {steps.map((step) => (
              <li key={step.id} className="rounded-xl border border-white/10 bg-[#050714]/40 px-4 py-3">
                <p className="text-white">{step.action}</p>
                <p className="text-xs text-[#6B7A99]">{step.target}</p>
                <p className="text-[10px] text-[#6B7A99]">{new Date(step.created_at).toLocaleTimeString()}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RecorderPanel;
