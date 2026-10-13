import React, { useState } from 'react';
import { TypographyTilesConfig } from './types';
import { Type, Palette, Waves, MousePointerClick, Plus, Trash2, Upload } from 'lucide-react';

interface TypographyTilesControlsProps {
  config: TypographyTilesConfig;
  onUpdate: (patch: Partial<TypographyTilesConfig>) => void;
}

const FONT_CHOICES = ['Arial', 'Helvetica', 'Georgia', 'Inter', 'Space Grotesk', 'Anton', 'Bungee', 'JetBrains Mono'];
const PALETTE_ADD_COLORS = ['#00E0FF', '#FF6B6B', '#A78BFA', '#FDBA74', '#34D399'];

/**
 * Editable controls for the Interactive Generative Typography ("Tile Break") engine — content/font/
 * dot geometry, palette, hover push physics, and the click ripple's own Speed/Thickness/Max
 * Radius/Pulse Strength/Color Band (a bespoke one-shot ring, not the shared wave engine).
 */
export const TypographyTilesControls: React.FC<TypographyTilesControlsProps> = ({ config: cfg, onUpdate }) => {
  const [customFonts, setCustomFonts] = useState<string[]>([]);
  const [fontUploadError, setFontUploadError] = useState<string | null>(null);

  const handleFontFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFontUploadError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const fontName = file.name.replace(/\.[^/.]+$/, '').trim() || 'Custom Tile Font';
      const fontFace = new FontFace(fontName, arrayBuffer);
      await fontFace.load();
      document.fonts.add(fontFace);
      setCustomFonts((prev) => (prev.includes(fontName) ? prev : [...prev, fontName]));
      onUpdate({ fontFamily: fontName });
    } catch (err) {
      console.error('Failed to load local font for Typography Tiles:', err);
      setFontUploadError('Could not load this font file — use a valid .ttf, .otf, .woff, or .woff2.');
    }
  };

  const slider = (
    label: string,
    value: number,
    field: keyof TypographyTilesConfig,
    min: number,
    max: number,
    step: number,
    unit = '',
    decimals = 2
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
        onChange={(e) => onUpdate({ [field]: parseFloat(e.target.value) } as Partial<TypographyTilesConfig>)}
        className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-amber-500"
      />
    </div>
  );

  const colorField = (label: string, value: string, field: keyof TypographyTilesConfig) => (
    <div>
      <label className="text-[#888] text-[10px] uppercase block mb-1">{label}</label>
      <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#222] rounded p-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onUpdate({ [field]: e.target.value } as Partial<TypographyTilesConfig>)}
          className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
        />
        <span className="text-[10px] text-[#cbd5e1] uppercase">{value}</span>
      </div>
    </div>
  );

  const handlePaletteColorChange = (idx: number, color: string) => {
    const next = [...cfg.palette];
    next[idx] = color;
    onUpdate({ palette: next });
  };
  const handlePaletteAdd = () => {
    if (cfg.palette.length >= 8) return;
    onUpdate({ palette: [...cfg.palette, PALETTE_ADD_COLORS[cfg.palette.length % PALETTE_ADD_COLORS.length]] });
  };
  const handlePaletteRemove = (idx: number) => {
    if (cfg.palette.length <= 1) return;
    onUpdate({ palette: cfg.palette.filter((_, i) => i !== idx) });
  };

  const allFonts = [...new Set([...FONT_CHOICES, ...customFonts, cfg.fontFamily])];

  return (
    <div className="space-y-4 font-mono p-3">
      <div className="flex items-center justify-between pb-2 border-b border-[#222]">
        <div className="flex items-center space-x-2">
          <Type className="w-4 h-4 text-amber-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">TILE BREAK — INTERACTIVE TYPOGRAPHY</span>
        </div>
      </div>

      {/* Text & Font */}
      <div className="space-y-2.5 p-3 bg-[#0d0d12] border border-[#262630] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-amber-400 flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5" /> TEXT
        </span>
        <textarea
          value={cfg.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          rows={2}
          className="w-full bg-[#0A0A0A] border border-[#222] rounded p-2 text-[11px] text-white font-mono focus:outline-none focus:border-amber-500 resize-none"
          placeholder="TEXT"
        />

        <div>
          <label className="text-[#888] text-[10px] uppercase block mb-1">FONT FAMILY</label>
          <select
            value={cfg.fontFamily}
            onChange={(e) => onUpdate({ fontFamily: e.target.value })}
            className="w-full bg-[#0A0A0A] border border-[#222] rounded p-1.5 text-[11px] text-white font-mono focus:outline-none focus:border-amber-500"
          >
            {allFonts.map((f) => (
              <option key={f} value={f} style={{ fontFamily: f }}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <label className="cursor-pointer py-1.5 px-3 bg-[#161616] hover:bg-[#202020] border border-[#333] hover:border-amber-500 rounded text-center text-[10px] text-[#ccc] hover:text-white uppercase transition-colors flex items-center justify-center gap-2">
          <Upload className="w-3.5 h-3.5 text-amber-400" />
          <span>UPLOAD FONT (.TTF, .OTF, .WOFF, .WOFF2)</span>
          <input type="file" accept=".ttf,.otf,.woff,.woff2" onChange={handleFontFileUpload} className="hidden" />
        </label>
        {fontUploadError && <p className="text-[9px] text-rose-400 leading-relaxed">{fontUploadError}</p>}

        <div className="grid grid-cols-3 gap-1.5">
          {[400, 700, 900].map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => onUpdate({ fontWeight: w })}
              className={`p-1.5 rounded border text-center transition-colors ${
                cfg.fontWeight === w
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                  : 'bg-[#121212] border-[#222] text-[#888] hover:text-white'
              }`}
            >
              <span className="block text-[9px] font-bold uppercase">
                {w === 400 ? 'REGULAR' : w === 700 ? 'BOLD' : 'BLACK'}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {slider('FONT SIZE', cfg.fontSize, 'fontSize', 40, 420, 2, 'px', 0)}
          {slider('DOT SPACING', cfg.tileSize, 'tileSize', 3, 24, 1, 'px', 0)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('DOT SIZE', cfg.baseDotScale, 'baseDotScale', 0.2, 1, 0.02, '', 2)}
        </div>
        <p className="text-[8px] text-[#666] font-sans leading-relaxed">
          Text is sampled as a grid of round dots (halftone-style) — smaller spacing = finer, more
          physics-driven dots (heavier). The glyph itself always stays crisp underneath, never drawn
          pixel by pixel.
        </p>

        {colorField('BACKGROUND', cfg.bgColor, 'bgColor')}
      </div>

      {/* Palette */}
      <div className="space-y-2.5 p-3 bg-[#0d0d12] border border-[#262630] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-amber-400 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5" /> COLOR PALETTE
        </span>
        <div className="flex flex-wrap gap-1.5">
          {cfg.palette.map((c, idx) => (
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
                disabled={cfg.palette.length <= 1}
                className="text-[#555] hover:text-rose-400 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handlePaletteAdd}
            disabled={cfg.palette.length >= 8}
            className="flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 px-2 py-1.5 rounded border border-amber-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" /> ADD
          </button>
        </div>
      </div>

      {/* Hover Push */}
      <div className="space-y-2.5 p-3 bg-[#0d0d12] border border-[#262630] rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase text-amber-400 flex items-center gap-1.5">
            <MousePointerClick className="w-3.5 h-3.5" /> HOVER PUSH
          </span>
          <button
            type="button"
            onClick={() => onUpdate({ hoverEnabled: !cfg.hoverEnabled })}
            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border transition-all ${
              cfg.hoverEnabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-[#181818] text-[#777] border-[#333]'
            }`}
          >
            {cfg.hoverEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        {cfg.hoverEnabled && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {slider('HOVER RADIUS', cfg.hoverRadius, 'hoverRadius', 30, 400, 2, 'px', 0)}
              {slider('PUSH FORCE', cfg.hoverPushForce, 'hoverPushForce', 0.2, 8, 0.1, '', 1)}
            </div>
          </>
        )}
        <div className="grid grid-cols-3 gap-3 pt-1 border-t border-[#1a1a1a]">
          {slider('SPRING', cfg.spring, 'spring', 0.01, 0.3, 0.005, '', 3)}
          {slider('FRICTION', cfg.friction, 'friction', 0.5, 0.95, 0.01, '', 2)}
          {slider('COLOR EASE', cfg.colorEase, 'colorEase', 0.02, 0.4, 0.01, '', 2)}
        </div>
      </div>

      {/* Click Ripple */}
      <div className="space-y-2.5 p-3 bg-[#0d0d12] border border-[#262630] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-amber-400 flex items-center gap-1.5">
          <Waves className="w-3.5 h-3.5" /> CLICK RIPPLE
        </span>
        <p className="text-[8px] text-[#666] font-sans leading-relaxed -mt-1">
          Click anywhere on the canvas to send out a single expanding ring from that point — its own
          bespoke one-shot ripple (speed/thickness/fade), not the shared wave engine other materials
          use. It only pulses each dot's size/colour as it passes — never displaces or distorts them.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {slider('SPEED', cfg.rippleSpeed, 'rippleSpeed', 100, 3000, 20, 'px/s', 0)}
          {slider('THICKNESS', cfg.rippleThickness, 'rippleThickness', 5, 300, 5, 'px', 0)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('MAX RADIUS', cfg.rippleMaxRadius, 'rippleMaxRadius', 200, 4000, 50, 'px', 0)}
          {slider('PULSE STRENGTH', cfg.ripplePulseStrength, 'ripplePulseStrength', 0, 1.5, 0.05, '', 2)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('COLOR BAND', cfg.rippleColorBandSize, 'rippleColorBandSize', 0, 300, 5, 'px', 0)}
        </div>
      </div>
    </div>
  );
};
