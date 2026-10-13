import React, { useState } from 'react';
import { RenderState } from '../../types';
import { CONTROL_REGISTRY } from '../../data/controlRegistry';
import { RegistryControl } from '../RegistryControl';
import { Segmented, Accordion } from '../ui';
import { Upload, Link, Unlink } from 'lucide-react';

interface TextPanelProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
}

const FONT_OPTIONS = [
  { name: 'Space Grotesk', category: 'Display Sans' },
  { name: 'Syne', category: 'Geometric Heavy' },
  { name: 'Instrument Serif', category: 'High Contrast Serif' },
  { name: 'Anton', category: 'Ultra Bold' },
  { name: 'JetBrains Mono', category: 'Scientific Monospace' },
  { name: 'Bungee', category: 'Monolithic' },
  { name: 'Cinzel', category: 'Classic Display' },
  { name: 'Inter', category: 'Clean Neutral' },
  { name: 'Press Start 2P', category: 'Pixel / LED' }
];

const MASK_MODES = [
  { id: 'text', label: 'Chữ' },
  { id: 'shape', label: 'Hình học' },
  { id: 'svg_mask', label: 'Logo SVG' }
] as const;

const MASK_SHAPES = [
  { id: 'circle', label: 'Tròn' },
  { id: 'square', label: 'Vuông' },
  { id: 'ring', label: 'Donut' },
  { id: 'star', label: 'Sao' },
  { id: 'heart', label: 'Tim' },
  { id: 'hexagon', label: 'Lục giác' },
  { id: 'diamond', label: 'Kim cương' },
  { id: 'shield', label: 'Khiên' }
] as const;

const get = (id: string) => CONTROL_REGISTRY.find((c) => c.id === id)!;

/**
 * Redesign V1-B, Phase P4 — the real "Text" group (spec section 5): content, mask type + its
 * sub-pickers, font + upload, size/weight/spacing/line-height/align are Basic (match on screen as
 * soon as the tab opens); invert mask and linked mask scale are tucked into "Nâng cao". Composition
 * mode (CompositionModeControls) and the independent KV text layer (TextLayoutControls) briefly lived
 * here after the "Bố cục" group was dropped, but were removed entirely per explicit instruction —
 * compositionMode is still readable/settable via presets and state, just no longer exposed as UI.
 */
export const TextPanel: React.FC<TextPanelProps> = ({ state, onUpdateState }) => {
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
      setCustomFonts((prev) => (prev.some((f) => f.name === fontName) ? prev : [...prev, { name: fontName, category: 'Local Font' }]));
      onUpdateState((prev) => ({ ...prev, font: { ...prev.font, fontFamily: fontName, customFontName: fontName } }));
    } catch (err) {
      console.error('Failed to load local font:', err);
      alert('Could not load the font file. Please ensure it is a valid .ttf, .otf, .woff, or .woff2 file.');
    }
  };

  const handleSvgMaskUpload = (file: File) => {
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
            maskSvgName: file.name,
            // A fresh upload must start at the file's own natural fit, not whatever maskScale a
            // previous preset or prior logo happened to leave behind — otherwise a brand new SVG
            // silently inherits an unrelated 2x/3x/0.75x multiplier and renders at the wrong size
            // relative to the actual file (e.g. Global Pulse bakes in maskScale: 2).
            maskScale: 1,
            maskScaleX: 1,
            maskScaleY: 1
          }
        }));
      };
      readerUrl.readAsDataURL(file);
    };
    readerText.readAsText(file);
  };

  const maskMode = state.font.maskMode || 'text';
  const scaleX = state.font.maskScaleX ?? state.font.maskScale ?? 1;
  const scaleY = state.font.maskScaleY ?? state.font.maskScale ?? 1;

  const setScale = (axis: 'x' | 'y', val: number) => {
    onUpdateState((prev) => ({
      ...prev,
      font: {
        ...prev.font,
        maskScaleX: axis === 'x' ? val : maskLinkAspect ? val : prev.font.maskScaleX ?? prev.font.maskScale ?? 1,
        maskScaleY: axis === 'y' ? val : maskLinkAspect ? val : prev.font.maskScaleY ?? prev.font.maskScale ?? 1,
        maskScale: val
      }
    }));
  };

  return (
    <div className="p-4 flex flex-col gap-5">
      <RegistryControl control={get('font.text')} state={state} onUpdate={onUpdateState} />

      <div className="kv-ctl">
        <label className="kv-ctl-label">Loại mask</label>
        <Segmented
          value={maskMode}
          onChange={(v) => onUpdateState((prev) => ({ ...prev, font: { ...prev.font, maskMode: v as typeof maskMode } }))}
          options={MASK_MODES.map((m) => ({ value: m.id, label: m.label }))}
        />
      </div>

      {maskMode === 'shape' && (
        <div className="grid grid-cols-4 gap-1.5">
          {MASK_SHAPES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onUpdateState((prev) => ({ ...prev, font: { ...prev.font, shapeType: s.id } }))}
              className="py-1.5 px-1 rounded-[var(--radius-input)] border text-center text-[10.5px] transition-colors"
              style={{
                borderColor: (state.font.shapeType || 'circle') === s.id ? 'var(--ink)' : 'var(--border)',
                background: (state.font.shapeType || 'circle') === s.id ? 'var(--chip)' : 'transparent',
                color: (state.font.shapeType || 'circle') === s.id ? 'var(--ink)' : 'var(--muted)',
                fontWeight: (state.font.shapeType || 'circle') === s.id ? 600 : 400
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {maskMode === 'svg_mask' && (
        <div>
          {state.font.maskSvgName ? (
            <div
              className="p-2.5 rounded-[var(--radius-input)] flex items-center justify-between text-[12px]"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              <span className="truncate max-w-[180px]">{state.font.maskSvgName}</span>
              <button
                type="button"
                onClick={() =>
                  onUpdateState((prev) => ({
                    ...prev,
                    font: { ...prev.font, maskSvgDataUrl: undefined, maskSvgXml: undefined, maskSvgName: undefined, maskMode: 'text' }
                  }))
                }
                className="text-rose-500 hover:underline text-[11px] uppercase ml-2"
              >
                Xoá
              </button>
            </div>
          ) : (
            <label className="kv-pill w-full cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Tải logo SVG</span>
              <input
                type="file"
                accept=".svg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleSvgMaskUpload(file);
                }}
                className="hidden"
              />
            </label>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="kv-ctl-label">Font</label>
          {state.font.customFontName && (
            <span className="text-[10.5px]" style={{ color: 'var(--modified)' }}>
              Local: {state.font.customFontName}
            </span>
          )}
        </div>
        <select
          value={state.font.fontFamily}
          onChange={(e) => onUpdateState((prev) => ({ ...prev, font: { ...prev.font, fontFamily: e.target.value } }))}
          className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--radius-input)] px-2.5 py-2 text-[13px] mb-2"
          style={{ color: 'var(--ink)' }}
        >
          {[...customFonts, ...FONT_OPTIONS].map((f) => (
            <option key={f.name} value={f.name}>
              {f.name} ({f.category})
            </option>
          ))}
        </select>
        <label className="kv-pill w-full cursor-pointer">
          <Upload className="w-3.5 h-3.5" />
          <span>Tải font (.ttf, .otf, .woff, .woff2)</span>
          <input
            type="file"
            accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
            onChange={handleFontFileUpload}
            className="hidden"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <RegistryControl control={get('font.fontSize')} state={state} onUpdate={onUpdateState} unit="px" decimals={0} />
        <RegistryControl control={get('font.fontWeight')} state={state} onUpdate={onUpdateState} decimals={0} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <RegistryControl control={get('font.letterSpacing')} state={state} onUpdate={onUpdateState} unit="px" decimals={0} />
        <RegistryControl control={get('font.lineHeight')} state={state} onUpdate={onUpdateState} decimals={2} />
      </div>

      <div className="kv-ctl">
        <label className="kv-ctl-label">Căn chữ</label>
        <Segmented
          value={state.font.textAlign}
          onChange={(v) => onUpdateState((prev) => ({ ...prev, font: { ...prev.font, textAlign: v as 'left' | 'center' | 'right' } }))}
          options={[
            { value: 'left', label: 'Trái' },
            { value: 'center', label: 'Giữa' },
            { value: 'right', label: 'Phải' }
          ]}
        />
      </div>

      <Accordion title="Nâng cao" storageKey="kv.text.advanced">
        <RegistryControl control={get('font.invertText')} state={state} onUpdate={onUpdateState} />

        <div className="kv-ctl">
          <div className="kv-ctl-head">
            <label className="kv-ctl-label">Tỉ lệ mask</label>
            <button
              type="button"
              onClick={() => setMaskLinkAspect((v) => !v)}
              className="flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-[var(--radius-pill)]"
              style={{
                border: `1px solid ${maskLinkAspect ? 'var(--modified)' : 'var(--border-strong)'}`,
                color: maskLinkAspect ? 'var(--modified)' : 'var(--muted)',
                background: maskLinkAspect ? 'var(--modified-bg)' : 'transparent'
              }}
            >
              {maskLinkAspect ? <Link className="w-2.5 h-2.5" /> : <Unlink className="w-2.5 h-2.5" />}
              {maskLinkAspect ? 'Đồng bộ' : 'Riêng'}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <RegistryControl
            control={{ ...get('font.maskScaleX'), default: scaleX }}
            state={state}
            onUpdate={onUpdateState}
            unit="x"
          />
          <RegistryControl
            control={{ ...get('font.maskScaleY'), default: scaleY }}
            state={state}
            onUpdate={onUpdateState}
            unit="x"
          />
        </div>
      </Accordion>
    </div>
  );
};
