import React from 'react';

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ eyebrow, title, description, actions }) => (
  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p className="text-xs uppercase tracking-[0.4em] text-jarvis-gold">{eyebrow}</p>
      <h2 className="font-heading text-xl font-semibold text-white">{title}</h2>
      {description && <p className="text-sm text-[#6B7A99]">{description}</p>}
    </div>
    {actions && <div className="flex gap-2">{actions}</div>}
  </div>
);

export default SectionHeader;
