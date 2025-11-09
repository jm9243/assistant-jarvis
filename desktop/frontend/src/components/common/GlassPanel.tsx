import React from 'react';

interface GlassPanelProps {
  className?: string;
  children: React.ReactNode;
  dashed?: boolean;
}

const GlassPanel: React.FC<GlassPanelProps> = ({ className = '', children, dashed = false }) => (
  <div
    className={`rounded-2xl border ${
      dashed ? 'border-dashed border-jarvis-gold/40' : 'border-white/10'
    } bg-white/5 p-5 backdrop-blur ${className}`}
  >
    {children}
  </div>
);

export default GlassPanel;
