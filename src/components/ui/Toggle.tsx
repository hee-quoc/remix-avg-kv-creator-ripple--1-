import React from 'react';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

/** Switch-style boolean control, e.g. "Original text layer", "Audio reactivity". */
export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, disabled }) => {
  const switchEl = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`kv-toggle ${checked ? 'is-on' : ''}`}
      onClick={() => !disabled && onChange(!checked)}
    >
      <span className="kv-toggle-knob" />
    </button>
  );

  if (!label) return switchEl;

  return (
    <div className={`kv-toggle-row ${disabled ? 'is-disabled' : ''}`}>
      <span>{label}</span>
      {switchEl}
    </div>
  );
};
