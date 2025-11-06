import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Video, Edit3, Grid3x3, CheckSquare, Library, Brain, Cpu, Settings } from 'lucide-react';
import './Layout.css';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/recorder', label: 'Recorder', icon: Video },
    { path: '/editor', label: 'Workflow Editor', icon: Edit3 },
    { path: '/elements', label: 'Element Manager', icon: Grid3x3 },
    { path: '/tasks', label: 'Task Center', icon: CheckSquare },
    { path: '/templates', label: 'Templates', icon: Library },
    { path: '/agent', label: 'Agent Config', icon: Brain },
    { path: '/mcp', label: 'MCP Tools', icon: Cpu },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="layout">
      {/* Header */}
      <header className="layout-header">
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="layout-title">Desktop Recorder Workflow</h1>
      </header>

      <div className="layout-container">
        {/* Sidebar */}
        <aside className={`layout-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav">
            {menuItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`nav-item ${isActive(path) ? 'active' : ''}`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{label}</span>}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="layout-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
