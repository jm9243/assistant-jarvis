/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/Auth/LoginPage';
import { RegisterPage } from '@/pages/Auth/RegisterPage';
import { DashboardLayout } from '@/pages/Layout/DashboardLayout';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { WorkflowDesignerPage } from '@/pages/Workflow/WorkflowDesignerPage';
import { RecorderPanel } from '@/pages/Recorder/RecorderPanel';
import { ExecutionCenter } from '@/pages/Execution/ExecutionCenter';
import { SystemMonitorPage } from '@/pages/System/SystemMonitorPage';
import { SoftwareScannerPage } from '@/pages/System/SoftwareScannerPage';
import AgentListPage from '@/pages/Agent/AgentListPage';
import AgentFormPage from '@/pages/Agent/AgentFormPage';
import ChatPage from '@/pages/Agent/ChatPage';
import KnowledgeBaseListPage from '@/pages/KnowledgeBase/KnowledgeBaseListPage';
import KnowledgeBaseDetailPage from '@/pages/KnowledgeBase/KnowledgeBaseDetailPage';
import ToolStorePage from '@/pages/Tool/ToolStorePage';

// 受保护路由组件
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem('auth_token');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'workflows',
        element: <WorkflowDesignerPage />,
      },
      {
        path: 'recorder',
        element: <RecorderPanel />,
      },
      {
        path: 'executions',
        element: <ExecutionCenter />,
      },
      {
        path: 'system',
        element: <SystemMonitorPage />,
      },
      {
        path: 'software',
        element: <SoftwareScannerPage />,
      },
      {
        path: 'agents',
        element: <AgentListPage />,
      },
      {
        path: 'agents/create',
        element: <AgentFormPage />,
      },
      {
        path: 'agents/edit/:agentId',
        element: <AgentFormPage />,
      },
      {
        path: 'agents/chat/:agentId',
        element: <ChatPage />,
      },
      {
        path: 'knowledge-bases',
        element: <KnowledgeBaseListPage />,
      },
      {
        path: 'knowledge-bases/:id',
        element: <KnowledgeBaseDetailPage />,
      },
      {
        path: 'tools',
        element: <ToolStorePage />,
      },
      {
        path: 'settings',
        element: <div className="text-jarvis-text">设置页面 - 开发中</div>,
      },
    ],
  },
]);
