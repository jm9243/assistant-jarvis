export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-jarvis-space">
      <div className="text-center">
        {/* Logo动画 */}
        <div className="w-32 h-32 mx-auto mb-8 relative">
          <div className="absolute inset-0 bg-jarvis-gold/20 rounded-full animate-pulse-gold" />
          <div className="absolute inset-4 bg-jarvis-gold/40 rounded-full animate-pulse-gold delay-300" />
          <div className="absolute inset-8 bg-jarvis-gold rounded-full flex items-center justify-center">
            <span className="text-4xl">🟡</span>
          </div>
        </div>

        {/* 加载文字 */}
        <h2 className="text-2xl font-orbitron font-bold text-jarvis-gold mb-2">
          贾维斯正在启动...
        </h2>
        <p className="text-jarvis-text-secondary">
          JARVIS AI Assistant
        </p>

        {/* 加载动画 */}
        <div className="mt-8 flex justify-center space-x-2">
          <div className="w-2 h-2 bg-jarvis-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-jarvis-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-jarvis-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
