import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import PageContainer from '@/components/common/PageContainer';

const navItems = [
  { label: '控制台', icon: '📊', path: '/' },
  { label: '工作流设计', icon: '🧩', path: '/workflows' },
  { label: '智能录制', icon: '🎬', path: '/recorder' },
  { label: '执行中心', icon: '⚡', path: '/execution' },
  { label: '系统监控', icon: '🛰️', path: '/system' },
  { label: '软件扫描', icon: '🧭', path: '/system/software' },
  { label: 'Agent 中心', icon: '🧠', path: '/agents' },
  { label: '知识库', icon: '📚', path: '/knowledge' },
  { label: 'AI 助手', icon: '✨', path: '/assistant' },
  { label: '语音中控', icon: '🎧', path: '/voice' },
  { label: '工具治理', icon: '🛡️', path: '/tools' },
  { label: 'Multi-Agent', icon: '🤝', path: '/multi-agent' },
];

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-[#050714] text-white">
      <aside className="hidden w-64 flex-col border-r border-white/5 bg-[#0A0E27] p-6 lg:flex">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.5em] text-[#FFB800]">jarvis</p>
          <h2 className="text-xl font-semibold">桌面控制台</h2>
          <p className="text-xs text-[#A8B2D1]">Phase 1 · Workflow</p>
        </div>
        <nav className="mt-8 flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                  isActive
                    ? 'bg-[#FFB800]/10 text-[#FFB800]'
                    : 'text-[#A8B2D1] hover:bg-white/5'
                }`
              }
              end={item.path === '/'}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-[#A8B2D1]">
          <p>今日执行</p>
          <p className="mt-2 text-3xl font-semibold text-white">42</p>
          <p className="text-xs text-[#6B7A99]">成功率 96% · 失败 2</p>
        </div>
      </aside>

      <main className="flex flex-1 flex-col">
        <header className="border-b border-white/5 bg-[#050714]/80 backdrop-blur">
          <div className="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between px-4 md:px-8">
            <div>
              <p className="text-xs text-[#6B7A99]">欢迎回来</p>
              <p className="text-lg font-semibold">{user?.name ?? '贾维斯同学'}</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="hidden items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-[#A8B2D1] transition hover:border-[#FFB800] hover:text-white lg:flex">
                <span>🔔</span> 通知 (3)
              </button>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#FFB800] to-[#FF8A00] text-center text-lg leading-10">
                  {user?.name?.[0] ?? 'J'}
                </div>
                <div className="text-xs text-[#A8B2D1]">
                  <p className="text-white">{user?.name ?? 'Jarvis User'}</p>
                  <p>{user?.title ?? 'Workflow Admin'}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-sm text-[#FF6B35] transition hover:text-red-400"
                >
                  退出
                </button>
              </div>
            </div>
          </div>
        </header>
        <section className="flex-1 overflow-y-auto bg-[#050714]">
          <PageContainer>
            <Outlet />
          </PageContainer>
        </section>
      </main>
    </div>
  );
};

export default DashboardLayout;
