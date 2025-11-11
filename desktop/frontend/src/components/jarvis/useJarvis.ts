/**
 * 贾维斯全局状态和快捷键管理
 */
import { useState, useEffect, useCallback } from 'react';

export const useJarvis = () => {
  const [isOpen, setIsOpen] = useState(false);

  // 打开搜索框
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  // 关闭搜索框
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // 切换搜索框
  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // 监听全局快捷键 Cmd/Ctrl + Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Space
      if ((e.metaKey || e.ctrlKey) && e.code === 'Space') {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggle]);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
};
