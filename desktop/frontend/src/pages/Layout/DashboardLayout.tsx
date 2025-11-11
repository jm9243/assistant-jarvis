import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';

const navigation = [
  { name: '主页', path: '/dashboard', icon: '🏠' },
  { name: 'Agent中心', path: '/dashboard/agents', icon: '🤖' },
  { name: '工作流', path: '/dashboard/workflows', icon: '🔄' },
  { name: '录制器', path: '/dashboard/recorder', icon: '🎙️' },
  { name: '执行中心', path: '/dashboard/executions', icon: '▶️' },
  { name: '系统监控', path: '/dashboard/system', icon: '📊' },
  { name: '软件扫描', path: '/dashboard/software', icon: '🔍' },
  { name: '设置', path: '/dashboard/settings', icon: '⚙️' },
];

export function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-jarvis-space overflow-hidden">
      {/* 侧边栏 */}
      <aside className="w-64 bg-jarvis-panel/50 border-r border-white/5 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <div className="w-8 h-8 bg-jarvis-gold rounded-full flex items-center justify-center mr-3">
            <span className="text-lg">🟡</span>
          </div>
          <span className="font-orbitron font-bold text-jarvis-gold">贾维斯</span>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-thin">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                cn(
                  'flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-jarvis-gold/10 text-jarvis-gold border border-jarvis-gold/20'
                    : 'text-jarvis-text-secondary hover:bg-jarvis-panel-light hover:text-jarvis-text'
                )
              }
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* 用户信息 */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-jarvis-gold/20 rounded-full flex items-center justify-center mr-3">
              <span className="text-lg">👤</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-jarvis-text truncate">{user?.username || '指挥官'}</p>
              <p className="text-xs text-jarvis-text-secondary truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-ghost w-full text-xs">
            退出登录
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部栏 */}
        <header className="h-16 bg-jarvis-panel/30 border-b border-white/5 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <input
              type="search"
              placeholder="搜索..."
              className="input w-64"
            />
          </div>

          <div className="flex items-center space-x-4">
            {/* 通知 */}
            <button className="relative p-2 text-jarvis-text-secondary hover:text-jarvis-text transition-colors">
              <span className="text-xl">🔔</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* 窗口控制 */}
            <div className="flex items-center space-x-2">
              <button className="p-2 text-jarvis-text-secondary hover:text-jarvis-text transition-colors">━</button>
              <button className="p-2 text-jarvis-text-secondary hover:text-jarvis-text transition-colors">□</button>
              <button className="p-2 text-jarvis-text-secondary hover:text-red-400 transition-colors">✕</button>
            </div>
          </div>
        </header>

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto scrollbar-thin p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
