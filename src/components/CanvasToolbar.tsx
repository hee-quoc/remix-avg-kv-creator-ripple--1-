import React from 'react';
import { RenderState, PreviewQuality } from '../types';
import { Segmented, PillButton } from './ui';
import { Play, Pause } from 'lucide-react';

interface CanvasToolbarProps {
  engineMode: 'kinetic' | 'flip_disc';
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
  fps: number;
  dotCount: number;
  // Flip Disc — only meaningful when engineMode === 'flip_disc'.
  flipDiscPlaying?: boolean;
  onToggleFlipDiscPlaying?: () => void;
  flipDiscFps?: number;
  flipDiscTileCount?: number;
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
 *
 * Merge pass — shared with Flip Disc too now. Stable/Flow, Quality and Masked have no Flip Disc
 * equivalent (no wave-mode concept, no adaptive-resolution concept, clip-mask is a Shape-tab control
 * not a quick toggle), so engineMode === 'flip_disc' only shows Play/Pause + a tile-count/fps readout
 * — kept simple rather than inventing fake controls, same call made for aspect-ratio/zoom above.
 */
export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  engineMode,
  state,
  onUpdateState,
  fps,
  dotCount,
  flipDiscPlaying,
  onToggleFlipDiscPlaying,
  flipDiscFps,
  flipDiscTileCount
}) => {
  const isFlipDisc = engineMode === 'flip_disc';
  const isPlaying = isFlipDisc ? !!flipDiscPlaying : state.isPlaying;

  return (
    <div className="absolute top-3.5 left-3.5 right-3.5 z-10 flex items-center justify-between pointer-events-none">
      <div className="flex items-center gap-2 pointer-events-auto">
        <PillButton
          onClick={() =>
            isFlipDisc ? onToggleFlipDiscPlaying?.() : onUpdateState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))
          }
          aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
          className="kv-pill-icon"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </PillButton>
        {!isFlipDisc && (
          <Segmented
            value={state.wave.mode}
            onChange={(v) => onUpdateState((prev) => ({ ...prev, wave: { ...prev.wave, mode: v as 'stable' | 'flow' } }))}
            options={[
              { value: 'stable', label: 'Stable' },
              { value: 'flow', label: 'Flow' }
            ]}
          />
        )}
      </div>

      <div className="flex items-center gap-2 pointer-events-auto">
        <span
          className="hidden sm:inline text-[10px] px-2.5 py-1 rounded-[var(--radius-pill)]"
          style={{ background: 'var(--surface)', color: 'var(--muted)', fontFamily: 'var(--font-mono)', border: '1px solid var(--border)' }}
        >
          {isFlipDisc ? `${(flipDiscTileCount || 0).toLocaleString()} tiles · ${flipDiscFps || 0} fps` : `${dotCount.toLocaleString()} dots · ${fps} fps`}
        </span>
        {!isFlipDisc && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};
