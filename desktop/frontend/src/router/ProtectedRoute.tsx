import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const status = useAuthStore((state) => state.status);
  const token = useAuthStore((state) => state.token);

  if (status === 'hydrating' || status === 'authenticating') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#050714] text-white">
        <div className="space-y-3 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#FFB800] border-t-transparent" />
          <p className="text-sm text-[#A8B2D1]">正在唤醒 Jarvis...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};
