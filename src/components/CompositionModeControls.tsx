import React from 'react';
import { RenderState, CompositionMode } from '../types';
import { Layout, Type, Eye, EyeOff } from 'lucide-react';

interface CompositionModeControlsProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
}

export const CompositionModeControls: React.FC<CompositionModeControlsProps> = ({
  state,
  onUpdateState
}) => {
  const currentMode = state.compositionMode || 'full_molecule';

  const modes: { id: CompositionMode; title: string; subtitle: string }[] = [
    {
      id: 'full_molecule',
      title: 'Full Molecule',
      subtitle: 'Wave halftone dots mask the typography shape directly.'
    },
    {
      id: 'molecule_wave_only',
      title: 'Molecule Wave Only',
      subtitle: 'Pure wave field molecules across viewport + crisp text layer.'
    },
    {
      id: 'editorial_collage',
      title: 'Editorial Collage',
      subtitle: 'High-contrast editorial layout with layered typographic scales.'
    }
  ];

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#222]">
        <div className="flex items-center space-x-2">
          <Layout className="w-4 h-4 text-[#00F0FF]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">
            COMPOSITION ARCHITECTURE
          </span>
        </div>
        <span className="text-[10px] text-[#00F0FF] uppercase font-bold">
          {currentMode.replace(/_/g, ' ')}
        </span>
      </div>

      <p className="text-[10px] text-[#888] font-sans leading-relaxed">
        Feature A: Toggle between halftone letter-masking and independent wave field molecule dynamics with crisp typographic overlay.
      </p>

      {/* Effect Text (Text Layer A) visibility — independent from the Original Text / KV Layout layer below */}
      <div className="p-3 bg-[#0e0e11] border border-[#222] rounded-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {state.showEffectText !== false ? (
            <Eye className="w-3.5 h-3.5 text-[#00F0FF]" />
          ) : (
            <EyeOff className="w-3.5 h-3.5 text-[#777]" />
          )}
          <div>
            <span className="block text-[11px] font-bold uppercase text-white">Effect Text (Molecule Layer)</span>
            <span className="block text-[9px] text-[#888]">Generative particle/wave typography layer</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            onUpdateState((prev) => ({
              ...prev,
              showEffectText: prev.showEffectText === false ? true : false
            }))
          }
          className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all border ${
            state.showEffectText !== false
              ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/50'
              : 'bg-[#1a1a1a] text-[#777] border-[#333] hover:text-white'
          }`}
        >
          {state.showEffectText !== false ? 'VISIBLE' : 'HIDDEN'}
        </button>
      </div>

      {/* Mode Selector Cards */}
      <div className="space-y-2">
        {modes.map((m) => {
          const isSelected = currentMode === m.id;
          return (
            <div
              key={m.id}
              onClick={() =>
                onUpdateState((prev) => ({
                  ...prev,
                  compositionMode: m.id
                }))
              }
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-[#181c24] border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'bg-[#0e0e11] border-[#222] hover:border-[#444]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase ${isSelected ? 'text-[#00F0FF]' : 'text-white'}`}>
                  {m.title}
                </span>
                {isSelected && (
                  <span className="text-[9px] bg-[#00F0FF]/20 text-[#00F0FF] px-1.5 py-0.5 rounded font-mono">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#999] font-sans mt-1 leading-relaxed">
                {m.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* Crisp Typography Layer Settings (when in molecule_wave_only or editorial_collage) */}
      {(currentMode === 'molecule_wave_only' || currentMode === 'editorial_collage') && (
        <div className="space-y-3 pt-3 border-t border-[#222] bg-[#0a0a0d] p-3 rounded-lg border border-[#222]">
          <div className="flex items-center space-x-2 text-[#00F0FF]">
            <Type className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold uppercase">
              ORIGINAL TYPOGRAPHY OVERLAY
            </span>
          </div>
          <p className="text-[9px] text-[#777] font-sans leading-relaxed -mt-1">
            Quick position/scale for this composition's crisp typography (reuses the text from the
            TEXT tab). For fully independent content, font, and KV layouts, use the TEXT LAYOUT
            controls below.
          </p>

          {/* Scale Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#888] text-[10px] uppercase">TEXT SCALE</label>
              <span className="text-[#00F0FF] text-[10px]">
                {((state.style.editorialHeadlineScale ?? 1.0) * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.05"
              value={state.style.editorialHeadlineScale ?? 1.0}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdateState((prev) => ({
                  ...prev,
                  style: { ...prev.style, editorialHeadlineScale: val }
                }));
              }}
              className="w-full accent-[#00F0FF] bg-[#1a1a1a] h-1 rounded appearance-none cursor-pointer"
            />
          </div>

          {/* Opacity Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#888] text-[10px] uppercase">TEXT OPACITY</label>
              <span className="text-[#00F0FF] text-[10px]">
                {((state.style.editorialHeadlineOpacity ?? 1.0) * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={state.style.editorialHeadlineOpacity ?? 1.0}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdateState((prev) => ({
                  ...prev,
                  style: { ...prev.style, editorialHeadlineOpacity: val }
                }));
              }}
              className="w-full accent-[#00F0FF] bg-[#1a1a1a] h-1 rounded appearance-none cursor-pointer"
            />
          </div>

          {/* Offset X & Y */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[#888] text-[10px] uppercase block mb-1">OFFSET X</label>
              <input
                type="range"
                min="-300"
                max="300"
                step="5"
                value={state.style.editorialHeadlineOffsetX || 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  onUpdateState((prev) => ({
                    ...prev,
                    style: { ...prev.style, editorialHeadlineOffsetX: val }
                  }));
                }}
                className="w-full accent-[#00F0FF] bg-[#1a1a1a] h-1 rounded appearance-none cursor-pointer"
              />
              <span className="text-[9px] text-[#666] block text-right font-mono">
                {state.style.editorialHeadlineOffsetX || 0}px
              </span>
            </div>

            <div>
              <label className="text-[#888] text-[10px] uppercase block mb-1">OFFSET Y</label>
              <input
                type="range"
                min="-300"
                max="300"
                step="5"
                value={state.style.editorialHeadlineOffsetY || 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  onUpdateState((prev) => ({
                    ...prev,
                    style: { ...prev.style, editorialHeadlineOffsetY: val }
                  }));
                }}
                className="w-full accent-[#00F0FF] bg-[#1a1a1a] h-1 rounded appearance-none cursor-pointer"
              />
              <span className="text-[9px] text-[#666] block text-right font-mono">
                {state.style.editorialHeadlineOffsetY || 0}px
              </span>
            </div>
          </div>

          {/* Text Color */}
          <div>
            <label className="text-[#888] text-[10px] uppercase block mb-1">OVERLAY COLOR</label>
            <div className="flex items-center space-x-2 bg-[#121212] p-1.5 rounded border border-[#222]">
              <input
                type="color"
                value={state.style.editorialHeadlineColor || '#ffffff'}
                onChange={(e) =>
                  onUpdateState((prev) => ({
                    ...prev,
                    style: { ...prev.style, editorialHeadlineColor: e.target.value }
                  }))
                }
                className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
              />
              <input
                type="text"
                value={state.style.editorialHeadlineColor || '#ffffff'}
                onChange={(e) =>
                  onUpdateState((prev) => ({
                    ...prev,
                    style: { ...prev.style, editorialHeadlineColor: e.target.value }
                  }))
                }
                className="w-full bg-transparent text-[#E0E0E0] font-mono text-[10px] focus:outline-none uppercase"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
