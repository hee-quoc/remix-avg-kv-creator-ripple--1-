import React, { useState } from 'react';
import { FlipDiscConfig, FlipDiscShape } from '../../flipDisc/types';
import { ObjectShapeType } from '../../types';
import { CONTROL_REGISTRY } from '../../data/controlRegistry';
import { RegistryControl } from '../RegistryControl';
import { Segmented, Accordion } from '../ui';
import { parseCustomShapeSvg } from '../../flipDisc/flipDiscCustomShape';
import { Upload } from 'lucide-react';

interface FlipDiscShapePanelProps {
  config: FlipDiscConfig;
  onUpdateConfig: (patch: Partial<FlipDiscConfig>) => void;
}

// Registry ids are namespaced `flipDisc.*` (so they don't collide with Kinetic's own ids in the
// shared CONTROL_REGISTRY), but FlipDiscConfig itself is a flat object — `density`, not
// `flipDisc.density`. getPath/setPath (utils/statePath.ts) split on every dot, so the prefix must be
// stripped before handing a control to RegistryControl. Every Flip Disc panel repeats this same tiny
// `get` helper, matching the existing per-panel `get` convention in the Kinetic panels.
const get = (id: string) => {
  const c = CONTROL_REGISTRY.find((c) => c.id === id)!;
  return { ...c, id: c.id.replace(/^flipDisc\./, '') };
};

const SHAPES: { id: FlipDiscShape; label: string }[] = [
  { id: 'circle', label: 'Tròn' },
  { id: 'clover', label: 'Cỏ 4 lá' },
  { id: 'square', label: 'Vuông' },
  { id: 'custom', label: 'Tùy chỉnh' }
];

const MASK_SHAPES: { id: ObjectShapeType; label: string }[] = [
  { id: 'circle', label: 'Tròn' },
  { id: 'square', label: 'Vuông' },
  { id: 'ring', label: 'Donut' },
  { id: 'star', label: 'Sao' },
  { id: 'heart', label: 'Tim' },
  { id: 'hexagon', label: 'Lục giác' },
  { id: 'diamond', label: 'Kim cương' },
  { id: 'shield', label: 'Khiên' }
];

/**
 * Flip Disc counterpart to Kinetic's TextPanel — occupies the same "Text" rail slot (relabeled
 * "Hình dạng" for this engine, see InspectorShell.tsx), covering disc shape + density/radius (Basic)
 * and thickness/radial-size/clip-mask (Advanced). Flip Disc has no typography concept, so this is the
 * closest equivalent: "what shape is the grid, and what silhouette does it fill."
 */
export const FlipDiscShapePanel: React.FC<FlipDiscShapePanelProps> = ({ config, onUpdateConfig }) => {
  const onUpdate = (updater: (prev: FlipDiscConfig) => FlipDiscConfig) => onUpdateConfig(updater(config));
  const [customShapeError, setCustomShapeError] = useState<string | null>(null);

  const handleCustomShapeFile = (file: File) => {
    setCustomShapeError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const xml = event.target?.result as string;
      const points = parseCustomShapeSvg(xml);
      if (!points) {
        setCustomShapeError('Không đọc được hình từ file SVG này — cần 1 path/circle/rect/ellipse/polygon khép kín duy nhất.');
        return;
      }
      onUpdateConfig({
        shape: 'custom',
        customShapePoints: points,
        customShapeName: file.name,
        customShapeVersion: (config.customShapeVersion || 0) + 1
      });
    };
    reader.onerror = () => setCustomShapeError('Không đọc được file này.');
    reader.readAsText(file);
  };

  const handleMaskSvgUpload = (file: File) => {
    const readerText = new FileReader();
    readerText.onload = (event) => {
      const xml = event.target?.result as string;
      const readerUrl = new FileReader();
      readerUrl.onload = (evUrl) => {
        const dataUrl = evUrl.target?.result as string;
        // Reset scale/offset on every fresh upload — same fix as Kinetic's TextPanel.tsx
        // handleSvgMaskUpload, so a brand new logo never inherits a stale multiplier/offset left
        // over from a previous upload or manual slider drag.
        onUpdateConfig({
          maskMode: 'svg',
          maskSvgXml: xml,
          maskSvgDataUrl: dataUrl,
          maskSvgName: file.name,
          maskScale: 1,
          maskOffsetX: 0,
          maskOffsetY: 0
        });
      };
      readerUrl.readAsDataURL(file);
    };
    readerText.readAsText(file);
  };

  return (
    <div className="p-4 flex flex-col gap-5">
      <div className="kv-ctl">
        <label className="kv-ctl-label">Hình dạng đĩa</label>
        <div className="grid grid-cols-4 gap-1.5">
          {SHAPES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                if (s.id === 'custom' && !config.customShapePoints) return;
                onUpdateConfig({ shape: s.id });
              }}
              className="py-1.5 px-1 rounded-[var(--radius-input)] border text-center text-[10.5px] transition-colors"
              style={{
                borderColor: config.shape === s.id ? 'var(--ink)' : 'var(--border)',
                background: config.shape === s.id ? 'var(--chip)' : 'transparent',
                color: config.shape === s.id ? 'var(--ink)' : 'var(--muted)',
                fontWeight: config.shape === s.id ? 600 : 400
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        {config.customShapeName ? (
          <div
            className="p-2.5 rounded-[var(--radius-input)] flex items-center justify-between text-[12px]"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            <span className="truncate max-w-[180px]">{config.customShapeName}</span>
            <button
              type="button"
              onClick={() =>
                onUpdateConfig({
                  shape: config.shape === 'custom' ? 'circle' : config.shape,
                  customShapePoints: undefined,
                  customShapeName: undefined
                })
              }
              className="text-rose-500 hover:underline text-[11px] uppercase ml-2"
            >
              Xoá
            </button>
          </div>
        ) : (
          <label className="kv-pill w-full cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Tải hình tùy chỉnh (SVG)</span>
            <input
              type="file"
              accept=".svg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCustomShapeFile(file);
                e.target.value = '';
              }}
              className="hidden"
            />
          </label>
        )}
        {customShapeError && (
          <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: '#f43f5e' }}>
            {customShapeError}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <RegistryControl control={get('flipDisc.density')} state={config} onUpdate={onUpdate} />
        <RegistryControl control={get('flipDisc.discRadius')} state={config} onUpdate={onUpdate} />
      </div>

      <Accordion title="Nâng cao" storageKey="kv.flipDisc.shape.advanced">
        <RegistryControl control={get('flipDisc.thickness')} state={config} onUpdate={onUpdate} />
        <RegistryControl control={get('flipDisc.radialSizeAmount')} state={config} onUpdate={onUpdate} />

        <div className="pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[11px] mb-2" style={{ color: 'var(--muted)' }}>
            Khuôn cắt — chỉ những đĩa nằm trong hình/logo được chọn mới lật vào, phần còn lại bỏ trống
            để lộ ra silhouette.
          </p>
          <div className="kv-ctl">
            <label className="kv-ctl-label">Khuôn cắt (Clip Mask)</label>
            <Segmented
              value={config.maskMode}
              onChange={(v) => onUpdateConfig({ maskMode: v as FlipDiscConfig['maskMode'] })}
              options={[
                { value: 'none', label: 'Không' },
                { value: 'shape', label: 'Hình học' },
                { value: 'svg', label: 'Logo SVG' }
              ]}
            />
          </div>

          {config.maskMode === 'shape' && (
            <div className="grid grid-cols-4 gap-1.5 mt-3">
              {MASK_SHAPES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onUpdateConfig({ maskShapeType: s.id })}
                  className="py-1.5 px-1 rounded-[var(--radius-input)] border text-center text-[10px] transition-colors"
                  style={{
                    borderColor: config.maskShapeType === s.id ? 'var(--ink)' : 'var(--border)',
                    background: config.maskShapeType === s.id ? 'var(--chip)' : 'transparent',
                    color: config.maskShapeType === s.id ? 'var(--ink)' : 'var(--muted)',
                    fontWeight: config.maskShapeType === s.id ? 600 : 400
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {config.maskMode === 'svg' && (
            <div className="mt-3">
              {config.maskSvgName ? (
                <div
                  className="p-2.5 rounded-[var(--radius-input)] flex items-center justify-between text-[12px]"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                  <span className="truncate max-w-[180px]">{config.maskSvgName}</span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateConfig({ maskSvgDataUrl: undefined, maskSvgXml: undefined, maskSvgName: undefined, maskMode: 'none' })
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
                      if (file) handleMaskSvgUpload(file);
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

          {config.maskMode !== 'none' && (
            <div className="flex flex-col gap-4 mt-3">
              <RegistryControl control={get('flipDisc.maskScale')} state={config} onUpdate={onUpdate} unit="x" />
              <div className="grid grid-cols-2 gap-4">
                <RegistryControl control={get('flipDisc.maskOffsetX')} state={config} onUpdate={onUpdate} />
                <RegistryControl control={get('flipDisc.maskOffsetY')} state={config} onUpdate={onUpdate} />
              </div>
            </div>
          )}
        </div>
      </Accordion>
    </div>
  );
};
