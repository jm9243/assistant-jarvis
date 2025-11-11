import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { tauriService } from '@/services/tauri';
import { wsService } from '@/services/websocket';
import { connectionMonitor } from '@/services/connectionMonitor';
import { LoadingScreen } from '@/components/LoadingScreen';
import { JarvisContainer } from '@/components/jarvis';
import { ToastContainer } from '@/components/ui/Toast';

// 开发环境加载测试工具
if ((import.meta as any).env?.DEV) {
  import('@/utils/testToast');
}

function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // 初始化引擎和WebSocket连接
    const initEngine = async () => {
      try {
        console.log('Initializing Jarvis...');

        // 检查引擎连接状态
        const isEngineRunning = await connectionMonitor.checkConnection('engine');

        if (!isEngineRunning) {
          // 引擎未运行，尝试通过 Tauri 启动（仅生产模式）
          console.log('Engine is not accessible, attempting to start...');
          const startResult = await tauriService.startEngine();

          if (startResult.success) {
            console.log('Engine started successfully via Tauri');
            // 等待引擎启动
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            console.warn('Failed to start engine via Tauri:', startResult.error);
            console.log('Please ensure engine is running: npm run start:engine');
          }
        } else {
          console.log('Engine is already running and accessible');
        }

        // 启动连接监控（每30秒检查一次）
        connectionMonitor.startMonitoring(30000);

        // 连接WebSocket
        wsService.connect().catch((error) => {
          console.warn('Failed to connect WebSocket:', error);
          console.log('WebSocket will retry automatically...');
        });
      } catch (error) {
        console.error('Error during initialization:', error);
        // 即使初始化失败，也继续渲染UI
      } finally {
        // 最少显示1秒加载画面，避免闪烁
        setTimeout(() => {
          setIsInitializing(false);
        }, 1000);
      }
    };

    initEngine();

    // 清理函数
    return () => {
      wsService.disconnect();
      connectionMonitor.stopMonitoring();
    };
  }, []);

  if (isInitializing) {
    return <LoadingScreen />;
  }

  return (
    <>
      <RouterProvider router={router} />
      <JarvisContainer />
      <ToastContainer />
    </>
  );
}

export default App;
