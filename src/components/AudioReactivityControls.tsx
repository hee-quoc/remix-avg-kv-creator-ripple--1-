import React, { useState, useEffect } from 'react';
import { RenderState } from '../types';
import { PRESETS } from '../data/presets';
import { audioAnalyzerInstance, AudioAnalysisResult } from '../utils/audioAnalyzer';
import { Mic, MicOff, Activity, Play, Square, AlertTriangle } from 'lucide-react';

interface AudioReactivityControlsProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
}

const IDLE_LEVELS: AudioAnalysisResult = {
  rmsVolume: 0,
  bass: 0,
  mid: 0,
  treble: 0,
  peak: 0,
  isActive: false,
  sourceType: 'none'
};

export const AudioReactivityControls: React.FC<AudioReactivityControlsProps> = ({
  state,
  onUpdateState
}) => {
  const [isMicRunning, setIsMicRunning] = useState(false);
  const [isToneRunning, setIsToneRunning] = useState(false);
  const [levels, setLevels] = useState<AudioAnalysisResult>(IDLE_LEVELS);

  // Item 9 — Sports: audio-reactive behavior is temporarily disabled for this category only.
  // Shared audio functionality (mic/synth engine, other presets) is left fully intact.
  const activePreset = PRESETS.find((p) => p.id === state.activePresetId);
  const isAudioLockedForPreset = activePreset?.category === 'Sports';

  // Update levels while audio is active
  useEffect(() => {
    let animId: number;
    const updateMeter = () => {
      if (state.audioActive) {
        setLevels(audioAnalyzerInstance.getAnalysis());
      }
      animId = requestAnimationFrame(updateMeter);
    };

    animId = requestAnimationFrame(updateMeter);
    return () => cancelAnimationFrame(animId);
  }, [state.audioActive]);

  // Force-disable audio reactivity whenever a Sports preset becomes active, without touching
  // audio engine state for any other preset.
  useEffect(() => {
    if (isAudioLockedForPreset) {
      if (isMicRunning || isToneRunning) {
        audioAnalyzerInstance.stop();
        setIsMicRunning(false);
        setIsToneRunning(false);
      }
      if (state.audioActive || (state.wave.soundReactivity || 0) > 0) {
        onUpdateState((prev) => ({
          ...prev,
          audioActive: false,
          wave: { ...prev.wave, soundReactivity: 0 }
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAudioLockedForPreset]);

  const toggleMic = async () => {
    if (isAudioLockedForPreset) return;
    if (isMicRunning) {
      audioAnalyzerInstance.stop();
      setIsMicRunning(false);
      onUpdateState((prev) => ({ ...prev, audioActive: false }));
    } else {
      try {
        if (isToneRunning) {
          audioAnalyzerInstance.stop();
          setIsToneRunning(false);
        }
        await audioAnalyzerInstance.startMicrophone();
        setIsMicRunning(true);
        onUpdateState((prev) => ({ ...prev, audioActive: true }));
      } catch (err) {
        console.error('Mic error:', err);
        alert('Could not start microphone: ' + (err as Error).message);
      }
    }
  };

  const toggleTone = () => {
    if (isAudioLockedForPreset) return;
    if (isToneRunning) {
      audioAnalyzerInstance.stop();
      setIsToneRunning(false);
      onUpdateState((prev) => ({ ...prev, audioActive: false }));
    } else {
      if (isMicRunning) {
        audioAnalyzerInstance.stop();
        setIsMicRunning(false);
      }
      audioAnalyzerInstance.startTestOscillator(130);
      setIsToneRunning(true);
      onUpdateState((prev) => ({ ...prev, audioActive: true }));
    }
  };

  if (isAudioLockedForPreset) {
    return (
      <div className="space-y-2 p-3 bg-[#0a0a0d] border border-[#222] rounded-lg font-mono">
        <div className="flex items-center space-x-2 text-[#888]">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#aaa]">
            AUDIO REACTIVITY ENGINE
          </span>
        </div>
        <p className="text-[9px] text-[#777] font-sans leading-relaxed">
          Audio reactivity is temporarily disabled for Sports presets while a playback issue is
          investigated. It remains fully available on every other preset.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#222]">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-[#00F0FF]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">
            AUDIO REACTIVITY ENGINE
          </span>
        </div>
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${state.audioActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-[#222] text-[#777]'}`}>
          {state.audioActive ? 'LIVE ACTIVE' : 'INACTIVE'}
        </span>
      </div>

      <p className="text-[10px] text-[#888] font-sans leading-relaxed">
        Drive ripple wave vectors, frequency, and amplitudes dynamically via live Web Audio analysis (microphone or built-in test synthesizer).
      </p>

      {/* Input Source Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={toggleMic}
          className={`p-2.5 rounded border flex items-center justify-center space-x-2 text-xs font-bold uppercase transition-all ${
            isMicRunning
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
              : 'bg-[#121212] border-[#262626] text-[#ccc] hover:border-[#444]'
          }`}
        >
          {isMicRunning ? <MicOff className="w-3.5 h-3.5 text-emerald-400" /> : <Mic className="w-3.5 h-3.5 text-[#00F0FF]" />}
          <span>{isMicRunning ? 'STOP MIC' : 'ENABLE MIC'}</span>
        </button>

        <button
          onClick={toggleTone}
          className={`p-2.5 rounded border flex items-center justify-center space-x-2 text-xs font-bold uppercase transition-all ${
            isToneRunning
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
              : 'bg-[#121212] border-[#262626] text-[#ccc] hover:border-[#444]'
          }`}
        >
          {isToneRunning ? <Square className="w-3.5 h-3.5 text-cyan-400" /> : <Play className="w-3.5 h-3.5 text-amber-400" />}
          <span>{isToneRunning ? 'STOP SYNTH' : 'TEST SYNTH'}</span>
        </button>
      </div>

      {/* Real-time Spectrum Meters */}
      <div className="p-3 bg-[#0a0a0d] border border-[#222] rounded-lg space-y-2">
        <span className="text-[10px] text-[#888] uppercase block tracking-wider font-bold">
          LIVE AUDIO SPECTRUM ANALYZER
        </span>

        <div className="space-y-1.5 text-[9px]">
          <div className="flex items-center justify-between">
            <span className="text-[#aaa] w-14">BASS (LOW)</span>
            <div className="flex-1 mx-2 h-2 bg-[#18181f] rounded overflow-hidden border border-[#2a2a35]">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-75"
                style={{ width: `${Math.min(100, levels.bass * 100)}%` }}
              />
            </div>
            <span className="text-[#666] w-8 text-right font-mono">
              {(levels.bass * 100).toFixed(0)}%
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#aaa] w-14">MID (VOICE)</span>
            <div className="flex-1 mx-2 h-2 bg-[#18181f] rounded overflow-hidden border border-[#2a2a35]">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 transition-all duration-75"
                style={{ width: `${Math.min(100, levels.mid * 100)}%` }}
              />
            </div>
            <span className="text-[#666] w-8 text-right font-mono">
              {(levels.mid * 100).toFixed(0)}%
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#aaa] w-14">TREBLE (HI)</span>
            <div className="flex-1 mx-2 h-2 bg-[#18181f] rounded overflow-hidden border border-[#2a2a35]">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-rose-400 transition-all duration-75"
                style={{ width: `${Math.min(100, levels.treble * 100)}%` }}
              />
            </div>
            <span className="text-[#666] w-8 text-right font-mono">
              {(levels.treble * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Reactive Configuration Sliders — bound to the real WaveConfig fields the engine reads */}
      <div className="space-y-3 pt-2 border-t border-[#222]">
        {/* Master Reactivity Strength (this is the field that actually gates the effect in wave.ts) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[#888] text-[11px] uppercase">REACTIVITY STRENGTH</label>
            <span className="text-[#00F0FF] text-[11px]">
              {Math.round((state.wave.soundReactivity || 0) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={state.wave.soundReactivity || 0}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdateState((prev) => ({
                ...prev,
                wave: { ...prev.wave, soundReactivity: val }
              }));
            }}
            className="w-full accent-[#00F0FF] bg-[#1a1a1a] h-1 rounded appearance-none cursor-pointer"
          />
        </div>

        {/* Sensitivity */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[#888] text-[11px] uppercase">AUDIO SENSITIVITY</label>
            <span className="text-[#00F0FF] text-[11px]">
              {(state.wave.soundSensitivity ?? 1.2).toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="4.0"
            step="0.1"
            value={state.wave.soundSensitivity ?? 1.2}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdateState((prev) => ({
                ...prev,
                wave: { ...prev.wave, soundSensitivity: val }
              }));
            }}
            className="w-full accent-[#00F0FF] bg-[#1a1a1a] h-1 rounded appearance-none cursor-pointer"
          />
        </div>

        {/* Frequency Band Selector */}
        <div>
          <label className="block text-[#888] text-[11px] uppercase mb-1">
            TARGET FREQUENCY BAND
          </label>
          <div className="grid grid-cols-4 gap-1">
            {(['bass', 'mid', 'treble', 'all'] as const).map((band) => (
              <button
                key={band}
                onClick={() =>
                  onUpdateState((prev) => ({
                    ...prev,
                    wave: { ...prev.wave, soundReactionBand: band }
                  }))
                }
                className={`py-1.5 rounded text-[10px] uppercase font-bold border transition-all ${
                  (state.wave.soundReactionBand || 'all') === band
                    ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/60'
                    : 'bg-[#121212] text-[#777] border-[#222] hover:text-[#ccc]'
                }`}
              >
                {band}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
