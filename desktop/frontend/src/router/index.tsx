import { createHashRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/router/ProtectedRoute';
import LoginPage from '@/pages/Auth/LoginPage';
import DashboardLayout from '@/pages/Layout/DashboardLayout';
import OverviewPage from '@/pages/Dashboard/OverviewPage';
import WorkflowDesignerPage from '@/pages/Workflow/WorkflowDesignerPage';
import RecorderPanel from '@/pages/Recorder/RecorderPanel';
import ExecutionCenter from '@/pages/Execution/ExecutionCenter';
import SystemMonitorPage from '@/pages/System/SystemMonitorPage';
import SoftwareScannerPage from '@/pages/System/SoftwareScannerPage';
import AgentCenterPage from '@/pages/Agent/AgentCenterPage';
import KnowledgeHubPage from '@/pages/Knowledge/KnowledgeHubPage';
import VoiceOpsPage from '@/pages/Voice/VoiceOpsPage';
import ToolGovernancePage from '@/pages/Tools/ToolGovernancePage';
import CommandCenterPage from '@/pages/Assistant/CommandCenterPage';
import MultiAgentStudioPage from '@/pages/MultiAgent/MultiAgentStudioPage';

export const router = createHashRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <OverviewPage />,
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
        path: 'execution',
        element: <ExecutionCenter />,
      },
      {
        path: 'system',
        element: <SystemMonitorPage />,
      },
      {
        path: 'system/software',
        element: <SoftwareScannerPage />,
      },
      {
        path: 'agents',
        element: <AgentCenterPage />,
      },
      {
        path: 'knowledge',
        element: <KnowledgeHubPage />,
      },
      {
        path: 'voice',
        element: <VoiceOpsPage />,
      },
      {
        path: 'tools',
        element: <ToolGovernancePage />,
      },
      {
        path: 'assistant',
        element: <CommandCenterPage />,
      },
      {
        path: 'multi-agent',
        element: <MultiAgentStudioPage />,
      },
    ],
  },
]);
