import React from 'react';
import { RenderState, ModularStripConfig } from '../types';
import { DEFAULT_MODULAR_STRIP_CONFIG } from '../utils/particleRenderer';
import { Rows3, Activity } from 'lucide-react';

interface ModularStripControlsProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
}

/**
 * Modular Signal Field controls (Breaking Signal redesign) — Block/Strip form and Motion controls.
 * Typography lives in TEXT LAYOUT (independent KV Layout / Original Text), and Color lives in the
 * multi-color palette system in the STYLE tab — both already generic, reused as-is here.
 */
export const ModularStripControls: React.FC<ModularStripControlsProps> = ({ state, onUpdateState }) => {
  const cfg: ModularStripConfig = { ...DEFAULT_MODULAR_STRIP_CONFIG, ...(state.grid.modularStrip || {}) };

  const update = (patch: Partial<ModularStripConfig>) => {
    onUpdateState((prev) => ({
      ...prev,
      grid: {
        ...prev.grid,
        dotShape: 'modular_strip',
        modularStrip: { ...DEFAULT_MODULAR_STRIP_CONFIG, ...(prev.grid.modularStrip || {}), ...patch }
      }
    }));
  };

  const slider = (
    label: string,
    value: number,
    field: keyof ModularStripConfig,
    min: number,
    max: number,
    step: number,
    unit = '',
    decimals = 2
  ) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[#888] text-[10px] uppercase">{label}</label>
        <span className="text-rose-400 text-[10px] font-bold">
          {value.toFixed(decimals)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => update({ [field]: parseFloat(e.target.value) } as Partial<ModularStripConfig>)}
        className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-rose-500"
      />
    </div>
  );

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between pb-2 border-b border-[#222]">
        <div className="flex items-center space-x-2">
          <Rows3 className="w-4 h-4 text-rose-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">
            MODULAR SIGNAL FIELD
          </span>
        </div>
      </div>

      <p className="text-[9px] text-[#888] font-sans leading-relaxed">
        Staggered vertical strip blocks interrupt the typography beneath — fragmented transmission /
        scanning motion instead of a particle burst. Typography lives in the TEXT LAYOUT tab (Original
        Text); colors live in the multi-color palette below in the STYLE tab.
      </p>

      {/* Block / Strip Form */}
      <div className="space-y-2.5 p-3 bg-[#0d0d12] border border-[#262630] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-rose-400">BLOCK / STRIP</span>
        <div className="grid grid-cols-2 gap-3">
          {slider('BAR WIDTH', cfg.barWidth, 'barWidth', 4, 80, 1, 'px', 0)}
          {slider('COLUMN COUNT', cfg.columnCount, 'columnCount', 3, 80, 1, '', 0)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('MIN HEIGHT', cfg.heightMin, 'heightMin', 4, 300, 2, 'px', 0)}
          {slider('MAX HEIGHT', cfg.heightMax, 'heightMax', 4, 500, 2, 'px', 0)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('DENSITY', cfg.density, 'density', 1, 40, 1, '', 0)}
          {slider('SPACING', cfg.spacing, 'spacing', 0, 40, 1, 'px', 0)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('VERTICAL OFFSET', cfg.verticalOffsetAmount, 'verticalOffsetAmount', 0, 200, 2, 'px', 0)}
          {slider('STAGGER AMOUNT', cfg.staggerAmount, 'staggerAmount', 0, 1, 0.02, '', 2)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('CLUSTER SIZE', cfg.clusterSize, 'clusterSize', 1, 12, 1, '', 0)}
          {slider('OVERLAP INTENSITY', cfg.overlapIntensity, 'overlapIntensity', 0.05, 1, 0.02, '', 2)}
        </div>
      </div>

      {/* Motion */}
      <div className="space-y-2.5 p-3 bg-[#0d0d12] border border-[#262630] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-rose-400 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" /> MOTION
        </span>
        <div className="grid grid-cols-2 gap-3">
          {slider('ANIMATION SPEED', cfg.animSpeed, 'animSpeed', 0, 4, 0.05, 'x', 2)}
          {slider('OFFSET TIMING', cfg.offsetTiming, 'offsetTiming', 0, 3, 0.05, '', 2)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('MOVEMENT AMPLITUDE', cfg.movementAmplitude, 'movementAmplitude', 0, 300, 2, 'px', 0)}
          {slider('VERTICAL MOTION', cfg.verticalMotionAmount, 'verticalMotionAmount', 0, 1, 0.02, '', 2)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('HORIZONTAL DRIFT', cfg.horizontalDriftAmount, 'horizontalDriftAmount', 0, 40, 1, 'px', 0)}
          {slider('LOOP SPEED', cfg.loopSpeed, 'loopSpeed', 0, 4, 0.05, 'x', 2)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('RANDOMNESS', cfg.randomnessAmount, 'randomnessAmount', 0, 1, 0.02, '', 2)}
          {slider('SYNC ↔ STAGGER', cfg.syncVsStagger, 'syncVsStagger', 0, 1, 0.02, '', 2)}
        </div>
      </div>
    </div>
  );
};
