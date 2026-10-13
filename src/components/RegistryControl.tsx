import React from 'react';
import { ControlDef } from '../data/controlRegistry';
import { getPath, setPath } from '../utils/statePath';
import { Slider, Toggle } from './ui';

interface RegistryControlProps<T extends object> {
  control: ControlDef;
  state: T;
  onUpdate: (updater: (prev: T) => T) => void;
  /** Cosmetic overrides the registry entry itself doesn't carry (not every control needs one). */
  unit?: string;
  decimals?: number;
}

const inferDecimals = (step: number | undefined): number => {
  if (!step || step >= 1) return 0;
  const s = step.toString();
  const i = s.indexOf('.');
  return i === -1 ? 0 : s.length - i - 1;
};

/**
 * Redesign V1-B, Phase P4 — renders ONE control-registry entry against whatever state object it
 * targets, so the new group panels don't each hand-write a Slider/Toggle/<select> binding per field.
 * Only handles the generic field types (slider/toggle/select/color/textarea/number/text); a handful
 * of ids (font.fontFamily, grid.dotShape, style.visualStyle, compositionMode) have richer existing
 * pickers (font list with categories, 17-shape icon grid, visual style gallery) and are rendered by
 * the group panels directly instead of through this generic renderer — see each panel's "specialIds".
 */
export function RegistryControl<T extends object>({ control, state, onUpdate, unit, decimals }: RegistryControlProps<T>) {
  const value = getPath<unknown>(state, control.id);
  const set = (v: unknown) => onUpdate((prev) => setPath(prev, control.id, v));
  const resolvedUnit = unit ?? control.unit ?? '';
  const resolvedDecimals = decimals ?? inferDecimals(control.step);

  switch (control.type) {
    case 'slider':
    case 'number':
      return (
        <Slider
          label={control.label.vi}
          value={typeof value === 'number' ? value : (control.default as number)}
          onChange={set}
          min={control.min ?? 0}
          max={control.max ?? 1}
          step={control.step ?? 1}
          unit={resolvedUnit}
          decimals={resolvedDecimals}
          defaultValue={control.default as number}
        />
      );
    case 'toggle':
      return <Toggle checked={!!value} onChange={set} label={control.label.vi} />;
    case 'select':
      return (
        <div className="kv-ctl">
          <label className="kv-ctl-label">{control.label.vi}</label>
          <select
            value={(value as string) ?? (control.default as string)}
            onChange={(e) => set(e.target.value)}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius-input)] px-2.5 py-2 text-[13px]"
            style={{ color: 'var(--ink)', fontFamily: 'var(--font-ui)' }}
          >
            {(control.options || []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label.vi}
              </option>
            ))}
          </select>
        </div>
      );
    case 'color':
      return (
        <div className="kv-ctl">
          <label className="kv-ctl-label">{control.label.vi}</label>
          <div className="flex items-center gap-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius-input)] p-1.5">
            <input
              type="color"
              value={(value as string) || (control.default as string)}
              onChange={(e) => set(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
            />
            <span className="text-[12px]" style={{ color: 'var(--ink-2)', fontFamily: 'var(--font-mono)' }}>
              {(value as string) || (control.default as string)}
            </span>
          </div>
        </div>
      );
    case 'textarea':
    case 'text':
      return (
        <div className="kv-ctl">
          <label className="kv-ctl-label">{control.label.vi}</label>
          <textarea
            value={(value as string) ?? ''}
            onChange={(e) => set(e.target.value)}
            rows={control.type === 'textarea' ? 2 : 1}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius-input)] p-2 text-[13px] resize-none"
            style={{ color: 'var(--ink)', fontFamily: 'var(--font-ui)' }}
          />
        </div>
      );
    default:
      return null;
  }
}
