// Parses an uploaded SVG into the same "unit-circle" perimeter point format the built-in circle /
// square / clover tile shapes already use (see makePerimeter in flipDiscGL.ts), so an uploaded shape
// slots straight into the EXISTING mesh builder — every disc in the field becomes that outline, still
// flipping/lighting/shading through the same WebGL pipeline. No second render path.

const SAMPLE_SEGMENTS = 48; // matches the built-in clover's resolution — smooth without being heavy

/**
 * Extracts the first closed vector shape from an uploaded SVG (path, circle, ellipse, rect, polygon,
 * or polyline — anything implementing SVGGeometryElement) and samples it into `segments` evenly-
 * spaced perimeter points, centered on its own bounding box and scaled so its farthest point sits at
 * radius 1. Returns null if the SVG has no usable closed shape.
 */
export function parseCustomShapeSvg(svgXml: string, segments = SAMPLE_SEGMENTS): [number, number][] | null {
  let hostSvg: SVGSVGElement | null = null;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgXml, 'image/svg+xml');
    if (doc.getElementsByTagName('parsererror').length > 0) return null;

    const svgEl = doc.querySelector('svg');
    if (!svgEl) return null;

    const geomEl = svgEl.querySelector('path, circle, ellipse, rect, polygon, polyline');
    if (!geomEl) return null;

    // getTotalLength()/getPointAtLength() need the element laid out in a real document — attach a
    // hidden, zero-impact host <svg> to sample from, then remove it immediately.
    hostSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
    hostSvg.style.position = 'fixed';
    hostSvg.style.left = '-99999px';
    hostSvg.style.top = '-99999px';
    hostSvg.style.width = '10px';
    hostSvg.style.height = '10px';
    hostSvg.setAttribute('aria-hidden', 'true');
    const viewBox = svgEl.getAttribute('viewBox');
    if (viewBox) hostSvg.setAttribute('viewBox', viewBox);

    const imported = document.importNode(geomEl, true) as SVGGeometryElement;
    hostSvg.appendChild(imported);
    document.body.appendChild(hostSvg);

    const total = imported.getTotalLength();
    if (!total || !isFinite(total) || total <= 0) return null;

    const raw: [number, number][] = [];
    for (let i = 0; i < segments; i++) {
      const pt = imported.getPointAtLength((i / segments) * total);
      raw.push([pt.x, pt.y]);
    }
    if (raw.length < 3) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [x, y] of raw) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    let maxR = 0;
    for (const [x, y] of raw) {
      const r = Math.hypot(x - cx, y - cy);
      if (r > maxR) maxR = r;
    }
    if (maxR <= 0) return null;

    // Flip Y: SVG's axis points down, the flip-disc mesh's local space points up (standard WebGL clip
    // space) — without this the uploaded shape would render upside-down relative to how it looks in
    // an SVG editor.
    return raw.map(([x, y]) => [(x - cx) / maxR, -(y - cy) / maxR]);
  } catch (e) {
    console.warn('Failed to parse custom Flip Disc shape SVG:', e);
    return null;
  } finally {
    if (hostSvg && hostSvg.parentNode) hostSvg.parentNode.removeChild(hostSvg);
  }
}
