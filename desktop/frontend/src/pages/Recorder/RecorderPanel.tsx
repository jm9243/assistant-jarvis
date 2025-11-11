import { useState, useEffect } from 'react';
import { useRecorderStore } from '@/stores/recorderStore';
import { wsService } from '@/services/websocket';

export function RecorderPanel() {
  const {
    isRecording,
    isPaused,
    steps,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    addStep,
    clearSteps
  } = useRecorderStore();

  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused]);

  useEffect(() => {
    const unsubscribe = wsService.on('recorder_event', (data) => {
      if (data.type === 'step_captured') {
        addStep(data.step);
      }
    });

    return unsubscribe;
  }, [addStep]);

  const handleStart = async () => {
    try {
      setError(null);
      await startRecording(mode);
      setDuration(0);
      clearSteps();
    } catch (err) {
      setError(err instanceof Error ? err.message : '启动录制失败');
    }
  };

  const handleStop = async () => {
    try {
      setError(null);
      await stopRecording();
    } catch (err) {
      setError(err instanceof Error ? err.message : '停止录制失败');
    }
  };

  const handlePause = async () => {
    try {
      setError(null);
      await pauseRecording();
    } catch (err) {
      setError(err instanceof Error ? err.message : '暂停录制失败');
    }
  };

  const handleResume = async () => {
    try {
      setError(null);
      await resumeRecording();
    } catch (err) {
      setError(err instanceof Error ? err.message : '恢复录制失败');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="jarvis-page">
      <div className="jarvis-header">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-jarvis-text">🎬 智能录制器</h1>
          {isRecording && (
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-jarvis-warning' : 'bg-jarvis-danger animate-pulse'}`} />
              <span className="text-sm text-jarvis-text-secondary">
                {isPaused ? '已暂停' : '录制中'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {isRecording && (
            <span className="text-lg font-mono text-jarvis-gold">{formatDuration(duration)}</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        <div className="w-96 bg-jarvis-panel/30 border-r border-white/5 p-6 space-y-6">
          {!isRecording && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-jarvis-text">录制模式</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 p-3 bg-jarvis-panel border border-white/10 rounded-lg cursor-pointer hover:border-jarvis-primary/50 transition-colors">
                  <input
                    type="radio"
                    name="mode"
                    value="auto"
                    checked={mode === 'auto'}
                    onChange={(e) => setMode(e.target.value as 'auto')}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="text-sm font-medium text-jarvis-text">自动模式</div>
                    <div className="text-xs text-jarvis-text-secondary">自动捕获所有操作</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-jarvis-panel border border-white/10 rounded-lg cursor-pointer hover:border-jarvis-primary/50 transition-colors">
                  <input
                    type="radio"
                    name="mode"
                    value="manual"
                    checked={mode === 'manual'}
                    onChange={(e) => setMode(e.target.value as 'manual')}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="text-sm font-medium text-jarvis-text">手动模式</div>
                    <div className="text-xs text-jarvis-text-secondary">手动选择要录制的操作</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {!isRecording ? (
              <button
                onClick={handleStart}
                className="w-full px-6 py-4 bg-jarvis-primary hover:bg-jarvis-primary/80 text-jarvis-space font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span className="text-xl">⏺</span>
                <span>开始录制</span>
              </button>
            ) : (
              <>
                {!isPaused ? (
                  <button
                    onClick={handlePause}
                    className="w-full px-6 py-4 bg-jarvis-warning hover:bg-jarvis-warning/80 text-jarvis-space font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <span className="text-xl">⏸</span>
                    <span>暂停录制</span>
                  </button>
                ) : (
                  <button
                    onClick={handleResume}
                    className="w-full px-6 py-4 bg-jarvis-success hover:bg-jarvis-success/80 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <span className="text-xl">▶️</span>
                    <span>继续录制</span>
                  </button>
                )}

                <button
                  onClick={handleStop}
                  className="w-full px-6 py-4 bg-jarvis-danger hover:bg-jarvis-danger/80 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <span className="text-xl">⏹</span>
                  <span>停止录制</span>
                </button>
              </>
            )}
          </div>

          {error && (
            <div className="p-4 bg-jarvis-danger/10 border border-jarvis-danger/50 rounded-lg">
              <div className="text-sm text-jarvis-danger">{error}</div>
            </div>
          )}

          <div className="p-4 bg-jarvis-panel/50 border border-white/5 rounded-lg space-y-2">
            <div className="text-sm font-medium text-jarvis-text">📖 使用说明</div>
            <ul className="text-xs text-jarvis-text-secondary space-y-1">
              <li>• 点击"开始录制"后进行操作</li>
              <li>• 系统会自动捕获鼠标和键盘操作</li>
              <li>• 可以随时暂停和恢复录制</li>
              <li>• 点击"停止录制"生成工作流节点</li>
            </ul>
          </div>

          <div className="p-4 bg-jarvis-panel/50 border border-white/5 rounded-lg space-y-2">
            <div className="text-sm font-medium text-jarvis-text">⌨️ 快捷键</div>
            <div className="text-xs text-jarvis-text-secondary space-y-1">
              <div className="flex justify-between">
                <span>开始/停止</span>
                <span className="font-mono">Ctrl+R</span>
              </div>
              <div className="flex justify-between">
                <span>暂停/继续</span>
                <span className="font-mono">Ctrl+P</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="h-full bg-jarvis-panel/30 border border-white/5 rounded-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-jarvis-text">
                  录制步骤 ({steps.length})
                </h2>
                {steps.length > 0 && (
                  <button
                    onClick={clearSteps}
                    className="text-sm text-jarvis-text-secondary hover:text-jarvis-text"
                  >
                    清空
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {steps.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-jarvis-text-secondary">
                    <div className="text-4xl mb-2">📝</div>
                    <div className="text-sm">暂无录制步骤</div>
                    <div className="text-xs mt-1">开始录制后，操作将显示在这里</div>
                  </div>
                </div>
              ) : (
                steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="p-3 bg-jarvis-panel border border-white/10 rounded-lg hover:border-jarvis-primary/50 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-jarvis-primary/20 text-jarvis-primary rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-jarvis-text">
                          {step.action}
                        </div>
                        <div className="text-xs text-jarvis-text-secondary mt-1">
                          {step.type} • {new Date(step.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
