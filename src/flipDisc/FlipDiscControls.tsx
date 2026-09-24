import React, { useRef } from 'react';
import { FlipDiscConfig, FlipDiscShape, FlipDiscMaterial } from './types';
import { ObjectShapeType } from '../types';
import { FlipDiscImageActions } from './FlipDiscCanvas';
import { Sparkles, Palette, Layers, Wand2, Image as ImageIcon, X, Shapes, Upload } from 'lucide-react';

interface FlipDiscControlsProps {
  config: FlipDiscConfig;
  onUpdate: (patch: Partial<FlipDiscConfig>) => void;
  imageActionsRef?: React.MutableRefObject<FlipDiscImageActions | null>;
  frontImageStatus?: string;
  backImageStatus?: string;
}

const SHAPES: { id: FlipDiscShape; label: string }[] = [
  { id: 'circle', label: 'CIRCLE' },
  { id: 'clover', label: 'CLOVER' },
  { id: 'square', label: 'SQUARE' }
];

const MATERIALS: { id: FlipDiscMaterial; label: string; desc: string }[] = [
  { id: 'matte', label: 'MATTE', desc: 'Soft, flat, graphic' },
  { id: 'glossy', label: 'GLOSSY', desc: 'Toy-like plastic shine' },
  { id: 'metallic', label: 'METALLIC', desc: 'Brushed chrome sheen' },
  { id: 'iridescent', label: 'IRIDESCENT', desc: 'Prismatic rainbow shimmer — default' }
];

const MASK_SHAPES: { id: ObjectShapeType; name: string }[] = [
  { id: 'circle', name: 'CIRCLE' },
  { id: 'square', name: 'SQUARE' },
  { id: 'ring', name: 'DONUT' },
  { id: 'star', name: 'STAR' },
  { id: 'heart', name: 'HEART' },
  { id: 'hexagon', name: 'HEXAGON' },
  { id: 'diamond', name: 'DIAMOND' },
  { id: 'shield', name: 'SHIELD' }
];

const PALETTES: { name: string; front: string; back: string; side: string }[] = [
  { name: 'Prismatic', front: '#0B9EB8', back: '#D43D11', side: '#34314D' },
  { name: 'Pastel Bloom', front: '#F7C6E0', back: '#C9E4FF', side: '#4A3F63' },
  { name: 'Toy Blocks', front: '#FF6F61', back: '#FFD23F', side: '#1F2937' },
  { name: 'Candy Pop', front: '#FF4D9D', back: '#5AD1E6', side: '#241B33' }
];

/**
 * Editable controls for the Prismatic Flip Circle scene — shape, color, material and motion, plus
 * optional front/back image uploads (ported from the reference sketch's control panel). Lives
 * entirely under src/flipDisc/, independent of the Kinetic engine's ControlsDrawer.
 */
export const FlipDiscControls: React.FC<FlipDiscControlsProps> = ({
  config,
  onUpdate,
  imageActionsRef,
  frontImageStatus,
  backImageStatus
}) => {
  const frontFileRef = useRef<HTMLInputElement>(null);
  const backFileRef = useRef<HTMLInputElement>(null);

  const slider = (
    label: string,
    value: number,
    field: keyof FlipDiscConfig,
    min: number,
    max: number,
    step: number,
    unit = '',
    decimals = 2
  ) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[#888] text-[10px] uppercase">{label}</label>
        <span className="text-pink-400 text-[10px] font-bold">
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
        onChange={(e) => onUpdate({ [field]: parseFloat(e.target.value) } as Partial<FlipDiscConfig>)}
        className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-pink-500"
      />
    </div>
  );

  const colorField = (label: string, value: string, field: keyof FlipDiscConfig) => (
    <div>
      <label className="text-[#888] text-[10px] uppercase block mb-1">{label}</label>
      <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#222] rounded p-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onUpdate({ [field]: e.target.value } as Partial<FlipDiscConfig>)}
          className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
        />
        <span className="text-[10px] text-[#cbd5e1] uppercase">{value}</span>
      </div>
    </div>
  );

  const imageUploadField = (which: 'front' | 'back', status: string | undefined) => {
    const fileRef = which === 'front' ? frontFileRef : backFileRef;
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <label className="cursor-pointer flex-1 py-1.5 px-2 bg-[#121212] hover:bg-[#1e1e1e] border border-[#222] hover:border-pink-500 rounded text-center text-[9px] font-mono text-[#ccc] hover:text-white uppercase transition-colors flex items-center justify-center gap-1.5">
            <ImageIcon className="w-3 h-3 text-pink-400" />
            <span>Upload Image</span>
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
          <button
            type="button"
            title="Remove image"
            onClick={() => {
              if (which === 'front') imageActionsRef?.current?.clearFront();
              else imageActionsRef?.current?.clearBack();
              if (fileRef.current) fileRef.current.value = '';
            }}
            className="p-1.5 rounded bg-[#121212] border border-[#222] hover:border-rose-500 text-[#888] hover:text-rose-400"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        <span className="text-[9px] text-[#666] block truncate">{status || 'No image — using flat color'}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4 font-mono p-3">
      <div className="flex items-center justify-between pb-2 border-b border-[#222]">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">
            PLAYFUL BLOOM — PRISMATIC FLIP CIRCLE
          </span>
        </div>
      </div>

      {/* Shape */}
      <div className="space-y-2.5 p-3 bg-[#0d0d12] border border-[#262630] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-pink-400 flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5" /> SHAPE
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {SHAPES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onUpdate({ shape: s.id })}
              className={`p-1.5 rounded border text-center transition-colors ${
                config.shape === s.id
                  ? 'bg-pink-500/20 border-pink-500 text-pink-300 font-bold'
                  : 'bg-[#121212] border-[#222] text-[#888] hover:text-white'
              }`}
            >
              <span className="block text-[9px] font-bold uppercase">{s.label}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('GRID COUNT', config.density, 'density', 6, 60, 1, '', 0)}
          {slider('DISC RADIUS', config.discRadius, 'discRadius', 0.1, 0.49, 0.01, '', 2)}
        </div>
        {slider('THICKNESS', config.thickness, 'thickness', 0.01, 0.32, 0.01, '', 2)}
      </div>

      {/* Color */}
      <div className="space-y-2.5 p-3 bg-[#0d0d12] border border-[#262630] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-pink-400 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5" /> COLOR
        </span>
        <div className="grid grid-cols-2 gap-3">
          {colorField('FRONT', config.frontColor, 'frontColor')}
          {colorField('BACK', config.backColor, 'backColor')}
        </div>
        <div className="grid grid-cols-2 gap-2 -mt-1">
          {imageUploadField('front', frontImageStatus)}
          {imageUploadField('back', backImageStatus)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {colorField('SIDE', config.sideColor, 'sideColor')}
          {colorField('BACKGROUND', config.backgroundColor, 'backgroundColor')}
        </div>
        <div>
          <label className="text-[#888] text-[10px] uppercase block mb-1.5">PALETTE PRESETS</label>
          <div className="grid grid-cols-2 gap-1.5">
            {PALETTES.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => onUpdate({ frontColor: p.front, backColor: p.back, sideColor: p.side })}
                className="p-1.5 rounded bg-[#111622] hover:bg-[#182030] border border-[#223048] flex items-center justify-between text-left transition-colors"
              >
                <span className="text-[9px] text-[#cbd5e1]">{p.name}</span>
                <div className="flex items-center space-x-1">
                  {[p.front, p.back, p.side].map((c, i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full border border-black/40" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Material */}
      <div className="space-y-2.5 p-3 bg-[#0d0d12] border border-[#262630] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-pink-400 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" /> MATERIAL
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {MATERIALS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onUpdate({ material: m.id })}
              title={m.desc}
              className={`p-1.5 rounded border text-left transition-colors ${
                config.material === m.id
                  ? 'bg-pink-500/20 border-pink-500 text-pink-300 font-bold'
                  : 'bg-[#121212] border-[#222] text-[#888] hover:text-white'
              }`}
            >
              <span className="block text-[9px] font-bold uppercase">{m.label}</span>
              <span className="text-[7.5px] opacity-70 block">{m.desc}</span>
            </button>
          ))}
        </div>
        {slider('RAINBOW (IRIDESCENT)', config.rainbowIntensity, 'rainbowIntensity', 0, 1, 0.02, '', 2)}
        {slider('SATURATION', config.saturation, 'saturation', 0, 2.5, 0.02, 'x', 2)}
        <div className="flex items-center justify-between pt-1 border-t border-[#1a1a1a]">
          <div>
            <span className="block text-[10px] uppercase text-white font-bold">GRAIN</span>
            <span className="text-[9px] text-[#777]">Subtle film-grain texture overlay</span>
          </div>
          <button
            type="button"
            onClick={() => onUpdate({ animateGrain: !config.animateGrain })}
            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border transition-all ${
              config.animateGrain
                ? 'bg-pink-500/20 text-pink-300 border-pink-500/50'
                : 'bg-[#181818] text-[#777] border-[#333]'
            }`}
          >
            ANIMATE: {config.animateGrain ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('GRAIN AMOUNT', config.grain, 'grain', 0, 0.3, 0.01, '', 2)}
          {slider('GRAIN SIZE', config.grainSize, 'grainSize', 1, 4, 0.5, 'px', 1)}
        </div>
      </div>

      {/* Motion */}
      <div className="space-y-2.5 p-3 bg-[#0d0d12] border border-[#262630] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-pink-400">MOTION</span>
        <div className="grid grid-cols-2 gap-3">
          {slider('FLIP SPEED', config.flipSpeed, 'flipSpeed', 0.1, 3.0, 0.05, 'x', 2)}
          {slider('RIPPLE DELAY', config.rippleDelay, 'rippleDelay', 0, 1.5, 0.02, '', 2)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('MOTION SOFTNESS', config.motionSoftness, 'motionSoftness', 0, 1.2, 0.02, '', 2)}
          {slider('WAVE TIMING', config.waveTiming, 'waveTiming', 0.2, 3.0, 0.05, 'x', 2)}
        </div>
      </div>

      {/* Clip Mask */}
      <div className="space-y-2.5 p-3 bg-[#0d0d12] border border-[#262630] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-pink-400 flex items-center gap-1.5">
          <Shapes className="w-3.5 h-3.5" /> CLIP MASK
        </span>
        <p className="text-[8px] text-[#666] font-sans leading-relaxed -mt-1">
          Only discs inside the chosen shape or uploaded logo get flipped in — the rest of the field
          stays empty, revealing the silhouette in the grid.
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              { id: 'none', label: 'NONE' },
              { id: 'shape', label: 'SHAPE' },
              { id: 'svg', label: 'SVG LOGO' }
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onUpdate({ maskMode: m.id })}
              className={`p-1.5 rounded border text-center transition-colors ${
                config.maskMode === m.id
                  ? 'bg-pink-500/20 border-pink-500 text-pink-300 font-bold'
                  : 'bg-[#121212] border-[#222] text-[#888] hover:text-white'
              }`}
            >
              <span className="block text-[9px] font-bold uppercase">{m.label}</span>
            </button>
          ))}
        </div>

        {config.maskMode === 'shape' && (
          <div className="pt-1 border-t border-[#1a1a1a] space-y-1.5">
            <span className="text-[9px] text-[#888] uppercase block">CHOOSE SHAPE</span>
            <div className="grid grid-cols-4 gap-1.5">
              {MASK_SHAPES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onUpdate({ maskShapeType: s.id })}
                  className={`py-1 px-1 rounded border text-center text-[8.5px] font-mono uppercase transition-colors ${
                    config.maskShapeType === s.id
                      ? 'bg-pink-500/20 border-pink-500 text-pink-300 font-bold'
                      : 'bg-[#161616] border-[#2b2b2b] text-[#888] hover:text-white'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {config.maskMode === 'svg' && (
          <div className="pt-1 border-t border-[#1a1a1a] space-y-2">
            <span className="text-[9px] text-[#888] uppercase block">UPLOAD SVG LOGO</span>
            {config.maskSvgName ? (
              <div className="p-2 bg-[#141414] border border-[#262626] rounded flex items-center justify-between text-[10px]">
                <span className="text-pink-300 truncate max-w-[150px]">{config.maskSvgName}</span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdate({
                      maskSvgDataUrl: undefined,
                      maskSvgXml: undefined,
                      maskSvgName: undefined,
                      maskMode: 'none'
                    })
                  }
                  className="text-rose-400 hover:text-rose-300 text-[9px] uppercase hover:underline ml-2"
                >
                  CLEAR
                </button>
              </div>
            ) : (
              <label className="cursor-pointer py-1.5 px-3 bg-[#161616] hover:bg-[#202020] border border-[#333] hover:border-pink-500 rounded text-center text-[10px] text-[#ccc] hover:text-white uppercase transition-colors flex items-center justify-center gap-2">
                <Upload className="w-3.5 h-3.5 text-pink-400" />
                <span>UPLOAD SVG FILE</span>
                <input
                  type="file"
                  accept=".svg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const readerText = new FileReader();
                    readerText.onload = (event) => {
                      const xml = event.target?.result as string;
                      const readerUrl = new FileReader();
                      readerUrl.onload = (evUrl) => {
                        const dataUrl = evUrl.target?.result as string;
                        onUpdate({
                          maskMode: 'svg',
                          maskSvgXml: xml,
                          maskSvgDataUrl: dataUrl,
                          maskSvgName: file.name
                        });
                      };
                      readerUrl.readAsDataURL(file);
                    };
                    readerText.readAsText(file);
                  }}
                  className="hidden"
                />
              </label>
            )}
          </div>
        )}

        {config.maskMode !== 'none' && (
          <div className="pt-1 border-t border-[#1a1a1a]">
            {slider('MASK SCALE', config.maskScale, 'maskScale', 0.3, 2.5, 0.02, 'x', 2)}
          </div>
        )}
      </div>
    </div>
  );
};
