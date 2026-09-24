import { FlipDiscConfig } from './types';
import { SDFData, sampleSDF } from '../utils/sdf';

// ============================================================
// PRISMATIC FLIP CIRCLE — ported from the user's p5.js/WebGL reference sketch into a
// self-contained TypeScript class (no p5.js dependency; driven by the React render loop in
// FlipDiscCanvas.tsx instead of p5's setup()/draw()). Shader math is kept byte-for-byte
// equivalent to the reference, with three previously-hardcoded constants (the 0.42 ripple delay,
// the 0.52 flip easing coefficient, and the flip period) promoted to uniforms so the existing
// Motion controls (Ripple Delay / Motion Softness / Wave Timing / Flip Speed) stay meaningful —
// their defaults exactly reproduce the reference's fixed numbers.
// ============================================================

const SHAPE_SEGMENTS: Record<FlipDiscConfig['shape'], number> = { circle: 28, square: 4, clover: 48, custom: 48 };
const MATERIAL_INDEX: Record<FlipDiscConfig['material'], number> = { matte: 0, glossy: 1, metallic: 2, iridescent: 3 };
const FLIP_SECONDS_BASE = 5.0; // reference's FLIP_SECONDS at flipSpeed = 1.0
const ART_SIZE = 0.9; // reference's ART_SIZE (overall on-screen zoom, not user-exposed in the reference panel either)

function rgb01(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
}

const VS = `
precision highp float;
attribute vec3 aUnit;
attribute vec2 aCenter;
attribute vec3 aNormal;
attribute vec2 aUV;
attribute float aFace;
uniform vec2 uResolution;
uniform float uPhase;
uniform float uRadius;
uniform float uThickness;
uniform float uSize;
uniform float uRippleDelay;
uniform float uWaveTiming;
uniform float uEase;
varying vec3 vNormal;
varying vec3 vView;
varying vec2 vUV;
varying float vFace;
varying float vHue;
mat3 ry(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c,0.,-s, 0.,1.,0., s,0.,c);
}
mat3 rz(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c,s,0., -s,c,0., 0.,0.,1.);
}
void main() {
  float radiusFromCenter = length(aCenter);
  float delay = radiusFromCenter * uRippleDelay * uWaveTiming;
  float wave = uPhase - delay;
  float flip = wave - uEase * sin(2.0 * wave);
  float localAxis = 0.12 * sin(uPhase * 1.3 + aCenter.x * 0.5 + aCenter.y * 0.7);
  mat3 rot = rz(localAxis) * ry(flip);
  vec3 scale = vec3(uRadius, uRadius, uThickness);
  vec3 pos = vec3(aCenter, 0.0) + rot * (aUnit * scale);
  vNormal = rot * normalize(aNormal / scale);
  float distance = 20.0;
  float w = distance - pos.z;
  vView = vec3(-pos.xy, w);
  vUV = aUV;
  vFace = aFace;
  vHue = radiusFromCenter * 0.08 + aCenter.x * 0.018
       + aCenter.y * 0.018 + 0.08 * sin(uPhase);
  float shortSide = min(uResolution.x, uResolution.y);
  vec2 aspect = vec2(shortSide) / uResolution;
  float focal = distance / 12.0 * uSize;
  gl_Position = vec4(pos.xy * focal * aspect, pos.z, w);
}
`;

const FS = `
precision highp float;
uniform vec3 uFrontColor;
uniform vec3 uBackColor;
uniform vec3 uSideColor;
uniform sampler2D uFrontTexture;
uniform sampler2D uBackTexture;
uniform float uHasFront;
uniform float uHasBack;
uniform float uFrontAspect;
uniform float uBackAspect;
uniform float uMaterial;
uniform float uRainbow;
uniform float uSaturation;
uniform float uGrain;
uniform float uGrainSize;
uniform float uGrainTime;
varying vec3 vNormal;
varying vec3 vView;
varying vec2 vUV;
varying float vFace;
varying float vHue;

vec3 spectrum(float t) {
  return 0.5 + 0.5 * cos(6.2831853 * (t + vec3(0.0, 0.33, 0.67)));
}
float rand(vec2 pixel, float seed) {
  return fract(sin(dot(pixel, vec2(127.1, 311.7)) + seed * 74.7) * 43758.5453);
}
vec2 coverUV(vec2 uv, float imageAspect) {
  if (imageAspect > 1.0) uv.x = (uv.x - 0.5) / imageAspect + 0.5;
  else uv.y = (uv.y - 0.5) * imageAspect + 0.5;
  return uv;
}
void main() {
  vec3 n = normalize(vNormal);
  vec3 eye = normalize(vView);
  vec3 light = normalize(vec3(-0.5, 0.7, 1.3));
  float facing = max(dot(n, eye), 0.0);
  float fresnel = pow(1.0 - facing, 3.0);
  vec3 base = uSideColor;

  if (vFace > 0.5) {
    base = uFrontColor;
    if (uHasFront > 0.5) {
      vec4 texel = texture2D(uFrontTexture, coverUV(vUV, uFrontAspect));
      base = mix(base, texel.rgb, texel.a);
    }
  } else if (vFace < -0.5) {
    base = uBackColor;
    if (uHasBack > 0.5) {
      vec4 texel = texture2D(uBackTexture, coverUV(vUV, uBackAspect));
      base = mix(base, texel.rgb, texel.a);
    }
  }

  vec3 film = spectrum(vHue + 0.8 * (1.0 - facing) + 0.22 * vUV.x);
  float diffuse = max(dot(n, light), 0.0);
  vec3 halfVector = normalize(light + eye);
  float highlight = max(dot(n, halfVector), 0.0);
  vec3 reflected = reflect(-eye, n);
  float strip = pow(max(1.0 - abs(reflected.x + 0.32), 0.0), 32.0);
  vec3 color;

  if (uMaterial < 0.5) {
    color = base * (0.40 + 0.60 * diffuse);
    color += vec3(1.0) * pow(highlight, 28.0) * 0.06;
  } else if (uMaterial < 1.5) {
    color = base * (0.22 + 0.78 * diffuse);
    color += vec3(1.0, 0.96, 0.91) * pow(highlight, 95.0) * 1.10;
    color += vec3(0.78, 0.89, 1.0) * strip * 0.23;
  } else if (uMaterial < 2.5) {
    color = base * (0.15 + 0.61 * diffuse);
    color += mix(base, vec3(1.0), 0.22) * pow(highlight, 110.0) * 1.30;
    color += mix(base, vec3(0.8, 0.9, 1.0), 0.35) * strip * 0.35;
    color += base * fresnel * 0.26;
  } else {
    vec3 irid = mix(base, film, (0.36 + 0.24 * fresnel) * clamp(uRainbow, 0.0, 1.0));
    color = irid * (0.24 + 0.72 * diffuse);
    color += vec3(1.0, 0.88, 0.72) * pow(highlight, 65.0) * 0.95;
    color += mix(irid, vec3(0.75, 0.88, 1.0), 0.65) * strip * 0.24;
    color += film * fresnel * (0.26 * uRainbow);
  }

  color = 1.0 - exp(-color * 1.3);
  color = pow(max(color, vec3(0.0)), vec3(0.4545));
  float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = clamp(mix(vec3(lum), color, uSaturation), 0.0, 1.0);
  if (uGrain > 0.0) {
    vec2 pixel = floor(gl_FragCoord.xy / max(1.0, uGrainSize));
    float noise = rand(pixel, uGrainTime) - 0.5;
    color = clamp(color + vec3(noise * uGrain), 0.0, 1.0);
  }
  gl_FragColor = vec4(color, 1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, isWebGL2: boolean, type: number, source: string): WebGLShader {
  let src = source;
  if (isWebGL2) {
    src = src.replace(/\battribute\b/g, 'in');
    src = src.replace(/\bvarying\b/g, type === gl.VERTEX_SHADER ? 'out' : 'in');
    if (type === gl.FRAGMENT_SHADER) {
      src = src.replace('precision highp float;', 'precision highp float;\nout vec4 outColor;');
      src = src.replace(/\bgl_FragColor\b/g, 'outColor');
      src = src.replace(/\btexture2D\b/g, 'texture');
    }
    src = '#version 300 es\n' + src;
  }
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Could not create shader');
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error('Shader compile error: ' + info);
  }
  return shader;
}

function makePerimeter(shape: FlipDiscConfig['shape'], customPoints?: [number, number][]): [number, number][] {
  if (shape === 'custom') {
    return customPoints && customPoints.length >= 3 ? customPoints : makePerimeter('circle');
  }
  const N = SHAPE_SEGMENTS[shape];
  const points: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const angle = shape === 'square' ? Math.PI / 4 + (i * 2 * Math.PI) / N : (i * 2 * Math.PI) / N;
    let radius = 1;
    if (shape === 'square') {
      radius = 1 / Math.max(Math.abs(Math.cos(angle)), Math.abs(Math.sin(angle)));
    }
    if (shape === 'clover') {
      radius = 0.72 + 0.28 * Math.cos(4 * angle);
    }
    points.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
  }
  return points;
}

export class FlipDiscGLRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private vertexBuffer: WebGLBuffer;
  private vertexCount = 0;
  private uLoc: Record<string, WebGLUniformLocation | null> = {};
  private aLoc: Record<string, number> = {};
  private frontTexture: WebGLTexture;
  private backTexture: WebGLTexture;
  private hasFrontImage = false;
  private hasBackImage = false;
  private frontAspect = 1;
  private backAspect = 1;
  private lastMeshKey = '';

  constructor(canvas: HTMLCanvasElement) {
    const ctxAttrs: WebGLContextAttributes = { antialias: true, preserveDrawingBuffer: true };
    const gl =
      (canvas.getContext('webgl2', ctxAttrs) as WebGLRenderingContext | null) ||
      canvas.getContext('webgl', ctxAttrs);
    if (!gl) throw new Error('WebGL is not supported in this browser.');
    this.gl = gl;
    const isWebGL2 = String(gl.getParameter(gl.VERSION)).includes('WebGL 2');

    const program = gl.createProgram();
    if (!program) throw new Error('Could not create WebGL program');
    gl.attachShader(program, compileShader(gl, isWebGL2, gl.VERTEX_SHADER, VS));
    gl.attachShader(program, compileShader(gl, isWebGL2, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('Program link error: ' + gl.getProgramInfoLog(program));
    }
    this.program = program;

    const uniforms = [
      'uResolution', 'uPhase', 'uRadius', 'uThickness', 'uSize',
      'uRippleDelay', 'uWaveTiming', 'uEase',
      'uFrontColor', 'uBackColor', 'uSideColor', 'uFrontTexture', 'uBackTexture',
      'uHasFront', 'uHasBack', 'uFrontAspect', 'uBackAspect', 'uMaterial',
      'uRainbow', 'uSaturation', 'uGrain', 'uGrainSize', 'uGrainTime'
    ];
    for (const name of uniforms) this.uLoc[name] = gl.getUniformLocation(program, name);
    for (const name of ['aUnit', 'aCenter', 'aNormal', 'aUV', 'aFace']) {
      this.aLoc[name] = gl.getAttribLocation(program, name);
    }

    const buffer = gl.createBuffer();
    if (!buffer) throw new Error('Could not create vertex buffer');
    this.vertexBuffer = buffer;

    this.frontTexture = this.createBlankTexture();
    this.backTexture = this.createBlankTexture();
  }

  private createBlankTexture(): WebGLTexture {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) throw new Error('Could not create texture');
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    return texture;
  }

  loadFaceImage(which: 'front' | 'back', file: File, onDone?: (fileName: string) => void, onError?: (msg: string) => void): void {
    if (!file.type.startsWith('image/')) {
      onError?.('Please choose a PNG, JPG, or WebP image.');
      return;
    }
    const gl = this.gl;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const texture = which === 'front' ? this.frontTexture : this.backTexture;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      if (which === 'front') {
        this.hasFrontImage = true;
        this.frontAspect = image.width / image.height;
      } else {
        this.hasBackImage = true;
        this.backAspect = image.width / image.height;
      }
      URL.revokeObjectURL(url);
      onDone?.(file.name);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      onError?.('Could not read this image. Try a PNG, JPG, or WebP file.');
    };
    image.src = url;
  }

  clearFaceImage(which: 'front' | 'back'): void {
    if (which === 'front') this.hasFrontImage = false;
    else this.hasBackImage = false;
  }

  private rebuildMeshIfNeeded(
    shape: FlipDiscConfig['shape'],
    density: number,
    mask: SDFData | null,
    maskKey: string,
    customPoints: [number, number][] | undefined,
    customVersion: number
  ): void {
    const count = Math.max(4, Math.round(density));
    const key = `${shape}_${count}_${maskKey}_${shape === 'custom' ? customVersion : ''}`;
    if (key === this.lastMeshKey) return;
    this.lastMeshKey = key;

    const gl = this.gl;
    const perimeter = makePerimeter(shape, customPoints);
    const N = perimeter.length;
    const data: number[] = [];
    const half = (count - 1) * 0.5;
    const fieldRadius = half + 0.25;

    const push = (
      x: number, y: number, z: number, cx: number, cy: number,
      nx: number, ny: number, nz: number, u: number, v: number, face: number
    ) => data.push(x, y, z, cx, cy, nx, ny, nz, u, v, face);

    const frontVertex = (x: number, y: number, cx: number, cy: number) =>
      push(x, y, 1, cx, cy, 0, 0, 1, (x + 1) * 0.5, (y + 1) * 0.5, 1);
    const backVertex = (x: number, y: number, cx: number, cy: number) =>
      push(x, y, -1, cx, cy, 0, 0, -1, (1 - x) * 0.5, (y + 1) * 0.5, -1);

    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        const cx = col - half;
        const cy = row - half;
        if (Math.hypot(cx, cy) > fieldRadius) continue;
        if (mask) {
          // Same normalized-0..1, y-up convention the mask SDF is authored in (see resolveFlipDiscMask
          // / generateTextSDF/generateImageSDF) — positive distance = inside the shape/logo silhouette.
          const u = 0.5 + cx / (2 * half);
          const v = 0.5 - cy / (2 * half);
          if (sampleSDF(mask, u, v) <= 0) continue;
        }
        for (let i = 0; i < N; i++) {
          const p = perimeter[i];
          const q = perimeter[(i + 1) % N];
          frontVertex(0, 0, cx, cy);
          frontVertex(p[0], p[1], cx, cy);
          frontVertex(q[0], q[1], cx, cy);
          backVertex(0, 0, cx, cy);
          backVertex(q[0], q[1], cx, cy);
          backVertex(p[0], p[1], cx, cy);
          const dx = q[0] - p[0];
          const dy = q[1] - p[1];
          const len = Math.hypot(dx, dy) || 1;
          const nx = dy / len;
          const ny = -dx / len;
          const side = (point: [number, number], z: number) =>
            push(point[0], point[1], z, cx, cy, nx, ny, 0, i / N, (z + 1) * 0.5, 0);
          side(p, 1);
          side(p, -1);
          side(q, 1);
          side(q, 1);
          side(p, -1);
          side(q, -1);
        }
      }
    }

    this.vertexCount = data.length / 11;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  }

  render(
    config: FlipDiscConfig,
    time: number,
    widthPx: number,
    heightPx: number,
    mask: SDFData | null = null,
    maskKey = 'none'
  ): void {
    const gl = this.gl;
    this.rebuildMeshIfNeeded(config.shape, config.density, mask, maskKey, config.customShapePoints, config.customShapeVersion);

    const period = FLIP_SECONDS_BASE / Math.max(0.05, config.flipSpeed);
    const phase = ((time % period) / period) * Math.PI * 2;

    gl.viewport(0, 0, widthPx, heightPx);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.disable(gl.CULL_FACE);
    const bg = rgb01(config.backgroundColor);
    gl.clearColor(bg[0], bg[1], bg[2], 1);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

    const stride = 11 * 4;
    const attrs: [string, number, number][] = [
      ['aUnit', 3, 0], ['aCenter', 2, 12], ['aNormal', 3, 20], ['aUV', 2, 32], ['aFace', 1, 40]
    ];
    for (const [name, size, offset] of attrs) {
      const location = this.aLoc[name];
      if (location < 0) continue;
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset);
    }

    gl.uniform2f(this.uLoc.uResolution as WebGLUniformLocation, widthPx, heightPx);
    gl.uniform1f(this.uLoc.uPhase as WebGLUniformLocation, phase);
    gl.uniform1f(this.uLoc.uRadius as WebGLUniformLocation, config.discRadius);
    gl.uniform1f(this.uLoc.uThickness as WebGLUniformLocation, config.thickness);
    gl.uniform1f(this.uLoc.uSize as WebGLUniformLocation, ART_SIZE);
    gl.uniform1f(this.uLoc.uRippleDelay as WebGLUniformLocation, config.rippleDelay);
    gl.uniform1f(this.uLoc.uWaveTiming as WebGLUniformLocation, config.waveTiming);
    gl.uniform1f(this.uLoc.uEase as WebGLUniformLocation, config.motionSoftness);
    gl.uniform3fv(this.uLoc.uFrontColor as WebGLUniformLocation, rgb01(config.frontColor));
    gl.uniform3fv(this.uLoc.uBackColor as WebGLUniformLocation, rgb01(config.backColor));
    gl.uniform3fv(this.uLoc.uSideColor as WebGLUniformLocation, rgb01(config.sideColor));
    gl.uniform1f(this.uLoc.uMaterial as WebGLUniformLocation, MATERIAL_INDEX[config.material]);
    gl.uniform1f(this.uLoc.uRainbow as WebGLUniformLocation, config.rainbowIntensity);
    gl.uniform1f(this.uLoc.uSaturation as WebGLUniformLocation, config.saturation);
    gl.uniform1f(this.uLoc.uGrain as WebGLUniformLocation, config.grain);
    gl.uniform1f(this.uLoc.uGrainSize as WebGLUniformLocation, config.grainSize);
    gl.uniform1f(this.uLoc.uGrainTime as WebGLUniformLocation, config.animateGrain ? Math.floor(time * 30) : 0);
    gl.uniform1f(this.uLoc.uHasFront as WebGLUniformLocation, this.hasFrontImage ? 1 : 0);
    gl.uniform1f(this.uLoc.uHasBack as WebGLUniformLocation, this.hasBackImage ? 1 : 0);
    gl.uniform1f(this.uLoc.uFrontAspect as WebGLUniformLocation, this.frontAspect);
    gl.uniform1f(this.uLoc.uBackAspect as WebGLUniformLocation, this.backAspect);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.frontTexture);
    gl.uniform1i(this.uLoc.uFrontTexture as WebGLUniformLocation, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.backTexture);
    gl.uniform1i(this.uLoc.uBackTexture as WebGLUniformLocation, 1);

    gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);

    for (const [name] of attrs) {
      const location = this.aLoc[name];
      if (location >= 0) gl.disableVertexAttribArray(location);
    }
  }

  dispose(): void {
    const gl = this.gl;
    gl.deleteBuffer(this.vertexBuffer);
    gl.deleteTexture(this.frontTexture);
    gl.deleteTexture(this.backTexture);
    gl.deleteProgram(this.program);
  }
}
