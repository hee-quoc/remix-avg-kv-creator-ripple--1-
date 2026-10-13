import React from 'react';
import { RenderState, DynamicThicknessConfig, ThicknessBehaviorMode } from '../types';
import { DEFAULT_DYNAMIC_THICKNESS_CONFIG } from '../utils/wave';
import { Layers, Activity } from 'lucide-react';

interface DynamicThicknessControlsProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
}

const MODES: { id: ThicknessBehaviorMode; name: string; desc: string }[] = [
  { id: 'uniform', name: 'Đều', desc: 'Mọi sóng dùng cùng một độ dày' },
  { id: 'radial_gradient', name: 'Gradient hướng tâm', desc: 'Độ dày thay đổi từ tâm ra viền' },
  { id: 'random', name: 'Ngẫu nhiên', desc: 'Mỗi sóng có độ dày tất định khác nhau' },
  { id: 'animated', name: 'Có chuyển động', desc: 'Độ dày dao động liên tục giữa min/max' }
];

/**
 * Dynamic Visual Thickness (2D) — ports the 3D Radial Wave's per-ring thickness modulation
 * (Radial3DConfig.thicknessAnimEnabled/min/max/frequency/phaseOffset/speed/randomness) into the
 * existing 2D concentric ripple system, without bringing over 3D rotation/camera/depth. Reuses the
 * same wave calculation pipeline (wave.ts -> localThickness), so it works across every material
 * (Line, Dot Matrix, ASCII, Diamond, Custom SVG, Stitch) automatically since they all read the same
 * wave intensity/band width. Disabled by default — zero effect on any existing preset until enabled.
 */
export const DynamicThicknessControls: React.FC<DynamicThicknessControlsProps> = ({ state, onUpdateState }) => {
  const dt = state.wave.dynamicThickness ?? DEFAULT_DYNAMIC_THICKNESS_CONFIG;

  const updateDT = (patch: Partial<DynamicThicknessConfig>) => {
    onUpdateState((prev) => ({
      ...prev,
      wave: {
        ...prev.wave,
        dynamicThickness: { ...(prev.wave.dynamicThickness ?? DEFAULT_DYNAMIC_THICKNESS_CONFIG), ...patch }
      }
    }));
  };

  const slider = (
    label: string,
    value: number,
    field: keyof DynamicThicknessConfig,
    min: number,
    max: number,
    step: number,
    unit = '',
    decimals = 2
  ) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] uppercase" style={{ color: 'var(--muted)' }}>{label}</label>
        <span className="text-[10px] font-bold" style={{ color: 'var(--modified-ink)' }}>
          {value.toFixed(decimals)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => updateDT({ [field]: parseFloat(e.target.value) } as Partial<DynamicThicknessConfig>)}
        className="w-full h-[2px] appearance-none cursor-pointer"
        style={{ background: 'var(--track)', accentColor: 'var(--modified)' }}
      />
    </div>
  );

  const showMinMax = dt.mode !== 'uniform';
  const showAnimated = dt.mode === 'animated';
  const showRandomness = dt.mode === 'animated' || dt.mode === 'random';

  return (
    <div className="space-y-3 p-3 rounded-[var(--radius-input)] border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', fontFamily: 'var(--font-ui)' }}>
      <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center space-x-2" style={{ color: 'var(--modified-ink)' }}>
          <Layers className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold uppercase">Độ dày trực quan động</span>
        </div>
        <button
          type="button"
          onClick={() => updateDT({ enabled: !dt.enabled })}
          className="text-[9px] px-2 py-0.5 rounded font-bold uppercase border transition-colors"
          style={
            dt.enabled
              ? { background: 'var(--modified-bg)', color: 'var(--modified-ink)', borderColor: 'var(--modified)' }
              : { background: 'var(--chip)', color: 'var(--muted)', borderColor: 'var(--border)' }
          }
        >
          {dt.enabled ? 'Bật' : 'Tắt'}
        </button>
      </div>

      <p className="text-[10px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        Cho mỗi sóng đồng tâm có độ rộng trực quan riêng — ví dụ Sóng 1 dày, Sóng 2 mỏng, Sóng 3 trung
        bình — chuyển thể từ hệ thống độ dày vòng của Radial Wave 3D. Đây là độ rộng của dải sóng, không
        phải kích thước hạt hay biên độ. Hoạt động với mọi material vì nó điều chỉnh phép tính sóng
        chung. Frequency không gian (khoảng cách sóng) vẫn hoàn toàn độc lập — trừ khi Advanced Frequency
        Control ở trên đặt là Thickness Only / Combined, khi đó sẽ tác động thêm vào slider Thickness
        Frequency bên dưới.
      </p>

      {dt.enabled && (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => updateDT({ mode: m.id })}
                title={m.desc}
                className="p-1.5 rounded-[var(--radius-input)] border text-left transition-colors"
                style={
                  dt.mode === m.id
                    ? { background: 'var(--modified-bg)', borderColor: 'var(--modified)', color: 'var(--modified-ink)' }
                    : { background: 'var(--chip)', borderColor: 'var(--border)', color: 'var(--muted)' }
                }
              >
                <span className="block text-[9.5px] font-bold uppercase">{m.name}</span>
              </button>
            ))}
          </div>

          {dt.mode === 'uniform' &&
            slider('Độ dày cơ bản', dt.baseThickness, 'baseThickness', 0.1, 4, 0.05, 'x', 2)}

          {showMinMax && (
            <div className="grid grid-cols-2 gap-3">
              {slider('Độ dày tối thiểu', dt.minThickness, 'minThickness', 0.05, 3, 0.05, 'x', 2)}
              {slider('Độ dày tối đa', dt.maxThickness, 'maxThickness', 0.1, 4, 0.05, 'x', 2)}
            </div>
          )}

          {showAnimated && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {slider('Tần số độ dày', dt.thicknessFrequency, 'thicknessFrequency', 0, 5, 0.1, '', 1)}
                {slider('Tốc độ hoạt ảnh', dt.animSpeed, 'animSpeed', 0, 4, 0.05, 'x', 2)}
              </div>
              {slider('Lệch pha', dt.phaseOffset, 'phaseOffset', -6.3, 6.3, 0.1, ' rad', 1)}
            </>
          )}

          {showRandomness &&
            slider(
              dt.mode === 'animated' ? 'Độ ngẫu nhiên độ dày (kết hợp)' : 'Độ ngẫu nhiên độ dày',
              dt.randomness,
              'randomness',
              0,
              1,
              0.05,
              '',
              2
            )}

          <div className="pt-2 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[10px] font-bold uppercase flex items-center gap-1.5" style={{ color: 'var(--ink)' }}>
              <Activity className="w-3 h-3" style={{ color: 'var(--modified-ink)' }} /> Ảnh hưởng âm thanh lên độ dày
            </span>
            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              Bass tăng dần độ dày vòng sóng một cách mượt mà; đoạn yên tĩnh sẽ trả lại trạng thái cũ. Cần
              bật Audio Reactivity bên dưới — không bao giờ sinh thêm vòng mới, chỉ điều chỉnh các vòng
              hiện có.
            </p>
            {slider('Mức ảnh hưởng', dt.audioThicknessInfluence, 'audioThicknessInfluence', 0, 1, 0.05, '', 2)}
          </div>
        </>
      )}
    </div>
  );
};
