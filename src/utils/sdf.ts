import { FontConfig } from '../types';

export interface SDFData {
  width: number;
  height: number;
  // Signed distance array where > 0 is inside text, < 0 is outside text
  // Values are in pixels or normalized distance
  distanceMap: Float32Array;
  // Raw canvas image data for direct fallback / debugging
  imageData: ImageData;
}

/**
 * 2D Euclidean Distance Transform (EDT) based on Felzenszwalb & Huttenlocher (2012)
 * Runs in O(width * height) linear time.
 */
function edt1d(f: Float32Array, d: Float32Array, v: Int32Array, z: Float32Array, n: number) {
  let k = 0;
  v[0] = 0;
  z[0] = -Infinity;
  z[1] = +Infinity;

  for (let q = 1; q < n; q++) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = +Infinity;
  }

  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) {
      k++;
    }
    const dx = q - v[k];
    d[q] = dx * dx + f[v[k]];
  }
}

function edt2d(grid: Float32Array, width: number, height: number): Float32Array {
  const output = new Float32Array(width * height);
  const f = new Float32Array(Math.max(width, height));
  const d = new Float32Array(Math.max(width, height));
  const v = new Int32Array(Math.max(width, height));
  const z = new Float32Array(Math.max(width, height) + 1);

  // Transform columns
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      f[y] = grid[y * width + x];
    }
    edt1d(f, d, v, z, height);
    for (let y = 0; y < height; y++) {
      output[y * width + x] = d[y];
    }
  }

  // Transform rows
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      f[x] = output[y * width + x];
    }
    edt1d(f, d, v, z, width);
    for (let x = 0; x < width; x++) {
      output[y * width + x] = Math.sqrt(d[x]);
    }
  }

  return output;
}

function drawShapeMask(ctx: CanvasRenderingContext2D, shape: string, width: number, height: number, maskScale: number = 1.0) {
  const cx = width / 2;
  const cy = height / 2;
  const size = Math.min(width, height) * 0.35 * maskScale;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.25;

  ctx.beginPath();
  if (shape === 'square') {
    ctx.rect(cx - size, cy - size, size * 2, size * 2);
    ctx.fill();
  } else if (shape === 'ring') {
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
    ctx.stroke();
  } else if (shape === 'star') {
    const points = 5;
    const outerR = size * 1.1;
    const innerR = size * 0.45;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  } else if (shape === 'heart') {
    const hSize = size * 0.85;
    ctx.moveTo(cx, cy + hSize * 0.7);
    ctx.bezierCurveTo(cx - hSize * 1.2, cy - hSize * 0.2, cx - hSize * 1.2, cy - hSize, cx, cy - hSize * 0.4);
    ctx.bezierCurveTo(cx + hSize * 1.2, cy - hSize, cx + hSize * 1.2, cy - hSize * 0.2, cx, cy + hSize * 0.7);
    ctx.fill();
  } else if (shape === 'hexagon') {
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = cx + Math.cos(angle) * size;
      const y = cy + Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  } else if (shape === 'diamond') {
    ctx.moveTo(cx, cy - size * 1.2);
    ctx.lineTo(cx + size, cy);
    ctx.lineTo(cx, cy + size * 1.2);
    ctx.lineTo(cx - size, cy);
    ctx.closePath();
    ctx.fill();
  } else if (shape === 'shield') {
    ctx.moveTo(cx - size * 0.9, cy - size * 0.9);
    ctx.lineTo(cx + size * 0.9, cy - size * 0.9);
    ctx.lineTo(cx + size * 0.9, cy + size * 0.2);
    ctx.quadraticCurveTo(cx, cy + size * 1.3, cx - size * 0.9, cy + size * 0.2);
    ctx.closePath();
    ctx.fill();
  } else {
    // Circle
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function generateImageSDF(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  maskScaleX: number = 1.0,
  maskScaleY: number = 1.0,
  svgXml?: string
): SDFData {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.clearRect(0, 0, targetWidth, targetHeight);

  // Derive true intrinsic dimensions to prevent SVG default 300x150 aspect distortion
  let intrinsicW = img.naturalWidth || img.width || 300;
  let intrinsicH = img.naturalHeight || img.height || 150;

  if (svgXml) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgXml, 'image/svg+xml');
      const svgEl = doc.querySelector('svg');
      if (svgEl) {
        const viewBox = svgEl.getAttribute('viewBox');
        if (viewBox) {
          const parts = viewBox.trim().split(/[\s,]+/).map(Number);
          if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
            intrinsicW = parts[2];
            intrinsicH = parts[3];
          }
        } else {
          const wAttr = parseFloat(svgEl.getAttribute('width') || '');
          const hAttr = parseFloat(svgEl.getAttribute('height') || '');
          if (!isNaN(wAttr) && wAttr > 0 && !isNaN(hAttr) && hAttr > 0) {
            intrinsicW = wAttr;
            intrinsicH = hAttr;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse SVG XML dimensions for SDF:', e);
    }
  }

  const padding = targetWidth * 0.15;
  const availW = targetWidth - padding * 2;
  const availH = targetHeight - padding * 2;
  const baseScale = Math.min(availW / intrinsicW, availH / intrinsicH);
  const drawW = intrinsicW * baseScale * maskScaleX;
  const drawH = intrinsicH * baseScale * maskScaleY;
  const drawX = (targetWidth - drawW) / 2;
  const drawY = (targetHeight - drawH) / 2;

  ctx.drawImage(img, drawX, drawY, drawW, drawH);

  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const pixels = imageData.data;
  const totalPixels = targetWidth * targetHeight;

  const insideGrid = new Float32Array(totalPixels);
  const outsideGrid = new Float32Array(totalPixels);
  const INF = 1e9;

  for (let i = 0; i < totalPixels; i++) {
    const alpha = pixels[i * 4 + 3];
    const isInside = alpha > 64;
    if (isInside) {
      insideGrid[i] = 0;
      outsideGrid[i] = INF;
    } else {
      insideGrid[i] = INF;
      outsideGrid[i] = 0;
    }
  }

  const distOutside = edt2d(insideGrid, targetWidth, targetHeight);
  const distInside = edt2d(outsideGrid, targetWidth, targetHeight);

  const sdf = new Float32Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    sdf[i] = distInside[i] - distOutside[i];
  }

  return {
    width: targetWidth,
    height: targetHeight,
    distanceMap: sdf,
    imageData
  };
}

/**
 * Renders the formatted text or geometric shape onto an offscreen canvas and constructs a high-precision Signed Distance Field.
 */
export function generateTextSDF(
  fontConfig: FontConfig,
  targetWidth: number,
  targetHeight: number
): SDFData {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Failed to get 2D canvas context for SDF generation');
  }

  // Clear canvas to transparent black
  ctx.clearRect(0, 0, targetWidth, targetHeight);

  const scaleX = fontConfig.maskScaleX ?? fontConfig.maskScale ?? 1.0;
  const scaleY = fontConfig.maskScaleY ?? fontConfig.maskScale ?? 1.0;

  ctx.save();
  if (scaleX !== 1.0 || scaleY !== 1.0) {
    ctx.translate(targetWidth / 2, targetHeight / 2);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-targetWidth / 2, -targetHeight / 2);
  }

  if (fontConfig.maskMode === 'shape') {
    drawShapeMask(ctx, fontConfig.shapeType || 'circle', targetWidth, targetHeight, 1.0);
  } else {
    // Default: Text Mask
    const fontSize = fontConfig.fontSize;
    const fontFamily = fontConfig.fontFamily || 'Space Grotesk, sans-serif';
    const fontWeight = fontConfig.fontWeight || 700;
    ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = fontConfig.textAlign;

    // Split multi-line text
    const lines = fontConfig.text.split('\n');
    const lineHeight = fontSize * fontConfig.lineHeight;
    const totalTextHeight = lines.length * lineHeight;
    const startY = (targetHeight - totalTextHeight) / 2 + lineHeight / 2;

    let xPos = targetWidth / 2;
    if (fontConfig.textAlign === 'left') {
      xPos = targetWidth * 0.1;
    } else if (fontConfig.textAlign === 'right') {
      xPos = targetWidth * 0.9;
    }

    // Render text onto canvas with letter spacing if needed
    lines.forEach((line, index) => {
      const yPos = startY + index * lineHeight;
      if (fontConfig.letterSpacing !== 0 && 'letterSpacing' in ctx) {
        (ctx as unknown as { letterSpacing: string }).letterSpacing = `${fontConfig.letterSpacing}px`;
      }
      ctx.fillText(line, xPos, yPos);
    });
  }
  ctx.restore();

  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const pixels = imageData.data;
  const totalPixels = targetWidth * targetHeight;

  // Prepare binary grids for inside and outside EDT
  const insideGrid = new Float32Array(totalPixels);
  const outsideGrid = new Float32Array(totalPixels);
  const INF = 1e9;

  for (let i = 0; i < totalPixels; i++) {
    const red = pixels[i * 4];
    const alpha = pixels[i * 4 + 3];
    // A pixel is inside text if red > 128 and alpha > 128
    const isInside = red > 128 && alpha > 128;

    if (isInside) {
      insideGrid[i] = 0;
      outsideGrid[i] = INF;
    } else {
      insideGrid[i] = INF;
      outsideGrid[i] = 0;
    }
  }

  // Compute Euclidean Distance Maps
  const distOutside = edt2d(insideGrid, targetWidth, targetHeight);
  const distInside = edt2d(outsideGrid, targetWidth, targetHeight);

  // Combine into Signed Distance Field
  // Inside text: positive distance (distInside)
  // Outside text: negative distance (-distOutside)
  const sdf = new Float32Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    sdf[i] = distInside[i] - distOutside[i];
  }

  return {
    width: targetWidth,
    height: targetHeight,
    distanceMap: sdf,
    imageData
  };
}

/**
 * Bilinear sampling from a Float32Array SDF distance map
 */
export function sampleSDF(
  sdf: SDFData,
  x: number,
  y: number,
  screenWidth?: number,
  screenHeight?: number
): number {
  const { width, height, distanceMap } = sdf;

  let px = x;
  let py = y;

  if (screenWidth && screenHeight && screenWidth > 0 && screenHeight > 0) {
    px = (x / screenWidth) * (width - 1);
    py = (y / screenHeight) * (height - 1);
  } else if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
    px = x * (width - 1);
    py = y * (height - 1);
  }

  // Clamp coordinates
  const cx = Math.max(0, Math.min(width - 1, px));
  const cy = Math.max(0, Math.min(height - 1, py));

  const x0 = Math.floor(cx);
  const x1 = Math.min(width - 1, x0 + 1);
  const y0 = Math.floor(cy);
  const y1 = Math.min(height - 1, y0 + 1);

  const tx = cx - x0;
  const ty = cy - y0;

  const d00 = distanceMap[y0 * width + x0];
  const d10 = distanceMap[y0 * width + x1];
  const d01 = distanceMap[y1 * width + x0];
  const d11 = distanceMap[y1 * width + x1];

  const top = d00 + tx * (d10 - d00);
  const bottom = d01 + tx * (d11 - d01);

  return top + ty * (bottom - top);
}
