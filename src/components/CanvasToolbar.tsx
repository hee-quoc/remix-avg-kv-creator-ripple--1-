import React from 'react';
import { RenderState, PreviewQuality } from '../types';
import { Segmented, PillButton } from './ui';
import { Play, Pause } from 'lucide-react';

interface CanvasToolbarProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
  fps: number;
  dotCount: number;
}

const QUALITY_OPTIONS: { value: PreviewQuality; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'high', label: 'High' },
  { value: 'performance', label: 'Perf' }
];

/**
 * Redesign V1-B, Phase P3 — the canvas's own floating toolbar (spec section 3), absolutely positioned
 * over the top of the canvas card. Reuses the SAME state fields/handlers the old header's center
 * button row did (wave.mode, isPlaying, grid.hideBackgroundDots, previewQuality) — just relocated and
 * restyled, no behavior changes. Aspect ratio / zoom from the mockup are intentionally left out: the
 * engine has no notion of a non-16:9 output frame or a preview zoom level today, and faking either
 * control here would just be decorative — left as an open item (spec section 11, Q4-adjacent) for
 * whoever scopes the real feature.
 */
export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ state, onUpdateState, fps, dotCount }) => {
  return (
    <div className="absolute top-3.5 left-3.5 right-3.5 z-10 flex items-center justify-between pointer-events-none">
      <div className="flex items-center gap-2 pointer-events-auto">
        <PillButton
          onClick={() => onUpdateState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))}
          aria-label={state.isPlaying ? 'Tạm dừng' : 'Phát'}
          className="kv-pill-icon"
        >
          {state.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </PillButton>
        <Segmented
          value={state.wave.mode}
          onChange={(v) => onUpdateState((prev) => ({ ...prev, wave: { ...prev.wave, mode: v as 'stable' | 'flow' } }))}
          options={[
            { value: 'stable', label: 'Stable' },
            { value: 'flow', label: 'Flow' }
          ]}
        />
      </div>

      <div className="flex items-center gap-2 pointer-events-auto">
        <span
          className="hidden sm:inline text-[10px] px-2.5 py-1 rounded-[var(--radius-pill)]"
          style={{ background: 'var(--surface)', color: 'var(--muted)', fontFamily: 'var(--font-mono)', border: '1px solid var(--border)' }}
        >
          {dotCount.toLocaleString()} dots · {fps} fps
        </span>
        <Segmented
          value={state.previewQuality || 'auto'}
          onChange={(v) => onUpdateState((prev) => ({ ...prev, previewQuality: v as PreviewQuality }))}
          options={QUALITY_OPTIONS.map((q) => ({ value: q.value, label: q.label }))}
        />
        <PillButton
          variant={state.grid.hideBackgroundDots ? 'active' : 'default'}
          onClick={() => onUpdateState((prev) => ({ ...prev, grid: { ...prev.grid, hideBackgroundDots: !prev.grid.hideBackgroundDots } }))}
        >
          Masked {state.grid.hideBackgroundDots ? '✓' : ''}
        </PillButton>
      </div>
    </div>
  );
};
