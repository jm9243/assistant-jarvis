import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  onClick,
}) => {
  const Component = hoverable ? motion.div : 'div';

  return (
    <Component
      className={clsx(
        'bg-elevation-1/80 backdrop-blur-lg border border-white/5 rounded-xl p-5',
        'shadow-level-1',
        hoverable && 'cursor-pointer transition-all duration-200',
        className
      )}
      onClick={onClick}
      {...(hoverable && {
        whileHover: { y: -2, boxShadow: '0 4px 16px rgba(255, 184, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.4)' },
        whileTap: { scale: 0.98 },
      })}
    >
      {children}
    </Component>
  );
};
