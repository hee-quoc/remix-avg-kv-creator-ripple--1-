import React from 'react';
import { RenderState, TypographyRippleConfig } from '../types';
import { DEFAULT_TYPOGRAPHY_RIPPLE_CONFIG } from '../utils/particleRenderer';
import { Type, Waves } from 'lucide-react';

interface TypographyRippleControlsProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
}

const FONT_CHOICES = [
  'Times New Roman',
  'Georgia',
  'Space Grotesk',
  'Inter',
  'JetBrains Mono',
  'Anton',
  'Courier New'
];

/**
 * Typography Radial Ripple controls (Breaking Signal redesign #2) — paragraph content and block
 * typography. Ripple physics (speed, frequency, softness, thickness, radial displacement) are the
 * SAME existing WAVE tab controls used everywhere else in the app — this panel doesn't duplicate them.
 * Character colors come from the multi-color palette system in the STYLE tab, reused as-is.
 */
export const TypographyRippleControls: React.FC<TypographyRippleControlsProps> = ({ state, onUpdateState }) => {
  const cfg: TypographyRippleConfig = {
    ...DEFAULT_TYPOGRAPHY_RIPPLE_CONFIG,
    ...(state.grid.typographyRipple || {})
  };

  const update = (patch: Partial<TypographyRippleConfig>) => {
    onUpdateState((prev) => ({
      ...prev,
      grid: {
        ...prev.grid,
        typographyRipple: { ...DEFAULT_TYPOGRAPHY_RIPPLE_CONFIG, ...(prev.grid.typographyRipple || {}), ...patch }
      }
    }));
  };

  const slider = (
    label: string,
    value: number,
    field: keyof TypographyRippleConfig,
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
        onChange={(e) => update({ [field]: parseFloat(e.target.value) } as Partial<TypographyRippleConfig>)}
        className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-rose-500"
      />
    </div>
  );

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between pb-2 border-b border-[#222]">
        <div className="flex items-center space-x-2">
          <Waves className="w-4 h-4 text-rose-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">
            TYPOGRAPHY RADIAL RIPPLE
          </span>
        </div>
      </div>

      <p className="text-[9px] text-[#888] font-sans leading-relaxed">
        Paragraph text is broken into individual colored character blocks that ripple outward from the
        wave origin. Ripple speed, frequency, softness and thickness are the same WAVE tab controls
        above; character colors come from the multi-color palette below in this tab.
      </p>

      {/* Content */}
      <div className="space-y-2.5 p-3 bg-[#0d0d12] border border-[#262630] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-rose-400 flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5" /> CONTENT
        </span>
        <div>
          <label className="text-[#888] text-[10px] uppercase block mb-1">PARAGRAPH TEXT</label>
          <textarea
            value={cfg.text}
            onChange={(e) => update({ text: e.target.value })}
            rows={6}
            className="w-full bg-[#0A0A0A] border border-[#222] rounded p-2 text-[#E0E0E0] font-sans text-[11px] leading-relaxed focus:outline-none focus:border-rose-500 resize-y"
            placeholder="Editorial paragraph text. Use a blank line to start a new paragraph."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[#888] text-[10px] uppercase block mb-1">FONT FAMILY</label>
            <select
              value={cfg.fontFamily}
              onChange={(e) => update({ fontFamily: e.target.value })}
              className="w-full bg-[#0A0A0A] border border-[#222] rounded p-1.5 text-[#E0E0E0] text-[10px] focus:outline-none focus:border-rose-500"
            >
              {[cfg.fontFamily, ...FONT_CHOICES.filter((f) => f !== cfg.fontFamily)].map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[#888] text-[10px] uppercase block mb-1">GLYPH COLOR</label>
            <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#222] rounded p-1.5">
              <input
                type="color"
                value={cfg.textColor}
                onChange={(e) => update({ textColor: e.target.value })}
                className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
              />
              <span className="text-[10px] text-[#cbd5e1] uppercase">{cfg.textColor}</span>
            </div>
          </div>
        </div>

        {slider('GLYPH SIZE', cfg.fontSize, 'fontSize', 10, 60, 1, 'px', 0)}
      </div>

      {/* Block Typography */}
      <div className="space-y-2.5 p-3 bg-[#0d0d12] border border-[#262630] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-rose-400">BLOCK TYPOGRAPHY</span>
        <div className="grid grid-cols-2 gap-3">
          {slider('BLOCK WIDTH', cfg.blockWidth, 'blockWidth', 8, 40, 1, 'px', 0)}
          {slider('BLOCK HEIGHT', cfg.blockHeight, 'blockHeight', 12, 70, 1, 'px', 0)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('LINE HEIGHT', cfg.lineHeight, 'lineHeight', 16, 90, 1, 'px', 0)}
          {slider('SIDE MARGIN', cfg.marginX, 'marginX', 0, 300, 2, 'px', 0)}
        </div>
        {slider('PARAGRAPH GAP', cfg.paragraphGap, 'paragraphGap', 0, 200, 2, 'px', 0)}
      </div>

      {/* Ripple Response */}
      <div className="space-y-2.5 p-3 bg-[#0d0d12] border border-[#262630] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-rose-400">RIPPLE RESPONSE</span>
        <div className="grid grid-cols-2 gap-3">
          {slider('VERTICAL PULSE', cfg.verticalPulseStrength, 'verticalPulseStrength', 0, 80, 1, 'px', 0)}
          {slider('BLOCK SCALE PULSE', cfg.blockScaleAmount, 'blockScaleAmount', 0, 0.5, 0.01, '', 2)}
        </div>
      </div>
    </div>
  );
};
