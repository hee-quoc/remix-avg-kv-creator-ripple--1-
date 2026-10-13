import React, { useEffect, useState } from 'react';
import { Slider, RangeSlider, Segmented, Toggle, Chip, PillButton, Accordion } from '../components/ui';

/**
 * Temporary demo screen for the redesign V1-B shared UI primitives (Phase P2) — not part of the real
 * app flow, reachable only via the #ui-demo hash so it can never appear for a normal user. Delete
 * once P3+ wire these components into the real inspector and this is no longer needed for visual
 * sign-off.
 */
export default function ComponentDemo() {
  const [speed, setSpeed] = useState(0.8);
  const [radius, setRadius] = useState<[number, number]>([1, 5.5]);
  const [engine, setEngine] = useState('stable');
  const [aspect, setAspect] = useState('16:9');
  const [audioOn, setAudioOn] = useState(false);
  const [masked, setMasked] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Design tokens are defined on :root[data-theme], which only matches the document's actual root
  // element (<html>) — setting data-theme on an inner wrapper div silently matches nothing.
  useEffect(() => {
    const prev = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', theme);
    return () => {
      if (prev === null) document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', prev);
    };
  }, [theme]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-ui)',
        padding: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 28
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>Redesign V1-B — Component demo (P2)</h1>
        <PillButton onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}>
          {theme === 'light' ? 'Chuyển Tối' : 'Chuyển Sáng'}
        </PillButton>
      </div>

      <section
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          maxWidth: 420
        }}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Chip active>Bộ pitch</Chip>
          <Chip>News</Chip>
          <Chip>Tech</Chip>
          <Chip tone="modified">● Đã chỉnh 2</Chip>
          <Chip tone="warn">2 trường bị bỏ qua</Chip>
          <Chip tone="ok">✓ Hợp lệ · schema v2</Chip>
        </div>

        <Segmented
          value={engine}
          onChange={setEngine}
          options={[
            { value: 'stable', label: 'Stable' },
            { value: 'flow', label: 'Flow' }
          ]}
        />
        <Segmented
          value={aspect}
          onChange={setAspect}
          options={[
            { value: '16:9', label: '16:9' },
            { value: '1:1', label: '1:1' },
            { value: '4:5', label: '4:5' },
            { value: '9:16', label: '9:16' }
          ]}
        />

        <Slider
          label="Tốc độ sóng"
          value={speed}
          onChange={setSpeed}
          min={0.1}
          max={3}
          step={0.05}
          unit="x"
          decimals={2}
          defaultValue={0.8}
          modified={speed !== 0.8}
        />

        <RangeSlider
          label="Kích thước chấm"
          valueMin={radius[0]}
          valueMax={radius[1]}
          onChange={(min, max) => setRadius([min, max])}
          min={0.5}
          max={10}
          step={0.1}
          decimals={1}
        />

        <Toggle checked={audioOn} onChange={setAudioOn} label="Bật phản ứng âm thanh" />
        <Toggle checked={masked} onChange={setMasked} label="Masked" />

        <Accordion title="Nâng cao" storageKey="kv.demo.advanced" badge={<Chip tone="modified">1</Chip>}>
          <Slider label="Độ dày tần số" value={1.2} onChange={() => {}} min={0.2} max={3} step={0.05} decimals={2} />
          <Toggle checked={false} onChange={() => {}} label="Dynamic visual thickness" />
        </Accordion>

        <div style={{ display: 'flex', gap: 8 }}>
          <PillButton>Huỷ</PillButton>
          <PillButton variant="primary">Áp dụng</PillButton>
          <PillButton variant="active">Đang bật</PillButton>
        </div>
      </section>
    </div>
  );
}
