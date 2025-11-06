import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '@components/Layout';
import Dashboard from '@pages/Dashboard';
import RecorderPage from '@pages/RecorderPage';
import WorkflowEditor from '@pages/WorkflowEditor';
import ElementManager from '@pages/ElementManager';
import TaskCenter from '@pages/TaskCenter';
import TemplateCenter from '@pages/TemplateCenter';
import AgentConfig from '@pages/AgentConfig';
import MCPToolCenter from '@pages/MCPToolCenter';
import Settings from '@pages/Settings';

const App: React.FC = () => {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Initialize app
    const initApp = async () => {
      try {
        if (window.electron) {
          const version = await window.electron.app.getVersion();
          console.log(`Desktop Recorder v${version}`);
        }
        setAppReady(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setAppReady(true);
      }
    };

    initApp();
  }, []);

  if (!appReady) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/recorder" element={<RecorderPage />} />
        <Route path="/editor/:id?" element={<WorkflowEditor />} />
        <Route path="/elements" element={<ElementManager />} />
        <Route path="/tasks" element={<TaskCenter />} />
        <Route path="/templates" element={<TemplateCenter />} />
        <Route path="/agent" element={<AgentConfig />} />
        <Route path="/mcp" element={<MCPToolCenter />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
};

export default App;
