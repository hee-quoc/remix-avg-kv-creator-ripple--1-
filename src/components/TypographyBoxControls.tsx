import React from 'react';
import { RenderState, TypographyBoxConfig } from '../types';
import { DEFAULT_TYPOGRAPHY_BOX_CONFIG } from '../utils/particleRenderer';
import { Type, Square, Waves, Plus, Trash2 } from 'lucide-react';

interface TypographyBoxControlsProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
}

const FONT_CHOICES = ['Arial', 'Helvetica', 'Inter', 'Space Grotesk', 'JetBrains Mono', 'Georgia'];

const PALETTE_ADD_COLORS = ['#00E0FF', '#FF6B6B', '#A78BFA', '#FDBA74', '#34D399'];

/**
 * Typography Box Material controls (News) — content/typography/geometry for the word-box grid, plus
 * the small Ripple Response section that replaces the source material's independent reveal animation.
 * Ripple physics itself (frequency, speed, amplitude, thickness, softness, origin, Dynamic Thickness,
 * Audio Reactivity) are the SAME existing WAVE tab controls — this panel never duplicates them.
 */
export const TypographyBoxControls: React.FC<TypographyBoxControlsProps> = ({ state, onUpdateState }) => {
  const cfg: TypographyBoxConfig = {
    ...DEFAULT_TYPOGRAPHY_BOX_CONFIG,
    ...(state.grid.typographyBox || {})
  };

  const update = (patch: Partial<TypographyBoxConfig>) => {
    onUpdateState((prev) => ({
      ...prev,
      grid: {
        ...prev.grid,
        typographyBox: { ...DEFAULT_TYPOGRAPHY_BOX_CONFIG, ...(prev.grid.typographyBox || {}), ...patch }
      }
    }));
  };

  const slider = (
    label: string,
    value: number,
    field: keyof TypographyBoxConfig,
    min: number,
    max: number,
    step: number,
    unit = '',
    decimals = 2,
    accent = 'accent-amber-500'
  ) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[#888] text-[10px] uppercase">{label}</label>
        <span className="text-amber-400 text-[10px] font-bold">
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
        onChange={(e) => update({ [field]: parseFloat(e.target.value) } as Partial<TypographyBoxConfig>)}
        className={`w-full h-[2px] bg-[#222] appearance-none cursor-pointer ${accent}`}
      />
    </div>
  );

  const handleWordsChange = (raw: string) => {
    const words = raw
      .split('\n')
      .map((w) => w.trim())
      .filter((w) => w.length > 0);
    update({ words: words.length > 0 ? words : DEFAULT_TYPOGRAPHY_BOX_CONFIG.words });
  };

  const handlePaletteColorChange = (idx: number, color: string) => {
    const next = [...cfg.colorPalette];
    next[idx] = color;
    update({ colorPalette: next });
  };

  const handlePaletteAdd = () => {
    if (cfg.colorPalette.length >= 8) return;
    const newColor = PALETTE_ADD_COLORS[cfg.colorPalette.length % PALETTE_ADD_COLORS.length];
    update({ colorPalette: [...cfg.colorPalette, newColor] });
  };

  const handlePaletteRemove = (idx: number) => {
    if (cfg.colorPalette.length <= 1) return;
    update({ colorPalette: cfg.colorPalette.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between pb-2 border-b border-[#222]">
        <div className="flex items-center space-x-2">
          <Square className="w-4 h-4 text-amber-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">
            TYPOGRAPHY BOX MATERIAL
          </span>
        </div>
      </div>

      <p className="text-[9px] text-[#888] font-sans leading-relaxed">
        Rounded word-boxes packed into a cached grid (geometry/words/colors never rebuild on their
        own — only when you edit something here or resize the canvas). Ripple physics come from the
        WAVE tab above; this panel only sets the box content/look and how strongly it reacts.
      </p>

      <p className="text-[8px] text-[#666] font-sans leading-relaxed">
        Clip Mask: this grid fills the canvas by default. Turn on <b>HIDE BG DOTS</b> (header bar or
        GRID tab) to clip it to the current text — or an SVG logo set as Object Mask in the TEXT tab —
        so only boxes inside that silhouette stay visible.
      </p>

      {/* Content */}
      <div className="space-y-2.5 p-3 bg-[#0d0d12] border border-[#262630] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-amber-400 flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5" /> WORDS & TYPOGRAPHY
        </span>
        <div>
          <label className="text-[#888] text-[10px] uppercase block mb-1">WORD LIST (ONE PER LINE)</label>
          <textarea
            value={cfg.words.join('\n')}
            onChange={(e) => handleWordsChange(e.target.value)}
            rows={5}
            className="w-full bg-[#0A0A0A] border border-[#222] rounded p-2 text-[#E0E0E0] font-sans text-[11px] leading-relaxed focus:outline-none focus:border-amber-500 resize-y"
            placeholder="caffeine&#10;Hola!&#10;Bonjour!"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[#888] text-[10px] uppercase block mb-1">FONT FAMILY</label>
            <select
              value={cfg.fontFamily}
              onChange={(e) => update({ fontFamily: e.target.value })}
              className="w-full bg-[#0A0A0A] border border-[#222] rounded p-1.5 text-[#E0E0E0] text-[10px] focus:outline-none focus:border-amber-500"
            >
              {[cfg.fontFamily, ...FONT_CHOICES.filter((f) => f !== cfg.fontFamily)].map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[#888] text-[10px] uppercase block mb-1">TEXT COLOR</label>
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
        {slider('FONT SIZE', cfg.fontSize, 'fontSize', 20, 90, 1, 'px', 0)}
      </div>

      {/* Box Geometry / "wrapping shape" */}
      <div className="space-y-2.5 p-3 bg-[#0d0d12] border border-[#262630] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-amber-400">BOX GEOMETRY</span>
        <div className="grid grid-cols-2 gap-3">
          {slider('BOX HEIGHT', cfg.boxHeight, 'boxHeight', 40, 160, 1, 'px', 0)}
          {slider('TEXT PADDING', cfg.horizontalPadding, 'horizontalPadding', 8, 100, 1, 'px', 0)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('ROW GAP (X)', cfg.marginX, 'marginX', 0, 80, 1, 'px', 0)}
          {slider('ROW GAP (Y)', cfg.marginY, 'marginY', 0, 80, 1, 'px', 0)}
        </div>
        <div>
          <label className="text-[#888] text-[10px] uppercase block mb-1.5">WRAPPING SHAPE</label>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            <button
              type="button"
              onClick={() => update({ cornerRadiusMode: 'uniform' })}
              className={`p-1.5 rounded border text-center transition-colors ${
                cfg.cornerRadiusMode === 'uniform'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                  : 'bg-[#121212] border-[#222] text-[#888] hover:text-white'
              }`}
            >
              <span className="block text-[9px] font-bold uppercase">Uniform</span>
              <span className="text-[7.5px] opacity-70 block">Same corner radius on every box</span>
            </button>
            <button
              type="button"
              onClick={() => update({ cornerRadiusMode: 'random' })}
              className={`p-1.5 rounded border text-center transition-colors ${
                cfg.cornerRadiusMode === 'random'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                  : 'bg-[#121212] border-[#222] text-[#888] hover:text-white'
              }`}
            >
              <span className="block text-[9px] font-bold uppercase">Random</span>
              <span className="text-[7.5px] opacity-70 block">Mixes rectangles + rounded, cached</span>
            </button>
          </div>

          {cfg.cornerRadiusMode === 'uniform' ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[#888] text-[10px] uppercase">CORNER RADIUS</label>
                <span className="text-amber-400 text-[10px] font-bold">
                  {cfg.cornerRadius <= 4 ? 'SHARP' : cfg.cornerRadius >= 45 ? 'PILL' : `${cfg.cornerRadius.toFixed(0)}px`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                step={1}
                value={cfg.cornerRadius}
                onChange={(e) => update({ cornerRadius: parseFloat(e.target.value) })}
                className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {slider('RADIUS MIN', cfg.cornerRadiusMin, 'cornerRadiusMin', 0, 60, 1, 'px', 0)}
              {slider('RADIUS MAX', cfg.cornerRadiusMax, 'cornerRadiusMax', 0, 60, 1, 'px', 0)}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('OUTLINE WIDTH', cfg.strokeWidth, 'strokeWidth', 0, 8, 0.5, 'px', 1)}
          {slider('FILLED RATIO', cfg.filledRatio, 'filledRatio', 0, 1, 0.05, '', 2)}
        </div>
        <div>
          <label className="text-[#888] text-[10px] uppercase block mb-1">OUTLINE COLOR</label>
          <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#222] rounded p-1.5 w-1/2">
            <input
              type="color"
              value={cfg.strokeColor}
              onChange={(e) => update({ strokeColor: e.target.value })}
              className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
            />
            <span className="text-[10px] text-[#cbd5e1] uppercase">{cfg.strokeColor}</span>
          </div>
        </div>
      </div>

      {/* Color Palette */}
      <div className="space-y-2.5 p-3 bg-[#0d0d12] border border-[#262630] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-amber-400">BOX COLOR PALETTE</span>
        <div className="flex flex-wrap gap-1.5">
          {cfg.colorPalette.map((c, idx) => (
            <div key={idx} className="flex items-center gap-1 bg-[#0A0A0A] border border-[#222] rounded p-1">
              <input
                type="color"
                value={c}
                onChange={(e) => handlePaletteColorChange(idx, e.target.value)}
                className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
              />
              <button
                type="button"
                onClick={() => handlePaletteRemove(idx)}
                disabled={cfg.colorPalette.length <= 1}
                className="text-[#555] hover:text-rose-400 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handlePaletteAdd}
            disabled={cfg.colorPalette.length >= 8}
            className="flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 px-2 py-1.5 rounded border border-amber-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" /> ADD
          </button>
        </div>
      </div>

      {/* Ripple Response */}
      <div className="space-y-2.5 p-3 bg-[#0d0d12] border border-[#262630] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-amber-400 flex items-center gap-1.5">
          <Waves className="w-3.5 h-3.5" /> RIPPLE RESPONSE
        </span>
        <p className="text-[8px] text-[#666] font-sans leading-relaxed -mt-1">
          Boxes sample the current wave field at their own center — this only sets how that intensity
          maps to opacity. Wave Frequency/Speed/Amplitude/Thickness/Softness/Origin, Dynamic Thickness
          and Audio Reactivity are all the existing WAVE tab controls.
        </p>
        {slider('RIPPLE OPACITY INFLUENCE', cfg.opacityInfluence, 'opacityInfluence', 0, 1, 0.02, '', 2)}
        <div className="grid grid-cols-2 gap-3">
          {slider('BASE OPACITY', cfg.baseOpacity, 'baseOpacity', 0, 1, 0.02, '', 2)}
          {slider('OPACITY SOFTNESS', cfg.opacitySoftness, 'opacitySoftness', 0.02, 1, 0.02, '', 2)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('MINIMUM OPACITY', cfg.minOpacity, 'minOpacity', 0, 1, 0.02, '', 2)}
          {slider('MAXIMUM OPACITY', cfg.maxOpacity, 'maxOpacity', 0, 1, 0.02, '', 2)}
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-[#1a1a1a]">
          <div>
            <span className="block text-[10px] uppercase text-white font-bold">INVERT OPACITY</span>
            <span className="text-[9px] text-[#777]">Boxes dim where the wave is strongest instead of lighting up</span>
          </div>
          <button
            type="button"
            onClick={() => update({ invertOpacity: !cfg.invertOpacity })}
            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border transition-all shrink-0 ml-2 ${
              cfg.invertOpacity
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-[#181818] text-[#777] border-[#333]'
            }`}
          >
            {cfg.invertOpacity ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  );
};
