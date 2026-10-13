import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RenderState, AudioConfig, AudioMappingConfig, RippleSequenceMode, SynthStyle, AudioColorShiftMode } from '../types';
import { PRESETS } from '../data/presets';
import { audioAnalyzerInstance, DEFAULT_AUDIO_CONFIG } from '../utils/audioAnalyzer';
import { AudioAnalysisData } from '../types';
import {
  Mic,
  MicOff,
  Activity,
  Play,
  Pause,
  Square,
  RotateCcw,
  Repeat,
  Upload,
  Volume2,
  VolumeX,
  AlertTriangle,
  ChevronDown,
  Zap,
  Waves,
  Radio,
  GitBranch,
  Palette,
  Plus,
  Trash2,
  Disc
} from 'lucide-react';

interface AudioReactivityControlsProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
}

const IDLE_ANALYSIS: AudioAnalysisData = {
  isPlaying: false,
  isLooping: true,
  currentTime: 0,
  duration: 0,
  fileName: null,
  sourceType: 'none',
  overallEnergy: 0,
  bass: 0,
  mid: 0,
  high: 0,
  vocal: 0,
  vocalRaw: 0,
  fullMix: 0,
  vocalConfidence: 0,
  vocalDetected: false,
  vocalDetectionMethod: 'heuristic',
  vocalStemStatus: 'unavailable',
  vocalRippleInfluence: 0,
  beatDetected: false,
  beatStrength: 0,
  beatPulse: 0,
  smoothedBeatIntensity: 0,
  secondWavePhase: 0,
  spectrum: new Uint8Array(0),
  waveform: new Uint8Array(0),
  activeRipples: [],
  volumeHistory: new Float32Array(0)
};

const formatTime = (secs: number) => {
  if (isNaN(secs) || secs < 0) return '00:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const sliderStyle: React.CSSProperties = { background: 'var(--track)', accentColor: 'var(--modified)' };

/** Collapsible section shell — restyled to the design-token system, same collapse behavior. */
const Section: React.FC<{
  title: string;
  icon: React.ReactNode;
  accent?: string;
  defaultOpen?: boolean;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, accent, defaultOpen = false, rightSlot, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  const accentColor = accent || 'var(--modified-ink)';
  return (
    <div className="border rounded-[var(--radius-input)] overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
      {/* Not a <button> — rightSlot may contain its own interactive <button>, and buttons cannot
          nest inside buttons (invalid HTML / React DOM-nesting warning). role="button" keeps it
          keyboard-accessible for the collapse toggle without that restriction. */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className="w-full flex items-center justify-between px-3 py-2.5 transition-colors cursor-pointer select-none"
        style={{ background: 'var(--chip)' }}
      >
        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>
          {icon}
          {title}
        </span>
        <span className="flex items-center gap-2">
          {rightSlot}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--muted)' }} />
        </span>
      </div>
      {open && (
        <div className="p-3 space-y-3 border-t" style={{ borderColor: 'var(--border)' }}>
          {children}
        </div>
      )}
    </div>
  );
};

export const AudioReactivityControls: React.FC<AudioReactivityControlsProps> = ({ state, onUpdateState }) => {
  const [isMicRunning, setIsMicRunning] = useState(false);
  const [isSynthRunning, setIsSynthRunning] = useState(false);
  const [analysis, setAnalysis] = useState<AudioAnalysisData>(IDLE_ANALYSIS);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [, forceTick] = useState(0);

  const audio: AudioConfig = state.audio || DEFAULT_AUDIO_CONFIG;

  // Item 9 — Sports: audio reactivity is locked for this category only, without touching shared
  // audio functionality used by every other preset.
  const activePreset = PRESETS.find((p) => p.id === state.activePresetId);
  const isAudioLockedForPreset = activePreset?.category === 'Sports';

  // Polls the analyzer's CACHED last snapshot at a throttled rate for meters/transport — never
  // calls `.update()` itself, so analysis runs exactly once per frame from KineticCanvas's render
  // loop (item 11: avoid duplicate analysis loops / excessive React state updates).
  useEffect(() => {
    const interval = window.setInterval(() => {
      const last = audioAnalyzerInstance.getLastAnalysis();
      setAnalysis(last || IDLE_ANALYSIS);
      forceTick((t) => t + 1);
    }, 150);
    const unsub = audioAnalyzerInstance.subscribe(() => forceTick((t) => t + 1));
    return () => {
      window.clearInterval(interval);
      unsub();
    };
  }, []);

  // Force-disable audio reactivity + stop any running source whenever a Sports preset becomes
  // active, without affecting audio state for any other preset.
  useEffect(() => {
    if (isAudioLockedForPreset) {
      if (isMicRunning || isSynthRunning || audioAnalyzerInstance.hasAudio()) {
        audioAnalyzerInstance.stop();
        setIsMicRunning(false);
        setIsSynthRunning(false);
      }
      if (audio.enabled) {
        onUpdateState((prev) => ({ ...prev, audio: { ...(prev.audio || DEFAULT_AUDIO_CONFIG), enabled: false } }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAudioLockedForPreset]);

  const updateAudio = useCallback(
    (patch: Partial<AudioConfig>) => {
      onUpdateState((prev) => ({ ...prev, audio: { ...(prev.audio || DEFAULT_AUDIO_CONFIG), ...patch } }));
    },
    [onUpdateState]
  );

  const hasAudio = audioAnalyzerInstance.hasAudio();
  const isPlaying = analysis.isPlaying;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isAudioLockedForPreset) return;
    setIsMicRunning(false);
    setIsSynthRunning(false);
    audioAnalyzerInstance.loadAudioFile(file).then(() => {
      updateAudio({ enabled: true });
    });
  };

  const toggleMic = async () => {
    if (isAudioLockedForPreset) return;
    if (isMicRunning) {
      audioAnalyzerInstance.stopMicrophone();
      setIsMicRunning(false);
    } else {
      setIsSynthRunning(false);
      const ok = await audioAnalyzerInstance.startMicrophone();
      if (ok) {
        setIsMicRunning(true);
        updateAudio({ enabled: true });
      } else {
        alert('Không truy cập được micro. Kiểm tra quyền truy cập trình duyệt rồi thử lại.');
      }
    }
  };

  const toggleSynth = () => {
    if (isAudioLockedForPreset) return;
    if (isSynthRunning) {
      audioAnalyzerInstance.stopProceduralBeat();
      setIsSynthRunning(false);
    } else {
      setIsMicRunning(false);
      audioAnalyzerInstance.startProceduralBeat(audio.synthStyle || 'electro', audio.synthBpm || 120);
      setIsSynthRunning(true);
      updateAudio({ enabled: true });
    }
  };

  const addMapping = () => {
    updateAudio({ mappings: [...audio.mappings, { source: 'bass', target: 'waveThickness', amount: 0.5 }] });
  };
  const removeMapping = (idx: number) => {
    updateAudio({ mappings: audio.mappings.filter((_, i) => i !== idx) });
  };
  const updateMapping = (idx: number, patch: Partial<AudioMappingConfig>) => {
    updateAudio({ mappings: audio.mappings.map((m, i) => (i === idx ? { ...m, ...patch } : m)) });
  };

  if (isAudioLockedForPreset) {
    return (
      <div className="space-y-2 p-3 rounded-[var(--radius-input)] border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', fontFamily: 'var(--font-ui)' }}>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink)' }}>
            Phản ứng theo âm thanh
          </span>
        </div>
        <p className="text-[10.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          Tạm thời tắt tính năng này cho các preset Sports trong lúc xử lý một lỗi phát lại. Vẫn khả
          dụng đầy đủ trên mọi preset khác.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" style={{ fontFamily: 'var(--font-ui)' }}>
      <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4" style={{ color: 'var(--modified-ink)' }} />
          <span className="text-[11px] font-bold uppercase tracking-wider">Phản ứng theo âm thanh</span>
        </div>
        <button
          type="button"
          onClick={() => updateAudio({ enabled: !audio.enabled })}
          className="px-3 py-1 rounded-[var(--radius-pill)] font-bold text-[10px] tracking-wider transition-colors border"
          style={
            audio.enabled
              ? { background: 'var(--modified-bg)', color: 'var(--modified-ink)', borderColor: 'var(--modified)' }
              : { background: 'var(--chip)', color: 'var(--muted)', borderColor: 'var(--border)' }
          }
        >
          {audio.enabled ? 'BẬT' : 'TẮT'}
        </button>
      </div>
      <p className="text-[10.5px] leading-relaxed -mt-1" style={{ color: 'var(--muted)' }}>
        Điều khiển trường sóng/hạt từ phân tích âm thanh thật. Mặc định TẮT cho mọi preset — hình ảnh
        hiện có được đảm bảo không đổi cho đến khi bạn chủ động bật.
      </p>

      {/* 1. NGUỒN & PHÁT */}
      <Section title="Nguồn & Phát" icon={<Upload className="w-3.5 h-3.5" />} defaultOpen>
        <label
          className="relative border-2 border-dashed rounded-[var(--radius-input)] p-3.5 text-center cursor-pointer transition-colors block"
          style={
            hasAudio
              ? { borderColor: 'var(--modified)', background: 'var(--modified-bg)' }
              : { borderColor: 'var(--border-strong)', background: 'var(--chip)' }
          }
        >
          <input ref={fileInputRef} type="file" accept=".mp3,.wav,.ogg,audio/*" onChange={handleFileChange} className="hidden" />
          <div className="flex flex-col items-center gap-1.5">
            <Upload className="w-4 h-4" style={{ color: 'var(--modified-ink)' }} />
            <span className="text-[10.5px] font-bold truncate max-w-full" style={{ color: 'var(--ink)' }}>
              {analysis.fileName || 'Tải file âm thanh (.mp3 / .wav / .ogg)'}
            </span>
          </div>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={toggleMic}
            className="p-2 rounded-[var(--radius-input)] border flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase transition-colors"
            style={
              isMicRunning
                ? { background: 'rgba(244,63,94,0.15)', borderColor: '#f43f5e', color: '#fb7185' }
                : { background: 'var(--chip)', borderColor: 'var(--border)', color: 'var(--ink-2)' }
            }
          >
            {isMicRunning ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" style={{ color: 'var(--modified-ink)' }} />}
            {isMicRunning ? 'Dừng mic' : 'Mic trực tiếp'}
          </button>
          <button
            type="button"
            onClick={toggleSynth}
            className="p-2 rounded-[var(--radius-input)] border flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase transition-colors"
            style={
              isSynthRunning
                ? { background: 'rgba(168,85,247,0.15)', borderColor: '#a855f7', color: '#d8b4fe' }
                : { background: 'var(--chip)', borderColor: 'var(--border)', color: 'var(--ink-2)' }
            }
          >
            {isSynthRunning ? <Square className="w-3.5 h-3.5" /> : <Disc className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />}
            {isSynthRunning ? 'Dừng synth' : 'Thử synth'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              { id: 'electro', label: 'Electro', bpm: 120 },
              { id: 'techno', label: 'Techno', bpm: 135 },
              { id: 'lofi', label: 'Lo-Fi', bpm: 84 }
            ] as { id: SynthStyle; label: string; bpm: number }[]
          ).map((st) => {
            const active = (audio.synthStyle || 'electro') === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  updateAudio({ synthStyle: st.id, synthBpm: st.bpm });
                  if (isSynthRunning) audioAnalyzerInstance.startProceduralBeat(st.id, st.bpm);
                }}
                className="py-1.5 rounded-[var(--radius-input)] text-[9.5px] font-bold uppercase border transition-colors"
                style={
                  active
                    ? { background: 'rgba(168,85,247,0.15)', borderColor: '#a855f7', color: '#d8b4fe' }
                    : { background: 'var(--chip)', borderColor: 'var(--border)', color: 'var(--muted)' }
                }
              >
                {st.label}
                <span className="block text-[8.5px] opacity-70">{st.bpm} BPM</span>
              </button>
            );
          })}
        </div>

        {hasAudio && (
          <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex justify-between text-[10px]" style={{ color: 'var(--muted)' }}>
              <span>{formatTime(analysis.currentTime)}</span>
              <span>{formatTime(analysis.duration)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={analysis.duration || 100}
              step={0.1}
              value={analysis.currentTime}
              onChange={(e) => audioAnalyzerInstance.seek(parseFloat(e.target.value))}
              className="w-full h-1 rounded appearance-none cursor-pointer"
              style={sliderStyle}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => (isPlaying ? audioAnalyzerInstance.pause() : audioAnalyzerInstance.play())}
                  className="w-8 h-8 rounded-[var(--radius-input)] flex items-center justify-center transition-colors"
                  style={{ background: 'var(--modified)', color: 'var(--surface)' }}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => audioAnalyzerInstance.stop()}
                  className="w-7 h-7 rounded-[var(--radius-input)] flex items-center justify-center transition-colors"
                  style={{ background: 'var(--chip)', color: 'var(--ink-2)' }}
                >
                  <Square className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => audioAnalyzerInstance.restart()}
                  className="w-7 h-7 rounded-[var(--radius-input)] flex items-center justify-center transition-colors"
                  style={{ background: 'var(--chip)', color: 'var(--ink-2)' }}
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = !audioAnalyzerInstance.getIsLooping();
                    audioAnalyzerInstance.setLoop(next);
                    updateAudio({ loopAudio: next });
                  }}
                  className="w-7 h-7 rounded-[var(--radius-input)] flex items-center justify-center transition-colors"
                  style={
                    audioAnalyzerInstance.getIsLooping()
                      ? { background: 'var(--modified-bg)', color: 'var(--modified-ink)', border: '1px solid var(--modified)' }
                      : { background: 'var(--chip)', color: 'var(--muted)' }
                  }
                >
                  <Repeat className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 w-28">
                {audioAnalyzerInstance.getVolume() === 0 ? (
                  <VolumeX className="w-3 h-3" style={{ color: 'var(--muted)' }} />
                ) : (
                  <Volume2 className="w-3 h-3" style={{ color: 'var(--modified-ink)' }} />
                )}
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  defaultValue={audioAnalyzerInstance.getVolume()}
                  onChange={(e) => audioAnalyzerInstance.setVolume(parseFloat(e.target.value))}
                  className="w-full h-1 rounded appearance-none cursor-pointer"
                  style={sliderStyle}
                />
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* 2. PHÂN TÍCH ÂM THANH */}
      <Section
        title="Phân tích âm thanh"
        icon={<Zap className="w-3.5 h-3.5" />}
        defaultOpen
        rightSlot={
          <span
            className="text-[8.5px] px-1.5 py-0.5 rounded font-bold uppercase border"
            style={
              analysis.isPlaying
                ? { background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', borderColor: 'rgba(16,185,129,0.4)' }
                : { background: 'var(--chip)', color: 'var(--muted)', borderColor: 'var(--border)' }
            }
          >
            {analysis.isPlaying ? 'LIVE' : 'IDLE'}
          </span>
        }
      >
        <div className="space-y-1.5">
          {([
            ['BASS', analysis.bass, 'from-rose-500 to-pink-500'],
            ['MID', analysis.mid, 'from-sky-500 to-cyan-400'],
            ['HIGH', analysis.high, 'from-purple-500 to-fuchsia-400'],
            ['VOCAL', analysis.vocal, 'from-amber-500 to-orange-400'],
            ['NĂNG LƯỢNG', analysis.overallEnergy, 'from-emerald-500 to-lime-400']
          ] as [string, number, string][]).map(([label, val, grad]) => (
            <div key={label} className="flex items-center justify-between text-[10px]">
              <span className="w-16 font-bold" style={{ color: 'var(--ink-2)' }}>{label}</span>
              <div className="flex-1 mx-2 h-2 rounded-full overflow-hidden border" style={{ background: 'var(--chip)', borderColor: 'var(--border)' }}>
                <div className={`h-full bg-gradient-to-r ${grad}`} style={{ width: `${Math.round(val * 100)}%` }} />
              </div>
              <span className="w-8 text-right" style={{ color: 'var(--muted)' }}>{Math.round(val * 100)}%</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full border transition-all"
              style={
                analysis.beatDetected
                  ? { background: '#ec4899', borderColor: '#ec4899', boxShadow: '0 0 10px #ec4899', transform: 'scale(1.25)' }
                  : { background: 'var(--chip)', borderColor: '#ec4899' }
              }
            />
            <span className="text-[10px] font-bold uppercase" style={{ color: analysis.beatDetected ? '#ec4899' : 'var(--muted)' }}>
              {analysis.beatDetected ? 'NHỊP!' : 'nhịp'}
            </span>
          </div>
          <span className="text-[10px]" style={{ color: 'var(--muted)' }}>Xung {Math.round(analysis.beatPulse * 100)}%</span>
        </div>

        {/* Debug: distinguishes a weak upstream signal (raw vocal-band reading near zero) from a
            valid signal that simply isn't reaching the renderer (Audio Reactivity master OFF). */}
        <div className="flex items-center justify-between pt-2 border-t text-[9px]" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          <span>Năng lượng vocal: <span style={{ color: 'var(--ink-2)' }}>{Math.round(analysis.vocalRaw * 100)}%</span></span>
          <span>Full Mix: <span style={{ color: 'var(--ink-2)' }}>{Math.round(analysis.fullMix * 100)}%</span></span>
          <span style={{ color: audio.enabled ? '#6ee7b7' : '#fb7185' }}>
            {audio.enabled ? '→ Engine: LIVE' : '→ Engine: TẮT (bật ở trên)'}
          </span>
        </div>

        <div className="pt-2 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
          <div>
            <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--muted)' }}>
              <span>ĐỘ NHẠY</span>
              <span style={{ color: 'var(--modified-ink)' }}>{audio.sensitivity.toFixed(2)}x</span>
            </div>
            <input type="range" min={0.1} max={2} step={0.05} value={audio.sensitivity} onChange={(e) => updateAudio({ sensitivity: parseFloat(e.target.value) })} className="w-full h-[2px] rounded appearance-none cursor-pointer" style={sliderStyle} />
          </div>
          <div>
            <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--muted)' }}>
              <span>ĐỘ MƯỢT</span>
              <span style={{ color: 'var(--modified-ink)' }}>{audio.smoothing.toFixed(2)}</span>
            </div>
            <input type="range" min={0.1} max={0.95} step={0.05} value={audio.smoothing} onChange={(e) => updateAudio({ smoothing: parseFloat(e.target.value) })} className="w-full h-[2px] rounded appearance-none cursor-pointer" style={sliderStyle} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([
              ['BASS', 'bassSensitivity'],
              ['MID', 'midSensitivity'],
              ['HIGH', 'highSensitivity']
            ] as [string, keyof AudioConfig][]).map(([label, field]) => (
              <div key={field}>
                <div className="flex justify-between text-[9px] mb-0.5" style={{ color: 'var(--muted)' }}>
                  <span>{label}</span>
                  <span style={{ color: 'var(--modified-ink)' }}>{(audio[field] as number).toFixed(1)}x</span>
                </div>
                <input
                  type="range" min={0.1} max={2.5} step={0.1}
                  value={audio[field] as number}
                  onChange={(e) => updateAudio({ [field]: parseFloat(e.target.value) } as Partial<AudioConfig>)}
                  className="w-full h-[2px] rounded appearance-none cursor-pointer"
                  style={sliderStyle}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] uppercase" style={{ color: 'var(--muted)' }}>Nhận diện nhịp</span>
            <button
              type="button"
              onClick={() => updateAudio({ beatDetectionEnabled: !audio.beatDetectionEnabled })}
              className="px-2 py-0.5 rounded text-[9.5px] font-bold uppercase border"
              style={
                audio.beatDetectionEnabled
                  ? { background: 'var(--modified-bg)', color: 'var(--modified-ink)', borderColor: 'var(--modified)' }
                  : { background: 'var(--chip)', color: 'var(--muted)', borderColor: 'var(--border)' }
              }
            >
              {audio.beatDetectionEnabled ? 'BẬT' : 'TẮT'}
            </button>
          </div>
          {audio.beatDetectionEnabled && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between text-[9px] mb-0.5" style={{ color: 'var(--muted)' }}><span>NGƯỠNG</span><span style={{ color: 'var(--modified-ink)' }}>{audio.beatThreshold.toFixed(2)}</span></div>
                <input type="range" min={0.1} max={1} step={0.05} value={audio.beatThreshold} onChange={(e) => updateAudio({ beatThreshold: parseFloat(e.target.value) })} className="w-full h-[2px] rounded appearance-none cursor-pointer" style={sliderStyle} />
              </div>
              <div>
                <div className="flex justify-between text-[9px] mb-0.5" style={{ color: 'var(--muted)' }}><span>SUY GIẢM</span><span style={{ color: 'var(--modified-ink)' }}>{audio.beatDecay.toFixed(2)}</span></div>
                <input type="range" min={0.7} max={0.98} step={0.01} value={audio.beatDecay} onChange={(e) => updateAudio({ beatDecay: parseFloat(e.target.value) })} className="w-full h-[2px] rounded appearance-none cursor-pointer" style={sliderStyle} />
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* 3. SÓNG LAN THEO NHẠC */}
      <Section
        title="Sóng lan theo nhạc"
        icon={<Waves className="w-3.5 h-3.5" />}
        rightSlot={
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); updateAudio({ audioMusicRippleEnabled: !audio.audioMusicRippleEnabled }); }}
            className="text-[8.5px] px-1.5 py-0.5 rounded font-bold uppercase border"
            style={
              audio.audioMusicRippleEnabled
                ? { background: 'var(--modified-bg)', color: 'var(--modified-ink)', borderColor: 'var(--modified)' }
                : { background: 'var(--chip)', color: 'var(--muted)', borderColor: 'var(--border)' }
            }
          >
            {audio.audioMusicRippleEnabled ? 'BẬT' : 'TẮT'}
          </button>
        }
      >
        <p className="text-[10px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          Một mặt sóng lan liên tục lấy mẫu từ lịch sử âm lượng thật: âm thanh mới vào từ tâm và lan
          ra ngoài qua trường hạt.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--muted)' }}><span>TỐC ĐỘ</span><span style={{ color: 'var(--modified-ink)' }}>{audio.audioRippleSpeed.toFixed(1)}</span></div>
            <input type="range" min={0.5} max={15} step={0.5} value={audio.audioRippleSpeed} onChange={(e) => updateAudio({ audioRippleSpeed: parseFloat(e.target.value) })} className="w-full h-[2px] rounded appearance-none cursor-pointer" style={sliderStyle} />
          </div>
          <div>
            <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--muted)' }}><span>CƯỜNG ĐỘ</span><span style={{ color: 'var(--modified-ink)' }}>{audio.audioRippleStrength.toFixed(2)}x</span></div>
            <input type="range" min={0.1} max={3.5} step={0.05} value={audio.audioRippleStrength} onChange={(e) => updateAudio({ audioRippleStrength: parseFloat(e.target.value) })} className="w-full h-[2px] rounded appearance-none cursor-pointer" style={sliderStyle} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--muted)' }}><span>BƯỚC SÓNG / TẦM XA</span><span style={{ color: 'var(--modified-ink)' }}>{audio.audioRippleWavelength}px</span></div>
          <input type="range" min={150} max={1500} step={25} value={audio.audioRippleWavelength} onChange={(e) => updateAudio({ audioRippleWavelength: parseFloat(e.target.value) })} className="w-full h-[2px] rounded appearance-none cursor-pointer" style={sliderStyle} />
        </div>
        <div>
          <label className="block text-[10px] uppercase mb-1" style={{ color: 'var(--muted)' }}>Nguồn phản ứng âm thanh</label>
          <div className="grid grid-cols-3 gap-1">
            {(['overall', 'bass', 'mid', 'vocal', 'beatPulse', 'fullMix'] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => updateAudio({ audioRippleBand: b })}
                className="py-1 rounded text-[9.5px] uppercase font-bold border transition-colors"
                style={
                  (audio.audioRippleBand || 'overall') === b
                    ? { background: 'var(--modified-bg)', borderColor: 'var(--modified)', color: 'var(--modified-ink)' }
                    : { background: 'var(--chip)', borderColor: 'var(--border)', color: 'var(--muted)' }
                }
              >
                {b === 'beatPulse' ? 'nhịp' : b === 'fullMix' ? 'full mix' : b}
              </button>
            ))}
          </div>
          <p className="text-[9px] mt-1" style={{ color: 'var(--muted)' }}>
            Full Mix gộp mọi dải tần + RMS, không cần bass đập nhịp mới kích hoạt.
          </p>
        </div>
        <div>
          <label className="block text-[10px] uppercase mb-1" style={{ color: 'var(--muted)' }}>Hoạ âm</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[1, 2, 3].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => updateAudio({ audioRippleHarmonics: h })}
                className="py-1.5 rounded text-[9.5px] font-bold border transition-colors"
                style={
                  (audio.audioRippleHarmonics ?? 1) === h
                    ? { background: 'var(--modified-bg)', borderColor: 'var(--modified)', color: 'var(--modified-ink)' }
                    : { background: 'var(--chip)', borderColor: 'var(--border)', color: 'var(--muted)' }
                }
              >
                {h}x
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* 4. SÓNG THỨ HAI */}
      <Section
        title="Sóng thứ hai"
        icon={<Radio className="w-3.5 h-3.5" />}
        rightSlot={
          <span
            className="text-[8.5px] px-1.5 py-0.5 rounded font-bold uppercase border"
            style={
              audio.beatRippleSequenceMode === 'second_wave'
                ? { background: 'var(--modified-bg)', color: 'var(--modified-ink)', borderColor: 'var(--modified)' }
                : { background: 'var(--chip)', color: 'var(--muted)', borderColor: 'var(--border)' }
            }
          >
            {audio.beatRippleSequenceMode === 'second_wave' ? 'ĐANG DÙNG' : 'TẮT'}
          </span>
        }
      >
        <p className="text-[10px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          Hoạt hoạ các vòng sóng ĐÃ CÓ sẵn trong bố cục — không bao giờ sinh vòng mới. Hoạt động với
          mọi material (Dot, ASCII, Diamond, Custom SVG, Stitch...). Im lặng sẽ để chuyển động lắng lại.
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              { id: 'second_wave', label: 'Sóng thứ 2', desc: 'Điều biến các vòng hiện có' },
              { id: 'cascade', label: 'Thác dội âm', desc: 'Các vòng đồng tâm' },
              { id: 'single', label: 'Xung đơn', desc: 'Một vòng mỗi nhịp' },
              { id: 'freq_bands', label: 'Tách dải tần', desc: 'Vòng Bass/Mid/High' },
              { id: 'alternate', label: 'Đổi tâm luân phiên', desc: 'Xoay vị trí' }
            ] as { id: RippleSequenceMode; label: string; desc: string }[]
          ).map((m) => {
            const active = audio.beatRippleSequenceMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => updateAudio({ beatRippleSequenceMode: m.id })}
                className="p-1.5 rounded text-left border transition-colors"
                style={
                  active
                    ? { background: 'var(--modified-bg)', borderColor: 'var(--modified)', color: 'var(--modified-ink)' }
                    : { background: 'var(--chip)', borderColor: 'var(--border)', color: 'var(--muted)' }
                }
              >
                <span className="block text-[9.5px] font-bold uppercase">{m.label}</span>
                <span className="block text-[8px] opacity-70">{m.desc}</span>
              </button>
            );
          })}
        </div>

        {audio.beatRippleSequenceMode === 'second_wave' && (
          <div className="space-y-2.5 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--muted)' }}><span>TỐC ĐỘ SÓNG</span><span style={{ color: 'var(--modified-ink)' }}>{audio.secondWaveSpeed.toFixed(2)}x</span></div>
                <input type="range" min={0} max={3} step={0.05} value={audio.secondWaveSpeed} onChange={(e) => updateAudio({ secondWaveSpeed: parseFloat(e.target.value) })} className="w-full h-[2px] rounded appearance-none cursor-pointer" style={sliderStyle} />
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--muted)' }}><span>TẦN SỐ SÓNG</span><span style={{ color: 'var(--modified-ink)' }}>{audio.secondWaveFrequency.toFixed(2)}</span></div>
                <input type="range" min={0.1} max={4} step={0.05} value={audio.secondWaveFrequency} onChange={(e) => updateAudio({ secondWaveFrequency: parseFloat(e.target.value) })} className="w-full h-[2px] rounded appearance-none cursor-pointer" style={sliderStyle} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--muted)' }}><span>ĐỘ DÀY CƠ BẢN</span><span style={{ color: 'var(--modified-ink)' }}>{audio.secondWaveBaseThickness.toFixed(2)}x</span></div>
              <input type="range" min={0.2} max={3} step={0.05} value={audio.secondWaveBaseThickness} onChange={(e) => updateAudio({ secondWaveBaseThickness: parseFloat(e.target.value) })} className="w-full h-[2px] rounded appearance-none cursor-pointer" style={sliderStyle} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--muted)' }}><span>ẢNH HƯỞNG ĐỘ DÀY</span><span style={{ color: 'var(--modified-ink)' }}>{Math.round(audio.secondWaveThicknessInfluence * 100)}%</span></div>
                <input type="range" min={0} max={1} step={0.02} value={audio.secondWaveThicknessInfluence} onChange={(e) => updateAudio({ secondWaveThicknessInfluence: parseFloat(e.target.value) })} className="w-full h-[2px] rounded appearance-none cursor-pointer" style={sliderStyle} />
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--muted)' }}><span>CƯỜNG ĐỘ CHUYỂN ĐỘNG</span><span style={{ color: 'var(--modified-ink)' }}>{Math.round(audio.secondWaveMovementStrength * 100)}%</span></div>
                <input type="range" min={0} max={1} step={0.02} value={audio.secondWaveMovementStrength} onChange={(e) => updateAudio({ secondWaveMovementStrength: parseFloat(e.target.value) })} className="w-full h-[2px] rounded appearance-none cursor-pointer" style={sliderStyle} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--muted)' }}><span>ĐỘ NHẠY NHỊP</span><span style={{ color: 'var(--modified-ink)' }}>{audio.secondWaveBeatSensitivity.toFixed(2)}x</span></div>
              <input type="range" min={0.1} max={2.5} step={0.05} value={audio.secondWaveBeatSensitivity} onChange={(e) => updateAudio({ secondWaveBeatSensitivity: parseFloat(e.target.value) })} className="w-full h-[2px] rounded appearance-none cursor-pointer" style={sliderStyle} />
            </div>
          </div>
        )}
      </Section>

      {/* 4B. PHẢN ỨNG THEO GIỌNG HÁT */}
      <Section
        title="Phản ứng theo giọng hát"
        icon={<Mic className="w-3.5 h-3.5" />}
        accent="#f59e0b"
        rightSlot={
          <span
            className="text-[8.5px] px-1.5 py-0.5 rounded font-bold uppercase border"
            style={
              audio.vocalReactivity.mode === 'off'
                ? { background: 'var(--chip)', color: 'var(--muted)', borderColor: 'var(--border)' }
                : { background: 'rgba(245,158,11,0.15)', color: '#fbbf24', borderColor: 'rgba(245,158,11,0.4)' }
            }
          >
            {audio.vocalReactivity.mode === 'off' ? 'TẮT' : audio.vocalReactivity.mode === 'auto_detect' ? 'TỰ ĐỘNG' : 'TÁCH RIÊNG'}
          </span>
        }
      >
        <p className="text-[10px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          Phản ứng theo hát/nói, không chỉ trống và bass. Nhận diện TÁCH BIỆT với năng lượng: một
          thuật toán đa đặc trưng (độ hài hoà + nhịp âm tiết ~2-6Hz + mật độ formant giọng hát) phải
          xác nhận có giọng hát trước khi Auto Detect điều khiển sóng lan — năng lượng dải trung đơn
          thuần không bao giờ được coi là bằng chứng có giọng hát.
        </p>
        <p className="text-[9px] leading-relaxed rounded px-2 py-1.5 border" style={{ color: '#fbbf24', background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)' }}>
          Phương pháp nhận diện: thuật toán DSP — KHÔNG phải mô hình ML đã huấn luyện để phân loại
          giọng hát, và bản build này không kèm theo model huấn luyện sẵn nào. Đáng tin cậy hơn hẳn so
          với năng lượng dải trung thô, nhưng vẫn có thể báo sai với âm sắc nhạc cụ bất thường — theo
          dõi chỉ số debug bên dưới.
        </p>

        <div>
          <label className="block text-[10px] uppercase mb-1" style={{ color: 'var(--muted)' }}>Chế độ giọng hát</label>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: 'off', label: 'Tắt', desc: 'Không phản ứng theo giọng hát' },
                { id: 'auto_detect', label: 'Tự động', desc: 'Thuật toán phân loại điều khiển sóng lan' },
                { id: 'isolated', label: 'Tách riêng', desc: 'Stem giọng hát tách riêng (chưa khả dụng ở bản này)' }
              ] as { id: 'off' | 'auto_detect' | 'isolated'; label: string; desc: string }[]
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => updateAudio({ vocalReactivity: { ...audio.vocalReactivity, mode: m.id } })}
                title={m.desc}
                className="p-1.5 rounded border text-center transition-colors"
                style={
                  audio.vocalReactivity.mode === m.id
                    ? { background: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.5)', color: '#fbbf24', fontWeight: 700 }
                    : { background: 'var(--chip)', borderColor: 'var(--border)', color: 'var(--muted)' }
                }
              >
                <span className="block text-[9.5px] font-bold uppercase">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {audio.vocalReactivity.mode === 'isolated' && (
          <div className="text-[10px] rounded px-2 py-1.5 leading-relaxed border" style={{ color: '#fda4af', background: 'rgba(244,63,94,0.08)', borderColor: 'rgba(244,63,94,0.25)' }}>
            Stem giọng hát tách riêng: <b>CHƯA KHẢ DỤNG</b>. Việc tách nguồn (chia stem giọng
            hát/nhạc nền) chưa được xây dựng trong bản này — cần một mô hình ML lớn mà không thể đóng
            gói/kiểm chứng ổn thoả ở đây. Chế độ này cố tình không tạo ảnh hưởng sóng lan nào thay vì
            ngầm thay bằng chỉ số full-mix kém tin cậy rồi gọi nó là "tách riêng".
          </div>
        )}

        {audio.vocalReactivity.mode !== 'off' && (
          <div className="space-y-2.5 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
            {/* Debug — distinguishes DETECTED presence from the ENERGY driving the ripple */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] rounded p-2 border" style={{ background: 'var(--chip)', borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>Độ tin cậy giọng hát</span>
              <span className="text-right" style={{ color: '#fbbf24' }}>{Math.round(analysis.vocalConfidence * 100)}%</span>
              <span style={{ color: 'var(--muted)' }}>Ngưỡng nhận diện (bật/tắt)</span>
              <span className="text-right" style={{ color: '#fbbf24' }}>
                {Math.round(audio.vocalReactivity.confidenceThresholdOn * 100)}% / {Math.round(audio.vocalReactivity.confidenceThresholdOff * 100)}%
              </span>
              <span style={{ color: 'var(--muted)' }}>Đã phát hiện giọng hát</span>
              <span className="text-right font-bold" style={{ color: analysis.vocalDetected ? '#6ee7b7' : 'var(--muted)' }}>
                {analysis.vocalDetected ? 'CÓ' : 'KHÔNG'}
              </span>
              <span style={{ color: 'var(--muted)' }}>Năng lượng giọng hát</span>
              <span className="text-right" style={{ color: '#fbbf24' }}>{Math.round(analysis.vocalRaw * 100)}%</span>
              <span style={{ color: 'var(--muted)' }}>Ảnh hưởng sóng lan cuối cùng</span>
              <span className="text-right" style={{ color: '#6ee7b7' }}>{Math.round(analysis.vocalRippleInfluence * 100)}%</span>
            </div>

            <div>
              <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--muted)' }}><span>ĐỘ NHẠY</span><span style={{ color: '#fbbf24' }}>{audio.vocalReactivity.sensitivity.toFixed(2)}x</span></div>
              <input type="range" min={0.1} max={3} step={0.05} value={audio.vocalReactivity.sensitivity} onChange={(e) => updateAudio({ vocalReactivity: { ...audio.vocalReactivity, sensitivity: parseFloat(e.target.value) } })} className="w-full h-[2px] rounded appearance-none cursor-pointer" style={{ background: 'var(--track)', accentColor: '#f59e0b' }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--muted)' }}><span>TẦN SỐ THẤP</span><span style={{ color: '#fbbf24' }}>{Math.round(audio.vocalReactivity.freqLow)}Hz</span></div>
                <input type="range" min={50} max={800} step={10} value={audio.vocalReactivity.freqLow} onChange={(e) => updateAudio({ vocalReactivity: { ...audio.vocalReactivity, freqLow: Math.min(parseFloat(e.target.value), audio.vocalReactivity.freqHigh - 50) } })} className="w-full h-[2px] rounded appearance-none cursor-pointer" style={{ background: 'var(--track)', accentColor: '#f59e0b' }} />
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--muted)' }}><span>TẦN SỐ CAO</span><span style={{ color: '#fbbf24' }}>{Math.round(audio.vocalReactivity.freqHigh)}Hz</span></div>
                <input type="range" min={1000} max={8000} step={50} value={audio.vocalReactivity.freqHigh} onChange={(e) => updateAudio({ vocalReactivity: { ...audio.vocalReactivity, freqHigh: Math.max(parseFloat(e.target.value), audio.vocalReactivity.freqLow + 50) } })} className="w-full h-[2px] rounded appearance-none cursor-pointer" style={{ background: 'var(--track)', accentColor: '#f59e0b' }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--muted)' }}><span>ATTACK</span><span style={{ color: '#fbbf24' }}>{audio.vocalReactivity.attack.toFixed(2)}</span></div>
                <input type="range" min={0} max={1} step={0.02} value={audio.vocalReactivity.attack} onChange={(e) => updateAudio({ vocalReactivity: { ...audio.vocalReactivity, attack: parseFloat(e.target.value) } })} className="w-full h-[2px] rounded appearance-none cursor-pointer" style={{ background: 'var(--track)', accentColor: '#f59e0b' }} />
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--muted)' }}><span>RELEASE</span><span style={{ color: '#fbbf24' }}>{audio.vocalReactivity.release.toFixed(2)}</span></div>
                <input type="range" min={0} max={1} step={0.02} value={audio.vocalReactivity.release} onChange={(e) => updateAudio({ vocalReactivity: { ...audio.vocalReactivity, release: parseFloat(e.target.value) } })} className="w-full h-[2px] rounded appearance-none cursor-pointer" style={{ background: 'var(--track)', accentColor: '#f59e0b' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--muted)' }}><span>ẢNH HƯỞNG LÊN SÓNG LAN</span><span style={{ color: '#fbbf24' }}>{Math.round(audio.vocalReactivity.influence * 100)}%</span></div>
              <input type="range" min={0} max={1} step={0.02} value={audio.vocalReactivity.influence} onChange={(e) => updateAudio({ vocalReactivity: { ...audio.vocalReactivity, influence: parseFloat(e.target.value) } })} className="w-full h-[2px] rounded appearance-none cursor-pointer" style={{ background: 'var(--track)', accentColor: '#f59e0b' }} />
            </div>
            <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
              <div>
                <span className="block text-[10px] uppercase" style={{ color: 'var(--muted)' }}>Chuẩn hoá thích ứng</span>
                <span className="text-[9px]" style={{ color: 'var(--muted)' }}>Tự theo dõi nền ồn + đỉnh để giọng hát nhỏ vẫn được ghi nhận</span>
              </div>
              <button
                type="button"
                onClick={() => updateAudio({ vocalReactivity: { ...audio.vocalReactivity, adaptiveNormalization: !audio.vocalReactivity.adaptiveNormalization } })}
                className="px-2 py-0.5 rounded text-[9.5px] font-bold uppercase border shrink-0 ml-2"
                style={
                  audio.vocalReactivity.adaptiveNormalization
                    ? { background: 'rgba(245,158,11,0.15)', color: '#fbbf24', borderColor: 'rgba(245,158,11,0.4)' }
                    : { background: 'var(--chip)', color: 'var(--muted)', borderColor: 'var(--border)' }
                }
              >
                {audio.vocalReactivity.adaptiveNormalization ? 'BẬT' : 'TẮT'}
              </button>
            </div>

            {audio.vocalReactivity.mode === 'auto_detect' && (
              <div className="space-y-2.5 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <span className="block text-[10px] uppercase" style={{ color: 'var(--muted)' }}>
                  Nhận diện giọng hát (hysteresis — tránh bật/tắt liên tục)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--muted)' }}><span>NGƯỠNG BẬT</span><span style={{ color: '#fbbf24' }}>{Math.round(audio.vocalReactivity.confidenceThresholdOn * 100)}%</span></div>
                    <input
                      type="range" min={0.1} max={0.95} step={0.02}
                      value={audio.vocalReactivity.confidenceThresholdOn}
                      onChange={(e) => {
                        const on = parseFloat(e.target.value);
                        updateAudio({ vocalReactivity: { ...audio.vocalReactivity, confidenceThresholdOn: on, confidenceThresholdOff: Math.min(audio.vocalReactivity.confidenceThresholdOff, on - 0.03) } });
                      }}
                      className="w-full h-[2px] rounded appearance-none cursor-pointer"
                      style={{ background: 'var(--track)', accentColor: '#f59e0b' }}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--muted)' }}><span>NGƯỠNG TẮT</span><span style={{ color: '#fbbf24' }}>{Math.round(audio.vocalReactivity.confidenceThresholdOff * 100)}%</span></div>
                    <input
                      type="range" min={0.02} max={0.9} step={0.02}
                      value={audio.vocalReactivity.confidenceThresholdOff}
                      onChange={(e) => {
                        const off = parseFloat(e.target.value);
                        updateAudio({ vocalReactivity: { ...audio.vocalReactivity, confidenceThresholdOff: Math.min(off, audio.vocalReactivity.confidenceThresholdOn - 0.03) } });
                      }}
                      className="w-full h-[2px] rounded appearance-none cursor-pointer"
                      style={{ background: 'var(--track)', accentColor: '#f59e0b' }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--muted)' }}><span>THỜI LƯỢNG TỐI THIỂU</span><span style={{ color: '#fbbf24' }}>{audio.vocalReactivity.minVocalDuration.toFixed(2)}s</span></div>
                    <input type="range" min={0} max={0.6} step={0.02} value={audio.vocalReactivity.minVocalDuration} onChange={(e) => updateAudio({ vocalReactivity: { ...audio.vocalReactivity, minVocalDuration: parseFloat(e.target.value) } })} className="w-full h-[2px] rounded appearance-none cursor-pointer" style={{ background: 'var(--track)', accentColor: '#f59e0b' }} />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--muted)' }}><span>ĐỘ MƯỢT NHẬN DIỆN</span><span style={{ color: '#fbbf24' }}>{audio.vocalReactivity.detectionSmoothing.toFixed(2)}</span></div>
                    <input type="range" min={0.05} max={0.9} step={0.02} value={audio.vocalReactivity.detectionSmoothing} onChange={(e) => updateAudio({ vocalReactivity: { ...audio.vocalReactivity, detectionSmoothing: parseFloat(e.target.value) } })} className="w-full h-[2px] rounded appearance-none cursor-pointer" style={{ background: 'var(--track)', accentColor: '#f59e0b' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* 5. ÁNH XẠ THAM SỐ */}
      <Section title="Ánh xạ tham số" icon={<GitBranch className="w-3.5 h-3.5" />}>
        <p className="text-[10px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          Gắn bất kỳ dải âm thanh nào vào bất kỳ tham số sóng/hạt nào với mức ảnh hưởng độc lập. Nhiều
          ánh xạ chạy song song; giá trị gốc thủ công không bao giờ bị ghi đè, chỉ bị điều biến thêm.
        </p>
        <div className="space-y-2">
          {audio.mappings.map((m, idx) => (
            <div key={idx} className="rounded p-2 space-y-1.5 border" style={{ background: 'var(--chip)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-1.5">
                <select
                  value={m.source}
                  onChange={(e) => updateMapping(idx, { source: e.target.value as AudioMappingConfig['source'] })}
                  className="flex-1 rounded px-1.5 py-1 text-[9.5px] border"
                  style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--modified-ink)' }}
                >
                  <option value="bass">Bass</option>
                  <option value="mid">Mid</option>
                  <option value="high">High</option>
                  <option value="vocal">Dải giọng hát</option>
                  <option value="overallEnergy">Tổng năng lượng</option>
                  <option value="beatPulse">Xung nhịp</option>
                  <option value="fullMix">Full Mix</option>
                </select>
                <span style={{ color: 'var(--muted)' }}>→</span>
                <select
                  value={m.target}
                  onChange={(e) => updateMapping(idx, { target: e.target.value as AudioMappingConfig['target'] })}
                  className="flex-1 rounded px-1.5 py-1 text-[9.5px] border"
                  style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--modified-ink)' }}
                >
                  <option value="waveAmplitude">Biên độ sóng</option>
                  <option value="waveSpeed">Tốc độ sóng</option>
                  <option value="waveFrequency">Tần số sóng</option>
                  <option value="waveThickness">Độ dày sóng</option>
                  <option value="particleSize">Kích thước hạt</option>
                  <option value="particleOpacity">Độ mờ hạt</option>
                </select>
                <button type="button" onClick={() => removeMapping(idx)} className="p-1" style={{ color: 'var(--muted)' }}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] w-12" style={{ color: 'var(--muted)' }}>MỨC ĐỘ</span>
                <input type="range" min={0} max={1} step={0.05} value={m.amount} onChange={(e) => updateMapping(idx, { amount: parseFloat(e.target.value) })} className="flex-1 h-[2px] rounded appearance-none cursor-pointer" style={sliderStyle} />
                <span className="text-[9px] w-8 text-right" style={{ color: 'var(--modified-ink)' }}>{Math.round(m.amount * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addMapping}
          className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold px-2 py-1.5 rounded border transition-colors"
          style={{ color: 'var(--modified-ink)', background: 'var(--modified-bg)', borderColor: 'var(--modified)' }}
        >
          <Plus className="w-3 h-3" /> Thêm ánh xạ
        </button>
      </Section>

      {/* 6. MÀU SẮC THEO ÂM THANH */}
      <Section
        title="Màu sắc theo âm thanh"
        icon={<Palette className="w-3.5 h-3.5" />}
        rightSlot={
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); updateAudio({ audioColorShift: !audio.audioColorShift }); }}
            className="text-[8.5px] px-1.5 py-0.5 rounded font-bold uppercase border"
            style={
              audio.audioColorShift
                ? { background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', borderColor: 'rgba(16,185,129,0.4)' }
                : { background: 'var(--chip)', color: 'var(--muted)', borderColor: 'var(--border)' }
            }
          >
            {audio.audioColorShift ? 'BẬT' : 'TẮT'}
          </button>
        }
      >
        <p className="text-[10px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          Tuỳ chọn — bảng màu bạn đã chọn không bao giờ bị thay thế ép buộc trừ khi bật ở đây.
        </p>
        {audio.audioColorShift && (
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: 'accent_glow', label: 'Phát sáng điểm nhấn' },
                { id: 'p5_inverted', label: 'Đảo màu' },
                { id: 'spectrum_shift', label: 'Theo quang phổ' }
              ] as { id: AudioColorShiftMode; label: string }[]
            ).map((cm) => (
              <button
                key={cm.id}
                type="button"
                onClick={() => updateAudio({ audioColorShiftMode: cm.id })}
                className="p-1.5 rounded text-[9.5px] font-bold uppercase border transition-colors"
                style={
                  (audio.audioColorShiftMode || 'accent_glow') === cm.id
                    ? { background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.5)', color: '#6ee7b7' }
                    : { background: 'var(--chip)', borderColor: 'var(--border)', color: 'var(--muted)' }
                }
              >
                {cm.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] uppercase" style={{ color: 'var(--muted)' }}>Phát sáng theo nhịp đập</span>
          <button
            type="button"
            onClick={() => updateAudio({ audioBeatGlow: !audio.audioBeatGlow })}
            className="px-2 py-0.5 rounded text-[9.5px] font-bold uppercase border"
            style={
              audio.audioBeatGlow
                ? { background: 'var(--modified-bg)', color: 'var(--modified-ink)', borderColor: 'var(--modified)' }
                : { background: 'var(--chip)', color: 'var(--muted)', borderColor: 'var(--border)' }
            }
          >
            {audio.audioBeatGlow ? 'BẬT' : 'TẮT'}
          </button>
        </div>
      </Section>
    </div>
  );
};
