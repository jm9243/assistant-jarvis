import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecorderStore } from '@/stores/recorderStore';
import { cn } from '@/utils/cn';

export function RecorderPage() {
  const navigate = useNavigate();
  const {
    isRecording,
    isPaused,
    steps,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  } = useRecorderStore();

  const [selectedMode, setSelectedMode] = useState<'auto' | 'manual'>('auto');
  const [recordingTime, setRecordingTime] = useState(0);

  // 录制计时器
  useEffect(() => {
    if (!isRecording || isPaused) return;

    const interval = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    setRecordingTime(0);
    await startRecording(selectedMode);
  };

  const handleStop = async () => {
    const result = await stopRecording();
    if (result) {
      // 导航到工作流设计器并导入节点
      navigate('/dashboard/workflows');
    }
  };

  const handlePause = async () => {
    if (isPaused) {
      await resumeRecording();
    } else {
      await pauseRecording();
    }
  };

  if (!isRecording) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="max-w-2xl w-full p-8">
          <div className="card">
            {/* 标题 */}
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎙️</div>
              <h1 className="text-3xl font-orbitron font-bold text-jarvis-text mb-2">
                智能录制器
              </h1>
              <p className="text-jarvis-text-secondary">
                录制您的操作，自动生成工作流
              </p>
            </div>

            {/* 录制模式选择 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-jarvis-text mb-3">
                录制模式
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedMode('auto')}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-all text-left',
                    selectedMode === 'auto'
                      ? 'border-jarvis-gold bg-jarvis-gold/10'
                      : 'border-white/10 bg-jarvis-panel-light hover:border-jarvis-gold/50'
                  )}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">🤖</span>
                    <span className="font-medium text-jarvis-text">全自动录制</span>
                  </div>
                  <p className="text-xs text-jarvis-text-secondary">
                    自动识别操作并生成节点（推荐）
                  </p>
                </button>

                <button
                  onClick={() => setSelectedMode('manual')}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-all text-left',
                    selectedMode === 'manual'
                      ? 'border-jarvis-gold bg-jarvis-gold/10'
                      : 'border-white/10 bg-jarvis-panel-light hover:border-jarvis-gold/50'
                  )}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">✋</span>
                    <span className="font-medium text-jarvis-text">手动录制</span>
                  </div>
                  <p className="text-xs text-jarvis-text-secondary">
                    手动选择要录制的操作（精确控制）
                  </p>
                </button>
              </div>
            </div>

            {/* 选项 */}
            <div className="space-y-3 mb-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-jarvis-gold/20 bg-jarvis-panel/60 text-jarvis-gold"
                />
                <span className="text-sm text-jarvis-text">录制前检查权限</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-jarvis-gold/20 bg-jarvis-panel/60 text-jarvis-gold"
                />
                <span className="text-sm text-jarvis-text">自动优化定位策略</span>
              </label>
            </div>

            {/* 提示信息 */}
            <div className="p-4 bg-jarvis-info/10 border border-jarvis-info/20 rounded-lg mb-6">
              <p className="text-sm text-jarvis-info">
                💡 提示：录制时请确保目标应用窗口可见，操作速度适中
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-3">
              <button className="btn-secondary flex-1" onClick={() => navigate('/dashboard')}>
                取消
              </button>
              <button className="btn-primary flex-1" onClick={handleStart}>
                开始录制 🎙️
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 录制中界面
  return (
    <div className="h-full flex flex-col">
      {/* 录制控制栏 */}
      <div className="bg-jarvis-panel/50 border-b border-white/5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={cn('w-3 h-3 rounded-full', isPaused ? 'bg-jarvis-warning' : 'bg-jarvis-danger animate-pulse')} />
              <span className="text-sm font-medium text-jarvis-text">
                {isPaused ? '已暂停' : '录制中'}
              </span>
            </div>
            <div className="border-l border-white/10 h-6" />
            <span className="text-sm text-jarvis-text-secondary">
              {formatTime(recordingTime)}
            </span>
            <div className="border-l border-white/10 h-6" />
            <span className="text-sm text-jarvis-text-secondary">
              已录制: {steps.length} 步
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePause}
              className="btn-secondary"
            >
              {isPaused ? '⏵ 继续' : '⏸ 暂停'}
            </button>
            <button onClick={handleStop} className="btn-primary">
              ⏹ 停止录制
            </button>
          </div>
        </div>
      </div>

      {/* 录制步骤列表 */}
      <div className="flex-1 overflow-auto scrollbar-thin p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-orbitron font-bold text-jarvis-text mb-4">
            录制步骤
          </h2>

          {steps.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">👆</div>
              <p className="text-jarvis-text-secondary">
                开始操作，系统将自动记录您的每一步
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="card-flat flex items-start space-x-4"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-jarvis-gold/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-jarvis-gold">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-jarvis-text">
                        {step.action}
                      </span>
                      <span className="text-xs text-jarvis-text-secondary">
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {step.element && (
                      <p className="text-xs text-jarvis-text-secondary">
                        元素: {step.element.title || step.element.role || '未知'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 快捷键提示 */}
      <div className="bg-jarvis-panel/30 border-t border-white/5 p-3">
        <div className="flex items-center justify-center space-x-6 text-xs text-jarvis-text-secondary">
          <span>⏸ 暂停: Ctrl+P</span>
          <span>⏹ 停止: Ctrl+S</span>
          <span>📝 标记: Ctrl+M</span>
        </div>
      </div>
    </div>
  );
}
