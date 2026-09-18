import React from 'react';
import { RenderState, Radial3DConfig, RadialWaveMaterial, CustomSvgLayer } from '../types';
import { DEFAULT_RADIAL3D_CONFIG } from '../utils/particleRenderer';
import { Box, RotateCcw, Upload, Waves, Layers3, Move3d } from 'lucide-react';

interface Radial3DControlsProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
}

const MATERIALS: { id: RadialWaveMaterial; name: string; desc: string }[] = [
  { id: 'line', name: 'LINE', desc: 'Clean continuous circular strokes' },
  { id: 'dot_matrix', name: 'DOT MATRIX', desc: 'Individual round dots' },
  { id: 'ascii', name: 'ASCII', desc: 'Wave segments as characters' },
  { id: 'diamond', name: 'DIAMOND', desc: 'Diamond SVG particles' },
  { id: 'custom_svg', name: 'CUSTOM SVG', desc: 'Upload your own vector shape' },
  { id: 'stitch', name: 'STITCH', desc: 'Embroidered thread units' }
];

export const Radial3DControls: React.FC<Radial3DControlsProps> = ({ state, onUpdateState }) => {
  const cfg: Radial3DConfig = { ...DEFAULT_RADIAL3D_CONFIG, ...(state.wave.radial3D || {}) };

  const update = (patch: Partial<Radial3DConfig>) => {
    onUpdateState((prev) => ({
      ...prev,
      wave: {
        ...prev.wave,
        radial3D: { ...DEFAULT_RADIAL3D_CONFIG, ...(prev.wave.radial3D || {}), ...patch }
      }
    }));
  };

  const slider = (
    label: string,
    value: number,
    field: keyof Radial3DConfig,
    min: number,
    max: number,
    step: number,
    unit = '',
    decimals = 2
  ) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[#888] text-[10px] uppercase">{label}</label>
        <span className="text-[#00F0FF] text-[10px] font-bold">
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
        onChange={(e) => update({ [field]: parseFloat(e.target.value) } as Partial<Radial3DConfig>)}
        className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
      />
    </div>
  );

  const handleSvgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const xml = ev.target?.result as string;
      if (!xml) return;
      const newLayer: CustomSvgLayer = {
        id: `radial3d_svg_${Date.now()}`,
        name: file.name.replace('.svg', ''),
        svgXml: xml,
        recolorMode: 'theme',
        scale: 1.0,
        rotationOffset: 0,
        opacity: 1.0,
        enabled: true
      };
      update({ customSvgLayers: [newLayer], material: 'custom_svg' });
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between pb-2 border-b border-[#222]">
        <div className="flex items-center space-x-2">
          <Box className="w-4 h-4 text-[#00F0FF]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">
            3D RADIAL WAVE
          </span>
        </div>
        <span className="text-[9px] text-[#00F0FF] uppercase font-bold bg-[#00F0FF]/10 px-1.5 py-0.5 rounded border border-[#00F0FF]/30">
          {cfg.material.replace('_', ' ')}
        </span>
      </div>

      <p className="text-[9px] text-[#888] font-sans leading-relaxed">
        Concentric rings arranged in 3D space. Drag inside the preview to rotate (Shift+drag for Z-axis).
        Switching material only changes how each ring point is drawn — geometry, thickness, motion, and
        rotation stay the same.
      </p>

      {/* Material Selector */}
      <div>
        <label className="block text-[#888] mb-1.5 text-[10px] uppercase tracking-wider flex items-center gap-1">
          <Layers3 className="w-3 h-3 text-[#00F0FF]" /> MATERIAL
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {MATERIALS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => update({ material: m.id })}
              className={`p-2 rounded border text-left transition-colors ${
                cfg.material === m.id
                  ? 'bg-[#222] border-[#00F0FF] text-[#00F0FF] font-bold shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                  : 'bg-[#0A0A0A] border-[#222] text-[#888] hover:text-white'
              }`}
            >
              <span className="block text-[9.5px] font-bold uppercase">{m.name}</span>
              <span className="text-[7.5px] opacity-70 block">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Material-specific sub-controls */}
      {cfg.material === 'line' && (
        <div className="grid grid-cols-1 gap-2 p-2.5 bg-[#0A0A0A] border border-[#222] rounded">
          {slider('LINE THICKNESS', cfg.lineThickness, 'lineThickness', 0.5, 8, 0.1, 'x', 1)}
        </div>
      )}
      {(cfg.material === 'dot_matrix' || cfg.material === 'diamond') && (
        <div className="grid grid-cols-1 gap-2 p-2.5 bg-[#0A0A0A] border border-[#222] rounded">
          {slider('DOT / PARTICLE SIZE', cfg.dotSize, 'dotSize', 1, 12, 0.5, 'px', 1)}
        </div>
      )}
      {cfg.material === 'ascii' && (
        <div className="space-y-2 p-2.5 bg-[#0A0A0A] border border-[#222] rounded">
          <label className="text-[#888] text-[10px] uppercase block">CHARACTER SET</label>
          <input
            type="text"
            value={cfg.asciiCharset}
            onChange={(e) => update({ asciiCharset: e.target.value })}
            className="w-full bg-[#080808] border border-[#222] rounded px-2 py-1.5 text-[#00F0FF] font-mono text-[11px]"
          />
          {slider('SIZE VARIATION', cfg.asciiSizeVariation, 'asciiSizeVariation', 0, 1, 0.05, '', 2)}
        </div>
      )}
      {cfg.material === 'custom_svg' && (
        <div className="space-y-2 p-2.5 bg-[#0A0A0A] border border-[#222] rounded">
          <label className="cursor-pointer w-full py-2 px-3 bg-[#121212] hover:bg-[#1a1a1a] border border-[#333] hover:border-[#00F0FF] rounded text-center text-[10px] text-[#ccc] hover:text-white uppercase font-bold transition-colors flex items-center justify-center gap-2">
            <Upload className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>{cfg.customSvgLayers?.[0]?.name || 'UPLOAD SVG SHAPE'}</span>
            <input type="file" accept=".svg" onChange={handleSvgUpload} className="hidden" />
          </label>
          {slider('PARTICLE SIZE', cfg.dotSize, 'dotSize', 1, 12, 0.5, 'px', 1)}
        </div>
      )}
      {cfg.material === 'stitch' && (
        <div className="space-y-2 p-2.5 bg-[#0A0A0A] border border-[#222] rounded">
          {slider('STITCH LENGTH', cfg.stitchLength, 'stitchLength', 4, 36, 1, 'px', 0)}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#888] uppercase">ANGLE FOLLOWS RING</span>
            <button
              type="button"
              onClick={() => update({ stitchAngleFollowsRing: !cfg.stitchAngleFollowsRing })}
              className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase border transition-all ${
                cfg.stitchAngleFollowsRing
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/50'
                  : 'bg-[#1a1a1a] text-[#777] border-[#333]'
              }`}
            >
              {cfg.stitchAngleFollowsRing ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      )}

      {/* Geometry */}
      <div className="space-y-2.5 p-3 bg-[#0a0a0d] border border-[#222] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-[#00F0FF]">GEOMETRY</span>
        <div className="grid grid-cols-2 gap-3">
          {slider('RING COUNT', cfg.ringCount, 'ringCount', 2, 60, 1, '', 0)}
          {slider('BASE RADIUS', cfg.baseRadius, 'baseRadius', 0, 300, 5, 'px', 0)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('RING SPACING', cfg.ringSpacing, 'ringSpacing', 2, 60, 1, 'px', 0)}
          {slider('ANGULAR RESOLUTION', cfg.angularResolutionDeg, 'angularResolutionDeg', 2, 45, 1, '°', 0)}
        </div>
        {slider('DEPTH DISPLACEMENT', cfg.depthDisplacement, 'depthDisplacement', 0, 250, 5, 'px', 0)}
      </div>

      {/* Thickness Animation */}
      <div className="space-y-2.5 p-3 bg-[#0a0a0d] border border-[#222] rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase text-[#00F0FF] flex items-center gap-1.5">
            <Waves className="w-3.5 h-3.5" /> THICKNESS ANIMATION
          </span>
          <button
            type="button"
            onClick={() => update({ thicknessAnimEnabled: !cfg.thicknessAnimEnabled })}
            className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase border transition-all ${
              cfg.thicknessAnimEnabled
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/50'
                : 'bg-[#1a1a1a] text-[#777] border-[#333]'
            }`}
          >
            {cfg.thicknessAnimEnabled ? 'ANIMATED' : 'FIXED'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('MIN THICKNESS', cfg.minThickness, 'minThickness', 0.1, 10, 0.1, 'px', 1)}
          {slider('MAX THICKNESS', cfg.maxThickness, 'maxThickness', 0.1, 12, 0.1, 'px', 1)}
        </div>
        {cfg.thicknessAnimEnabled && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {slider('THICKNESS FREQUENCY', cfg.thicknessFrequency, 'thicknessFrequency', 0, 5, 0.1, '', 1)}
              {slider('THICKNESS PHASE OFFSET', cfg.thicknessPhaseOffset, 'thicknessPhaseOffset', -6.3, 6.3, 0.1, ' rad', 1)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {slider('THICKNESS SPEED', cfg.thicknessSpeed, 'thicknessSpeed', 0, 4, 0.05, 'x', 2)}
              {slider('RANDOMNESS', cfg.thicknessRandomness, 'thicknessRandomness', 0, 1, 0.05, '', 2)}
            </div>
          </>
        )}
      </div>

      {/* 3D Wave Motion (Z axis) */}
      <div className="space-y-2.5 p-3 bg-[#0a0a0d] border border-[#222] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-[#00F0FF] flex items-center gap-1.5">
          <Move3d className="w-3.5 h-3.5" /> 3D WAVE MOTION (Z-AXIS)
        </span>
        <div className="grid grid-cols-2 gap-3">
          {slider('MOTION FREQUENCY', cfg.zMotionFrequency, 'zMotionFrequency', 0, 5, 0.1, '', 1)}
          {slider('MOTION SPEED', cfg.zMotionSpeed, 'zMotionSpeed', 0, 4, 0.05, 'x', 2)}
        </div>
        {slider('PHASE DIFFERENCE', cfg.zPhaseDifference, 'zPhaseDifference', -1, 1, 0.02, '', 2)}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-[#888] uppercase">MOTION DIRECTION</span>
          <div className="grid grid-cols-2 gap-1.5 w-32">
            <button
              type="button"
              onClick={() => update({ zMotionDirection: 1 })}
              className={`py-1 rounded text-[9px] font-bold uppercase border transition-colors ${
                cfg.zMotionDirection === 1
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/50'
                  : 'bg-[#1a1a1a] text-[#777] border-[#333]'
              }`}
            >
              FORWARD
            </button>
            <button
              type="button"
              onClick={() => update({ zMotionDirection: -1 })}
              className={`py-1 rounded text-[9px] font-bold uppercase border transition-colors ${
                cfg.zMotionDirection === -1
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/50'
                  : 'bg-[#1a1a1a] text-[#777] border-[#333]'
              }`}
            >
              REVERSE
            </button>
          </div>
        </div>
      </div>

      {/* Rotation */}
      <div className="space-y-2.5 p-3 bg-[#0a0a0d] border border-[#222] rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase text-[#00F0FF]">INTERACTIVE 3D ROTATION</span>
          <button
            type="button"
            onClick={() => update({ rotationX: 66, rotationY: 0, rotationZ: 0 })}
            className="flex items-center space-x-1.5 px-2 py-1 rounded bg-[#181818] hover:bg-[#222] border border-[#333] hover:border-[#00F0FF]/50 text-white text-[9px] font-bold uppercase transition-colors"
          >
            <RotateCcw className="w-3 h-3 text-[#00F0FF]" />
            <span>RESET</span>
          </button>
        </div>
        <p className="text-[9px] text-[#777] font-sans -mt-1">
          Drag the preview to rotate (horizontal → Y, vertical → X). Hold Shift while dragging to rotate Z.
        </p>
        {slider('ROTATION X', cfg.rotationX, 'rotationX', -180, 180, 1, '°', 0)}
        {slider('ROTATION Y', cfg.rotationY, 'rotationY', -180, 180, 1, '°', 0)}
        {slider('ROTATION Z', cfg.rotationZ, 'rotationZ', -180, 180, 1, '°', 0)}
      </div>
    </div>
  );
};
