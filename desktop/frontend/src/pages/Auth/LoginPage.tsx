import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || '登录失败');
      }
    } catch (err) {
      setError('登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* 左侧品牌展示区 */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-jarvis-space to-jarvis-space-light overflow-hidden">
        {/* 动态背景 */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-jarvis-gold/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-jarvis-gold/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* 中心内容 */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          {/* Logo/3D动画占位 */}
          <div className="w-48 h-48 mb-8 relative">
            <div className="absolute inset-0 bg-jarvis-gold/20 rounded-full animate-pulse-gold" />
            <div className="absolute inset-4 bg-jarvis-gold/40 rounded-full animate-pulse-gold delay-300" />
            <div className="absolute inset-8 bg-jarvis-gold rounded-full flex items-center justify-center">
              <span className="text-4xl">🟡</span>
            </div>
          </div>

          {/* 品牌信息 */}
          <h1 className="text-4xl font-orbitron font-bold text-jarvis-gold mb-2">助手·贾维斯</h1>
          <p className="text-xl font-orbitron text-jarvis-text-secondary mb-4">JARVIS AI ASSISTANT</p>
          <p className="text-sm text-jarvis-text-secondary text-center max-w-md">
            Your Digital Companion in the Future
          </p>

          {/* 版本号 */}
          <div className="absolute bottom-8 left-8 text-xs text-jarvis-text-secondary">v1.0.0</div>
        </div>
      </div>

      {/* 右侧登录表单 */}
      <div className="flex-1 flex items-center justify-center p-8 bg-jarvis-space-light">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-orbitron font-bold text-jarvis-text mb-2">欢迎回来，指挥官</h2>
            <p className="text-jarvis-text-secondary">请登录以继续使用贾维斯</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 邮箱输入 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-jarvis-text mb-2">
                📧 邮箱或用户名
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                placeholder="请输入邮箱或用户名"
                required
                autoFocus
              />
            </div>

            {/* 密码输入 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-jarvis-text mb-2">
                🔒 密码
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input w-full pr-10"
                  placeholder="请输入密码"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-jarvis-text-secondary hover:text-jarvis-text"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* 记住我 */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-jarvis-gold/20 bg-jarvis-panel/60 text-jarvis-gold focus:ring-jarvis-gold/20"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-jarvis-text-secondary">
                记住我
              </label>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="p-3 bg-jarvis-danger/10 border border-jarvis-danger/20 rounded-lg text-jarvis-danger text-sm">
                {error}
              </div>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn('btn-primary w-full', isLoading && 'opacity-50 cursor-not-allowed')}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="loading-spinner mr-2" />
                  登录中...
                </span>
              ) : (
                '登 录 →'
              )}
            </button>

            {/* 分隔线 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-jarvis-gold/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-jarvis-space-light text-jarvis-text-secondary">或者</span>
              </div>
            </div>

            {/* 第三方登录 */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="btn-secondary flex items-center justify-center"
                onClick={() => alert('微信登录功能开发中')}
              >
                <span className="mr-2">🔵</span>
                微信
              </button>
              <button
                type="button"
                className="btn-secondary flex items-center justify-center"
                onClick={() => alert('Google登录功能开发中')}
              >
                <span className="mr-2">🌐</span>
                Google
              </button>
            </div>
          </form>

          {/* 注册链接 */}
          <div className="mt-6 text-center text-sm text-jarvis-text-secondary">
            还没有账号？
            <button className="ml-1 text-jarvis-gold hover:underline" onClick={() => alert('注册功能开发中')}>
              立即注册
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
