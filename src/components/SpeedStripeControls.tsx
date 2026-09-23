import React from 'react';
import { RenderState, SpeedStripeConfig, SpeedStripeVariationMode } from '../types';
import { DEFAULT_SPEED_STRIPE_CONFIG } from '../utils/particleRenderer';
import { Zap, Waves, Palette, Layers } from 'lucide-react';

interface SpeedStripeControlsProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
}

const VARIATION_MODES: { id: SpeedStripeVariationMode; name: string; desc: string }[] = [
  { id: 'uniform', name: 'Uniform', desc: 'Same size & color everywhere — ripple still drives opacity' },
  { id: 'scaled', name: 'Scaled', desc: 'Dashes grow at the peak of each wave pulse' },
  { id: 'staggered', name: 'Staggered', desc: 'Directional sweep — the wave visibly travels across the field' },
  { id: 'alternating', name: 'Alternating', desc: 'Checkerboards Primary/Secondary color per dash' },
  { id: 'wave_activated', name: 'Wave Activated', desc: 'Combines Scaled + Staggered — dashes light up as the ripple passes' }
];

/**
 * Speed Stripe Field controls (Sports) — dash field geometry + how the material READS the wave. The
 * ripple itself (Frequency/Speed/Amplitude/Softness/Thickness), impact point (Ripple Origin), impact
 * falloff (Radial Thickness), and wave direction (Wave Pattern) are the SAME existing WAVE tab controls
 * used by every other preset — this panel never duplicates them. Motion Direction below is a separate,
 * LOCAL stagger-sweep direction (it time-shifts each dash's own wave sample), not the WAVE tab's angle.
 */
export const SpeedStripeControls: React.FC<SpeedStripeControlsProps> = ({ state, onUpdateState }) => {
  const cfg: SpeedStripeConfig = { ...DEFAULT_SPEED_STRIPE_CONFIG, ...(state.grid.speedStripe || {}) };

  const update = (patch: Partial<SpeedStripeConfig>) => {
    onUpdateState((prev) => ({
      ...prev,
      grid: {
        ...prev.grid,
        speedStripe: { ...DEFAULT_SPEED_STRIPE_CONFIG, ...(prev.grid.speedStripe || {}), ...patch }
      }
    }));
  };

  const slider = (
    label: string,
    value: number,
    field: keyof SpeedStripeConfig,
    min: number,
    max: number,
    step: number,
    unit = '',
    decimals = 2
  ) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[#888] text-[10px] uppercase">{label}</label>
        <span className="text-yellow-400 text-[10px] font-bold">
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
        onChange={(e) => update({ [field]: parseFloat(e.target.value) } as Partial<SpeedStripeConfig>)}
        className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-yellow-400"
      />
    </div>
  );

  const colorField = (label: string, value: string, field: keyof SpeedStripeConfig) => (
    <div>
      <label className="text-[#888] text-[10px] uppercase block mb-1">{label}</label>
      <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#222] rounded p-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => update({ [field]: e.target.value } as Partial<SpeedStripeConfig>)}
          className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
        />
        <span className="text-[10px] text-[#cbd5e1] uppercase">{value}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between pb-2 border-b border-[#222]">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">
            SPEED STRIPE FIELD
          </span>
        </div>
      </div>

      <p className="text-[9px] text-[#888] font-sans leading-relaxed">
        A field of diagonal dash units driven by the SAME wave engine every other preset uses — the
        WAVE tab's Frequency/Speed/Amplitude shape the pulse, Ripple Origin is the impact point, Wave
        Pattern picks the direction, and Radial Thickness shapes the falloff. This panel only sets the
        dash field's own geometry, variation mode, and how strongly it reads the wave.
      </p>

      {/* Pattern / Form */}
      <div className="space-y-2.5 p-3 bg-[#0d0d12] border border-[#262626] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-yellow-400 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" /> PATTERN & FORM
        </span>
        <div className="grid grid-cols-2 gap-3">
          {slider('DASH ANGLE', cfg.dashAngle, 'dashAngle', -90, 90, 1, '°', 0)}
          {slider('ROW OFFSET', cfg.rowOffset, 'rowOffset', 0, 1, 0.02, '', 2)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('DASH WIDTH', cfg.dashWidth, 'dashWidth', 8, 160, 1, 'px', 0)}
          {slider('DASH HEIGHT', cfg.dashHeight, 'dashHeight', 2, 60, 1, 'px', 0)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('SPACING X', cfg.spacingX, 'spacingX', 0, 60, 1, 'px', 0)}
          {slider('SPACING Y', cfg.spacingY, 'spacingY', 0, 60, 1, 'px', 0)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('COLUMN DENSITY', cfg.columnCount, 'columnCount', 2, 40, 1, '', 0)}
          {slider('ROW DENSITY', cfg.rowCount, 'rowCount', 2, 30, 1, '', 0)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('FIELD WIDTH', cfg.fieldWidth, 'fieldWidth', 0.1, 1, 0.02, '', 2)}
          {slider('FIELD HEIGHT', cfg.fieldHeight, 'fieldHeight', 0.1, 1, 0.02, '', 2)}
        </div>
        {slider('SCALE PROGRESSION', cfg.scaleProgression, 'scaleProgression', -1, 1, 0.02, '', 2)}
      </div>

      {/* Motion / Ripple Response */}
      <div className="space-y-2.5 p-3 bg-[#0d0d12] border border-[#262626] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-yellow-400 flex items-center gap-1.5">
          <Waves className="w-3.5 h-3.5" /> MOTION / RIPPLE RESPONSE
        </span>
        <div className="grid grid-cols-2 gap-3">
          {slider('RIPPLE INFLUENCE', cfg.rippleInfluence, 'rippleInfluence', 0, 1, 0.02, '', 2)}
          {slider('ANIMATION SPEED', cfg.animSpeed, 'animSpeed', 0, 3, 0.05, 'x', 2)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('DISPLACEMENT AMOUNT', cfg.displacementAmount, 'displacementAmount', 0, 2, 0.05, 'x', 2)}
          {slider('OPACITY INFLUENCE', cfg.opacityInfluence, 'opacityInfluence', 0, 1, 0.02, '', 2)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('SCALE PULSE AMOUNT', cfg.scalePulseAmount, 'scalePulseAmount', 0, 1, 0.02, '', 2)}
          {slider('STAGGER AMOUNT', cfg.staggerAmount, 'staggerAmount', 0, 1, 0.02, '', 2)}
        </div>
        {slider('MOTION DIRECTION', cfg.motionDirection, 'motionDirection', -180, 180, 1, '°', 0)}
        <p className="text-[8px] text-[#666] font-sans leading-relaxed">
          Motion Direction only steers the Stagger sweep (a local time-shift of each dash's own wave
          sample) — it's independent of the WAVE tab's Ripple Origin/Pattern.
        </p>
      </div>

      {/* Variation */}
      <div className="space-y-2 p-3 bg-[#0d0d12] border border-[#262626] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-yellow-400">VARIATION MODE</span>
        <div className="grid grid-cols-1 gap-1.5">
          {VARIATION_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => update({ variationMode: m.id })}
              className={`p-1.5 rounded text-left border transition-colors ${
                cfg.variationMode === m.id
                  ? 'bg-yellow-500/10 border-yellow-500/50'
                  : 'bg-[#121212] hover:bg-[#181818] border-[#262626]'
              }`}
            >
              <span
                className={`block text-[9.5px] font-bold uppercase ${
                  cfg.variationMode === m.id ? 'text-yellow-300' : 'text-[#cbd5e1]'
                }`}
              >
                {m.name}
              </span>
              <span className="text-[7.5px] opacity-70 block text-[#888]">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div className="space-y-2.5 p-3 bg-[#0d0d12] border border-[#262626] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-yellow-400 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5" /> STYLE
        </span>
        <div className="grid grid-cols-2 gap-3">
          {colorField('PRIMARY COLOR', cfg.primaryColor, 'primaryColor')}
          {colorField('SECONDARY COLOR', cfg.secondaryColor, 'secondaryColor')}
        </div>
        <p className="text-[8px] text-[#666] font-sans leading-relaxed">
          Secondary Color checkerboards with Primary in "Alternating" mode, and always flashes in at the
          peak of each wave pulse in every other mode. Background color is the global Style panel's
          Background Color, same as every other preset.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {slider('OPACITY', cfg.baseOpacity, 'baseOpacity', 0, 1, 0.02, '', 2)}
          {slider('CONTRAST', cfg.contrast, 'contrast', 0, 2, 0.02, '', 2)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('MIN OPACITY', cfg.minOpacity, 'minOpacity', 0, 1, 0.02, '', 2)}
          {slider('MAX OPACITY', cfg.maxOpacity, 'maxOpacity', 0, 1, 0.02, '', 2)}
        </div>
      </div>
    </div>
  );
};
