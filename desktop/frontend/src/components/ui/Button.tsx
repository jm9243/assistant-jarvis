/**
 * 统一的按钮组件
 * 支持不同的变体和尺寸，适配主题系统
 */
import React from 'react';
import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-jarvis-gold hover:bg-jarvis-gold-dark text-jarvis-space font-medium border-transparent',
  secondary: 'bg-jarvis-panel hover:bg-jarvis-panel-light text-jarvis-text border-white/10 hover:border-white/20',
  outline: 'bg-transparent hover:bg-jarvis-panel/50 text-jarvis-text border-white/20 hover:border-jarvis-gold',
  ghost: 'bg-transparent hover:bg-jarvis-panel/30 text-jarvis-text-secondary hover:text-jarvis-text border-transparent',
  danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30 hover:border-red-500/50',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled = false,
      icon,
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          // 基础样式
          'inline-flex items-center justify-center gap-2',
          'rounded-lg border transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-jarvis-gold focus:ring-offset-2 focus:ring-offset-jarvis-space',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // 变体样式
          buttonVariants[variant],
          // 尺寸样式
          buttonSizes[size],
          // 全宽
          fullWidth && 'w-full',
          // 自定义类名
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {icon && !loading && icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
