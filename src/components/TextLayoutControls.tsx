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
      alert('Không đọc được file font. Hãy chắc chắn đó là file .ttf, .otf, .woff hoặc .woff2 hợp lệ.');
    }
  };

  const inputClass = 'w-full rounded-[var(--radius-input)] border px-1.5 py-1 text-[10px]';
  const inputStyle: React.CSSProperties = {
    background: 'var(--chip)',
    borderColor: 'var(--border)',
    color: 'var(--ink)',
    fontFamily: 'var(--font-mono)'
  };
  const accentInputStyle: React.CSSProperties = { ...inputStyle, color: 'var(--modified-ink)' };

  return (
    <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-ui)' }}>
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center space-x-2" style={{ color: 'var(--modified-ink)' }}>
          <LayoutTemplate className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold uppercase">Văn bản gốc (Bố cục KV độc lập)</span>
        </div>
        <button
          type="button"
          onClick={() => setEnabled(!enabled)}
          className="text-[9px] px-2 py-0.5 rounded font-bold uppercase border transition-colors"
          style={
            enabled
              ? { background: 'var(--modified-bg)', color: 'var(--modified-ink)', borderColor: 'var(--modified)' }
              : { background: 'var(--chip)', color: 'var(--muted)', borderColor: 'var(--border)' }
          }
        >
          {enabled ? 'Hiện' : 'Ẩn'}
        </button>
      </div>

      <p className="text-[10px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        Một lớp typography/bố cục hoàn toàn độc lập — không bao giờ được chuyển thành hạt, không bị
        sóng làm biến dạng. Có nội dung, font (kể cả font tải lên), vị trí, xoay, tỉ lệ và độ mờ riêng.
        Chỉnh sửa lớp này không ảnh hưởng đến Effect Text hay cấu hình sóng/hạt.
      </p>

      {enabled && kvLayout && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-[var(--radius-input)] border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={() => switchMode('with_ui')}
              className="py-1.5 rounded text-[10px] uppercase transition-colors font-bold"
              style={{
                fontFamily: 'var(--font-mono)',
                background: mode === 'with_ui' ? 'var(--modified-bg)' : 'transparent',
                color: mode === 'with_ui' ? 'var(--modified-ink)' : 'var(--muted)',
                border: mode === 'with_ui' ? '1px solid var(--modified)' : '1px solid transparent'
              }}
            >
              Có UI
            </button>
            <button
              type="button"
              onClick={() => switchMode('without_ui')}
              className="py-1.5 rounded text-[10px] uppercase transition-colors font-bold"
              style={{
                fontFamily: 'var(--font-mono)',
                background: mode === 'without_ui' ? 'var(--modified-bg)' : 'transparent',
                color: mode === 'without_ui' ? 'var(--modified-ink)' : 'var(--muted)',
                border: mode === 'without_ui' ? '1px solid var(--modified)' : '1px solid transparent'
              }}
            >
              Không UI
            </button>
          </div>
          <p className="text-[10px] -mt-2" style={{ color: 'var(--muted)' }}>
            {mode === 'with_ui'
              ? 'Bố cục editorial với khung chứa có thể chỉnh (bar, badge, frame).'
              : 'Bố cục sạch — chỉ có hiệu ứng sinh thành + typography, không khung chứa.'}
          </p>

          <div className="grid grid-cols-2 gap-1.5">
            {KV_TEMPLATE_DEFINITIONS.filter((t) => t.mode === mode).map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => selectTemplate(tpl.id)}
                title={tpl.description}
                className="py-1.5 px-2 rounded-[var(--radius-input)] border text-left text-[9.5px] uppercase transition-colors"
                style={
                  kvLayout.templateId === tpl.id
                    ? { background: 'var(--modified-bg)', borderColor: 'var(--modified)', color: 'var(--modified-ink)', fontFamily: 'var(--font-mono)', fontWeight: 700 }
                    : { background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }
                }
              >
                {tpl.name}
              </button>
            ))}
          </div>

          <div>
            <label className="flex items-center gap-1 text-[10px] uppercase mb-1" style={{ color: 'var(--muted)' }}>
              <MousePointerClick className="w-3 h-3" /> Chọn phần tử
            </label>
            <div className="flex flex-wrap gap-1.5">
              {kvLayout.textBlocks.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => selectElement(b.id)}
                  className="px-2 py-1 rounded-[var(--radius-pill)] text-[9.5px] uppercase border transition-colors"
                  style={
                    selectedId === b.id
                      ? { background: 'var(--modified-bg)', borderColor: 'var(--modified)', color: 'var(--modified-ink)', fontFamily: 'var(--font-mono)', fontWeight: 700 }
                      : { background: 'var(--chip)', borderColor: 'var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }
                  }
                >
                  {b.name || 'Văn bản'}
                </button>
              ))}
              {kvLayout.graphicElements.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => selectElement(g.id)}
                  className="px-2 py-1 rounded-[var(--radius-pill)] text-[9.5px] uppercase border transition-colors"
                  style={
                    selectedId === g.id
                      ? { background: 'rgba(245,158,11,0.15)', borderColor: '#f59e0b', color: '#f59e0b', fontFamily: 'var(--font-mono)', fontWeight: 700 }
                      : { background: 'var(--chip)', borderColor: 'var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }
                  }
                >
                  {g.name || 'Khung chứa'}
                </button>
              ))}
            </div>
          </div>

          {selectedBlock && (
            <div className="p-3 rounded-[var(--radius-input)] border space-y-2.5" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
              <div className="flex items-center space-x-2" style={{ color: 'var(--ink)' }}>
                <Type className="w-3.5 h-3.5" style={{ color: 'var(--modified-ink)' }} />
                <span className="text-[10px] font-bold uppercase">{selectedBlock.name || 'Khối văn bản'}</span>
              </div>

              <textarea
                value={selectedBlock.text}
                onChange={(e) => updateSelectedBlock({ text: e.target.value })}
                rows={2}
                className="w-full rounded-[var(--radius-input)] border p-2 text-[11px] focus:outline-none"
                style={{ background: 'var(--chip)', borderColor: 'var(--border)', color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}
                placeholder="Nội dung văn bản gốc..."
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedBlock.fontFamily}
                  onChange={(e) => updateSelectedBlock({ fontFamily: e.target.value })}
                  className={inputClass}
                  style={inputStyle}
                >
                  {[...(kvLayout.uploadedFonts || []).map((f) => f.family), ...KV_FONT_OPTIONS]
                    .filter((v, i, arr) => arr.indexOf(v) === i)
                    .map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                </select>
                <label
                  className="cursor-pointer py-1.5 px-2 rounded-[var(--radius-input)] border text-center text-[9.5px] uppercase transition-colors flex items-center justify-center gap-1.5"
                  style={{ background: 'var(--chip)', borderColor: 'var(--border)', color: 'var(--ink-2)' }}
                >
                  <Upload className="w-3 h-3" style={{ color: 'var(--modified-ink)' }} />
                  <span>Tải font</span>
                  <input
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
                    onChange={handleFontUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[9.5px]">
                <div>
                  <span className="block mb-0.5" style={{ color: 'var(--muted)' }}>Kích thước</span>
                  <input
                    type="number"
                    min={8}
                    max={300}
                    value={selectedBlock.fontSize}
                    onChange={(e) => updateSelectedBlock({ fontSize: parseFloat(e.target.value) || 0 })}
                    className={inputClass}
                    style={accentInputStyle}
                  />
                </div>
                <div>
                  <span className="block mb-0.5" style={{ color: 'var(--muted)' }}>Độ đậm</span>
                  <select
                    value={selectedBlock.fontWeight}
                    onChange={(e) => updateSelectedBlock({ fontWeight: parseInt(e.target.value) })}
                    className={inputClass}
                    style={inputStyle}
                  >
                    <option value={300}>300</option>
                    <option value={400}>400</option>
                    <option value={700}>700</option>
                    <option value={900}>900</option>
                  </select>
                </div>
                <div>
                  <span className="block mb-0.5" style={{ color: 'var(--muted)' }}>Căn lề</span>
                  <select
                    value={selectedBlock.textAlign}
                    onChange={(e) => updateSelectedBlock({ textAlign: e.target.value as KVTextBlock['textAlign'] })}
                    className={inputClass}
                    style={inputStyle}
                  >
                    <option value="left">Trái</option>
                    <option value="center">Giữa</option>
                    <option value="right">Phải</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[9.5px]">
                <div>
                  <div className="flex justify-between mb-0.5" style={{ color: 'var(--muted)' }}>
                    <span>Giãn chữ</span>
                    <span style={{ color: 'var(--modified-ink)' }}>{selectedBlock.letterSpacing}px</span>
                  </div>
                  <input
                    type="range"
                    min={-10}
                    max={30}
                    value={selectedBlock.letterSpacing}
                    onChange={(e) => updateSelectedBlock({ letterSpacing: parseFloat(e.target.value) })}
                    className="w-full h-[2px] appearance-none cursor-pointer"
                    style={{ background: 'var(--track)', accentColor: 'var(--modified)' }}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-0.5" style={{ color: 'var(--muted)' }}>
                    <span>Chiều cao dòng</span>
                    <span style={{ color: 'var(--modified-ink)' }}>{selectedBlock.lineHeight.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.6}
                    max={2.0}
                    step={0.05}
                    value={selectedBlock.lineHeight}
                    onChange={(e) => updateSelectedBlock({ lineHeight: parseFloat(e.target.value) })}
                    className="w-full h-[2px] appearance-none cursor-pointer"
                    style={{ background: 'var(--track)', accentColor: 'var(--modified)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[9.5px]">
                <div>
                  <span className="block mb-0.5" style={{ color: 'var(--muted)' }}>Vị trí X</span>
                  <input
                    type="number"
                    value={Math.round(selectedBlock.x)}
                    onChange={(e) => updateSelectedBlock({ x: parseFloat(e.target.value) || 0 })}
                    className={inputClass}
                    style={accentInputStyle}
                  />
                </div>
                <div>
                  <span className="block mb-0.5" style={{ color: 'var(--muted)' }}>Vị trí Y</span>
                  <input
                    type="number"
                    value={Math.round(selectedBlock.y)}
                    onChange={(e) => updateSelectedBlock({ y: parseFloat(e.target.value) || 0 })}
                    className={inputClass}
                    style={accentInputStyle}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[9.5px]">
                <div>
                  <div className="flex justify-between mb-0.5" style={{ color: 'var(--muted)' }}>
                    <span>Xoay</span>
                    <span style={{ color: 'var(--modified-ink)' }}>{selectedBlock.rotation || 0}°</span>
                  </div>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    value={selectedBlock.rotation || 0}
                    onChange={(e) => updateSelectedBlock({ rotation: parseFloat(e.target.value) })}
                    className="w-full h-[2px] appearance-none cursor-pointer"
                    style={{ background: 'var(--track)', accentColor: 'var(--modified)' }}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-0.5" style={{ color: 'var(--muted)' }}>
                    <span>Tỉ lệ</span>
                    <span style={{ color: 'var(--modified-ink)' }}>{(selectedBlock.scale ?? 1.0).toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={3.0}
                    step={0.05}
                    value={selectedBlock.scale ?? 1.0}
                    onChange={(e) => updateSelectedBlock({ scale: parseFloat(e.target.value) })}
                    className="w-full h-[2px] appearance-none cursor-pointer"
                    style={{ background: 'var(--track)', accentColor: 'var(--modified)' }}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-0.5" style={{ color: 'var(--muted)' }}>
                    <span>Độ mờ</span>
                    <span style={{ color: 'var(--modified-ink)' }}>{Math.round(selectedBlock.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={selectedBlock.opacity}
                    onChange={(e) => updateSelectedBlock({ opacity: parseFloat(e.target.value) })}
                    className="w-full h-[2px] appearance-none cursor-pointer"
                    style={{ background: 'var(--track)', accentColor: 'var(--modified)' }}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 p-1.5 rounded-[var(--radius-input)] border" style={{ background: 'var(--chip)', borderColor: 'var(--border)' }}>
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
                  className="w-full bg-transparent text-[10px] focus:outline-none uppercase"
                  style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>
          )}

          {selectedGraphic && (
            <div className="p-3 rounded-[var(--radius-input)] border space-y-2.5" style={{ background: 'var(--surface-2)', borderColor: 'rgba(245,158,11,0.3)' }}>
              <span className="text-[10px] font-bold uppercase" style={{ color: '#f59e0b' }}>
                {selectedGraphic.name || 'Khung chứa'}
              </span>

              <div className="grid grid-cols-4 gap-2 text-[9.5px]">
                <div>
                  <span className="block mb-0.5" style={{ color: 'var(--muted)' }}>X</span>
                  <input
                    type="number"
                    value={Math.round(selectedGraphic.x)}
                    onChange={(e) => updateSelectedGraphic({ x: parseFloat(e.target.value) || 0 })}
                    className={inputClass}
                    style={{ ...inputStyle, color: '#f59e0b' }}
                  />
                </div>
                <div>
                  <span className="block mb-0.5" style={{ color: 'var(--muted)' }}>Y</span>
                  <input
                    type="number"
                    value={Math.round(selectedGraphic.y)}
                    onChange={(e) => updateSelectedGraphic({ y: parseFloat(e.target.value) || 0 })}
                    className={inputClass}
                    style={{ ...inputStyle, color: '#f59e0b' }}
                  />
                </div>
                <div>
                  <span className="block mb-0.5" style={{ color: 'var(--muted)' }}>W</span>
                  <input
                    type="number"
                    value={Math.round(selectedGraphic.width)}
                    onChange={(e) => updateSelectedGraphic({ width: parseFloat(e.target.value) || 0 })}
                    className={inputClass}
                    style={{ ...inputStyle, color: '#f59e0b' }}
                  />
                </div>
                <div>
                  <span className="block mb-0.5" style={{ color: 'var(--muted)' }}>H</span>
                  <input
                    type="number"
                    value={Math.round(selectedGraphic.height)}
                    onChange={(e) => updateSelectedGraphic({ height: parseFloat(e.target.value) || 0 })}
                    className={inputClass}
                    style={{ ...inputStyle, color: '#f59e0b' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block mb-0.5 text-[9.5px]" style={{ color: 'var(--muted)' }}>Nền</span>
                  <input
                    type="text"
                    value={selectedGraphic.backgroundColor || 'transparent'}
                    onChange={(e) => updateSelectedGraphic({ backgroundColor: e.target.value })}
                    className={`${inputClass} text-[9.5px]`}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <span className="block mb-0.5 text-[9.5px]" style={{ color: 'var(--muted)' }}>Viền</span>
                  <input
                    type="text"
                    value={selectedGraphic.borderColor || 'transparent'}
                    onChange={(e) => updateSelectedGraphic({ borderColor: e.target.value })}
                    className={`${inputClass} text-[9.5px]`}
                    style={inputStyle}
                  />
                </div>
              </div>

              {typeof selectedGraphic.textLabel === 'string' && (
                <div>
                  <span className="block mb-0.5 text-[9.5px]" style={{ color: 'var(--muted)' }}>Nhãn chữ</span>
                  <input
                    type="text"
                    value={selectedGraphic.textLabel}
                    onChange={(e) => updateSelectedGraphic({ textLabel: e.target.value })}
                    className={inputClass}
                    style={inputStyle}
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
