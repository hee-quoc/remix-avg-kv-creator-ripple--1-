import React from 'react';
import { RenderState, CustomSvgLayer } from '../types';
import { DEFAULT_CUSTOM_SVG_LAYERS } from '../utils/particleRenderer';
import { Layers, Eye, EyeOff, Trash2, Upload, Plus } from 'lucide-react';

interface CustomSvgLayerControlsProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
}

/**
 * Custom SVG multi-layer dot shape + per-layer recolor/scale/rotation/opacity matrix (grid.dotShape
 * === 'custom_svg'). Extracted verbatim out of ControlsDrawer.tsx's old GRID tab (same behavior, same
 * handlers — just given its own file so it can be reused as a normal embeddable control component,
 * consistent with its siblings like TypographyBoxControls/MeshNetControls/etc.) as part of the
 * redesign V1-B Phase P4 Effect panel.
 */
export const CustomSvgLayerControls: React.FC<CustomSvgLayerControlsProps> = ({ state, onUpdateState }) => {
  return (
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

      {state.grid.dotShape !== 'custom_svg' && state.grid.customSvgLayers && state.grid.customSvgLayers.length > 0 && (
        <div className="text-[9px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded px-2.5 py-2 leading-relaxed">
          Your uploaded SVG ({state.grid.customSvgLayers[0]?.name || 'logo'}) is saved and not
          lost — the current shape/style just isn't using it as the dot shape right now. Click
          ENABLE SVG above to make it active again.
        </div>
      )}

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
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = currentLayers.map((l, i) => (i === index ? { ...l, enabled: l.enabled === false } : l));
                      updateLayers(updated);
                    }}
                    className={`p-1 rounded border shrink-0 transition-colors ${
                      layer.enabled !== false
                        ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/50'
                        : 'bg-[#1a1a1a] text-[#555] border-[#333]'
                    }`}
                    title={layer.enabled !== false ? 'Layer Enabled' : 'Layer Disabled'}
                  >
                    {layer.enabled !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  <input
                    type="text"
                    value={layer.name}
                    onChange={(e) => {
                      const updated = currentLayers.map((l, i) => (i === index ? { ...l, name: e.target.value } : l));
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
                      const updated = currentLayers.map((l, i) => (i === index ? { ...l, recolorMode: mode.id } : l));
                      updateLayers(updated);
                    }}
                    className={`py-1 text-[9px] font-bold uppercase rounded transition-colors ${
                      layer.recolorMode === mode.id ? 'bg-[#222] text-[#00F0FF] border border-[#00F0FF]/40' : 'text-[#777] hover:text-white'
                    }`}
                  >
                    {mode.name}
                  </button>
                ))}
              </div>

              {layer.recolorMode === 'custom' && (
                <div className="flex items-center space-x-2 bg-[#080808] p-1.5 rounded border border-[#222]">
                  <span className="text-[9px] text-[#888] uppercase">RECOLOR:</span>
                  <input
                    type="color"
                    value={layer.customColor || '#00F0FF'}
                    onChange={(e) => {
                      const updated = currentLayers.map((l, i) => (i === index ? { ...l, customColor: e.target.value } : l));
                      updateLayers(updated);
                    }}
                    className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={layer.customColor || '#00F0FF'}
                    onChange={(e) => {
                      const updated = currentLayers.map((l, i) => (i === index ? { ...l, customColor: e.target.value } : l));
                      updateLayers(updated);
                    }}
                    className="w-full bg-transparent text-[#00F0FF] text-[10px] focus:outline-none uppercase"
                  />
                </div>
              )}

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
                      const updated = currentLayers.map((l, i) => (i === index ? { ...l, scaleX: val, scale: val } : l));
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
                      const updated = currentLayers.map((l, i) => (i === index ? { ...l, scaleY: val, scale: val } : l));
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
                      const updated = currentLayers.map((l, i) => (i === index ? { ...l, rotationOffset: parseInt(e.target.value, 10) } : l));
                      updateLayers(updated);
                    }}
                    className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#888] mb-0.5">
                    <span>OPACITY</span>
                    <span className="text-[#00F0FF]">{Math.round((layer.opacity ?? 1.0) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={layer.opacity ?? 1.0}
                    onChange={(e) => {
                      const updated = currentLayers.map((l, i) => (i === index ? { ...l, opacity: parseFloat(e.target.value) } : l));
                      updateLayers(updated);
                    }}
                    className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                  />
                </div>
              </div>
            </div>
          );
        })}

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
                    grid: { ...prev.grid, dotShape: 'custom_svg', customSvgLayers: [...currentLayers, newLayer] }
                  }));
                };
                reader.readAsText(file);
              }}
              className="hidden"
            />
          </label>

          <div className="grid grid-cols-3 gap-1 pt-1">
            <button
              type="button"
              onClick={() => {
                const currentLayers =
                  state.grid.customSvgLayers && state.grid.customSvgLayers.length > 0 ? state.grid.customSvgLayers : DEFAULT_CUSTOM_SVG_LAYERS;
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
                  grid: { ...prev.grid, dotShape: 'custom_svg', customSvgLayers: [...currentLayers, newLayer] }
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
                  state.grid.customSvgLayers && state.grid.customSvgLayers.length > 0 ? state.grid.customSvgLayers : DEFAULT_CUSTOM_SVG_LAYERS;
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
                  grid: { ...prev.grid, dotShape: 'custom_svg', customSvgLayers: [...currentLayers, newLayer] }
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
                  state.grid.customSvgLayers && state.grid.customSvgLayers.length > 0 ? state.grid.customSvgLayers : DEFAULT_CUSTOM_SVG_LAYERS;
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
                  grid: { ...prev.grid, dotShape: 'custom_svg', customSvgLayers: [...currentLayers, newLayer] }
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
  );
};
