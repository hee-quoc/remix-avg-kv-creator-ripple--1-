import React from 'react';
import { FlipDiscConfig } from '../../flipDisc/types';
import { FLIP_DISC_PRESETS } from '../../flipDisc/presets';
import { resolveQuickControls } from '../../data/controlRegistry';
import { RegistryControl } from '../RegistryControl';
import { Chip } from '../ui';
import { Zap } from 'lucide-react';

interface FlipDiscQuickPanelProps {
  config: FlipDiscConfig;
  activePresetId: string;
  onUpdateConfig: (patch: Partial<FlipDiscConfig>) => void;
}

// Matches playful_bloom's own curated list (src/flipDisc/presets.ts) — used for the 3 presets that
// don't have their own quickControls yet (same fallback pattern as Kinetic's QuickPanel.tsx).
const FALLBACK_IDS = ['flipDisc.discRadius', 'flipDisc.frontColor', 'flipDisc.backColor', 'flipDisc.flipSpeed', 'flipDisc.rippleDelay'];

/**
 * Flip Disc counterpart to QuickPanel.tsx — same "preset's own curated dial list, or a sensible
 * fallback" pattern, just targeting FlipDiscConfig (a flat object) instead of RenderState. Registry
 * ids are namespaced `flipDisc.*` but the config itself has no `flipDisc` wrapper key, so the prefix
 * is stripped before handing each control to RegistryControl — see FlipDiscShapePanel.tsx's doc
 * comment for why (same fix applied in every Flip Disc panel).
 */
export const FlipDiscQuickPanel: React.FC<FlipDiscQuickPanelProps> = ({ config, activePresetId, onUpdateConfig }) => {
  const onUpdate = (updater: (prev: FlipDiscConfig) => FlipDiscConfig) => onUpdateConfig(updater(config));
  const preset = FLIP_DISC_PRESETS.find((p) => p.id === activePresetId);
  const ids = preset?.quickControls && preset.quickControls.length > 0 ? preset.quickControls : FALLBACK_IDS;
  const controls = resolveQuickControls(ids).map((c) => ({ ...c, id: c.id.replace(/^flipDisc\./, '') }));
  const isFallback = !preset?.quickControls || preset.quickControls.length === 0;

  return (
    <div className="p-4 flex flex-col gap-5">
      <div className="flex items-center gap-2 flex-wrap">
        <Chip>{preset?.name || 'Chưa chọn preset'}</Chip>
        {isFallback && preset && <Chip tone="warn">Chưa có danh sách riêng — dùng mặc định</Chip>}
      </div>

      {controls.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <Zap className="w-7 h-7" style={{ color: 'var(--muted)' }} />
          <p className="text-xs leading-relaxed max-w-[220px]" style={{ color: 'var(--muted)' }}>
            Chọn một preset Flip Disc ở dải bên dưới canvas để thấy các control nhanh ở đây.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {controls.map((c) => (
            <RegistryControl key={c.id} control={c} state={config} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  );
};
