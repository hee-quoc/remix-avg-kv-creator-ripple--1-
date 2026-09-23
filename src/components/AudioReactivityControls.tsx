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

/** Collapsible section shell matching the app's existing dark/mono control panel language. */
const Section: React.FC<{
  title: string;
  icon: React.ReactNode;
  accent?: string;
  defaultOpen?: boolean;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, accent = '#00F0FF', defaultOpen = false, rightSlot, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#222] rounded-lg overflow-hidden bg-[#0a0a0d]">
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
        className="w-full flex items-center justify-between px-3 py-2.5 bg-[#0d0d12] hover:bg-[#131318] transition-colors cursor-pointer select-none"
      >
        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: accent }}>
          {icon}
          {title}
        </span>
        <span className="flex items-center gap-2">
          {rightSlot}
          <ChevronDown className={`w-3.5 h-3.5 text-[#666] transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </div>
      {open && <div className="p-3 space-y-3 border-t border-[#1a1a1a]">{children}</div>}
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
        alert('Could not access the microphone. Check browser permissions and try again.');
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
      <div className="space-y-2 p-3 bg-[#0a0a0d] border border-[#222] rounded-lg font-mono">
        <div className="flex items-center space-x-2 text-[#888]">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#aaa]">AUDIO REACTIVITY</span>
        </div>
        <p className="text-[9px] text-[#777] font-sans leading-relaxed">
          Audio reactivity is temporarily disabled for Sports presets while a playback issue is
          investigated. It remains fully available on every other preset.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 font-mono">
      {/* Master toggle */}
      <div className="flex items-center justify-between pb-2 border-b border-[#222]">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-[#00F0FF]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">AUDIO REACTIVITY</span>
        </div>
        <button
          type="button"
          onClick={() => updateAudio({ enabled: !audio.enabled })}
          className={`px-3 py-1 rounded-full font-bold text-[10px] tracking-wider transition-all border ${
            audio.enabled
              ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/50 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
              : 'bg-[#181818] text-[#777] border-[#333]'
          }`}
        >
          {audio.enabled ? 'ON' : 'OFF'}
        </button>
      </div>
      <p className="text-[9px] text-[#888] font-sans leading-relaxed -mt-1">
        Drives the ripple/particle field from real audio analysis. OFF by default for every preset —
        existing visuals are guaranteed unchanged until you explicitly enable this.
      </p>

      {/* 1. SOURCE & PLAYBACK */}
      <Section title="Source & Playback" icon={<Upload className="w-3.5 h-3.5" />} defaultOpen>
        <label
          className={`relative border-2 border-dashed rounded-lg p-3.5 text-center cursor-pointer transition-all block ${
            hasAudio ? 'border-[#00F0FF]/40 bg-[#00F0FF]/5' : 'border-[#333] bg-[#0d0d12] hover:border-[#555]'
          }`}
        >
          <input ref={fileInputRef} type="file" accept=".mp3,.wav,.ogg,audio/*" onChange={handleFileChange} className="hidden" />
          <div className="flex flex-col items-center gap-1.5">
            <Upload className="w-4 h-4 text-[#00F0FF]" />
            <span className="text-[10px] font-bold text-[#ddd] truncate max-w-full">
              {analysis.fileName || 'UPLOAD AUDIO FILE (.MP3 / .WAV / .OGG)'}
            </span>
          </div>
        </label>

        {/* Mic + Synth launchers */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={toggleMic}
            className={`p-2 rounded border flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase transition-all ${
              isMicRunning
                ? 'bg-rose-500/20 border-rose-500/60 text-rose-300'
                : 'bg-[#121212] border-[#262626] text-[#ccc] hover:border-[#444]'
            }`}
          >
            {isMicRunning ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-[#00F0FF]" />}
            {isMicRunning ? 'STOP MIC' : 'LIVE MIC'}
          </button>
          <button
            type="button"
            onClick={toggleSynth}
            className={`p-2 rounded border flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase transition-all ${
              isSynthRunning
                ? 'bg-purple-500/20 border-purple-500/60 text-purple-300'
                : 'bg-[#121212] border-[#262626] text-[#ccc] hover:border-[#444]'
            }`}
          >
            {isSynthRunning ? <Square className="w-3.5 h-3.5" /> : <Disc className="w-3.5 h-3.5 text-amber-400" />}
            {isSynthRunning ? 'STOP SYNTH' : 'TEST SYNTH'}
          </button>
        </div>

        {/* Synth styles */}
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
                className={`py-1.5 rounded text-[9px] font-bold uppercase border transition-colors ${
                  active ? 'bg-purple-500/20 border-purple-400/50 text-purple-300' : 'bg-[#121212] border-[#222] text-[#888] hover:text-white'
                }`}
              >
                {st.label}
                <span className="block text-[8px] opacity-70">{st.bpm} BPM</span>
              </button>
            );
          })}
        </div>

        {/* Transport */}
        {hasAudio && (
          <div className="space-y-2 pt-2 border-t border-[#1a1a1a]">
            <div className="flex justify-between text-[9px] text-[#888]">
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
              className="w-full h-1 bg-[#222] rounded appearance-none cursor-pointer accent-[#00F0FF]"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => (isPlaying ? audioAnalyzerInstance.pause() : audioAnalyzerInstance.play())}
                  className="w-8 h-8 rounded bg-[#00F0FF] hover:bg-[#33f3ff] text-black flex items-center justify-center transition-colors"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => audioAnalyzerInstance.stop()}
                  className="w-7 h-7 rounded bg-[#181818] hover:bg-[#222] text-[#ccc] flex items-center justify-center transition-colors"
                >
                  <Square className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => audioAnalyzerInstance.restart()}
                  className="w-7 h-7 rounded bg-[#181818] hover:bg-[#222] text-[#ccc] flex items-center justify-center transition-colors"
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
                  className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                    audioAnalyzerInstance.getIsLooping() ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40' : 'bg-[#181818] text-[#666]'
                  }`}
                >
                  <Repeat className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 w-28">
                {audioAnalyzerInstance.getVolume() === 0 ? (
                  <VolumeX className="w-3 h-3 text-[#666]" />
                ) : (
                  <Volume2 className="w-3 h-3 text-[#00F0FF]" />
                )}
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  defaultValue={audioAnalyzerInstance.getVolume()}
                  onChange={(e) => audioAnalyzerInstance.setVolume(parseFloat(e.target.value))}
                  className="w-full h-1 bg-[#222] rounded appearance-none cursor-pointer accent-[#00F0FF]"
                />
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* 2. AUDIO ANALYSIS */}
      <Section
        title="Audio Analysis"
        icon={<Zap className="w-3.5 h-3.5" />}
        defaultOpen
        rightSlot={
          <span
            className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase border ${
              analysis.isPlaying ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-[#181818] text-[#666] border-[#333]'
            }`}
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
            ['ENERGY', analysis.overallEnergy, 'from-emerald-500 to-lime-400']
          ] as [string, number, string][]).map(([label, val, grad]) => (
            <div key={label} className="flex items-center justify-between text-[9px]">
              <span className="w-12 text-[#999] font-bold">{label}</span>
              <div className="flex-1 mx-2 h-2 bg-[#151515] rounded-full overflow-hidden border border-[#262626]">
                <div className={`h-full bg-gradient-to-r ${grad}`} style={{ width: `${Math.round(val * 100)}%` }} />
              </div>
              <span className="w-8 text-right text-[#666]">{Math.round(val * 100)}%</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full border border-pink-500 transition-all ${
                analysis.beatDetected ? 'bg-pink-500 shadow-[0_0_10px_#ec4899] scale-125' : 'bg-[#151515]'
              }`}
            />
            <span className={`text-[10px] font-bold uppercase ${analysis.beatDetected ? 'text-pink-400' : 'text-[#666]'}`}>
              {analysis.beatDetected ? 'BEAT!' : 'beat'}
            </span>
          </div>
          <span className="text-[9px] text-[#888]">Pulse {Math.round(analysis.beatPulse * 100)}%</span>
        </div>

        {/* Debug: distinguishes a weak upstream signal (raw vocal-band reading near zero) from a
            valid signal that simply isn't reaching the renderer (Audio Reactivity master OFF). */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1a1a1a] text-[8px] text-[#777]">
          <span>Vocal energy: <span className="text-[#aaa]">{Math.round(analysis.vocalRaw * 100)}%</span></span>
          <span>Full Mix: <span className="text-[#aaa]">{Math.round(analysis.fullMix * 100)}%</span></span>
          <span className={audio.enabled ? 'text-emerald-400' : 'text-rose-400'}>
            {audio.enabled ? '→ Engine: LIVE' : '→ Engine: OFF (enable above)'}
          </span>
        </div>

        {/* Global sensitivity / smoothing + beat detection */}
        <div className="pt-2 border-t border-[#1a1a1a] space-y-2">
          <div>
            <div className="flex justify-between text-[9px] text-[#888] mb-1">
              <span>SENSITIVITY</span>
              <span className="text-[#00F0FF]">{audio.sensitivity.toFixed(2)}x</span>
            </div>
            <input type="range" min={0.1} max={2} step={0.05} value={audio.sensitivity} onChange={(e) => updateAudio({ sensitivity: parseFloat(e.target.value) })} className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]" />
          </div>
          <div>
            <div className="flex justify-between text-[9px] text-[#888] mb-1">
              <span>SMOOTHING</span>
              <span className="text-[#00F0FF]">{audio.smoothing.toFixed(2)}</span>
            </div>
            <input type="range" min={0.1} max={0.95} step={0.05} value={audio.smoothing} onChange={(e) => updateAudio({ smoothing: parseFloat(e.target.value) })} className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([
              ['BASS', 'bassSensitivity'],
              ['MID', 'midSensitivity'],
              ['HIGH', 'highSensitivity']
            ] as [string, keyof AudioConfig][]).map(([label, field]) => (
              <div key={field}>
                <div className="flex justify-between text-[8px] text-[#777] mb-0.5">
                  <span>{label}</span>
                  <span className="text-[#00F0FF]">{(audio[field] as number).toFixed(1)}x</span>
                </div>
                <input
                  type="range" min={0.1} max={2.5} step={0.1}
                  value={audio[field] as number}
                  onChange={(e) => updateAudio({ [field]: parseFloat(e.target.value) } as Partial<AudioConfig>)}
                  className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[9px] text-[#888] uppercase">Beat Detection</span>
            <button
              type="button"
              onClick={() => updateAudio({ beatDetectionEnabled: !audio.beatDetectionEnabled })}
              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                audio.beatDetectionEnabled ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40' : 'bg-[#181818] text-[#666] border-[#333]'
              }`}
            >
              {audio.beatDetectionEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          {audio.beatDetectionEnabled && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between text-[8px] text-[#777] mb-0.5"><span>THRESHOLD</span><span className="text-[#00F0FF]">{audio.beatThreshold.toFixed(2)}</span></div>
                <input type="range" min={0.1} max={1} step={0.05} value={audio.beatThreshold} onChange={(e) => updateAudio({ beatThreshold: parseFloat(e.target.value) })} className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]" />
              </div>
              <div>
                <div className="flex justify-between text-[8px] text-[#777] mb-0.5"><span>DECAY</span><span className="text-[#00F0FF]">{audio.beatDecay.toFixed(2)}</span></div>
                <input type="range" min={0.7} max={0.98} step={0.01} value={audio.beatDecay} onChange={(e) => updateAudio({ beatDecay: parseFloat(e.target.value) })} className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]" />
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* 3. RIPPLE REACTIVITY — Continuous Music Ripple */}
      <Section
        title="Ripple Reactivity"
        icon={<Waves className="w-3.5 h-3.5" />}
        rightSlot={
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); updateAudio({ audioMusicRippleEnabled: !audio.audioMusicRippleEnabled }); }}
            className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase border ${
              audio.audioMusicRippleEnabled ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40' : 'bg-[#181818] text-[#666] border-[#333]'
            }`}
          >
            {audio.audioMusicRippleEnabled ? 'ON' : 'OFF'}
          </button>
        }
      >
        <p className="text-[9px] text-[#777] font-sans leading-relaxed">
          A continuously travelling wavefront sampled from real audio volume history: new audio
          enters at the center and propagates outward through the particle field.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between text-[9px] text-[#888] mb-1"><span>SPEED</span><span className="text-[#00F0FF]">{audio.audioRippleSpeed.toFixed(1)}</span></div>
            <input type="range" min={0.5} max={15} step={0.5} value={audio.audioRippleSpeed} onChange={(e) => updateAudio({ audioRippleSpeed: parseFloat(e.target.value) })} className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]" />
          </div>
          <div>
            <div className="flex justify-between text-[9px] text-[#888] mb-1"><span>STRENGTH</span><span className="text-[#00F0FF]">{audio.audioRippleStrength.toFixed(2)}x</span></div>
            <input type="range" min={0.1} max={3.5} step={0.05} value={audio.audioRippleStrength} onChange={(e) => updateAudio({ audioRippleStrength: parseFloat(e.target.value) })} className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]" />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[9px] text-[#888] mb-1"><span>WAVELENGTH / REACH</span><span className="text-[#00F0FF]">{audio.audioRippleWavelength}px</span></div>
          <input type="range" min={150} max={1500} step={25} value={audio.audioRippleWavelength} onChange={(e) => updateAudio({ audioRippleWavelength: parseFloat(e.target.value) })} className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]" />
        </div>
        <div>
          <label className="block text-[9px] text-[#888] uppercase mb-1">Audio Response Source</label>
          <div className="grid grid-cols-3 gap-1">
            {(['overall', 'bass', 'mid', 'vocal', 'beatPulse', 'fullMix'] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => updateAudio({ audioRippleBand: b })}
                className={`py-1 rounded text-[9px] uppercase font-bold border transition-colors ${
                  (audio.audioRippleBand || 'overall') === b ? 'bg-[#00F0FF]/20 border-[#00F0FF]/50 text-[#00F0FF]' : 'bg-[#121212] border-[#222] text-[#888] hover:text-white'
                }`}
              >
                {b === 'beatPulse' ? 'beat' : b === 'fullMix' ? 'full mix' : b}
              </button>
            ))}
          </div>
          <p className="text-[8px] text-[#666] font-sans mt-1">
            Full Mix combines every band + RMS without needing a bass beat to trigger a response.
          </p>
        </div>
        <div>
          <label className="block text-[9px] text-[#888] uppercase mb-1">Harmonics</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[1, 2, 3].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => updateAudio({ audioRippleHarmonics: h })}
                className={`py-1.5 rounded text-[9px] font-bold border transition-colors ${
                  (audio.audioRippleHarmonics ?? 1) === h ? 'bg-[#00F0FF]/20 border-[#00F0FF]/50 text-[#00F0FF]' : 'bg-[#121212] border-[#222] text-[#888] hover:text-white'
                }`}
              >
                {h}x
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* 4. SECOND WAVE */}
      <Section
        title="Second Wave"
        icon={<Radio className="w-3.5 h-3.5" />}
        rightSlot={
          <span
            className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase border ${
              audio.beatRippleSequenceMode === 'second_wave' ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40' : 'bg-[#181818] text-[#666] border-[#333]'
            }`}
          >
            {audio.beatRippleSequenceMode === 'second_wave' ? 'ACTIVE' : 'OFF'}
          </span>
        }
      >
        <p className="text-[9px] text-[#777] font-sans leading-relaxed">
          Animates the EXISTING rings already in the composition — never spawns new ones. Works with
          any material (Dot, ASCII, Diamond, Custom SVG, Stitch...). Silence lets the motion settle.
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {(
            [
              { id: 'second_wave', label: '2nd Wave', desc: 'Modulates existing rings' },
              { id: 'cascade', label: 'Echo Cascade', desc: 'Concentric rings' },
              { id: 'single', label: 'Single Pulse', desc: 'One ring per beat' },
              { id: 'freq_bands', label: 'Band Split', desc: 'Bass/Mid/High rings' },
              { id: 'alternate', label: 'Alt. Origins', desc: 'Rotates position' }
            ] as { id: RippleSequenceMode; label: string; desc: string }[]
          ).map((m) => {
            const active = audio.beatRippleSequenceMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => updateAudio({ beatRippleSequenceMode: m.id })}
                className={`p-1.5 rounded text-left border transition-colors ${
                  active ? 'bg-[#00F0FF]/15 border-[#00F0FF]/50 text-[#00F0FF]' : 'bg-[#121212] border-[#222] text-[#888] hover:text-white'
                }`}
              >
                <span className="block text-[9px] font-bold uppercase">{m.label}</span>
                <span className="block text-[7.5px] opacity-70">{m.desc}</span>
              </button>
            );
          })}
        </div>

        {audio.beatRippleSequenceMode === 'second_wave' && (
          <div className="space-y-2.5 pt-2 border-t border-[#1a1a1a]">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[9px] text-[#888] mb-1"><span>WAVE SPEED</span><span className="text-[#00F0FF]">{audio.secondWaveSpeed.toFixed(2)}x</span></div>
                <input type="range" min={0} max={3} step={0.05} value={audio.secondWaveSpeed} onChange={(e) => updateAudio({ secondWaveSpeed: parseFloat(e.target.value) })} className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]" />
              </div>
              <div>
                <div className="flex justify-between text-[9px] text-[#888] mb-1"><span>WAVE FREQUENCY</span><span className="text-[#00F0FF]">{audio.secondWaveFrequency.toFixed(2)}</span></div>
                <input type="range" min={0.1} max={4} step={0.05} value={audio.secondWaveFrequency} onChange={(e) => updateAudio({ secondWaveFrequency: parseFloat(e.target.value) })} className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[9px] text-[#888] mb-1"><span>BASE THICKNESS</span><span className="text-[#00F0FF]">{audio.secondWaveBaseThickness.toFixed(2)}x</span></div>
              <input type="range" min={0.2} max={3} step={0.05} value={audio.secondWaveBaseThickness} onChange={(e) => updateAudio({ secondWaveBaseThickness: parseFloat(e.target.value) })} className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[9px] text-[#888] mb-1"><span>THICKNESS INFLUENCE</span><span className="text-[#00F0FF]">{Math.round(audio.secondWaveThicknessInfluence * 100)}%</span></div>
                <input type="range" min={0} max={1} step={0.02} value={audio.secondWaveThicknessInfluence} onChange={(e) => updateAudio({ secondWaveThicknessInfluence: parseFloat(e.target.value) })} className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]" />
              </div>
              <div>
                <div className="flex justify-between text-[9px] text-[#888] mb-1"><span>MOVEMENT STRENGTH</span><span className="text-[#00F0FF]">{Math.round(audio.secondWaveMovementStrength * 100)}%</span></div>
                <input type="range" min={0} max={1} step={0.02} value={audio.secondWaveMovementStrength} onChange={(e) => updateAudio({ secondWaveMovementStrength: parseFloat(e.target.value) })} className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[9px] text-[#888] mb-1"><span>BEAT SENSITIVITY</span><span className="text-[#00F0FF]">{audio.secondWaveBeatSensitivity.toFixed(2)}x</span></div>
              <input type="range" min={0.1} max={2.5} step={0.05} value={audio.secondWaveBeatSensitivity} onChange={(e) => updateAudio({ secondWaveBeatSensitivity: parseFloat(e.target.value) })} className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]" />
            </div>
          </div>
        )}
      </Section>

      {/* 4B. VOCAL REACTIVITY */}
      <Section
        title="Vocal Reactivity"
        icon={<Mic className="w-3.5 h-3.5" />}
        accent="#f59e0b"
        rightSlot={
          <span
            className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase border ${
              audio.vocalReactivity.mode === 'off'
                ? 'bg-[#181818] text-[#666] border-[#333]'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            {audio.vocalReactivity.mode === 'off' ? 'OFF' : audio.vocalReactivity.mode === 'auto_detect' ? 'AUTO' : 'ISOLATED'}
          </span>
        }
      >
        <p className="text-[9px] text-[#777] font-sans leading-relaxed">
          Reacts to singing/speech, not just drums and bass. Detection is SEPARATE from energy: a
          multi-feature heuristic (harmonicity + syllabic-rate ~2-6Hz modulation + vocal-formant
          concentration) must confirm vocal presence before Auto Detect drives the ripple — plain
          mid-frequency energy alone is never treated as proof of singing.
        </p>
        <p className="text-[8px] text-amber-300/80 font-sans leading-relaxed bg-amber-500/5 border border-amber-500/20 rounded px-2 py-1.5">
          Detection method: DSP heuristic — NOT a trained ML singing-voice classifier, and no
          pretrained model is bundled in this build. Meaningfully more reliable than raw mid-band
          energy, but can still misfire on unusual instrumental timbres — watch the debug readout.
        </p>

        <div>
          <label className="block text-[9px] text-[#888] uppercase mb-1">Vocal Mode</label>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: 'off', label: 'Off', desc: 'No vocal-driven reactivity' },
                { id: 'auto_detect', label: 'Auto Detect', desc: 'Heuristic classifier gates the ripple' },
                { id: 'isolated', label: 'Isolated', desc: 'Separated vocal stem (unavailable in this build)' }
              ] as { id: 'off' | 'auto_detect' | 'isolated'; label: string; desc: string }[]
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => updateAudio({ vocalReactivity: { ...audio.vocalReactivity, mode: m.id } })}
                title={m.desc}
                className={`p-1.5 rounded border text-center transition-colors ${
                  audio.vocalReactivity.mode === m.id
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                    : 'bg-[#121212] border-[#222] text-[#888] hover:text-white'
                }`}
              >
                <span className="block text-[9px] font-bold uppercase">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {audio.vocalReactivity.mode === 'isolated' && (
          <div className="text-[9px] text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded px-2 py-1.5 font-sans leading-relaxed">
            Isolated vocal stem: <b>UNAVAILABLE</b>. Source separation (splitting vocal/instrumental
            stems) is not implemented in this build — it needs a large local ML model that couldn't
            be reliably bundled/verified here. This mode intentionally produces zero ripple
            influence rather than silently substituting the unreliable full-mix band reading and
            labeling it "isolated."
          </div>
        )}

        {audio.vocalReactivity.mode !== 'off' && (
          <div className="space-y-2.5 pt-1 border-t border-[#1a1a1a]">
            {/* Debug — distinguishes DETECTED presence from the ENERGY driving the ripple */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[8px] bg-[#0d0d12] border border-[#222] rounded p-2">
              <span className="text-[#888]">Vocal Confidence</span>
              <span className="text-amber-400 text-right">{Math.round(analysis.vocalConfidence * 100)}%</span>
              <span className="text-[#888]">Detection Threshold (on/off)</span>
              <span className="text-amber-400 text-right">
                {Math.round(audio.vocalReactivity.confidenceThresholdOn * 100)}% / {Math.round(audio.vocalReactivity.confidenceThresholdOff * 100)}%
              </span>
              <span className="text-[#888]">Vocal Detected</span>
              <span className={`text-right font-bold ${analysis.vocalDetected ? 'text-emerald-400' : 'text-[#666]'}`}>
                {analysis.vocalDetected ? 'YES' : 'NO'}
              </span>
              <span className="text-[#888]">Vocal Energy</span>
              <span className="text-amber-400 text-right">{Math.round(analysis.vocalRaw * 100)}%</span>
              <span className="text-[#888]">Final Ripple Influence</span>
              <span className="text-emerald-400 text-right">{Math.round(analysis.vocalRippleInfluence * 100)}%</span>
            </div>

            <div>
              <div className="flex justify-between text-[9px] text-[#888] mb-1"><span>SENSITIVITY</span><span className="text-amber-400">{audio.vocalReactivity.sensitivity.toFixed(2)}x</span></div>
              <input type="range" min={0.1} max={3} step={0.05} value={audio.vocalReactivity.sensitivity} onChange={(e) => updateAudio({ vocalReactivity: { ...audio.vocalReactivity, sensitivity: parseFloat(e.target.value) } })} className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-amber-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[9px] text-[#888] mb-1"><span>FREQ LOW</span><span className="text-amber-400">{Math.round(audio.vocalReactivity.freqLow)}Hz</span></div>
                <input type="range" min={50} max={800} step={10} value={audio.vocalReactivity.freqLow} onChange={(e) => updateAudio({ vocalReactivity: { ...audio.vocalReactivity, freqLow: Math.min(parseFloat(e.target.value), audio.vocalReactivity.freqHigh - 50) } })} className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-amber-500" />
              </div>
              <div>
                <div className="flex justify-between text-[9px] text-[#888] mb-1"><span>FREQ HIGH</span><span className="text-amber-400">{Math.round(audio.vocalReactivity.freqHigh)}Hz</span></div>
                <input type="range" min={1000} max={8000} step={50} value={audio.vocalReactivity.freqHigh} onChange={(e) => updateAudio({ vocalReactivity: { ...audio.vocalReactivity, freqHigh: Math.max(parseFloat(e.target.value), audio.vocalReactivity.freqLow + 50) } })} className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-amber-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[9px] text-[#888] mb-1"><span>ATTACK</span><span className="text-amber-400">{audio.vocalReactivity.attack.toFixed(2)}</span></div>
                <input type="range" min={0} max={1} step={0.02} value={audio.vocalReactivity.attack} onChange={(e) => updateAudio({ vocalReactivity: { ...audio.vocalReactivity, attack: parseFloat(e.target.value) } })} className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-amber-500" />
              </div>
              <div>
                <div className="flex justify-between text-[9px] text-[#888] mb-1"><span>RELEASE</span><span className="text-amber-400">{audio.vocalReactivity.release.toFixed(2)}</span></div>
                <input type="range" min={0} max={1} step={0.02} value={audio.vocalReactivity.release} onChange={(e) => updateAudio({ vocalReactivity: { ...audio.vocalReactivity, release: parseFloat(e.target.value) } })} className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-amber-500" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[9px] text-[#888] mb-1"><span>INFLUENCE ON RIPPLE</span><span className="text-amber-400">{Math.round(audio.vocalReactivity.influence * 100)}%</span></div>
              <input type="range" min={0} max={1} step={0.02} value={audio.vocalReactivity.influence} onChange={(e) => updateAudio({ vocalReactivity: { ...audio.vocalReactivity, influence: parseFloat(e.target.value) } })} className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-amber-500" />
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#1a1a1a]">
              <div>
                <span className="block text-[9px] text-[#888] uppercase">Adaptive Normalization</span>
                <span className="text-[8px] text-[#666]">Auto-tracks noise floor + peak so quiet vocals still register</span>
              </div>
              <button
                type="button"
                onClick={() => updateAudio({ vocalReactivity: { ...audio.vocalReactivity, adaptiveNormalization: !audio.vocalReactivity.adaptiveNormalization } })}
                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border shrink-0 ml-2 ${
                  audio.vocalReactivity.adaptiveNormalization ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-[#181818] text-[#666] border-[#333]'
                }`}
              >
                {audio.vocalReactivity.adaptiveNormalization ? 'ON' : 'OFF'}
              </button>
            </div>

            {audio.vocalReactivity.mode === 'auto_detect' && (
              <div className="space-y-2.5 pt-2 border-t border-[#1a1a1a]">
                <span className="block text-[9px] text-[#888] uppercase">
                  Vocal Detection (hysteresis — prevents rapid on/off toggling)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[9px] text-[#888] mb-1"><span>THRESHOLD ON</span><span className="text-amber-400">{Math.round(audio.vocalReactivity.confidenceThresholdOn * 100)}%</span></div>
                    <input
                      type="range" min={0.1} max={0.95} step={0.02}
                      value={audio.vocalReactivity.confidenceThresholdOn}
                      onChange={(e) => {
                        const on = parseFloat(e.target.value);
                        updateAudio({ vocalReactivity: { ...audio.vocalReactivity, confidenceThresholdOn: on, confidenceThresholdOff: Math.min(audio.vocalReactivity.confidenceThresholdOff, on - 0.03) } });
                      }}
                      className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[9px] text-[#888] mb-1"><span>THRESHOLD OFF</span><span className="text-amber-400">{Math.round(audio.vocalReactivity.confidenceThresholdOff * 100)}%</span></div>
                    <input
                      type="range" min={0.02} max={0.9} step={0.02}
                      value={audio.vocalReactivity.confidenceThresholdOff}
                      onChange={(e) => {
                        const off = parseFloat(e.target.value);
                        updateAudio({ vocalReactivity: { ...audio.vocalReactivity, confidenceThresholdOff: Math.min(off, audio.vocalReactivity.confidenceThresholdOn - 0.03) } });
                      }}
                      className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[9px] text-[#888] mb-1"><span>MIN VOCAL DURATION</span><span className="text-amber-400">{audio.vocalReactivity.minVocalDuration.toFixed(2)}s</span></div>
                    <input type="range" min={0} max={0.6} step={0.02} value={audio.vocalReactivity.minVocalDuration} onChange={(e) => updateAudio({ vocalReactivity: { ...audio.vocalReactivity, minVocalDuration: parseFloat(e.target.value) } })} className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-amber-500" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[9px] text-[#888] mb-1"><span>DETECTION SMOOTHING</span><span className="text-amber-400">{audio.vocalReactivity.detectionSmoothing.toFixed(2)}</span></div>
                    <input type="range" min={0.05} max={0.9} step={0.02} value={audio.vocalReactivity.detectionSmoothing} onChange={(e) => updateAudio({ vocalReactivity: { ...audio.vocalReactivity, detectionSmoothing: parseFloat(e.target.value) } })} className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-amber-500" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* 5. PARAMETER MAPPING */}
      <Section title="Parameter Mapping" icon={<GitBranch className="w-3.5 h-3.5" />}>
        <p className="text-[9px] text-[#777] font-sans leading-relaxed">
          Route any audio band to any wave/particle parameter with an independent influence amount.
          Multiple mappings run simultaneously; manual base values are never overwritten, only modulated.
        </p>
        <div className="space-y-2">
          {audio.mappings.map((m, idx) => (
            <div key={idx} className="bg-[#0d0d12] border border-[#222] rounded p-2 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <select
                  value={m.source}
                  onChange={(e) => updateMapping(idx, { source: e.target.value as AudioMappingConfig['source'] })}
                  className="flex-1 bg-[#0A0A0A] border border-[#262626] text-[#00F0FF] rounded px-1.5 py-1 text-[9px]"
                >
                  <option value="bass">Bass</option>
                  <option value="mid">Mid</option>
                  <option value="high">High</option>
                  <option value="vocal">Vocal Range</option>
                  <option value="overallEnergy">Overall Energy</option>
                  <option value="beatPulse">Beat Pulse</option>
                  <option value="fullMix">Full Mix</option>
                </select>
                <span className="text-[#555]">→</span>
                <select
                  value={m.target}
                  onChange={(e) => updateMapping(idx, { target: e.target.value as AudioMappingConfig['target'] })}
                  className="flex-1 bg-[#0A0A0A] border border-[#262626] text-[#00F0FF] rounded px-1.5 py-1 text-[9px]"
                >
                  <option value="waveAmplitude">Wave Amplitude</option>
                  <option value="waveSpeed">Wave Speed</option>
                  <option value="waveFrequency">Wave Frequency</option>
                  <option value="waveThickness">Wave Thickness</option>
                  <option value="particleSize">Particle Size</option>
                  <option value="particleOpacity">Particle Opacity</option>
                </select>
                <button type="button" onClick={() => removeMapping(idx)} className="text-[#555] hover:text-rose-400 p-1">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-[#777] w-12">AMOUNT</span>
                <input type="range" min={0} max={1} step={0.05} value={m.amount} onChange={(e) => updateMapping(idx, { amount: parseFloat(e.target.value) })} className="flex-1 h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]" />
                <span className="text-[8px] text-[#00F0FF] w-8 text-right">{Math.round(m.amount * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addMapping}
          className="w-full flex items-center justify-center gap-1.5 text-[9px] font-bold text-[#00F0FF] bg-[#00F0FF]/10 hover:bg-[#00F0FF]/15 px-2 py-1.5 rounded border border-[#00F0FF]/30 transition-colors"
        >
          <Plus className="w-3 h-3" /> ADD MAPPING
        </button>
      </Section>

      {/* 6. AUDIO COLOR */}
      <Section
        title="Audio Color"
        icon={<Palette className="w-3.5 h-3.5" />}
        rightSlot={
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); updateAudio({ audioColorShift: !audio.audioColorShift }); }}
            className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase border ${
              audio.audioColorShift ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-[#181818] text-[#666] border-[#333]'
            }`}
          >
            {audio.audioColorShift ? 'ON' : 'OFF'}
          </button>
        }
      >
        <p className="text-[9px] text-[#777] font-sans leading-relaxed">
          Optional — your chosen palette is never forcibly replaced unless enabled here.
        </p>
        {audio.audioColorShift && (
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: 'accent_glow', label: 'Accent Glow' },
                { id: 'p5_inverted', label: 'Inverted' },
                { id: 'spectrum_shift', label: 'Spectrum' }
              ] as { id: AudioColorShiftMode; label: string }[]
            ).map((cm) => (
              <button
                key={cm.id}
                type="button"
                onClick={() => updateAudio({ audioColorShiftMode: cm.id })}
                className={`p-1.5 rounded text-[9px] font-bold uppercase border transition-colors ${
                  (audio.audioColorShiftMode || 'accent_glow') === cm.id
                    ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300'
                    : 'bg-[#121212] border-[#222] text-[#888] hover:text-white'
                }`}
              >
                {cm.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[9px] text-[#888] uppercase">Beat Kick Glow</span>
          <button
            type="button"
            onClick={() => updateAudio({ audioBeatGlow: !audio.audioBeatGlow })}
            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
              audio.audioBeatGlow ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40' : 'bg-[#181818] text-[#666] border-[#333]'
            }`}
          >
            {audio.audioBeatGlow ? 'ON' : 'OFF'}
          </button>
        </div>
      </Section>
    </div>
  );
};
