import React from 'react';

export interface ChipProps {
  children: React.ReactNode;
  active?: boolean;
  tone?: 'default' | 'modified' | 'warn' | 'ok';
  onClick?: () => void;
  icon?: React.ReactNode;
}

/** Small rounded label — category pills, "● Đã chỉnh N" badge, preset chips. */
export const Chip: React.FC<ChipProps> = ({ children, active, tone = 'default', onClick, icon }) => {
  const toneClass =
    tone === 'modified' ? 'kv-chip-modified' : tone === 'warn' ? 'kv-chip-warn' : tone === 'ok' ? 'kv-chip-ok' : '';
  return (
    <span
      className={`kv-chip ${active ? 'is-active' : ''} ${toneClass} ${onClick ? 'is-clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {icon}
      {children}
    </span>
  );
};
