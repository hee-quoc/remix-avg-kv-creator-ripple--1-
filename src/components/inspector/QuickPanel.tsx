import React from 'react';
import { RenderState } from '../../types';
import { PRESETS } from '../../data/presets';
import { resolveQuickControls } from '../../data/controlRegistry';
import { RegistryControl } from '../RegistryControl';
import { Chip } from '../ui';
import { Zap } from 'lucide-react';

interface QuickPanelProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
  onNavigate: (rail: 'text' | 'effect' | 'appearance') => void;
}

// Sensible fallback for presets that don't have their own curated quickControls yet (only the 4
// pinned "pitch" presets do, as of Phase P1) — still useful rather than an empty/dead tab.
const FALLBACK_IDS = ['font.text', 'style.theme', 'grid.density', 'wave.waveSpeed', 'wave.waveAmplitude'];

const SUMMARY_ROWS: { label: string; rail: 'text' | 'effect' | 'appearance'; render: (s: RenderState) => string }[] = [
  { label: 'Text', rail: 'text', render: (s) => `${s.font.fontFamily} · ${s.font.fontSize} · ${s.font.fontWeight}` },
  { label: 'Màu sắc', rail: 'appearance', render: (s) => s.style.theme },
  { label: 'Hiệu ứng', rail: 'effect', render: (s) => `${s.grid.dotShape} · ${s.wave.pattern} · ${s.wave.waveType}` }
];

/**
 * Redesign V1-B, Phase P4 (quick-tune part of P5) — "Tinh chỉnh nhanh": the 4-6 control-registry ids
 * a preset's own `quickControls` names (spec section 4.2), rendered with the same RegistryControl
 * used everywhere else, plus a jump-to-group summary row. Falls back to a small generic set for
 * presets that haven't had their own curated list picked yet.
 */
export const QuickPanel: React.FC<QuickPanelProps> = ({ state, onUpdateState, onNavigate }) => {
  const preset = PRESETS.find((p) => p.id === state.activePresetId);
  const ids = preset?.quickControls && preset.quickControls.length > 0 ? preset.quickControls : FALLBACK_IDS;
  const controls = resolveQuickControls(ids);
  const isFallback = !preset?.quickControls || preset.quickControls.length === 0;

  return (
    <div className="p-4 flex flex-col gap-5">
      <div className="flex items-center gap-2 flex-wrap">
        <Chip>{preset?.name || 'Chưa chọn preset'}</Chip>
        {isFallback && preset && <Chip tone="warn">Chưa có danh sách riêng — dùng mặc định</Chip>}
      </div>

      {controls.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <Zap className="w-7 h-7" style={{ color: 'var(--muted)' }} />
          <p className="text-xs leading-relaxed max-w-[220px]" style={{ color: 'var(--muted)' }}>
            Chọn một preset ở dải bên dưới canvas để thấy các control nhanh ở đây.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {controls.map((c) => (
            <RegistryControl key={c.id} control={c} state={state} onUpdate={onUpdateState} />
          ))}
        </div>
      )}

      <div className="flex flex-col pt-2 border-t mt-auto" style={{ borderColor: 'var(--border)' }}>
        {SUMMARY_ROWS.map((row) => (
          <button
            key={row.label}
            type="button"
            onClick={() => onNavigate(row.rail)}
            className="flex items-center justify-between py-2.5 text-[12.5px] border-b text-left"
            style={{ borderColor: 'var(--border)', color: 'var(--ink-2)' }}
          >
            <span>{row.label}</span>
            <span className="truncate max-w-[180px]" style={{ color: 'var(--muted)' }}>
              {row.render(state)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
