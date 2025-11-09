import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { useAuthStore } from '@/stores/authStore';
import { startEngine } from '@/services/tauri';

const SplashScreen: React.FC = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#050714] text-white">
    <div className="space-y-3 text-center">
      <div className="mx-auto h-16 w-16 animate-spin rounded-full border-2 border-[#FFB800] border-t-transparent" />
      <p className="text-sm text-[#A8B2D1]">加载控制台...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    restoreSession();
    startEngine().catch((error) => {
      console.warn('启动 Sidecar 失败', error);
    });
  }, [restoreSession]);

  if (status === 'hydrating') {
    return <SplashScreen />;
  }

  return <RouterProvider router={router} />;
};

export default App;
