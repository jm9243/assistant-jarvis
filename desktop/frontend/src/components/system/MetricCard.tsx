import React from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, hint, accent = '#FFB800' }) => {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-[#6B7A99]">{label}</p>
      <p className="mt-2 text-4xl font-semibold" style={{ color: accent }}>
        {value}
      </p>
      {hint && <p className="text-xs text-[#A8B2D1]">{hint}</p>}
    </div>
  );
};

export default MetricCard;
