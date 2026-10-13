import React, { useRef } from 'react';
import { FlipDiscConfig, FlipDiscMaterial } from '../../flipDisc/types';
import { FlipDiscImageActions } from '../../flipDisc/FlipDiscCanvas';
import { CONTROL_REGISTRY } from '../../data/controlRegistry';
import { RegistryControl } from '../RegistryControl';
import { Accordion, PillButton } from '../ui';
import { Image as ImageIcon, X } from 'lucide-react';

interface FlipDiscAppearancePanelProps {
  config: FlipDiscConfig;
  onUpdateConfig: (patch: Partial<FlipDiscConfig>) => void;
  imageActionsRef?: React.MutableRefObject<FlipDiscImageActions | null>;
  frontImageStatus?: string;
  backImageStatus?: string;
}

const get = (id: string) => {
  const c = CONTROL_REGISTRY.find((c) => c.id === id)!;
  return { ...c, id: c.id.replace(/^flipDisc\./, '') };
};

const MATERIALS: { id: FlipDiscMaterial; label: string; desc: string }[] = [
  { id: 'matte', label: 'Nhám', desc: 'Phẳng, mềm, graphic' },
  { id: 'glossy', label: 'Bóng', desc: 'Nhựa bóng kiểu đồ chơi' },
  { id: 'metallic', label: 'Kim loại', desc: 'Ánh chrome chải xước' },
  { id: 'iridescent', label: 'Ánh cầu vồng', desc: 'Lấp lánh lăng kính — mặc định' }
];

const PALETTES: { name: string; front: string; back: string; side: string }[] = [
  { name: 'Prismatic', front: '#0B9EB8', back: '#D43D11', side: '#34314D' },
  { name: 'Pastel Bloom', front: '#F7C6E0', back: '#C9E4FF', side: '#4A3F63' },
  { name: 'Toy Blocks', front: '#FF6F61', back: '#FFD23F', side: '#1F2937' },
  { name: 'Candy Pop', front: '#FF4D9D', back: '#5AD1E6', side: '#241B33' }
];

/**
 * Flip Disc counterpart to Kinetic's AppearancePanel — colors + material (Basic), rainbow/saturation
 * (Advanced). Image-texture upload for front/back faces lives here too since it's a color-adjacent
 * concept (a photo instead of a flat fill), matching where it sat in the old FlipDiscControls.tsx.
 */
export const FlipDiscAppearancePanel: React.FC<FlipDiscAppearancePanelProps> = ({
  config,
  onUpdateConfig,
  imageActionsRef,
  frontImageStatus,
  backImageStatus
}) => {
  const onUpdate = (updater: (prev: FlipDiscConfig) => FlipDiscConfig) => onUpdateConfig(updater(config));
  const frontFileRef = useRef<HTMLInputElement>(null);
  const backFileRef = useRef<HTMLInputElement>(null);

  const imageUploadRow = (which: 'front' | 'back', status: string | undefined) => {
    const fileRef = which === 'front' ? frontFileRef : backFileRef;
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <label className="kv-pill flex-1 justify-center cursor-pointer">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Tải ảnh</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && which === 'front') imageActionsRef?.current?.loadFront(file);
                else if (file) imageActionsRef?.current?.loadBack(file);
              }}
              className="hidden"
            />
          </label>
          <PillButton
            className="kv-pill-icon"
            onClick={() => {
              if (which === 'front') imageActionsRef?.current?.clearFront();
              else imageActionsRef?.current?.clearBack();
              if (fileRef.current) fileRef.current.value = '';
            }}
            aria-label="Xoá ảnh"
          >
            <X className="w-3.5 h-3.5" />
          </PillButton>
        </div>
        <span className="text-[10.5px] truncate" style={{ color: 'var(--muted)' }}>
          {status || 'Chưa có ảnh — dùng màu phẳng'}
        </span>
      </div>
    );
  };

  return (
    <div className="p-4 flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <RegistryControl control={get('flipDisc.frontColor')} state={config} onUpdate={onUpdate} />
        <RegistryControl control={get('flipDisc.backColor')} state={config} onUpdate={onUpdate} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {imageUploadRow('front', frontImageStatus)}
        {imageUploadRow('back', backImageStatus)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <RegistryControl control={get('flipDisc.sideColor')} state={config} onUpdate={onUpdate} />
        <RegistryControl control={get('flipDisc.backgroundColor')} state={config} onUpdate={onUpdate} />
      </div>

      <div className="kv-ctl">
        <label className="kv-ctl-label">Chất liệu</label>
        <div className="grid grid-cols-2 gap-1.5">
          {MATERIALS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onUpdateConfig({ material: m.id })}
              title={m.desc}
              className="p-2 rounded-[var(--radius-input)] border text-left transition-colors"
              style={{
                borderColor: config.material === m.id ? 'var(--ink)' : 'var(--border)',
                background: config.material === m.id ? 'var(--chip)' : 'transparent'
              }}
            >
              <span className="block text-[11px]" style={{ color: 'var(--ink)', fontWeight: config.material === m.id ? 600 : 400 }}>
                {m.label}
              </span>
              <span className="block text-[9.5px]" style={{ color: 'var(--muted)' }}>
                {m.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="kv-ctl">
        <label className="kv-ctl-label">Bảng màu dựng sẵn</label>
        <div className="grid grid-cols-2 gap-1.5">
          {PALETTES.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => onUpdateConfig({ frontColor: p.front, backColor: p.back, sideColor: p.side })}
              className="p-2 rounded-[var(--radius-input)] border flex items-center justify-between text-left transition-colors"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            >
              <span className="text-[10.5px]" style={{ color: 'var(--ink-2)' }}>
                {p.name}
              </span>
              <div className="flex items-center gap-1">
                {[p.front, p.back, p.side].map((c, i) => (
                  <span key={i} className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: c, borderColor: 'var(--border-strong)' }} />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      <Accordion title="Nâng cao" storageKey="kv.flipDisc.appearance.advanced">
        <RegistryControl control={get('flipDisc.rainbowIntensity')} state={config} onUpdate={onUpdate} />
        <RegistryControl control={get('flipDisc.saturation')} state={config} onUpdate={onUpdate} unit="x" />
      </Accordion>
    </div>
  );
};
