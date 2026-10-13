import React from 'react';
import { FlipDiscConfig } from '../../flipDisc/types';
import { CONTROL_REGISTRY } from '../../data/controlRegistry';
import { RegistryControl } from '../RegistryControl';
import { Accordion } from '../ui';

interface FlipDiscEffectPanelProps {
  config: FlipDiscConfig;
  onUpdateConfig: (patch: Partial<FlipDiscConfig>) => void;
}

const get = (id: string) => {
  const c = CONTROL_REGISTRY.find((c) => c.id === id)!;
  return { ...c, id: c.id.replace(/^flipDisc\./, '') };
};

/**
 * Flip Disc counterpart to Kinetic's EffectPanel — motion (flip speed/ripple delay, Basic) and grain
 * texture (Advanced). No shape/wave/audio sub-nav needed here since Flip Disc's "effect" surface is
 * just this one small set of fields (registry group `effect`/subgroup `motion`).
 */
export const FlipDiscEffectPanel: React.FC<FlipDiscEffectPanelProps> = ({ config, onUpdateConfig }) => {
  const onUpdate = (updater: (prev: FlipDiscConfig) => FlipDiscConfig) => onUpdateConfig(updater(config));

  return (
    <div className="p-4 flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <RegistryControl control={get('flipDisc.flipSpeed')} state={config} onUpdate={onUpdate} unit="x" />
        <RegistryControl control={get('flipDisc.rippleDelay')} state={config} onUpdate={onUpdate} />
      </div>

      <Accordion title="Nâng cao" storageKey="kv.flipDisc.effect.advanced">
        <div className="grid grid-cols-2 gap-4">
          <RegistryControl control={get('flipDisc.motionSoftness')} state={config} onUpdate={onUpdate} />
          <RegistryControl control={get('flipDisc.waveTiming')} state={config} onUpdate={onUpdate} unit="x" />
        </div>

        <div className="pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[11px] mb-2" style={{ color: 'var(--muted)' }}>
            Hạt nhiễu — lớp film-grain nhẹ phủ lên toàn cảnh.
          </p>
          <RegistryControl control={get('flipDisc.animateGrain')} state={config} onUpdate={onUpdate} />
          <div className="grid grid-cols-2 gap-4 mt-3">
            <RegistryControl control={get('flipDisc.grain')} state={config} onUpdate={onUpdate} />
            <RegistryControl control={get('flipDisc.grainSize')} state={config} onUpdate={onUpdate} unit="px" />
          </div>
        </div>
      </Accordion>
    </div>
  );
};
