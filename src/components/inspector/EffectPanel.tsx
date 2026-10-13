import React, { useState } from 'react';
import { RenderState } from '../../types';
import { CONTROL_REGISTRY } from '../../data/controlRegistry';
import { RegistryControl } from '../RegistryControl';
import { Segmented, Accordion, RangeSlider } from '../ui';
import { CustomSvgLayerControls } from '../CustomSvgLayerControls';
import { AsciiControls } from '../AsciiControls';
import { TangentLineControls } from '../TangentLineControls';
import { StitchCraftControls } from '../StitchCraftControls';
import { ModularStripControls } from '../ModularStripControls';
import { TypographyRippleControls } from '../TypographyRippleControls';
import { TypographyBoxControls } from '../TypographyBoxControls';
import { MeshNetControls } from '../MeshNetControls';
import { SpeedStripeControls } from '../SpeedStripeControls';
import { MultiColorDotControls } from '../MultiColorDotControls';
import { Radial3DControls } from '../Radial3DControls';
import { WaveVariationControls } from '../WaveVariationControls';
import { FrequencyMappingControls } from '../FrequencyMappingControls';
import { DynamicThicknessControls } from '../DynamicThicknessControls';
import { AudioReactivityControls } from '../AudioReactivityControls';

interface EffectPanelProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
}

const get = (id: string) => CONTROL_REGISTRY.find((c) => c.id === id)!;

const DOT_SHAPES = [
  { id: 'circle', label: 'Tròn đặc' },
  { id: 'ring', label: 'Donut' },
  { id: 'soft_circle', label: 'Mềm phát sáng' },
  { id: 'square', label: 'Vuông' },
  { id: 'concentric_arc', label: 'Cung tròn' },
  { id: 'tangent_line', label: 'Đường tiếp tuyến' },
  { id: 'wave_ripple', label: 'Gợn sóng' },
  { id: 'stitch', label: 'Mũi chỉ' },
  { id: 'woven', label: 'Dệt vải' },
  { id: 'original_stitch', label: 'Thêu gốc' },
  { id: 'typography_box', label: 'Hộp chữ' },
  { id: 'mesh_net', label: 'Lưới sine' },
  { id: 'speed_stripe', label: 'Vạch tốc độ' },
  { id: 'ascii', label: 'ASCII' },
  { id: 'extruded_block', label: 'Khối 2.5D' },
  { id: 'tile', label: 'Xoáy tile' }
] as const;

const WAVE_PATTERNS = [
  { id: 'circular', label: 'Radar tròn' },
  { id: 'linear', label: 'Mặt phẳng' },
  { id: 'spiral', label: 'Xoáy ốc' },
  { id: 'interference', label: 'Giao thoa' },
  { id: 'market_chart', label: 'Biểu đồ' },
  { id: 'radial_3d', label: 'Radial 3D' }
] as const;

type SubTab = 'shape' | 'wave' | 'audio';

/**
 * Redesign V1-B, Phase P4 — "Hiệu ứng" (Effect), the real one from spec section 5: a single group with
 * an internal sub-segment (Hình hạt | Sóng | Âm thanh) instead of 2 separate rail destinations, so the
 * shape/wave/audio split matches the spec exactly. Basic tier = registry-driven generic sliders;
 * Advanced tier = the material-specific sub-components, embedded exactly as before (just visually
 * grouped under "Nâng cao" now) — see CustomSvgLayerControls.tsx's doc comment for why these stay as
 * reused components rather than being flattened into the registry.
 */
export const EffectPanel: React.FC<EffectPanelProps> = ({ state, onUpdateState }) => {
  const [sub, setSub] = useState<SubTab>('shape');

  return (
    <div className="p-4 flex flex-col gap-4">
      <Segmented
        value={sub}
        onChange={(v) => setSub(v as SubTab)}
        options={[
          { value: 'shape', label: 'Hình hạt' },
          { value: 'wave', label: 'Sóng' },
          { value: 'audio', label: 'Âm thanh' }
        ]}
      />

      {sub === 'shape' && (
        <div className="flex flex-col gap-5">
          <div className="kv-ctl">
            <label className="kv-ctl-label">Hình hạt</label>
            <div className="grid grid-cols-2 gap-1.5">
              {DOT_SHAPES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onUpdateState((prev) => ({ ...prev, grid: { ...prev.grid, dotShape: s.id } }))}
                  className="py-2 px-2 rounded-[var(--radius-input)] border text-center text-[11px] transition-colors"
                  style={{
                    borderColor: state.grid.dotShape === s.id ? 'var(--ink)' : 'var(--border)',
                    background: state.grid.dotShape === s.id ? 'var(--chip)' : 'transparent',
                    color: state.grid.dotShape === s.id ? 'var(--ink)' : 'var(--muted)',
                    fontWeight: state.grid.dotShape === s.id ? 600 : 400
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <RangeSlider
            label="Kích thước chấm"
            valueMin={state.grid.minRadius}
            valueMax={state.grid.maxRadius}
            onChange={(min, max) => onUpdateState((prev) => ({ ...prev, grid: { ...prev.grid, minRadius: min, maxRadius: max } }))}
            min={0.2}
            max={16}
            step={0.1}
            unit="px"
          />
          <div className="grid grid-cols-2 gap-4">
            <RegistryControl control={get('grid.sdfThreshold')} state={state} onUpdate={onUpdateState} />
            <RegistryControl control={get('grid.sdfSoftness')} state={state} onUpdate={onUpdateState} />
          </div>

          <Accordion title="Nâng cao" storageKey="kv.effect.shape.advanced">
            <RegistryControl control={get('grid.hideBackgroundDots')} state={state} onUpdate={onUpdateState} />
            <RegistryControl control={get('style.enableMultiColor')} state={state} onUpdate={onUpdateState} />
            <RegistryControl control={get('style.extrusionDepth')} state={state} onUpdate={onUpdateState} />

            {/* Material-specific panels — each only applies to its own dotShape/compositionMode,
                exactly the same gating ControlsDrawer.tsx used. */}
            <div className="kv-legacy-embed flex flex-col gap-3">
              {state.grid.dotShape === 'ascii' && <AsciiControls state={state} onUpdateState={onUpdateState} />}
              {state.grid.dotShape === 'tangent_line' && <TangentLineControls state={state} onUpdateState={onUpdateState} />}
              {(state.grid.dotShape === 'stitch' ||
                state.grid.dotShape === 'woven' ||
                state.grid.dotShape === 'original_stitch' ||
                state.style.visualStyle === 'stitch_craft') && <StitchCraftControls state={state} onUpdateState={onUpdateState} />}
              {(state.grid.dotShape === 'modular_strip' || state.compositionMode === 'modular_signal_field') && (
                <ModularStripControls state={state} onUpdateState={onUpdateState} />
              )}
              {state.compositionMode === 'typography_ripple' && <TypographyRippleControls state={state} onUpdateState={onUpdateState} />}
              {state.grid.dotShape === 'typography_box' && <TypographyBoxControls state={state} onUpdateState={onUpdateState} />}
              {state.grid.dotShape === 'mesh_net' && <MeshNetControls state={state} onUpdateState={onUpdateState} />}
              {state.grid.dotShape === 'speed_stripe' && <SpeedStripeControls state={state} onUpdateState={onUpdateState} />}
              <MultiColorDotControls state={state} onUpdateState={onUpdateState} />
              <CustomSvgLayerControls state={state} onUpdateState={onUpdateState} />
            </div>
          </Accordion>
        </div>
      )}

      {sub === 'wave' && (
        <div className="flex flex-col gap-5">
          <div className="kv-ctl">
            <label className="kv-ctl-label">Chế độ máy sóng</label>
            <Segmented
              value={state.wave.mode}
              onChange={(v) => onUpdateState((prev) => ({ ...prev, wave: { ...prev.wave, mode: v as 'stable' | 'flow' } }))}
              options={[
                { value: 'stable', label: 'Stable' },
                { value: 'flow', label: 'Flow' }
              ]}
            />
          </div>

          <div className="kv-ctl">
            <label className="kv-ctl-label">Hình dạng sóng</label>
            <div className="grid grid-cols-2 gap-1.5">
              {WAVE_PATTERNS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onUpdateState((prev) => ({ ...prev, wave: { ...prev.wave, pattern: p.id } }))}
                  className="py-2 px-2 rounded-[var(--radius-input)] border text-center text-[11px] transition-colors"
                  style={{
                    borderColor: state.wave.pattern === p.id ? 'var(--ink)' : 'var(--border)',
                    background: state.wave.pattern === p.id ? 'var(--chip)' : 'transparent',
                    color: state.wave.pattern === p.id ? 'var(--ink)' : 'var(--muted)',
                    fontWeight: state.wave.pattern === p.id ? 600 : 400
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {state.wave.pattern === 'radial_3d' && (
            <div className="kv-legacy-embed">
              <Radial3DControls state={state} onUpdateState={onUpdateState} />
            </div>
          )}

          <div className="kv-ctl">
            <label className="kv-ctl-label">Dạng sóng</label>
            <Segmented
              value={state.wave.waveType}
              onChange={(v) => onUpdateState((prev) => ({ ...prev, wave: { ...prev.wave, waveType: v as RenderState['wave']['waveType'] } }))}
              options={[
                { value: 'sine', label: 'Sine' },
                { value: 'pulse', label: 'Pulse' },
                { value: 'square', label: 'Vuông' },
                { value: 'gaussian', label: 'Gaussian' }
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <RegistryControl control={get('wave.waveSpeed')} state={state} onUpdate={onUpdateState} unit="x" />
            <RegistryControl control={get('wave.waveFrequency')} state={state} onUpdate={onUpdateState} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <RegistryControl control={get('wave.waveAmplitude')} state={state} onUpdate={onUpdateState} unit="x" />
            <RegistryControl control={get('wave.waveSoftness')} state={state} onUpdate={onUpdateState} />
          </div>

          <Accordion title="Nâng cao" storageKey="kv.effect.wave.advanced">
            <div className="grid grid-cols-2 gap-4">
              <RegistryControl control={get('wave.originX')} state={state} onUpdate={onUpdateState} />
              <RegistryControl control={get('wave.originY')} state={state} onUpdate={onUpdateState} />
            </div>
            <RegistryControl control={get('wave.frequencyThickness')} state={state} onUpdate={onUpdateState} />
            <RegistryControl control={get('wave.followMouse')} state={state} onUpdate={onUpdateState} />
            <RegistryControl control={get('wave.dynamicThickness.enabled')} state={state} onUpdate={onUpdateState} />
            <div className="flex flex-col gap-3">
              <WaveVariationControls state={state} onUpdateState={onUpdateState} />
              <FrequencyMappingControls state={state} onUpdateState={onUpdateState} />
              {state.wave.pattern !== 'radial_3d' && <DynamicThicknessControls state={state} onUpdateState={onUpdateState} />}
            </div>
          </Accordion>
        </div>
      )}

      {sub === 'audio' && (
        <div className="flex flex-col gap-5">
          <RegistryControl control={get('audio.enabled')} state={state} onUpdate={onUpdateState} />
          <RegistryControl control={get('audio.sensitivity')} state={state} onUpdate={onUpdateState} />
          <Accordion title="Nâng cao" storageKey="kv.effect.audio.advanced" defaultOpen>
            <div className="kv-legacy-embed">
              <AudioReactivityControls state={state} onUpdateState={onUpdateState} />
            </div>
          </Accordion>
        </div>
      )}
    </div>
  );
};
