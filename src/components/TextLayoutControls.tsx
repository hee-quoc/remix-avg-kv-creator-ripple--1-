import React, { useState } from 'react';
import { RenderState, KVTextBlock, KVGraphicElement, KVLayoutMode, UploadedFont } from '../types';
import { KV_TEMPLATE_DEFINITIONS, createTemplateLayout, getDefaultKVLayout } from '../utils/kvLayoutTemplates';
import { Type, Upload, LayoutTemplate, MousePointerClick } from 'lucide-react';

interface TextLayoutControlsProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
}

const KV_FONT_OPTIONS = [
  'Space Grotesk',
  'Syne',
  'Instrument Serif',
  'Anton',
  'JetBrains Mono',
  'Bungee',
  'Cinzel',
  'Inter'
];

/**
 * Text Layer B — Original Text / independent KV Layout editor (Items 4B & 6).
 *
 * This is fully decoupled from the generative engine: it reads/writes only
 * `state.kvLayout`, which is not a dependency of SDF/particle regeneration,
 * so editing it never touches the Effect Text (Text Layer A) particle system.
 */
export const TextLayoutControls: React.FC<TextLayoutControlsProps> = ({ state, onUpdateState }) => {
  const kvLayout = state.kvLayout;
  const enabled = kvLayout?.enabled ?? false;
  const mode: KVLayoutMode = kvLayout?.mode ?? 'without_ui';
  const [selectedFontUpload, setSelectedFontUpload] = useState<string | null>(null);

  const updateKvLayout = (updater: (prev: NonNullable<RenderState['kvLayout']>) => NonNullable<RenderState['kvLayout']>) => {
    onUpdateState((prev) => ({
      ...prev,
      kvLayout: updater(prev.kvLayout || getDefaultKVLayout('without_ui', 'clean_focus'))
    }));
  };

  const setEnabled = (val: boolean) => {
    updateKvLayout((prev) => ({ ...prev, enabled: val }));
  };

  const switchMode = (newMode: KVLayoutMode) => {
    updateKvLayout((prev) => {
      const defaultTemplate = newMode === 'with_ui' ? 'question_bar' : 'clean_focus';
      const next = createTemplateLayout(defaultTemplate, newMode, prev.textBlocks);
      return { ...next, enabled: prev.enabled, uploadedFonts: prev.uploadedFonts };
    });
  };

  const selectTemplate = (templateId: (typeof KV_TEMPLATE_DEFINITIONS)[number]['id']) => {
    updateKvLayout((prev) => {
      const next = createTemplateLayout(templateId, prev.mode, prev.textBlocks);
      return { ...next, enabled: prev.enabled, uploadedFonts: prev.uploadedFonts };
    });
  };

  const selectedId = kvLayout?.selectedElementId || kvLayout?.textBlocks?.[0]?.id || null;
  const selectedBlock: KVTextBlock | undefined = kvLayout?.textBlocks.find((b) => b.id === selectedId);
  const selectedGraphic: KVGraphicElement | undefined = kvLayout?.graphicElements.find((g) => g.id === selectedId);

  const selectElement = (id: string) => {
    updateKvLayout((prev) => ({ ...prev, selectedElementId: id }));
  };

  const updateSelectedBlock = (patch: Partial<KVTextBlock>) => {
    updateKvLayout((prev) => ({
      ...prev,
      textBlocks: prev.textBlocks.map((b) => (b.id === selectedId ? { ...b, ...patch } : b))
    }));
  };

  const updateSelectedGraphic = (patch: Partial<KVGraphicElement>) => {
    updateKvLayout((prev) => ({
      ...prev,
      graphicElements: prev.graphicElements.map((g) => (g.id === selectedId ? { ...g, ...patch } : g))
    }));
  };

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBlock) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const fontName = `KV_${file.name.replace(/\.[^/.]+$/, '').trim() || 'CustomFont'}`;
      const fontFace = new FontFace(fontName, arrayBuffer);
      await fontFace.load();
      document.fonts.add(fontFace);

      const ext = (file.name.split('.').pop() || '').toLowerCase();
      const format = (['ttf', 'otf', 'woff', 'woff2'].includes(ext) ? ext : 'ttf') as UploadedFont['format'];

      updateKvLayout((prev) => {
        const uploaded: UploadedFont[] = prev.uploadedFonts || [];
        const exists = uploaded.some((f) => f.family === fontName);
        return {
          ...prev,
          uploadedFonts: exists ? uploaded : [...uploaded, { name: file.name, family: fontName, format }],
          textBlocks: prev.textBlocks.map((b) => (b.id === selectedId ? { ...b, fontFamily: fontName } : b))
        };
      });
      setSelectedFontUpload(fontName);
    } catch (err) {
      console.error('Failed to load KV layout font:', err);
      alert('Could not load the font file. Please ensure it is a valid .ttf, .otf, .woff, or .woff2 file.');
    }
  };

  return (
    <div className="space-y-3 pt-3 border-t border-[#222]">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center space-x-2 text-[#00F0FF]">
          <LayoutTemplate className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold uppercase">ORIGINAL TEXT (INDEPENDENT KV LAYOUT)</span>
        </div>
        <button
          type="button"
          onClick={() => setEnabled(!enabled)}
          className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase border transition-all ${
            enabled
              ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/50'
              : 'bg-[#181818] text-[#777] border-[#333]'
          }`}
        >
          {enabled ? 'VISIBLE' : 'HIDDEN'}
        </button>
      </div>

      <p className="text-[9px] text-[#888] font-sans leading-relaxed">
        A completely independent typography/layout layer — never converted to particles, never
        distorted by waves. Its own content, font (including custom upload), position, rotation,
        scale and opacity. Editing it never touches the Effect Text or wave/particle configuration.
      </p>

      {enabled && kvLayout && (
        <div className="space-y-3">
          {/* With UI / Without UI mode switch */}
          <div className="grid grid-cols-2 gap-1.5 bg-[#0A0A0A] p-1 rounded border border-[#222]">
            <button
              type="button"
              onClick={() => switchMode('with_ui')}
              className={`py-1.5 rounded text-[10px] font-mono uppercase transition-colors ${
                mode === 'with_ui'
                  ? 'bg-[#222] text-[#00F0FF] border border-[#00F0FF]/40 font-bold'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              With UI
            </button>
            <button
              type="button"
              onClick={() => switchMode('without_ui')}
              className={`py-1.5 rounded text-[10px] font-mono uppercase transition-colors ${
                mode === 'without_ui'
                  ? 'bg-[#222] text-[#00F0FF] border border-[#00F0FF]/40 font-bold'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              Without UI
            </button>
          </div>
          <p className="text-[9px] text-[#777] font-sans -mt-2">
            {mode === 'with_ui'
              ? 'Editorial layout with editable graphic containers (bars, badges, frames).'
              : 'Clean composition — generative effect + typography only, no containers.'}
          </p>

          {/* Template Gallery */}
          <div className="grid grid-cols-2 gap-1.5">
            {KV_TEMPLATE_DEFINITIONS.filter((t) => t.mode === mode).map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => selectTemplate(tpl.id)}
                title={tpl.description}
                className={`py-1.5 px-2 rounded border text-left text-[9px] font-mono uppercase transition-colors ${
                  kvLayout.templateId === tpl.id
                    ? 'bg-[#222] border-[#00F0FF] text-[#00F0FF] font-bold'
                    : 'bg-[#0A0A0A] border-[#222] text-[#888] hover:text-white'
                }`}
              >
                {tpl.name}
              </button>
            ))}
          </div>

          {/* Element selector chips */}
          <div>
            <label className="flex items-center gap-1 text-[#888] text-[10px] uppercase mb-1">
              <MousePointerClick className="w-3 h-3" /> Select Element
            </label>
            <div className="flex flex-wrap gap-1.5">
              {kvLayout.textBlocks.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => selectElement(b.id)}
                  className={`px-2 py-1 rounded text-[9px] font-mono uppercase border transition-colors ${
                    selectedId === b.id
                      ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF] font-bold'
                      : 'bg-[#121212] border-[#222] text-[#888] hover:text-white'
                  }`}
                >
                  {b.name || 'Text'}
                </button>
              ))}
              {kvLayout.graphicElements.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => selectElement(g.id)}
                  className={`px-2 py-1 rounded text-[9px] font-mono uppercase border transition-colors ${
                    selectedId === g.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-[#121212] border-[#222] text-[#888] hover:text-white'
                  }`}
                >
                  {g.name || 'Container'}
                </button>
              ))}
            </div>
          </div>

          {/* Text Block Editor */}
          {selectedBlock && (
            <div className="p-3 bg-[#0a0a0d] border border-[#222] rounded-lg space-y-2.5">
              <div className="flex items-center space-x-2 text-[#E0E0E0]">
                <Type className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span className="text-[10px] font-bold uppercase">{selectedBlock.name || 'Text Block'}</span>
              </div>

              <textarea
                value={selectedBlock.text}
                onChange={(e) => updateSelectedBlock({ text: e.target.value })}
                rows={2}
                className="w-full bg-[#0A0A0A] border border-[#222] rounded p-2 text-[#E0E0E0] font-mono text-[11px] focus:outline-none focus:border-[#00F0FF]"
                placeholder="Original text content..."
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedBlock.fontFamily}
                  onChange={(e) => updateSelectedBlock({ fontFamily: e.target.value })}
                  className="bg-[#0A0A0A] border border-[#222] rounded p-1.5 text-[#E0E0E0] font-mono text-[10px]"
                >
                  {[...(kvLayout.uploadedFonts || []).map((f) => f.family), ...KV_FONT_OPTIONS]
                    .filter((v, i, arr) => arr.indexOf(v) === i)
                    .map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                </select>
                <label className="cursor-pointer py-1.5 px-2 bg-[#121212] hover:bg-[#1e1e1e] border border-[#222] hover:border-[#00F0FF] rounded text-center text-[9px] font-mono text-[#ccc] hover:text-white uppercase transition-colors flex items-center justify-center gap-1.5">
                  <Upload className="w-3 h-3 text-[#00F0FF]" />
                  <span>Upload Font</span>
                  <input
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
                    onChange={handleFontUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[9px]">
                <div>
                  <span className="text-[#888] block mb-0.5">SIZE</span>
                  <input
                    type="number"
                    min={8}
                    max={300}
                    value={selectedBlock.fontSize}
                    onChange={(e) => updateSelectedBlock({ fontSize: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0A0A0A] border border-[#222] rounded px-1.5 py-1 text-[#00F0FF] font-mono"
                  />
                </div>
                <div>
                  <span className="text-[#888] block mb-0.5">WEIGHT</span>
                  <select
                    value={selectedBlock.fontWeight}
                    onChange={(e) => updateSelectedBlock({ fontWeight: parseInt(e.target.value) })}
                    className="w-full bg-[#0A0A0A] border border-[#222] rounded px-1 py-1 text-[#E0E0E0] font-mono"
                  >
                    <option value={300}>300</option>
                    <option value={400}>400</option>
                    <option value={700}>700</option>
                    <option value={900}>900</option>
                  </select>
                </div>
                <div>
                  <span className="text-[#888] block mb-0.5">ALIGN</span>
                  <select
                    value={selectedBlock.textAlign}
                    onChange={(e) => updateSelectedBlock({ textAlign: e.target.value as KVTextBlock['textAlign'] })}
                    className="w-full bg-[#0A0A0A] border border-[#222] rounded px-1 py-1 text-[#E0E0E0] font-mono"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[9px]">
                <div>
                  <div className="flex justify-between text-[#888] mb-0.5">
                    <span>LETTER SPACING</span>
                    <span className="text-[#00F0FF]">{selectedBlock.letterSpacing}px</span>
                  </div>
                  <input
                    type="range"
                    min={-10}
                    max={30}
                    value={selectedBlock.letterSpacing}
                    onChange={(e) => updateSelectedBlock({ letterSpacing: parseFloat(e.target.value) })}
                    className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[#888] mb-0.5">
                    <span>LINE HEIGHT</span>
                    <span className="text-[#00F0FF]">{selectedBlock.lineHeight.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.6}
                    max={2.0}
                    step={0.05}
                    value={selectedBlock.lineHeight}
                    onChange={(e) => updateSelectedBlock({ lineHeight: parseFloat(e.target.value) })}
                    className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[9px]">
                <div>
                  <span className="text-[#888] block mb-0.5">POSITION X</span>
                  <input
                    type="number"
                    value={Math.round(selectedBlock.x)}
                    onChange={(e) => updateSelectedBlock({ x: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0A0A0A] border border-[#222] rounded px-1.5 py-1 text-[#00F0FF] font-mono"
                  />
                </div>
                <div>
                  <span className="text-[#888] block mb-0.5">POSITION Y</span>
                  <input
                    type="number"
                    value={Math.round(selectedBlock.y)}
                    onChange={(e) => updateSelectedBlock({ y: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0A0A0A] border border-[#222] rounded px-1.5 py-1 text-[#00F0FF] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[9px]">
                <div>
                  <div className="flex justify-between text-[#888] mb-0.5">
                    <span>ROTATE</span>
                    <span className="text-[#00F0FF]">{selectedBlock.rotation || 0}°</span>
                  </div>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    value={selectedBlock.rotation || 0}
                    onChange={(e) => updateSelectedBlock({ rotation: parseFloat(e.target.value) })}
                    className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[#888] mb-0.5">
                    <span>SCALE</span>
                    <span className="text-[#00F0FF]">{(selectedBlock.scale ?? 1.0).toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={3.0}
                    step={0.05}
                    value={selectedBlock.scale ?? 1.0}
                    onChange={(e) => updateSelectedBlock({ scale: parseFloat(e.target.value) })}
                    className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[#888] mb-0.5">
                    <span>OPACITY</span>
                    <span className="text-[#00F0FF]">{Math.round(selectedBlock.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={selectedBlock.opacity}
                    onChange={(e) => updateSelectedBlock({ opacity: parseFloat(e.target.value) })}
                    className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 bg-[#121212] p-1.5 rounded border border-[#222]">
                <input
                  type="color"
                  value={selectedBlock.color}
                  onChange={(e) => updateSelectedBlock({ color: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={selectedBlock.color}
                  onChange={(e) => updateSelectedBlock({ color: e.target.value })}
                  className="w-full bg-transparent text-[#E0E0E0] font-mono text-[10px] focus:outline-none uppercase"
                />
              </div>
            </div>
          )}

          {/* Graphic Element Editor (With UI mode) */}
          {selectedGraphic && (
            <div className="p-3 bg-[#0a0a0d] border border-amber-500/20 rounded-lg space-y-2.5">
              <span className="text-[10px] font-bold uppercase text-amber-300">
                {selectedGraphic.name || 'Container'}
              </span>

              <div className="grid grid-cols-4 gap-2 text-[9px]">
                <div>
                  <span className="text-[#888] block mb-0.5">X</span>
                  <input
                    type="number"
                    value={Math.round(selectedGraphic.x)}
                    onChange={(e) => updateSelectedGraphic({ x: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0A0A0A] border border-[#222] rounded px-1 py-1 text-amber-300 font-mono"
                  />
                </div>
                <div>
                  <span className="text-[#888] block mb-0.5">Y</span>
                  <input
                    type="number"
                    value={Math.round(selectedGraphic.y)}
                    onChange={(e) => updateSelectedGraphic({ y: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0A0A0A] border border-[#222] rounded px-1 py-1 text-amber-300 font-mono"
                  />
                </div>
                <div>
                  <span className="text-[#888] block mb-0.5">W</span>
                  <input
                    type="number"
                    value={Math.round(selectedGraphic.width)}
                    onChange={(e) => updateSelectedGraphic({ width: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0A0A0A] border border-[#222] rounded px-1 py-1 text-amber-300 font-mono"
                  />
                </div>
                <div>
                  <span className="text-[#888] block mb-0.5">H</span>
                  <input
                    type="number"
                    value={Math.round(selectedGraphic.height)}
                    onChange={(e) => updateSelectedGraphic({ height: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0A0A0A] border border-[#222] rounded px-1 py-1 text-amber-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[#888] block mb-0.5 text-[9px]">BACKGROUND</span>
                  <input
                    type="text"
                    value={selectedGraphic.backgroundColor || 'transparent'}
                    onChange={(e) => updateSelectedGraphic({ backgroundColor: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[#222] rounded px-1.5 py-1 text-[#E0E0E0] font-mono text-[9px]"
                  />
                </div>
                <div>
                  <span className="text-[#888] block mb-0.5 text-[9px]">BORDER</span>
                  <input
                    type="text"
                    value={selectedGraphic.borderColor || 'transparent'}
                    onChange={(e) => updateSelectedGraphic({ borderColor: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[#222] rounded px-1.5 py-1 text-[#E0E0E0] font-mono text-[9px]"
                  />
                </div>
              </div>

              {typeof selectedGraphic.textLabel === 'string' && (
                <div>
                  <span className="text-[#888] block mb-0.5 text-[9px]">LABEL TEXT</span>
                  <input
                    type="text"
                    value={selectedGraphic.textLabel}
                    onChange={(e) => updateSelectedGraphic({ textLabel: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[#222] rounded px-1.5 py-1 text-[#E0E0E0] font-mono text-[10px]"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
