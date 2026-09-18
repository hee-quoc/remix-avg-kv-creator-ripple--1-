import React, { useState } from 'react';
import { RenderState, ThemeId, CustomSvgLayer, CustomSvgDistribution } from '../types';
import { PRESETS } from '../data/presets';
import { DEFAULT_CUSTOM_SVG_LAYERS } from '../utils/particleRenderer';
import { PresetGallery } from './PresetGallery';
import { VisualStyleGallery } from './VisualStyleGallery';
import { AudioReactivityControls } from './AudioReactivityControls';
import { CompositionModeControls } from './CompositionModeControls';
import { TextLayoutControls } from './TextLayoutControls';
import { WaveVariationControls } from './WaveVariationControls';
import { FrequencyMappingControls } from './FrequencyMappingControls';
import { DynamicThicknessControls } from './DynamicThicknessControls';
import { Radial3DControls } from './Radial3DControls';
import { AsciiControls } from './AsciiControls';
import { TangentLineControls } from './TangentLineControls';
import { ModularStripControls } from './ModularStripControls';
import { TypographyRippleControls } from './TypographyRippleControls';
import { StitchCraftControls } from './StitchCraftControls';
import { MultiColorDotControls } from './MultiColorDotControls';
import {
  Type,
  Grid,
  Radio,
  Palette,
  Sparkles,
  Download,
  FileCode,
  Video,
  ChevronRight,
  RotateCcw,
  Layers,
  Activity,
  Compass,
  Zap,
  Sliders,
  Maximize2,
  Upload,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Link,
  Unlink,
  Layout,
  Waves
} from 'lucide-react';

interface ControlsDrawerProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (presetId: string) => void;
  onSelectFlipDiscPreset?: (presetId: string) => void;
}

type TabType = 'presets' | 'styles' | 'composition' | 'typography' | 'grid' | 'wavefront' | 'style';

const FONT_OPTIONS = [
  { name: 'Space Grotesk', category: 'Display Sans' },
  { name: 'Syne', category: 'Geometric Heavy' },
  { name: 'Instrument Serif', category: 'High Contrast Serif' },
  { name: 'Anton', category: 'Ultra Bold' },
  { name: 'JetBrains Mono', category: 'Scientific Monospace' },
  { name: 'Bungee', category: 'Monolithic' },
  { name: 'Cinzel', category: 'Classic Display' },
  { name: 'Inter', category: 'Clean Neutral' }
];

const THEMES: { id: ThemeId; name: string; dot: string; bg: string; accent: string }[] = [
  { id: 'dark_radar', name: 'Dark Radar', dot: '#00f0ff', bg: '#0a0d14', accent: '#38bdf8' },
  { id: 'swiss_editorial', name: 'Swiss Editorial', dot: '#0f172a', bg: '#f8fafc', accent: '#dc2626' },
  { id: 'neon_scientific', name: 'Neon Scientific', dot: '#22c55e', bg: '#051d11', accent: '#4ade80' },
  { id: 'blueprint_cyan', name: 'Blueprint Cyan', dot: '#38bdf8', bg: '#031930', accent: '#00f0ff' },
  { id: 'cyber_freq', name: 'Cyber Freq', dot: '#ec4899', bg: '#18021e', accent: '#a855f7' },
  { id: 'solarized', name: 'Solarized Gold', dot: '#f59e0b', bg: '#1c1917', accent: '#fbbf24' },
  { id: 'thermal', name: 'Thermal Scan', dot: '#facc15', bg: '#180029', accent: '#f43f5e' },
  { id: 'minimal_noir', name: 'Minimal Noir', dot: '#ffffff', bg: '#000000', accent: '#94a3b8' }
];

export const ControlsDrawer: React.FC<ControlsDrawerProps> = ({
  state,
  onUpdateState,
  isOpen,
  onClose,
  onSelectPreset,
  onSelectFlipDiscPreset
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('typography');
  const [videoDuration, setVideoDuration] = useState(5);
  const [customFonts, setCustomFonts] = useState<{ name: string; category: string }[]>([]);
  const [maskLinkAspect, setMaskLinkAspect] = useState(true);

  const handleFontFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const fontName = file.name.replace(/\.[^/.]+$/, '').trim() || 'Custom Local Font';

      const fontFace = new FontFace(fontName, arrayBuffer);
      await fontFace.load();
      document.fonts.add(fontFace);

      setCustomFonts((prev) => {
        if (prev.some((f) => f.name === fontName)) return prev;
        return [...prev, { name: fontName, category: 'Local Font' }];
      });

      onUpdateState((prev) => ({
        ...prev,
        font: {
          ...prev.font,
          fontFamily: fontName,
          customFontName: fontName
        }
      }));
    } catch (err) {
      console.error('Failed to load local font:', err);
      alert('Could not load the font file. Please ensure it is a valid .ttf, .otf, .woff, or .woff2 file.');
    }
  };

  if (!isOpen) return null;

  const triggerExport = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.click();
  };

  const applyTheme = (theme: (typeof THEMES)[0]) => {
    onUpdateState((prev) => ({
      ...prev,
      style: {
        ...prev.style,
        theme: theme.id,
        dotColor: theme.dot,
        bgColor: theme.bg,
        accentColor: theme.accent
      }
    }));
  };

  return (
    <div className="w-80 sm:w-96 bg-[#0D0D0D] border-l border-[#222] h-full flex flex-col z-20 text-[#E0E0E0] shadow-2xl shrink-0 font-mono">
      {/* Drawer Header Tabs */}
      <div className="grid grid-cols-4 sm:grid-cols-7 border-b border-[#222] bg-[#0A0A0A] p-1 gap-0.5">
        <button
          onClick={() => setActiveTab('presets')}
          className={`py-1.5 px-1 rounded text-[9px] font-mono tracking-wider transition-colors text-center ${
            activeTab === 'presets'
              ? 'bg-[#222] text-[#00F0FF] border border-[#00F0FF]/50 font-bold'
              : 'text-[#777] hover:text-[#ccc] hover:bg-[#151515]'
          }`}
          title="KV Presets & Production Exports"
        >
          PRESETS
        </button>

        <button
          onClick={() => setActiveTab('styles')}
          className={`py-1.5 px-1 rounded text-[9px] font-mono tracking-wider transition-colors text-center ${
            activeTab === 'styles'
              ? 'bg-[#222] text-[#00F0FF] border border-[#00F0FF]/50 font-bold'
              : 'text-[#777] hover:text-[#ccc] hover:bg-[#151515]'
          }`}
          title="10 Visual Styles Library"
        >
          STYLES
        </button>

        <button
          onClick={() => setActiveTab('composition')}
          className={`py-1.5 px-1 rounded text-[9px] font-mono tracking-wider transition-colors text-center ${
            activeTab === 'composition'
              ? 'bg-[#222] text-[#00F0FF] border border-[#00F0FF]/50 font-bold'
              : 'text-[#777] hover:text-[#ccc] hover:bg-[#151515]'
          }`}
          title="Composition & Molecule Wave Mode"
        >
          LAYOUT
        </button>

        <button
          onClick={() => setActiveTab('typography')}
          className={`py-1.5 px-1 rounded text-[9px] font-mono tracking-wider transition-colors text-center ${
            activeTab === 'typography'
              ? 'bg-[#222] text-[#00F0FF] border border-[#00F0FF]/50 font-bold'
              : 'text-[#777] hover:text-[#ccc] hover:bg-[#151515]'
          }`}
          title="Typography Settings"
        >
          TEXT
        </button>

        <button
          onClick={() => setActiveTab('grid')}
          className={`py-1.5 px-1 rounded text-[9px] font-mono tracking-wider transition-colors text-center ${
            activeTab === 'grid'
              ? 'bg-[#222] text-[#00F0FF] border border-[#00F0FF]/50 font-bold'
              : 'text-[#777] hover:text-[#ccc] hover:bg-[#151515]'
          }`}
          title="Halftone Grid & Molecule Shapes"
        >
          GRID
        </button>

        <button
          onClick={() => setActiveTab('wavefront')}
          className={`py-1.5 px-1 rounded text-[9px] font-mono tracking-wider transition-colors text-center ${
            activeTab === 'wavefront'
              ? 'bg-[#222] text-[#00F0FF] border border-[#00F0FF]/50 font-bold'
              : 'text-[#777] hover:text-[#ccc] hover:bg-[#151515]'
          }`}
          title="Wave Dynamics & Audio Reactivity"
        >
          WAVE
        </button>

        <button
          onClick={() => setActiveTab('style')}
          className={`py-1.5 px-1 rounded text-[9px] font-mono tracking-wider transition-colors text-center col-span-2 sm:col-span-1 ${
            activeTab === 'style'
              ? 'bg-[#222] text-[#00F0FF] border border-[#00F0FF]/50 font-bold'
              : 'text-[#777] hover:text-[#ccc] hover:bg-[#151515]'
          }`}
          title="Color Palettes & Visual FX"
        >
          STYLE
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs font-mono">
        {/* ================= TAB 1: TYPOGRAPHY & OBJECT MASK ================= */}
        {activeTab === 'typography' && (
          <div className="space-y-4">
            {/* 01_TEXT INPUT (ALWAYS ACCESSIBLE) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[#888888] font-mono text-[11px] uppercase tracking-wider">
                  01_TEXT_INPUT
                </label>
                {(!state.font.maskMode || state.font.maskMode === 'text') && (
                  <span className="text-[9px] text-[#00F0FF] font-mono uppercase font-bold">
                    [ACTIVE MASK]
                  </span>
                )}
              </div>
              <textarea
                value={state.font.text}
                onChange={(e) =>
                  onUpdateState((prev) => ({
                    ...prev,
                    font: { ...prev.font, text: e.target.value }
                  }))
                }
                rows={3}
                className="w-full bg-[#0A0A0A] border border-[#222] rounded p-2.5 text-[#E0E0E0] font-mono font-bold focus:outline-none focus:border-[#00F0FF] transition-colors placeholder-[#444]"
                placeholder="Type kinetic text..."
              />
            </div>

            {/* 02_OBJECT MASK SOURCE (TEXT vs SHAPE vs SVG MASK) */}
            <div className="p-3 bg-[#0A0A0A] border border-[#222] rounded space-y-2.5 font-mono">
              <label className="block text-[#E0E0E0] text-[11px] font-bold uppercase tracking-wider">
                02_OVERALL OBJECT MASK
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'text', name: 'TEXT' },
                    { id: 'shape', name: 'GEOMETRIC' },
                    { id: 'svg_mask', name: 'SVG LOGO' }
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() =>
                      onUpdateState((prev) => ({
                        ...prev,
                        font: { ...prev.font, maskMode: mode.id }
                      }))
                    }
                    className={`py-1.5 px-2 rounded border text-center text-[10px] font-mono uppercase transition-colors ${
                      (state.font.maskMode || 'text') === mode.id
                        ? 'bg-[#222] border-[#00F0FF] text-[#00F0FF] font-bold shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                        : 'bg-[#121212] border-[#222] text-[#888888] hover:text-white'
                    }`}
                  >
                    {mode.name}
                  </button>
                ))}
              </div>

              {state.font.maskMode === 'shape' && (
                <div className="pt-2 border-t border-[#1a1a1a] space-y-1.5">
                  <span className="text-[10px] text-[#888] uppercase block">CHOOSE OBJECT SHAPE:</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(
                      [
                        { id: 'circle', name: 'CIRCLE' },
                        { id: 'square', name: 'SQUARE' },
                        { id: 'ring', name: 'DONUT' },
                        { id: 'star', name: 'STAR' },
                        { id: 'heart', name: 'HEART' },
                        { id: 'hexagon', name: 'HEXAGON' },
                        { id: 'diamond', name: 'DIAMOND' },
                        { id: 'shield', name: 'SHIELD' }
                      ] as const
                    ).map((shp) => (
                      <button
                        key={shp.id}
                        type="button"
                        onClick={() =>
                          onUpdateState((prev) => ({
                            ...prev,
                            font: { ...prev.font, shapeType: shp.id }
                          }))
                        }
                        className={`py-1 px-1 rounded border text-center text-[9px] font-mono uppercase transition-colors ${
                          (state.font.shapeType || 'circle') === shp.id
                            ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF] font-bold'
                            : 'bg-[#161616] border-[#2b2b2b] text-[#888] hover:text-white'
                        }`}
                      >
                        {shp.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {state.font.maskMode === 'svg_mask' && (
                <div className="pt-2 border-t border-[#1a1a1a] space-y-2">
                  <span className="text-[10px] text-[#888] uppercase block">UPLOAD SVG MASK LOGO:</span>
                  {state.font.maskSvgName ? (
                    <div className="p-2 bg-[#141414] border border-[#262626] rounded flex items-center justify-between text-[10px]">
                      <span className="text-[#00F0FF] truncate max-w-[150px]">
                        {state.font.maskSvgName}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateState((prev) => ({
                            ...prev,
                            font: {
                              ...prev.font,
                              maskSvgDataUrl: undefined,
                              maskSvgXml: undefined,
                              maskSvgName: undefined,
                              maskMode: 'text'
                            }
                          }))
                        }
                        className="text-rose-400 hover:text-rose-300 text-[9px] uppercase hover:underline ml-2"
                      >
                        CLEAR
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer py-1.5 px-3 bg-[#161616] hover:bg-[#202020] border border-[#333] hover:border-[#00F0FF] rounded text-center text-[10px] text-[#ccc] hover:text-white uppercase transition-colors flex items-center justify-center gap-2">
                      <Upload className="w-3.5 h-3.5 text-[#00F0FF]" />
                      <span>UPLOAD SVG MASK FILE</span>
                      <input
                        type="file"
                        accept=".svg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const readerText = new FileReader();
                          readerText.onload = (event) => {
                            const xml = event.target?.result as string;
                            const readerUrl = new FileReader();
                            readerUrl.onload = (evUrl) => {
                              const dataUrl = evUrl.target?.result as string;
                              onUpdateState((prev) => ({
                                ...prev,
                                font: {
                                  ...prev.font,
                                  maskMode: 'svg_mask',
                                  maskSvgXml: xml,
                                  maskSvgDataUrl: dataUrl,
                                  maskSvgName: file.name
                                }
                              }));
                            };
                            readerUrl.readAsDataURL(file);
                          };
                          readerText.readAsText(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              )}

              {/* MASK / LOGO SCALE CONTROL (HORIZONTAL & VERTICAL) */}
              <div className="pt-2 border-t border-[#1a1a1a] space-y-2 font-mono">
                <div className="flex items-center justify-between text-[10px] text-[#888888]">
                  <span className="uppercase tracking-wider">SVG LOGO / MASK SCALE</span>
                  <button
                    type="button"
                    onClick={() => setMaskLinkAspect(!maskLinkAspect)}
                    className={`flex items-center space-x-1 text-[9px] px-2 py-0.5 rounded border transition-colors ${
                      maskLinkAspect
                        ? 'border-[#00F0FF] text-[#00F0FF] bg-[#00F0FF]/10'
                        : 'border-[#444] text-[#888] bg-transparent'
                    }`}
                    title={maskLinkAspect ? 'Aspect ratio linked' : 'Aspect ratio unlinked'}
                  >
                    {maskLinkAspect ? <Link className="w-2.5 h-2.5" /> : <Unlink className="w-2.5 h-2.5" />}
                    <span>{maskLinkAspect ? 'LINKED' : 'UNLINKED'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <div>
                    <div className="flex justify-between text-[#888] mb-1">
                      <span>SCALE H (X)</span>
                      <span className="text-[#00F0FF] font-bold">
                        {(state.font.maskScaleX ?? state.font.maskScale ?? 1.0).toFixed(2)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="3.0"
                      step="0.05"
                      value={state.font.maskScaleX ?? state.font.maskScale ?? 1.0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onUpdateState((prev) => ({
                          ...prev,
                          font: {
                            ...prev.font,
                            maskScaleX: val,
                            maskScaleY: maskLinkAspect ? val : (prev.font.maskScaleY ?? prev.font.maskScale ?? 1.0),
                            maskScale: val
                          }
                        }));
                      }}
                      className="w-full h-1.5 bg-[#222] appearance-none cursor-pointer accent-[#00F0FF] rounded"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[#888] mb-1">
                      <span>SCALE V (Y)</span>
                      <span className="text-[#00F0FF] font-bold">
                        {(state.font.maskScaleY ?? state.font.maskScale ?? 1.0).toFixed(2)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="3.0"
                      step="0.05"
                      value={state.font.maskScaleY ?? state.font.maskScale ?? 1.0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onUpdateState((prev) => ({
                          ...prev,
                          font: {
                            ...prev.font,
                            maskScaleY: val,
                            maskScaleX: maskLinkAspect ? val : (prev.font.maskScaleX ?? prev.font.maskScale ?? 1.0),
                            maskScale: val
                          }
                        }));
                      }}
                      className="w-full h-1.5 bg-[#222] appearance-none cursor-pointer accent-[#00F0FF] rounded"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[#888888] font-mono text-[11px] uppercase tracking-wider">03_FONT_FAMILY</label>
                {state.font.customFontName && (
                  <span className="text-[9px] text-[#00F0FF] font-mono uppercase truncate max-w-[120px]">
                    LOCAL: {state.font.customFontName}
                  </span>
                )}
              </div>
              <select
                value={state.font.fontFamily}
                onChange={(e) =>
                  onUpdateState((prev) => ({
                    ...prev,
                    font: { ...prev.font, fontFamily: e.target.value }
                  }))
                }
                className="w-full bg-[#0A0A0A] border border-[#222] rounded p-2 text-[#E0E0E0] font-mono focus:outline-none focus:border-[#00F0FF]"
              >
                {[...customFonts, ...FONT_OPTIONS].map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name} ({f.category})
                  </option>
                ))}
              </select>

              <div className="mt-2">
                <label className="cursor-pointer w-full py-2 px-3 bg-[#121212] hover:bg-[#1e1e1e] border border-[#222] hover:border-[#00F0FF] rounded text-center text-[10px] font-mono text-[#ccc] hover:text-white uppercase transition-colors flex items-center justify-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span>UPLOAD LOCAL FONT (.TTF, .OTF, .WOFF, .WOFF2)</span>
                  <input
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
                    onChange={handleFontFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center text-[#888888] mb-1 text-[11px] font-mono">
                  <span>SIZE</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="10"
                      max="500"
                      value={state.font.fontSize}
                      onChange={(e) => {
                        const val = Math.max(10, Math.min(500, parseFloat(e.target.value) || 10));
                        onUpdateState((prev) => ({
                          ...prev,
                          font: { ...prev.font, fontSize: val }
                        }));
                      }}
                      className="w-14 bg-[#0A0A0A] border border-[#333] focus:border-[#00F0FF] rounded px-1.5 py-0.5 text-right text-[#00F0FF] text-[10px] font-bold font-mono focus:outline-none"
                    />
                    <span className="text-[#888]">px</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="10"
                  max="500"
                  value={state.font.fontSize}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      font: { ...prev.font, fontSize: parseFloat(e.target.value) }
                    }))
                  }
                  className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#888888] mb-1 text-[11px] font-mono">
                  <span>WEIGHT</span>
                  <span className="text-[#00F0FF]">{state.font.fontWeight}</span>
                </div>
                <select
                  value={state.font.fontWeight}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      font: { ...prev.font, fontWeight: parseInt(e.target.value) }
                    }))
                  }
                  className="w-full bg-[#0A0A0A] border border-[#222] rounded p-1.5 text-[#E0E0E0] font-mono"
                >
                  <option value="300">300 - LIGHT</option>
                  <option value="400">400 - REGULAR</option>
                  <option value="700">700 - BOLD</option>
                  <option value="900">900 - HEAVY</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[#888888] mb-1 text-[11px] font-mono">
                  <span>SPACING</span>
                  <span className="text-[#00F0FF]">{state.font.letterSpacing}px</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="30"
                  value={state.font.letterSpacing}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      font: { ...prev.font, letterSpacing: parseFloat(e.target.value) }
                    }))
                  }
                  className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#888888] mb-1 text-[11px] font-mono">
                  <span>LINE HEIGHT</span>
                  <span className="text-[#00F0FF]">{state.font.lineHeight.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.8"
                  step="0.05"
                  value={state.font.lineHeight}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      font: { ...prev.font, lineHeight: parseFloat(e.target.value) }
                    }))
                  }
                  className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#888888] mb-1 font-mono text-[11px] uppercase tracking-wider">TEXT ALIGNMENT</label>
              <div className="grid grid-cols-3 gap-1 bg-[#0A0A0A] p-1 rounded border border-[#222]">
                {(['left', 'center', 'right'] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() =>
                      onUpdateState((prev) => ({
                        ...prev,
                        font: { ...prev.font, textAlign: align }
                      }))
                    }
                    className={`py-1 rounded text-center uppercase text-[10px] font-mono ${
                      state.font.textAlign === align
                        ? 'bg-[#222] text-[#00F0FF] border border-[#00F0FF]/40 font-bold'
                        : 'text-[#888888] hover:text-white'
                    }`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#222] flex items-center justify-between">
              <div>
                <span className="block font-bold text-[#E0E0E0] text-[11px] font-mono uppercase">Invert Halftone Mask</span>
                <span className="text-[10px] text-[#888888] font-mono">Dots inside text vs full canvas</span>
              </div>
              <input
                type="checkbox"
                checked={state.font.invertText}
                onChange={(e) =>
                  onUpdateState((prev) => ({
                    ...prev,
                    font: { ...prev.font, invertText: e.target.checked }
                  }))
                }
                className="w-4 h-4 accent-[#00F0FF] bg-[#0A0A0A] border-[#333] cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* ================= TAB 2: GRID & HALFTONE ================= */}
        {activeTab === 'grid' && (
          <div className="space-y-4">
            <div>
              <label className="block text-[#888888] mb-1 font-mono text-[11px] uppercase tracking-wider">GRID ARCHITECTURE</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() =>
                    onUpdateState((prev) => ({
                      ...prev,
                      grid: { ...prev.grid, gridType: 'square' }
                    }))
                  }
                  className={`p-2 rounded border text-left flex flex-col font-mono transition-colors ${
                    state.grid.gridType === 'square'
                      ? 'bg-[#222] border-[#00F0FF] text-[#00F0FF]'
                      : 'bg-[#0A0A0A] border-[#222] text-[#888888] hover:text-[#ccc]'
                  }`}
                >
                  <span className="font-bold uppercase text-[10px]">SQUARE</span>
                  <span className="text-[8px] opacity-70">Matrix</span>
                </button>

                <button
                  onClick={() =>
                    onUpdateState((prev) => ({
                      ...prev,
                      grid: { ...prev.grid, gridType: 'hexagonal' }
                    }))
                  }
                  className={`p-2 rounded border text-left flex flex-col font-mono transition-colors ${
                    state.grid.gridType === 'hexagonal'
                      ? 'bg-[#222] border-[#00F0FF] text-[#00F0FF]'
                      : 'bg-[#0A0A0A] border-[#222] text-[#888888] hover:text-[#ccc]'
                  }`}
                >
                  <span className="font-bold uppercase text-[10px]">HEXAGONAL</span>
                  <span className="text-[8px] opacity-70">Honeycomb</span>
                </button>

                <button
                  onClick={() =>
                    onUpdateState((prev) => ({
                      ...prev,
                      grid: { ...prev.grid, gridType: 'radial' }
                    }))
                  }
                  className={`p-2 rounded border text-left flex flex-col font-mono transition-colors ${
                    state.grid.gridType === 'radial'
                      ? 'bg-[#222] border-[#00F0FF] text-[#00F0FF]'
                      : 'bg-[#0A0A0A] border-[#222] text-[#888888] hover:text-[#ccc]'
                  }`}
                >
                  <span className="font-bold uppercase text-[10px]">RADIAL</span>
                  <span className="text-[8px] opacity-70">Rings</span>
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[#888888] mb-1 text-[11px] font-mono">
                <span>DOT DENSITY (STEP)</span>
                <span className="text-[#00F0FF]">{state.grid.density}px</span>
              </div>
              <input
                type="range"
                min="5"
                max="32"
                value={state.grid.density}
                onChange={(e) =>
                  onUpdateState((prev) => ({
                    ...prev,
                    grid: { ...prev.grid, density: parseFloat(e.target.value) }
                  }))
                }
                className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
              />
            </div>

            {/* 01_STANDARD DOT PARTICLES */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[#888888] font-mono text-[11px] uppercase tracking-wider">
                  01_BUILT-IN DOT PARTICLES
                </label>
                {state.grid.dotShape !== 'custom_svg' && (
                  <span className="text-[9px] text-[#00F0FF] font-mono uppercase font-bold">
                    ACTIVE
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'circle', name: 'SOLID CIRCLE' },
                    { id: 'ring', name: 'DONUT RING' },
                    { id: 'soft_circle', name: 'SOFT GLOW' },
                    { id: 'square', name: 'SQUARE' },
                    { id: 'concentric_arc', name: 'CONCENTRIC ARC' },
                    { id: 'tangent_line', name: 'TANGENT LINE' },
                    { id: 'wave_ripple', name: 'WAVE RIPPLE' },
                    { id: 'stitch', name: 'STITCH THREAD' },
                    { id: 'woven', name: 'WOVEN TEXTILE' },
                    { id: 'ascii', name: 'ASCII MOLECULE' },
                    { id: 'extruded_block', name: 'EXTRUDED 2.5D' },
                    { id: 'tile', name: 'VORTEX TILE' }
                  ] as const
                ).map((shape) => (
                  <button
                    key={shape.id}
                    type="button"
                    onClick={() =>
                      onUpdateState((prev) => ({
                        ...prev,
                        grid: { ...prev.grid, dotShape: shape.id }
                      }))
                    }
                    className={`py-2 px-2 rounded border text-center text-[10px] font-mono uppercase transition-colors ${
                      state.grid.dotShape === shape.id
                        ? 'bg-[#222] border-[#00F0FF] text-[#00F0FF] font-bold shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                        : 'bg-[#0A0A0A] border-[#222] text-[#888888] hover:text-white'
                    }`}
                  >
                    {shape.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Feature C: ASCII Molecule Controls when ASCII is selected */}
            {state.grid.dotShape === 'ascii' && (
              <AsciiControls state={state} onUpdateState={onUpdateState} />
            )}

            {/* Tangent Line material controls when tangent_line shape is selected */}
            {state.grid.dotShape === 'tangent_line' && (
              <TangentLineControls state={state} onUpdateState={onUpdateState} />
            )}

            {/* Stitch Craft Controls when stitch/woven shape or style is selected */}
            {(state.grid.dotShape === 'stitch' ||
              state.grid.dotShape === 'woven' ||
              state.style.visualStyle === 'stitch_craft') && (
              <StitchCraftControls state={state} onUpdateState={onUpdateState} />
            )}

            {/* Modular Signal Field Controls (Breaking Signal redesign) when modular_strip is active */}
            {(state.grid.dotShape === 'modular_strip' || state.compositionMode === 'modular_signal_field') && (
              <ModularStripControls state={state} onUpdateState={onUpdateState} />
            )}

            {/* Typography Radial Ripple Controls (Breaking Signal redesign #2) */}
            {state.compositionMode === 'typography_ripple' && (
              <TypographyRippleControls state={state} onUpdateState={onUpdateState} />
            )}

            {/* Multi-Color Dot Controls */}
            <MultiColorDotControls state={state} onUpdateState={onUpdateState} />

            {/* 02_CUSTOM SVG MULTI-LAYER & RECOLOR MATRIX */}
            <div className="p-3 bg-[#0A0A0A] border border-[#222] rounded space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-[#E0E0E0] text-[11px] font-bold uppercase tracking-wider">
                    02_CUSTOM SVG DOT LAYERS & RECOLOR
                  </label>
                  <span className="text-[9px] text-[#888888]">
                    Multi-layer vector particles with per-layer recoloring
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateState((prev) => ({
                      ...prev,
                      grid: {
                        ...prev.grid,
                        dotShape: prev.grid.dotShape === 'custom_svg' ? 'circle' : 'custom_svg',
                        customSvgLayers:
                          prev.grid.customSvgLayers && prev.grid.customSvgLayers.length > 0
                            ? prev.grid.customSvgLayers
                            : DEFAULT_CUSTOM_SVG_LAYERS
                      }
                    }))
                  }
                  className={`px-2.5 py-1 text-[9px] rounded font-bold uppercase border transition-all ${
                    state.grid.dotShape === 'custom_svg'
                      ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/50 shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                      : 'bg-[#181818] text-[#777777] border-[#333333] hover:text-white'
                  }`}
                >
                  {state.grid.dotShape === 'custom_svg' ? 'ACTIVE' : 'ENABLE SVG'}
                </button>
              </div>

              {/* Layer Distribution Mode Selector */}
              <div className="pt-2 border-t border-[#222] space-y-1.5">
                <span className="block text-[10px] text-[#888888] uppercase">LAYER DISTRIBUTION MODE</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'cycle', name: 'CYCLE / ALTERNATE' },
                      { id: 'stacked', name: 'STACK ALL LAYERS' },
                      { id: 'size_tier', name: 'SIZE TIERS' },
                      { id: 'random', name: 'RANDOM SCATTER' }
                    ] as const
                  ).map((dist) => (
                    <button
                      key={dist.id}
                      type="button"
                      onClick={() =>
                        onUpdateState((prev) => ({
                          ...prev,
                          grid: { ...prev.grid, dotShape: 'custom_svg', customSvgDistribution: dist.id }
                        }))
                      }
                      className={`py-1.5 px-2 rounded border text-center text-[9px] font-bold uppercase transition-all ${
                        (state.grid.customSvgDistribution || 'cycle') === dist.id
                          ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/50'
                          : 'bg-[#121212] text-[#888888] border-[#222] hover:text-white'
                      }`}
                    >
                      {dist.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Layers List */}
              <div className="pt-2 border-t border-[#222] space-y-2.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#00F0FF] font-bold uppercase flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#00F0FF]" />
                    <span>SVG LAYERS ({((state.grid.customSvgLayers || DEFAULT_CUSTOM_SVG_LAYERS).length)})</span>
                  </span>
                </div>

                {(state.grid.customSvgLayers || DEFAULT_CUSTOM_SVG_LAYERS).map((layer, index) => {
                  const currentLayers = state.grid.customSvgLayers || DEFAULT_CUSTOM_SVG_LAYERS;
                  const updateLayers = (newLayers: CustomSvgLayer[]) => {
                    onUpdateState((prev) => ({
                      ...prev,
                      grid: { ...prev.grid, dotShape: 'custom_svg', customSvgLayers: newLayers }
                    }));
                  };

                  return (
                    <div
                      key={layer.id}
                      className={`p-2.5 rounded border transition-colors space-y-2 ${
                        layer.enabled !== false
                          ? 'bg-[#111111] border-[#2a2a2a] hover:border-[#00F0FF]/40'
                          : 'bg-[#0a0a0a] border-[#1f1f1f] opacity-60'
                      }`}
                    >
                      {/* Layer Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2 min-w-0">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = currentLayers.map((l, i) =>
                                i === index ? { ...l, enabled: l.enabled === false } : l
                              );
                              updateLayers(updated);
                            }}
                            className={`p-1 rounded border shrink-0 transition-colors ${
                              layer.enabled !== false
                                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/50'
                                : 'bg-[#1a1a1a] text-[#555] border-[#333]'
                            }`}
                            title={layer.enabled !== false ? 'Layer Enabled' : 'Layer Disabled'}
                          >
                            {layer.enabled !== false ? (
                              <Eye className="w-3.5 h-3.5" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <input
                            type="text"
                            value={layer.name}
                            onChange={(e) => {
                              const updated = currentLayers.map((l, i) =>
                                i === index ? { ...l, name: e.target.value } : l
                              );
                              updateLayers(updated);
                            }}
                            className="bg-transparent text-white font-bold text-[10px] focus:outline-none focus:border-b border-[#00F0FF] truncate w-28 uppercase"
                          />
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = currentLayers.filter((_, i) => i !== index);
                              updateLayers(updated.length > 0 ? updated : DEFAULT_CUSTOM_SVG_LAYERS);
                            }}
                            className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded transition-colors"
                            title="Delete Layer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Recolor Mode Selector */}
                      <div className="grid grid-cols-3 gap-1 bg-[#0a0a0a] p-1 rounded border border-[#222]">
                        {(
                          [
                            { id: 'theme', name: 'THEME' },
                            { id: 'custom', name: 'CUSTOM' },
                            { id: 'original', name: 'ORIGINAL' }
                          ] as const
                        ).map((mode) => (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => {
                              const updated = currentLayers.map((l, i) =>
                                i === index ? { ...l, recolorMode: mode.id } : l
                              );
                              updateLayers(updated);
                            }}
                            className={`py-1 text-[9px] font-bold uppercase rounded transition-colors ${
                              layer.recolorMode === mode.id
                                ? 'bg-[#222] text-[#00F0FF] border border-[#00F0FF]/40'
                                : 'text-[#777] hover:text-white'
                            }`}
                          >
                            {mode.name}
                          </button>
                        ))}
                      </div>

                      {/* Custom Color Input */}
                      {layer.recolorMode === 'custom' && (
                        <div className="flex items-center space-x-2 bg-[#080808] p-1.5 rounded border border-[#222]">
                          <span className="text-[9px] text-[#888] uppercase">RECOLOR:</span>
                          <input
                            type="color"
                            value={layer.customColor || '#00F0FF'}
                            onChange={(e) => {
                              const updated = currentLayers.map((l, i) =>
                                i === index ? { ...l, customColor: e.target.value } : l
                              );
                              updateLayers(updated);
                            }}
                            className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent"
                          />
                          <input
                            type="text"
                            value={layer.customColor || '#00F0FF'}
                            onChange={(e) => {
                              const updated = currentLayers.map((l, i) =>
                                i === index ? { ...l, customColor: e.target.value } : l
                              );
                              updateLayers(updated);
                            }}
                            className="w-full bg-transparent text-[#00F0FF] text-[10px] focus:outline-none uppercase"
                          />
                        </div>
                      )}

                      {/* Layer Fine-Tuning Controls */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1a1a1a] text-[9px]">
                        <div>
                          <div className="flex justify-between text-[#888] mb-0.5">
                            <span>SCALE H (X)</span>
                            <span className="text-[#00F0FF]">{(layer.scaleX ?? layer.scale ?? 1.0).toFixed(1)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="3.0"
                            step="0.1"
                            value={layer.scaleX ?? layer.scale ?? 1.0}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              const updated = currentLayers.map((l, i) =>
                                i === index ? { ...l, scaleX: val, scale: val } : l
                              );
                              updateLayers(updated);
                            }}
                            className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[#888] mb-0.5">
                            <span>SCALE V (Y)</span>
                            <span className="text-[#00F0FF]">{(layer.scaleY ?? layer.scale ?? 1.0).toFixed(1)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="3.0"
                            step="0.1"
                            value={layer.scaleY ?? layer.scale ?? 1.0}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              const updated = currentLayers.map((l, i) =>
                                i === index ? { ...l, scaleY: val, scale: val } : l
                              );
                              updateLayers(updated);
                            }}
                            className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[#888] mb-0.5">
                            <span>ROTATE</span>
                            <span className="text-[#00F0FF]">{layer.rotationOffset ?? 0}°</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            step="15"
                            value={layer.rotationOffset ?? 0}
                            onChange={(e) => {
                              const updated = currentLayers.map((l, i) =>
                                i === index ? { ...l, rotationOffset: parseInt(e.target.value, 10) } : l
                              );
                              updateLayers(updated);
                            }}
                            className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[#888] mb-0.5">
                            <span>OPACITY</span>
                            <span className="text-[#00F0FF]">
                              {Math.round((layer.opacity ?? 1.0) * 100)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.05"
                            value={layer.opacity ?? 1.0}
                            onChange={(e) => {
                              const updated = currentLayers.map((l, i) =>
                                i === index ? { ...l, opacity: parseFloat(e.target.value) } : l
                              );
                              updateLayers(updated);
                            }}
                            className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add Layer Actions */}
                <div className="space-y-2 pt-2 border-t border-[#222]">
                  <label className="cursor-pointer w-full py-2 px-3 bg-[#121212] hover:bg-[#1a1a1a] border border-[#333] hover:border-[#00F0FF] rounded text-center text-[10px] text-[#ccc] hover:text-white uppercase font-bold transition-colors flex items-center justify-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-[#00F0FF]" />
                    <span>UPLOAD NEW SVG FILE LAYER</span>
                    <input
                      type="file"
                      accept=".svg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const xml = ev.target?.result as string;
                          if (!xml) return;
                          const currentLayers =
                            state.grid.customSvgLayers && state.grid.customSvgLayers.length > 0
                              ? state.grid.customSvgLayers
                              : DEFAULT_CUSTOM_SVG_LAYERS;
                          const newLayer: CustomSvgLayer = {
                            id: `layer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                            name: file.name.replace('.svg', ''),
                            svgXml: xml,
                            recolorMode: 'theme',
                            scale: 1.0,
                            rotationOffset: 0,
                            opacity: 1.0,
                            enabled: true
                          };
                          onUpdateState((prev) => ({
                            ...prev,
                            grid: {
                              ...prev.grid,
                              dotShape: 'custom_svg',
                              customSvgLayers: [...currentLayers, newLayer]
                            }
                          }));
                        };
                        reader.readAsText(file);
                      }}
                      className="hidden"
                    />
                  </label>

                  {/* Add Built-in Layer Presets */}
                  <div className="grid grid-cols-3 gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const currentLayers =
                          state.grid.customSvgLayers && state.grid.customSvgLayers.length > 0
                            ? state.grid.customSvgLayers
                            : DEFAULT_CUSTOM_SVG_LAYERS;
                        const newLayer: CustomSvgLayer = {
                          id: `layer_${Date.now()}`,
                          name: 'Star Burst',
                          svgXml: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z"/></svg>`,
                          recolorMode: 'theme',
                          scale: 1.0,
                          rotationOffset: 0,
                          opacity: 1.0,
                          enabled: true
                        };
                        onUpdateState((prev) => ({
                          ...prev,
                          grid: {
                            ...prev.grid,
                            dotShape: 'custom_svg',
                            customSvgLayers: [...currentLayers, newLayer]
                          }
                        }));
                      }}
                      className="py-1 px-1.5 bg-[#0e0e0e] hover:bg-[#181818] border border-[#252525] hover:border-[#00F0FF] rounded text-[9px] text-[#aaa] hover:text-white uppercase flex items-center justify-center gap-1 transition-colors"
                    >
                      <Plus className="w-2.5 h-2.5 text-[#00F0FF]" />
                      <span>+ STAR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const currentLayers =
                          state.grid.customSvgLayers && state.grid.customSvgLayers.length > 0
                            ? state.grid.customSvgLayers
                            : DEFAULT_CUSTOM_SVG_LAYERS;
                        const newLayer: CustomSvgLayer = {
                          id: `layer_${Date.now()}`,
                          name: 'Crosshair',
                          svgXml: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11 0h2v9h9v2h-9v9h-2v-9H2v-2h9V0z"/></svg>`,
                          recolorMode: 'custom',
                          customColor: '#00F0FF',
                          scale: 0.85,
                          rotationOffset: 45,
                          opacity: 0.9,
                          enabled: true
                        };
                        onUpdateState((prev) => ({
                          ...prev,
                          grid: {
                            ...prev.grid,
                            dotShape: 'custom_svg',
                            customSvgLayers: [...currentLayers, newLayer]
                          }
                        }));
                      }}
                      className="py-1 px-1.5 bg-[#0e0e0e] hover:bg-[#181818] border border-[#252525] hover:border-[#00F0FF] rounded text-[9px] text-[#aaa] hover:text-white uppercase flex items-center justify-center gap-1 transition-colors"
                    >
                      <Plus className="w-2.5 h-2.5 text-[#00F0FF]" />
                      <span>+ CROSS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const currentLayers =
                          state.grid.customSvgLayers && state.grid.customSvgLayers.length > 0
                            ? state.grid.customSvgLayers
                            : DEFAULT_CUSTOM_SVG_LAYERS;
                        const newLayer: CustomSvgLayer = {
                          id: `layer_${Date.now()}`,
                          name: 'Diamond',
                          svgXml: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2L22 12L12 22L2 12Z"/></svg>`,
                          recolorMode: 'theme',
                          scale: 1.1,
                          rotationOffset: 0,
                          opacity: 0.85,
                          enabled: true
                        };
                        onUpdateState((prev) => ({
                          ...prev,
                          grid: {
                            ...prev.grid,
                            dotShape: 'custom_svg',
                            customSvgLayers: [...currentLayers, newLayer]
                          }
                        }));
                      }}
                      className="py-1 px-1.5 bg-[#0e0e0e] hover:bg-[#181818] border border-[#252525] hover:border-[#00F0FF] rounded text-[9px] text-[#aaa] hover:text-white uppercase flex items-center justify-center gap-1 transition-colors"
                    >
                      <Plus className="w-2.5 h-2.5 text-[#00F0FF]" />
                      <span>+ DIAMOND</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[#888888] mb-1 text-[11px] font-mono">
                  <span>MIN RADIUS</span>
                  <span className="text-[#00F0FF]">{state.grid.minRadius.toFixed(1)}px</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="4"
                  step="0.1"
                  value={state.grid.minRadius}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      grid: { ...prev.grid, minRadius: parseFloat(e.target.value) }
                    }))
                  }
                  className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#888888] mb-1 text-[11px] font-mono">
                  <span>MAX RADIUS</span>
                  <span className="text-[#00F0FF]">{state.grid.maxRadius.toFixed(1)}px</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="16"
                  step="0.2"
                  value={state.grid.maxRadius}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      grid: { ...prev.grid, maxRadius: parseFloat(e.target.value) }
                    }))
                  }
                  className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#222] space-y-3">
              <div className="p-2.5 bg-[#0A0A0A] border border-[#222] rounded flex items-center justify-between font-mono">
                <div>
                  <span className="block text-[11px] font-bold text-white uppercase tracking-wider">
                    BACKGROUND DOTS
                  </span>
                  <span className="block text-[9px] text-[#888888]">
                    {state.grid.hideBackgroundDots
                      ? 'Hidden (Dots strictly inside text)'
                      : 'Visible (Grid fills entire canvas)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateState((prev) => ({
                      ...prev,
                      grid: { ...prev.grid, hideBackgroundDots: !prev.grid.hideBackgroundDots }
                    }))
                  }
                  className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all border ${
                    state.grid.hideBackgroundDots
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                      : 'bg-[#1a1a1a] text-[#00F0FF] border-[#00F0FF]/50 hover:bg-[#222]'
                  }`}
                >
                  {state.grid.hideBackgroundDots ? 'HIDDEN' : 'VISIBLE'}
                </button>
              </div>

              <div>
                <div className="flex justify-between text-[#888888] mb-1 text-[11px] font-mono">
                  <span>SDF THRESHOLD</span>
                  <span className="text-[#00F0FF]">{state.grid.sdfThreshold.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.02"
                  value={state.grid.sdfThreshold}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      grid: { ...prev.grid, sdfThreshold: parseFloat(e.target.value) }
                    }))
                  }
                  className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#888888] mb-1 text-[11px] font-mono">
                  <span>SDF SOFTNESS</span>
                  <span className="text-[#00F0FF]">{state.grid.sdfSoftness.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.05"
                  value={state.grid.sdfSoftness}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      grid: { ...prev.grid, sdfSoftness: parseFloat(e.target.value) }
                    }))
                  }
                  className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: WAVEFRONT PHYSICS ================= */}
        {activeTab === 'wavefront' && (
          <div className="space-y-4">
            {/* Mode Selector */}
            <div>
              <label className="block text-[#888888] mb-1 font-mono text-[11px] uppercase tracking-wider">ANIMATION ENGINE</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    onUpdateState((prev) => ({
                      ...prev,
                      wave: { ...prev.wave, mode: 'stable' }
                    }))
                  }
                  className={`p-2.5 rounded border text-left font-mono transition-colors ${
                    state.wave.mode === 'stable'
                      ? 'bg-[#222] border-[#00F0FF] text-[#00F0FF] font-bold'
                      : 'bg-[#0A0A0A] border-[#222] text-[#888888] hover:text-white'
                  }`}
                >
                  <span className="block text-[10px] uppercase">1. STABLE_WAVE</span>
                  <span className="text-[9px] opacity-70">Radius & opacity wave. Text fixed.</span>
                </button>

                <button
                  onClick={() =>
                    onUpdateState((prev) => ({
                      ...prev,
                      wave: { ...prev.wave, mode: 'flow' }
                    }))
                  }
                  className={`p-2.5 rounded border text-left font-mono transition-colors ${
                    state.wave.mode === 'flow'
                      ? 'bg-[#222] border-[#00F0FF] text-[#00F0FF] font-bold'
                      : 'bg-[#0A0A0A] border-[#222] text-[#888888] hover:text-white'
                  }`}
                >
                  <span className="block text-[10px] uppercase">2. FLOW_WAVE</span>
                  <span className="text-[9px] opacity-70">Vector field displacement with blend back.</span>
                </button>
              </div>
            </div>

            {/* Wave Pattern */}
            <div>
              <label className="block text-[#888888] mb-1 font-mono text-[11px] uppercase tracking-wider">WAVEFRONT PATTERN</label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'circular', name: 'CIRCULAR RADAR' },
                    { id: 'linear', name: 'LINEAR PLANE' },
                    { id: 'spiral', name: 'LOG SPIRAL' },
                    { id: 'interference', name: 'INTERFERENCE' },
                    { id: 'market_chart', name: 'MARKET CHART' },
                    { id: 'radial_3d', name: '3D RADIAL WAVE' }
                  ] as const
                ).map((pat) => (
                  <button
                    key={pat.id}
                    onClick={() =>
                      onUpdateState((prev) => ({
                        ...prev,
                        wave: { ...prev.wave, pattern: pat.id }
                      }))
                    }
                    className={`py-2 px-2 rounded border text-[10px] font-mono text-center uppercase transition-colors ${
                      state.wave.pattern === pat.id
                        ? 'bg-[#222] border-[#00F0FF] text-[#00F0FF] font-bold'
                        : 'bg-[#0A0A0A] border-[#222] text-[#888888] hover:text-white'
                    }`}
                  >
                    {pat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 3D Radial Wave — dedicated controls (geometry, thickness, motion, rotation, material) */}
            {state.wave.pattern === 'radial_3d' && (
              <Radial3DControls state={state} onUpdateState={onUpdateState} />
            )}

            {/* Wave Pulse Shape */}
            <div>
              <label className="block text-[#888888] mb-1 font-mono text-[11px] uppercase tracking-wider">HARMONIC PROFILE</label>
              <div className="grid grid-cols-4 gap-1">
                {(['sine', 'pulse', 'square', 'gaussian'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() =>
                      onUpdateState((prev) => ({
                        ...prev,
                        wave: { ...prev.wave, waveType: type }
                      }))
                    }
                    className={`py-1.5 rounded uppercase text-[9px] font-mono border text-center transition-colors ${
                      state.wave.waveType === type
                        ? 'bg-[#222] border-[#00F0FF] text-[#00F0FF] font-bold'
                        : 'bg-[#0A0A0A] border-[#222] text-[#888888] hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[#888888] mb-1 text-[11px] font-mono">
                  <span>SPEED</span>
                  <span className="text-[#00F0FF]">{state.wave.waveSpeed.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.05"
                  value={state.wave.waveSpeed}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      wave: { ...prev.wave, waveSpeed: parseFloat(e.target.value) }
                    }))
                  }
                  className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#888888] mb-1 text-[11px] font-mono">
                  <span>FREQUENCY</span>
                  <span className="text-[#00F0FF]">{state.wave.waveFrequency.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.05"
                  value={state.wave.waveFrequency}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      wave: { ...prev.wave, waveFrequency: parseFloat(e.target.value) }
                    }))
                  }
                  className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[#888888] mb-1 text-[11px] font-mono">
                  <span>AMPLITUDE</span>
                  <span className="text-[#00F0FF]">{state.wave.waveAmplitude.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.0"
                  step="0.05"
                  value={state.wave.waveAmplitude}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      wave: { ...prev.wave, waveAmplitude: parseFloat(e.target.value) }
                    }))
                  }
                  className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#888888] mb-1 text-[11px] font-mono">
                  <span>SOFTNESS</span>
                  <span className="text-[#00F0FF]">{state.wave.waveSoftness.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={state.wave.waveSoftness}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      wave: { ...prev.wave, waveSoftness: parseFloat(e.target.value) }
                    }))
                  }
                  className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                />
              </div>
            </div>

            {/* Frequency Thickness & Radial Gradient Section */}
            <div className="p-3 bg-[#0A0A0A] border border-[#222] rounded space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <label className="text-[#00F0FF] font-bold text-[11px] uppercase tracking-wider">
                  FREQUENCY THICKNESS & FALLOFF
                </label>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#181818] border border-[#333] text-[#888]">
                  RADIAL GRADIENT
                </span>
              </div>

              <div>
                <div className="flex justify-between text-[#888888] mb-1 text-[11px]">
                  <span>BASE WAVE THICKNESS</span>
                  <span className="text-[#00F0FF]">{(state.wave.frequencyThickness ?? 1.0).toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.05"
                  value={state.wave.frequencyThickness ?? 1.0}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      wave: { ...prev.wave, frequencyThickness: parseFloat(e.target.value) }
                    }))
                  }
                  className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#888888] mb-1 text-[11px]">
                  <span>CENTER vs EDGE THICKNESS</span>
                  <span className="text-[#00F0FF]">
                    {(state.wave.radialThickness ?? 0) > 0.05
                      ? `CENTER THICKER (+${Math.round((state.wave.radialThickness ?? 0) * 100)}%)`
                      : (state.wave.radialThickness ?? 0) < -0.05
                      ? `CENTER THINNER (${Math.round((state.wave.radialThickness ?? 0) * 100)}%)`
                      : 'UNIFORM'}
                  </span>
                </div>
                <input
                  type="range"
                  min="-1.0"
                  max="1.0"
                  step="0.05"
                  value={state.wave.radialThickness ?? 0.0}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      wave: { ...prev.wave, radialThickness: parseFloat(e.target.value) }
                    }))
                  }
                  className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                />
              </div>

              {/* Quick Bias Presets */}
              <div className="grid grid-cols-3 gap-1 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateState((prev) => ({
                      ...prev,
                      wave: { ...prev.wave, radialThickness: 0.8 }
                    }))
                  }
                  className={`py-1 text-[9px] font-mono uppercase rounded border transition-colors ${
                    (state.wave.radialThickness ?? 0) > 0.4
                      ? 'bg-[#222] border-[#00F0FF] text-[#00F0FF] font-bold'
                      : 'bg-[#121212] border-[#222] text-[#888] hover:text-white'
                  }`}
                >
                  CENTER THICK
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateState((prev) => ({
                      ...prev,
                      wave: { ...prev.wave, radialThickness: 0.0 }
                    }))
                  }
                  className={`py-1 text-[9px] font-mono uppercase rounded border transition-colors ${
                    Math.abs(state.wave.radialThickness ?? 0) <= 0.1
                      ? 'bg-[#222] border-[#00F0FF] text-[#00F0FF] font-bold'
                      : 'bg-[#121212] border-[#222] text-[#888] hover:text-white'
                  }`}
                >
                  UNIFORM
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateState((prev) => ({
                      ...prev,
                      wave: { ...prev.wave, radialThickness: -0.8 }
                    }))
                  }
                  className={`py-1 text-[9px] font-mono uppercase rounded border transition-colors ${
                    (state.wave.radialThickness ?? 0) < -0.4
                      ? 'bg-[#222] border-[#00F0FF] text-[#00F0FF] font-bold'
                      : 'bg-[#121212] border-[#222] text-[#888] hover:text-white'
                  }`}
                >
                  CENTER THIN
                </button>
              </div>
            </div>

            {state.wave.pattern === 'linear' && (
              <div>
                <div className="flex justify-between text-[#888888] mb-1 text-[11px] font-mono">
                  <span>PLANE ANGLE</span>
                  <span className="text-[#00F0FF]">{state.wave.linearAngle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={state.wave.linearAngle}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      wave: { ...prev.wave, linearAngle: parseInt(e.target.value) }
                    }))
                  }
                  className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                />
              </div>
            )}

            {/* Flow Mode Displacement Controls */}
            {state.wave.mode === 'flow' && (
              <div className="p-3 bg-[#0A0A0A] border border-[#333] rounded space-y-3 font-mono">
                <span className="block font-bold text-[#00F0FF] text-[11px] uppercase">FLOW VECTOR FIELD DISPLACEMENT</span>
                <div>
                  <div className="flex justify-between text-[#888888] mb-1 text-[11px]">
                    <span>VECTOR FIELD STRENGTH</span>
                    <span className="text-[#00F0FF]">{state.wave.vectorDistortion.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.05"
                    value={state.wave.vectorDistortion}
                    onChange={(e) =>
                      onUpdateState((prev) => ({
                        ...prev,
                        wave: { ...prev.wave, vectorDistortion: parseFloat(e.target.value) }
                      }))
                    }
                    className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#888888] mb-1 text-[11px]">
                    <span>LETTERFORM BLEND BACK</span>
                    <span className="text-[#00F0FF]">{Math.round(state.wave.blendBack * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.02"
                    value={state.wave.blendBack}
                    onChange={(e) =>
                      onUpdateState((prev) => ({
                        ...prev,
                        wave: { ...prev.wave, blendBack: parseFloat(e.target.value) }
                      }))
                    }
                    className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                  />
                </div>
              </div>
            )}

            {/* Origin Mouse Tracking */}
            <div className="pt-2 border-t border-[#222] flex items-center justify-between font-mono">
              <div>
                <span className="block font-bold text-[#E0E0E0] text-[11px] uppercase">CURSOR EMITTER TRACKING</span>
                <span className="text-[10px] text-[#888888]">Lock wave origin to mouse</span>
              </div>
              <input
                type="checkbox"
                checked={state.wave.followMouse}
                onChange={(e) =>
                  onUpdateState((prev) => ({
                    ...prev,
                    wave: { ...prev.wave, followMouse: e.target.checked }
                  }))
                }
                className="w-4 h-4 accent-[#00F0FF] bg-[#0A0A0A] border-[#333] cursor-pointer"
              />
            </div>

            {/* Feature B: Dynamic Wave Variation Controls */}
            <WaveVariationControls state={state} onUpdateState={onUpdateState} />

            {/* Advanced Frequency Control — Spatial / Thickness / Motion mapping (applies to every pattern) */}
            <FrequencyMappingControls state={state} onUpdateState={onUpdateState} />

            {/* Dynamic Visual Thickness — per-ring thickness ported from 3D Radial Wave (2D patterns only;
                radial_3d keeps its own dedicated thickness system via Radial3DControls above) */}
            {state.wave.pattern !== 'radial_3d' && (
              <DynamicThicknessControls state={state} onUpdateState={onUpdateState} />
            )}

            {/* Audio Reactivity Controls */}
            <AudioReactivityControls state={state} onUpdateState={onUpdateState} />
          </div>
        )}

        {/* ================= TAB 4: STYLE & PALETTE ================= */}
        {activeTab === 'style' && (
          <div className="space-y-4 font-mono">
            <div>
              <label className="block text-[#888888] mb-1 text-[11px] uppercase tracking-wider">CURATED PALETTES</label>
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map((th) => (
                  <button
                    key={th.id}
                    onClick={() => applyTheme(th)}
                    className={`p-2 rounded border text-left flex items-center justify-between transition-colors ${
                      state.style.theme === th.id
                        ? 'border-[#00F0FF] bg-[#222]'
                        : 'border-[#222] bg-[#0A0A0A] hover:border-[#444]'
                    }`}
                  >
                    <span className="font-bold text-[#E0E0E0] truncate text-[10px] mr-2">{th.name}</span>
                    <div className="flex items-center space-x-1 shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full border border-[#444]" style={{ backgroundColor: th.bg }} />
                      <div className="w-2.5 h-2.5 rounded-full border border-[#444]" style={{ backgroundColor: th.dot }} />
                      <div className="w-2.5 h-2.5 rounded-full border border-[#444]" style={{ backgroundColor: th.accent }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#222]">
              <div>
                <label className="block text-[#888888] mb-1 text-[11px] uppercase">DOT COLOR</label>
                <div className="flex items-center space-x-2 bg-[#0A0A0A] p-1.5 rounded border border-[#222]">
                  <input
                    type="color"
                    value={state.style.dotColor}
                    onChange={(e) =>
                      onUpdateState((prev) => ({
                        ...prev,
                        style: { ...prev.style, dotColor: e.target.value }
                      }))
                    }
                    className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={state.style.dotColor}
                    onChange={(e) =>
                      onUpdateState((prev) => ({
                        ...prev,
                        style: { ...prev.style, dotColor: e.target.value }
                      }))
                    }
                    className="w-full bg-transparent text-[#E0E0E0] font-mono text-[11px] focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#888888] mb-1 text-[11px] uppercase">BACKGROUND</label>
                <div className="flex items-center space-x-2 bg-[#0A0A0A] p-1.5 rounded border border-[#222]">
                  <input
                    type="color"
                    value={state.style.bgColor}
                    onChange={(e) =>
                      onUpdateState((prev) => ({
                        ...prev,
                        style: { ...prev.style, bgColor: e.target.value }
                      }))
                    }
                    className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={state.style.bgColor}
                    onChange={(e) =>
                      onUpdateState((prev) => ({
                        ...prev,
                        style: { ...prev.style, bgColor: e.target.value }
                      }))
                    }
                    className="w-full bg-transparent text-[#E0E0E0] font-mono text-[11px] focus:outline-none uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#222] space-y-3">
              <div className="p-2.5 bg-[#0A0A0A] border border-[#222] rounded flex items-center justify-between font-mono">
                <div>
                  <span className="block text-[11px] font-bold text-white uppercase tracking-wider">
                    SAME COLOR & VIBRANCY
                  </span>
                  <span className="block text-[9px] text-[#888888]">
                    {state.style.uniformColorBrightness
                      ? 'Wave ripple & all dots share same color & 100% brightness'
                      : 'Wave ripple brightens/modulates dot color'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateState((prev) => ({
                      ...prev,
                      style: {
                        ...prev.style,
                        uniformColorBrightness: !prev.style.uniformColorBrightness
                      }
                    }))
                  }
                  className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all border ${
                    state.style.uniformColorBrightness
                      ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/50 shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                      : 'bg-[#1a1a1a] text-[#888888] border-[#333] hover:text-white'
                  }`}
                >
                  {state.style.uniformColorBrightness ? 'SAME COLOR' : 'MODULATED'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="block font-bold text-[#E0E0E0] text-[11px] uppercase">WAVE INTENSITY GRADIENT</span>
                  <span className="text-[10px] text-[#888888]">Shift color with wave power</span>
                </div>
                <input
                  type="checkbox"
                  checked={state.style.enableColorGradient}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      style: { ...prev.style, enableColorGradient: e.target.checked }
                    }))
                  }
                  className="w-4 h-4 accent-[#00F0FF] bg-[#0A0A0A] border-[#333] cursor-pointer"
                />
              </div>

              {state.style.enableColorGradient && (
                <div>
                  <label className="block text-[#888888] mb-1 text-[11px] uppercase">SECONDARY GRADIENT</label>
                  <div className="flex items-center space-x-2 bg-[#0A0A0A] p-1.5 rounded border border-[#222]">
                    <input
                      type="color"
                      value={state.style.gradientColor}
                      onChange={(e) =>
                        onUpdateState((prev) => ({
                          ...prev,
                          style: { ...prev.style, gradientColor: e.target.value }
                        }))
                      }
                      className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={state.style.gradientColor}
                      onChange={(e) =>
                        onUpdateState((prev) => ({
                          ...prev,
                          style: { ...prev.style, gradientColor: e.target.value }
                        }))
                      }
                      className="w-full bg-transparent text-[#E0E0E0] font-mono text-[11px] focus:outline-none uppercase"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <span className="block font-bold text-[#E0E0E0] text-[11px] uppercase">RADAR FIELD OVERLAY</span>
                  <span className="text-[10px] text-[#888888]">Display wave origin rings</span>
                </div>
                <input
                  type="checkbox"
                  checked={state.style.showRadarGrid}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      style: { ...prev.style, showRadarGrid: e.target.checked }
                    }))
                  }
                  className="w-4 h-4 accent-[#00F0FF] bg-[#0A0A0A] border-[#333] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="block font-bold text-[#E0E0E0] text-[11px] uppercase">VIEWPORT TARGET HANDLES</span>
                  <span className="text-[10px] text-[#888888]">Show origin crosshairs</span>
                </div>
                <input
                  type="checkbox"
                  checked={state.style.showEmitterHandle}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      style: { ...prev.style, showEmitterHandle: e.target.checked }
                    }))
                  }
                  className="w-4 h-4 accent-[#00F0FF] bg-[#0A0A0A] border-[#333] cursor-pointer"
                />
              </div>

              {/* Data Constellation Lines (for Style 05 or custom) */}
              <MultiColorDotControls state={state} onUpdateState={onUpdateState} />

              <div className="p-2.5 bg-[#0A0A0A] border border-[#222] rounded space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white uppercase">
                    DATA CONSTELLATION NETWORK
                  </span>
                  <input
                    type="checkbox"
                    checked={(state.style.constellationMaxDistance || 0) > 0 || state.style.visualStyle === 'data_constellation'}
                    onChange={(e) =>
                      onUpdateState((prev) => ({
                        ...prev,
                        style: {
                          ...prev.style,
                          constellationMaxDistance: e.target.checked ? 55 : 0
                        }
                      }))
                    }
                    className="w-4 h-4 accent-[#00F0FF] bg-[#0A0A0A] border-[#333] cursor-pointer"
                  />
                </div>

                {((state.style.constellationMaxDistance || 0) > 0 || state.style.visualStyle === 'data_constellation') && (
                  <div>
                    <div className="flex justify-between text-[#888] text-[10px] mb-1">
                      <span>MAX CONNECTION DISTANCE</span>
                      <span className="text-[#00F0FF]">{state.style.constellationMaxDistance || 55}px</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="120"
                      step="5"
                      value={state.style.constellationMaxDistance || 55}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        onUpdateState((prev) => ({
                          ...prev,
                          style: { ...prev.style, constellationMaxDistance: val }
                        }));
                      }}
                      className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                    />
                  </div>
                )}
              </div>

              {/* 2.5D Extrusion Controls (for Extruded Block Shape or Style 07) */}
              <div className="p-2.5 bg-[#0A0A0A] border border-[#222] rounded space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white uppercase">
                    2.5D EXTRUSION DEPTH
                  </span>
                  <span className="text-[#00F0FF] text-[10px]">
                    {state.style.extrusionDepth || 8}px
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="24"
                  step="1"
                  value={state.style.extrusionDepth || 8}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    onUpdateState((prev) => ({
                      ...prev,
                      style: { ...prev.style, extrusionDepth: val }
                    }));
                  }}
                  className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#222]">
                <div>
                  <span className="block font-bold text-[#E0E0E0] text-[11px] uppercase">TRANSPARENT BACKGROUND</span>
                  <span className="text-[10px] text-[#888888]">Alpha background for exports (PNG, SVG, MP4)</span>
                </div>
                <input
                  type="checkbox"
                  checked={!!state.transparentBg}
                  onChange={(e) =>
                    onUpdateState((prev) => ({
                      ...prev,
                      transparentBg: e.target.checked
                    }))
                  }
                  className="w-4 h-4 accent-[#00F0FF] bg-[#0A0A0A] border-[#333] cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
        {/* ================= TAB: PRESETS & EXPORT ================= */}
        {activeTab === 'presets' && (
          <div className="space-y-4 font-mono">
            <PresetGallery state={state} onSelectPreset={onSelectPreset} onSelectFlipDiscPreset={onSelectFlipDiscPreset} />

            <div className="pt-4 border-t border-[#222] space-y-3">
              <label className="block text-[#888888] text-[11px] uppercase tracking-wider">PRODUCTION EXPORTS</label>

              <button
                onClick={() => triggerExport('export-png-trigger')}
                className="w-full py-2.5 px-3 rounded bg-[#222] hover:bg-[#2a2a2a] border border-[#333] text-white flex items-center justify-between font-bold text-[11px] transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4 text-[#00F0FF]" />
                  <span>EXPORT PNG SNAPSHOT</span>
                </div>
                <span className="text-[10px] text-[#888888]">RASTER</span>
              </button>

              <button
                onClick={() => triggerExport('export-svg-trigger')}
                className="w-full py-2.5 px-3 rounded bg-[#222] hover:bg-[#2a2a2a] border border-[#333] text-white flex items-center justify-between font-bold text-[11px] transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <FileCode className="w-4 h-4 text-[#00F0FF]" />
                  <span>EXPORT VECTOR SVG</span>
                </div>
                <span className="text-[10px] text-[#888888]">VECTOR</span>
              </button>

              <div className="p-3 bg-[#0A0A0A] border border-[#333] rounded space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#E0E0E0] flex items-center space-x-1.5 text-[11px] uppercase">
                    <Video className="w-4 h-4 text-[#00F0FF]" />
                    <span>EXPORT MP4 VIDEO</span>
                  </span>
                  <select
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(parseInt(e.target.value))}
                    className="bg-[#151515] border border-[#333] text-[#00F0FF] text-[10px] rounded px-1.5 py-0.5 font-mono"
                  >
                    <option value="3">3 SECONDS</option>
                    <option value="5">5 SECONDS</option>
                    <option value="10">10 SECONDS</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    const el = document.getElementById('export-mp4-trigger') as HTMLButtonElement;
                    if (el) el.click();
                  }}
                  className="w-full py-2 rounded bg-white hover:bg-[#e0e0e0] text-black font-bold text-[11px] transition-colors uppercase tracking-wider shadow-md"
                >
                  START RECORDING MP4
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: VISUAL STYLE GALLERY ================= */}
        {activeTab === 'styles' && (
          <VisualStyleGallery state={state} onUpdateState={onUpdateState} />
        )}

        {/* ================= TAB: COMPOSITION & LAYOUT ================= */}
        {activeTab === 'composition' && (
          <div className="space-y-4">
            <CompositionModeControls state={state} onUpdateState={onUpdateState} />
            <TextLayoutControls state={state} onUpdateState={onUpdateState} />
          </div>
        )}
      </div>
    </div>
  );
};
