/**
 * Toast通知组件
 * 用于显示系统提示、错误信息等
 */
import { useEffect } from 'react';
import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface ToastStore {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    clearAll: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    addToast: (toast) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        set((state) => ({
            toasts: [...state.toasts, { ...toast, id }],
        }));

        // 自动移除（如果设置了duration）
        if (toast.duration !== 0) {
            setTimeout(() => {
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id),
                }));
            }, toast.duration || 5000);
        }
    },
    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        }));
    },
    clearAll: () => {
        set({ toasts: [] });
    },
}));

// Toast容器组件
export function ToastContainer() {
    const { toasts, removeToast } = useToastStore();

    return (
        <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
}

// 单个Toast项
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    useEffect(() => {
        // 添加进入动画
        const timer = setTimeout(() => {
            const element = document.getElementById(toast.id);
            if (element) {
                element.classList.add('toast-enter');
            }
        }, 10);

        return () => clearTimeout(timer);
    }, [toast.id]);

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            case 'info':
                return 'ℹ';
        }
    };

    const getColorClasses = () => {
        switch (toast.type) {
            case 'success':
                return 'bg-green-500/10 border-green-500/30 text-green-400';
            case 'error':
                return 'bg-red-500/10 border-red-500/30 text-red-400';
            case 'warning':
                return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
            case 'info':
                return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
        }
    };

    return (
        <div
            id={toast.id}
            className={`
        toast-item pointer-events-auto
        min-w-[320px] max-w-md
        backdrop-blur-xl
        border rounded-lg
        p-4
        shadow-2xl
        transform transition-all duration-300
        ${getColorClasses()}
      `}
        >
            <div className="flex items-start gap-3">
                {/* 图标 */}
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center font-bold text-lg">
                    {getIcon()}
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-white">{toast.title}</div>
                    {toast.message && (
                        <div className="mt-1 text-sm opacity-90">{toast.message}</div>
                    )}
                    {toast.action && (
                        <button
                            onClick={toast.action.onClick}
                            className="mt-2 text-sm font-medium hover:underline"
                        >
                            {toast.action.label}
                        </button>
                    )}
                </div>

                {/* 关闭按钮 */}
                <button
                    onClick={onClose}
                    className="flex-shrink-0 w-5 h-5 flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}

// 便捷方法
export const toast = {
    success: (title: string, message?: string, options?: Partial<Toast>) => {
        useToastStore.getState().addToast({ type: 'success', title, message, ...options });
    },
    error: (title: string, message?: string, options?: Partial<Toast>) => {
        useToastStore.getState().addToast({ type: 'error', title, message, ...options });
    },
    warning: (title: string, message?: string, options?: Partial<Toast>) => {
        useToastStore.getState().addToast({ type: 'warning', title, message, ...options });
    },
    info: (title: string, message?: string, options?: Partial<Toast>) => {
        useToastStore.getState().addToast({ type: 'info', title, message, ...options });
    },
};
