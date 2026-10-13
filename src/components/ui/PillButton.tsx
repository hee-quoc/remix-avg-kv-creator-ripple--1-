import React from 'react';

export interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'active';
  icon?: React.ReactNode;
}

/** Rounded 999px button — header actions, "Xuất file", "+ Lưu look hiện tại", toolbar toggles. */
export const PillButton: React.FC<PillButtonProps> = ({
  variant = 'default',
  icon,
  children,
  className = '',
  ...rest
}) => (
  <button type="button" className={`kv-pill kv-pill-${variant} ${className}`} {...rest}>
    {icon}
    {children}
  </button>
);
