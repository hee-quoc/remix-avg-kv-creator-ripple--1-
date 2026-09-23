import { RenderState } from '../types';
import {
  Particle,
  renderParticleToSVG,
  renderConstellationLinesToSVG,
  renderOriginalTypographyToSVG,
  DESIGN_WIDTH,
  DESIGN_HEIGHT
} from './particleRenderer';
import { renderKVLayoutToSVG } from './kvLayoutTemplates';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Generates an SVG string representation of the current halftone kinetic typography frame
 * directly from the pre-computed Particle[] snapshot in memory.
 */
export function generateSVGFromParticles(
  particles: Particle[],
  state: RenderState,
  width: number = DESIGN_WIDTH,
  height: number = DESIGN_HEIGHT
): string {
  const { style, font, compositionMode } = state;

  // Create root SVG document element
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('width', width.toString());
  svg.setAttribute('height', height.toString());
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  // Root Defs element for shared filters, gradients, clipPaths
  const defs = document.createElementNS(SVG_NS, 'defs');

  // Background rect if non-transparent
  if (!state.transparentBg) {
    const bgRect = document.createElementNS(SVG_NS, 'rect');
    bgRect.setAttribute('width', '100%');
    bgRect.setAttribute('height', '100%');
    bgRect.setAttribute('fill', style.bgColor);
    svg.appendChild(bgRect);
  }

  // Feature A: In Molecule Wave Only or Editorial Collage mode, render clean original text layer
  if (compositionMode === 'molecule_wave_only' || compositionMode === 'editorial_collage') {
    const textGroup = document.createElementNS(SVG_NS, 'g');
    textGroup.setAttribute('id', 'original-typography-layer');
    renderOriginalTypographyToSVG(textGroup, font, style, width, height, svg.ownerDocument);
    svg.appendChild(textGroup);
  }

  // Modular Signal Field (Breaking Signal redesign): KV Layout text sits UNDERNEATH the moving strip
  // blocks so they visually interrupt/mask it — opposite of the normal Text Layer B stacking order.
  const isModularSignalField = compositionMode === 'modular_signal_field';
  if (isModularSignalField && state.kvLayout?.enabled) {
    const kvGroupUnder = document.createElementNS(SVG_NS, 'g');
    kvGroupUnder.setAttribute('id', 'kv-layout-layer');
    renderKVLayoutToSVG(kvGroupUnder, state.kvLayout, width, height, svg.ownerDocument);
    svg.appendChild(kvGroupUnder);
  }

  // Optional Data Constellation connecting lines — see the matching gate in KineticCanvas.tsx.
  if (style.visualStyle === 'data_constellation' && style.showConnections) {
    const linesGroup = document.createElementNS(SVG_NS, 'g');
    linesGroup.setAttribute('id', 'constellation-connections');
    renderConstellationLinesToSVG(
      linesGroup,
      particles,
      style.constellationMaxDistance || 55,
      style.constellationLineColor || '#00f0ff',
      svg.ownerDocument
    );
    svg.appendChild(linesGroup);
  }

  // Container group for halftone elements
  const gridGroup = document.createElementNS(SVG_NS, 'g');
  gridGroup.setAttribute('id', 'halftone-kinetic-grid');

  // Render each particle in the snapshot to SVG group using shared renderParticleToSVG
  for (const particle of particles) {
    renderParticleToSVG(gridGroup, particle, defs, svg.ownerDocument);
  }

  if (defs.hasChildNodes()) {
    svg.appendChild(defs);
  }
  svg.appendChild(gridGroup);

  // Text Layer B — independent Original Text / KV Layout (Items 4B & 6). Fully decoupled from the
  // particle snapshot above; drawn from state.kvLayout only. (Modular Signal Field already drew this
  // layer above, underneath the strips, so it's skipped here to avoid duplicating it on top.)
  if (!isModularSignalField && state.kvLayout?.enabled) {
    const kvGroup = document.createElementNS(SVG_NS, 'g');
    kvGroup.setAttribute('id', 'kv-layout-layer');
    renderKVLayoutToSVG(kvGroup, state.kvLayout, width, height, svg.ownerDocument);
    svg.appendChild(kvGroup);
  }

  // Serialize root SVG using XMLSerializer
  const serializer = new XMLSerializer();
  let rawSvgString = serializer.serializeToString(svg).trim();

  // Strip any accidental leading XML processing instructions produced by browser XMLSerializer
  if (rawSvgString.startsWith('<?xml')) {
    const endDeclIndex = rawSvgString.indexOf('?>');
    if (endDeclIndex !== -1) {
      rawSvgString = rawSvgString.substring(endDeclIndex + 2).trim();
    }
  }

  // Prepend single, canonical XML declaration without leading whitespace
  const fullSvgString = `<?xml version="1.0" encoding="UTF-8"?>\n${rawSvgString}`;

  // Validate output with DOMParser
  const validator = new DOMParser();
  const checkDoc = validator.parseFromString(fullSvgString, 'image/svg+xml');
  const parserErrors = checkDoc.getElementsByTagName('parsererror');
  if (parserErrors.length > 0) {
    const errText = parserErrors[0].textContent || 'SVG document is not well-formed';
    console.error('SVG Validation Error:', errText);
    throw new Error(`SVG Export Error: ${errText}`);
  }

  return fullSvgString;
}

/**
 * Triggers SVG download in browser after validating SVG integrity.
 */
export function downloadSVG(svgString: string, filename = 'halftone-kinetic-typography.svg') {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const parserErrors = doc.getElementsByTagName('parsererror');
    if (parserErrors.length > 0) {
      const msg = parserErrors[0].textContent || 'Generated SVG contains syntax errors.';
      alert(`Export Failed: ${msg}`);
      return;
    }

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to download SVG:', err);
    alert(`Export Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}


