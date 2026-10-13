import React, { useEffect, useRef, useState } from 'react';

/**
 * Shared Slider — redesign V1-B (spec section 4.5). Label + mono value row on top (click the value
 * to type a number directly, Enter to confirm, Esc to cancel), a thin track + circular knob below.
 * Keyboard: ←/→ = step (native <input type="range"> behavior), Shift+←/→ = step×10. Double-click the
 * track resets to `defaultValue` when one is given. `modified` shows the small blue dot used
 * throughout the new inspector to mark a value that's drifted from its preset default.
 */
export interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  decimals?: number;
  defaultValue?: number;
  modified?: boolean;
  disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  decimals = 2,
  defaultValue,
  modified,
  disabled
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) return;
    setDraft(value.toFixed(decimals));
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const commit = () => {
    const n = parseFloat(draft);
    if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
    setEditing(false);
  };

  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <div className="kv-ctl">
      <div className="kv-ctl-head">
        <label className="kv-ctl-label">
          {modified && <span className="kv-modified-dot" aria-hidden="true" />}
          {label}
        </label>
        {editing ? (
          <input
            ref={inputRef}
            type="number"
            value={draft}
            step={step}
            className="kv-ctl-value-input"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') setEditing(false);
            }}
          />
        ) : (
          <button
            type="button"
            className="kv-ctl-value"
            onClick={() => !disabled && setEditing(true)}
            title={defaultValue !== undefined ? `Gốc: ${defaultValue.toFixed(decimals)}${unit}` : undefined}
          >
            {value.toFixed(decimals)}
            {unit}
          </button>
        )}
      </div>
      <input
        type="range"
        className="kv-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onDoubleClick={() => defaultValue !== undefined && onChange(defaultValue)}
        onKeyDown={(e) => {
          if (e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
            e.preventDefault();
            const delta = (e.key === 'ArrowRight' ? 1 : -1) * step * 10;
            onChange(Math.min(max, Math.max(min, value + delta)));
          }
        }}
        style={{ ['--kv-slider-pct' as string]: `${pct}%` } as React.CSSProperties}
      />
    </div>
  );
};

export interface RangeSliderProps {
  label: string;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  decimals?: number;
  modified?: boolean;
}

/** Two-handle variant (e.g. Min/Max radius) — classic overlapping-range-inputs technique. */
export const RangeSlider: React.FC<RangeSliderProps> = ({
  label,
  valueMin,
  valueMax,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  decimals = 1,
  modified
}) => {
  const pctMin = max > min ? ((valueMin - min) / (max - min)) * 100 : 0;
  const pctMax = max > min ? ((valueMax - min) / (max - min)) * 100 : 0;

  return (
    <div className="kv-ctl">
      <div className="kv-ctl-head">
        <label className="kv-ctl-label">
          {modified && <span className="kv-modified-dot" aria-hidden="true" />}
          {label}
        </label>
        <span className="kv-ctl-value">
          {valueMin.toFixed(decimals)} – {valueMax.toFixed(decimals)}
          {unit}
        </span>
      </div>
      <div className="kv-range-track">
        <div className="kv-range-fill" style={{ left: `${pctMin}%`, width: `${Math.max(0, pctMax - pctMin)}%` }} />
        <input
          type="range"
          className="kv-range-input"
          min={min}
          max={max}
          step={step}
          value={valueMin}
          aria-label={`${label} min`}
          onChange={(e) => onChange(Math.min(parseFloat(e.target.value), valueMax), valueMax)}
        />
        <input
          type="range"
          className="kv-range-input"
          min={min}
          max={max}
          step={step}
          value={valueMax}
          aria-label={`${label} max`}
          onChange={(e) => onChange(valueMin, Math.max(parseFloat(e.target.value), valueMin))}
        />
      </div>
    </div>
  );
};
