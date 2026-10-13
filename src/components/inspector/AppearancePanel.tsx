import React from 'react';
import { RenderState, ThemeId } from '../../types';
import { CONTROL_REGISTRY } from '../../data/controlRegistry';
import { RegistryControl } from '../RegistryControl';
import { Accordion } from '../ui';
import { VisualStyleGallery } from '../VisualStyleGallery';

interface AppearancePanelProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
}

const get = (id: string) => CONTROL_REGISTRY.find((c) => c.id === id)!;

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

/**
 * Redesign V1-B, Phase P4 — the real "Màu sắc" (Appearance) group (spec section 5). Basic: curated
 * palette grid, dot/background color, Visual Style gallery (11 styles, reused component). Advanced:
 * same-color/modulated, wave gradient, radar overlay, emitter handle — the handful of StyleConfig
 * fields that only matter once you're deep in tuning a look, not picking one.
 */
export const AppearancePanel: React.FC<AppearancePanelProps> = ({ state, onUpdateState }) => {
  const applyTheme = (theme: (typeof THEMES)[number]) => {
    onUpdateState((prev) => ({
      ...prev,
      style: { ...prev.style, theme: theme.id, dotColor: theme.dot, bgColor: theme.bg, accentColor: theme.accent }
    }));
  };

  return (
    <div className="p-4 flex flex-col gap-5">
      <div className="kv-ctl">
        <label className="kv-ctl-label">Bảng màu</label>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((th) => (
            <button
              key={th.id}
              type="button"
              onClick={() => applyTheme(th)}
              className="p-2 rounded-[var(--radius-input)] border flex items-center justify-between transition-colors"
              style={{
                borderColor: state.style.theme === th.id ? 'var(--ink)' : 'var(--border)',
                background: state.style.theme === th.id ? 'var(--chip)' : 'transparent'
              }}
            >
              <span className="text-[11px] truncate mr-2" style={{ color: 'var(--ink)', fontWeight: state.style.theme === th.id ? 600 : 400 }}>
                {th.name}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {[th.bg, th.dot, th.accent].map((c, i) => (
                  <span key={i} className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: c, borderColor: 'var(--border-strong)' }} />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <RegistryControl control={get('style.dotColor')} state={state} onUpdate={onUpdateState} />
        <RegistryControl control={get('style.bgColor')} state={state} onUpdate={onUpdateState} />
      </div>

      <VisualStyleGallery state={state} onUpdateState={onUpdateState} />

      <Accordion title="Nâng cao" storageKey="kv.appearance.advanced">
        <RegistryControl control={get('style.uniformColorBrightness')} state={state} onUpdate={onUpdateState} />
        <RegistryControl control={get('style.enableColorGradient')} state={state} onUpdate={onUpdateState} />
        <RegistryControl control={get('style.gradientColor')} state={state} onUpdate={onUpdateState} />
        <RegistryControl control={get('style.showRadarGrid')} state={state} onUpdate={onUpdateState} />
        {state.style.showRadarGrid && <RegistryControl control={get('style.radarGridOpacity')} state={state} onUpdate={onUpdateState} />}
        <RegistryControl control={get('style.showEmitterHandle')} state={state} onUpdate={onUpdateState} />
      </Accordion>
    </div>
  );
};
