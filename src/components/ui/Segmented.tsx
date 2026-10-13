import React from 'react';

export interface SegmentedOption {
  value: string;
  label: string;
}

export interface SegmentedProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  'aria-label'?: string;
}

/** Pill-shaped segmented control — e.g. canvas toolbar's Stable/Flow, aspect ratio picker. */
export const Segmented: React.FC<SegmentedProps> = ({ options, value, onChange, ...rest }) => (
  <div className="kv-seg" role="tablist" aria-label={rest['aria-label']}>
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        role="tab"
        aria-selected={opt.value === value}
        className={`kv-seg-item ${opt.value === value ? 'is-on' : ''}`}
        onClick={() => onChange(opt.value)}
      >
        {opt.label}
      </button>
    ))}
  </div>
);
