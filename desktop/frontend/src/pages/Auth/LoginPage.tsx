import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const INITIAL_PAYLOAD = {
  identifier: '',
  password: '',
  rememberMe: true,
};

type OAuthProvider = 'wechat' | 'google';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(INITIAL_PAYLOAD);
  const [tips, setTips] = useState<string | null>(null);
  const login = useAuthStore((state) => state.login);
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);

  const isSubmitting = status === 'authenticating';

  const canSubmit = useMemo(() => {
    return Boolean(form.identifier.trim() && form.password.trim()) && !isSubmitting;
  }, [form.identifier, form.password, isSubmitting]);

  const handleInputChange = (key: 'identifier' | 'password') =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    const ok = await login(form);
    if (ok) {
      const from = (location.state as { from?: Location })?.from?.pathname ?? '/';
      navigate(from, { replace: true });
    }
  };

  const handleOAuth = (provider: OAuthProvider) => {
    setTips(
      provider === 'wechat'
        ? '微信登录即将接入企业版 SSO，敬请期待'
        : 'Google 登录将在海外版本开启测试',
    );
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030615] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(255, 184, 0, 0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(0, 217, 255, 0.3), transparent 40%)',
        }}
      />
      <div className="relative z-10 grid w-full max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-8">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.6em] text-[#FFB800]">JARVIS DESKTOP</p>
            <h1 className="text-4xl font-bold leading-snug lg:text-5xl">
              让 AI 成为你的数字伙伴
              <br />
              而不是一款软件
            </h1>
            <p className="text-sm text-[#A8B2D1]">语音唤醒 · 语义编排 · 实时执行</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.3em] text-[#A8B2D1]">今日任务完成度</p>
              <p className="mt-4 text-5xl font-semibold text-[#FFB800]">87%</p>
              <p className="text-xs text-white/80">工作流执行 +12%，智能录制 +5%</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-xs text-[#A8B2D1]">Phase 1 · Workflow Automation</p>
              <div className="mt-4 space-y-2 text-sm text-white">
                <div className="flex items-center justify-between">
                  <span>进行中工作流</span>
                  <span className="text-[#FFB800]">08</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>系统健康度</span>
                  <span className="text-[#00F5A0]">99%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="w-full rounded-3xl border border-white/10 bg-[#0C1124]/90 p-8 shadow-2xl backdrop-blur">
          <div className="space-y-2 text-center">
            <p className="text-xs uppercase tracking-[0.5em] text-[#FFB800]">phase 1</p>
            <h2 className="text-2xl font-semibold">登录助手 · 贾维斯</h2>
            <p className="text-sm text-[#A8B2D1]">账号密码登录，或使用第三方账号</p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm text-[#A8B2D1]" htmlFor="identifier">
                邮箱 / 用户名
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#FFB800] focus:bg-transparent"
                placeholder="you@jarvis.dev"
                value={form.identifier}
                onChange={handleInputChange('identifier')}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[#A8B2D1]" htmlFor="password">
                密码
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-[#FFB800] focus:bg-transparent"
                placeholder="••••••••"
                value={form.password}
                onChange={handleInputChange('password')}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[#A8B2D1]">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-white/20 bg-transparent accent-[#FFB800]"
                  checked={form.rememberMe}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, rememberMe: event.target.checked }))
                  }
                />
                记住我 · 14 天免登录
              </label>
              <button
                type="button"
                className="text-[#FFB800] transition hover:text-white"
                onClick={() => setTips('请联系管理员重置密码')}
              >
                忘记密码？
              </button>
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
                {error}
              </p>
            )}

            {tips && (
              <p className="rounded-xl border border-[#00D9FF]/40 bg-[#00D9FF]/10 px-4 py-2 text-sm text-[#00D9FF]">
                {tips}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#FFB800] to-[#FF8A00] px-4 py-3 text-base font-semibold text-[#050714] transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? '正在验证...' : '进入控制台'}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 text-xs text-[#6B7A99]">
              <span className="h-px flex-1 bg-white/10" />
              <span>第三方快速登录</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOAuth('wechat')}
                className="rounded-xl border border-white/10 bg-white/5 py-3 text-sm text-white transition hover:border-[#00F5A0] hover:text-[#00F5A0]"
              >
                微信扫码
              </button>
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                className="rounded-xl border border-white/10 bg-white/5 py-3 text-sm text-white transition hover:border-[#00D9FF] hover:text-[#00D9FF]"
              >
                Google 登录
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-[#6B7A99]">
            登录即代表同意《用户协议》和《隐私政策》
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
