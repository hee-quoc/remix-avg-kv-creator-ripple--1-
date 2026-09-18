/**
 * Magnetic Needle Vector Field Simulation for Automotive Preset
 * Direct implementation of user's Processing sketch:
 * - 60x60 grid of magnetic needles with angular momentum & forces
 * - Continuous noise field + tension coupling between neighbors
 * - Mouse press triggers shockwave propagation through the grid
 * - Neon blue-violet chromatic stroke rendering
 */

const N = 60;

// Perlin noise permutation table
const PERM: number[] = new Array(512);
const P_BASE = [
  151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
  190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,
  68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
  102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,
  3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,
  119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,
  97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,
  84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
];

for (let i = 0; i < 256; i++) {
  PERM[i] = P_BASE[i];
  PERM[256 + i] = P_BASE[i];
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(t: number, a: number, b: number): number {
  return a + t * (b - a);
}

function grad(hash: number, x: number, y: number, z: number): number {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

export function perlin3d(x: number, y: number, z: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;

  const fx = x - Math.floor(x);
  const fy = y - Math.floor(y);
  const fz = z - Math.floor(z);

  const u = fade(fx);
  const v = fade(fy);
  const w = fade(fz);

  const A = PERM[X] + Y;
  const AA = PERM[A] + Z;
  const AB = PERM[A + 1] + Z;
  const B = PERM[X + 1] + Y;
  const BA = PERM[B] + Z;
  const BB = PERM[B + 1] + Z;

  return (
    lerp(
      w,
      lerp(
        v,
        lerp(u, grad(PERM[AA], fx, fy, fz), grad(PERM[BA], fx - 1, fy, fz)),
        lerp(u, grad(PERM[AB], fx, fy - 1, fz), grad(PERM[BB], fx - 1, fy - 1, fz))
      ),
      lerp(
        v,
        lerp(u, grad(PERM[AA + 1], fx, fy, fz - 1), grad(PERM[BA + 1], fx - 1, fy, fz - 1)),
        lerp(u, grad(PERM[AB + 1], fx, fy - 1, fz - 1), grad(PERM[BB + 1], fx - 1, fy - 1, fz - 1))
      )
    ) * 0.5 + 0.5
  );
}

export interface MagneticNeedle {
  x: number;
  y: number;
  angle: number;
  length: number;
  strokeWeight: number;
  color: string;
}

class MagneticFieldSimulator {
  private n = N;
  private magnets: Float32Array;
  private forces: Float32Array;
  private time = 0;
  private lastTriggerTime = 0;
  private waveOrigins: { x: number; y: number; birthTime: number }[] = [];

  constructor() {
    this.magnets = new Float32Array(this.n * this.n);
    this.forces = new Float32Array(this.n * this.n);
    this.reset();
  }

  public reset() {
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        const idx = i * this.n + j;
        this.magnets[idx] = Math.random() * Math.PI * 2;
        this.forces[idx] = 0.0;
      }
    }
  }

  /**
   * Trigger the shockwave perturbation as requested in mousePressed()
   */
  public triggerMouseWave(normX?: number, normY?: number) {
    const now = performance.now() / 1000;
    this.lastTriggerTime = now;

    if (normX !== undefined && normY !== undefined) {
      this.waveOrigins.push({ x: normX * this.n, y: normY * this.n, birthTime: now });
      if (this.waveOrigins.length > 4) this.waveOrigins.shift();
    }

    // Direct user logic: randomize magnetic field
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        const idx = i * this.n + j;
        if (normX !== undefined && normY !== undefined) {
          const dx = i - normX * this.n;
          const dy = j - normY * this.n;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const impact = Math.max(0, 1 - dist / 25);
          this.magnets[idx] += (Math.random() * 20 - 10) * (0.3 + 0.7 * impact);
        } else {
          this.magnets[idx] = Math.random() * 20 - 10;
        }
      }
    }
  }

  public update() {
    const now = performance.now() / 1000;

    // Apply noise forces
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < Math.floor(this.n * 0.75); j++) {
        const idx = i * this.n + j;
        const nVal = perlin3d(0.1 * i, 0.1 * j, 0.01 * this.time);
        this.forces[idx] = 2.0 * (nVal - 0.5);
      }
    }

    // Propagate shockwaves from mouse presses
    for (const wave of this.waveOrigins) {
      const age = now - wave.birthTime;
      const radius = age * 28.0; // wave speed across grid
      if (age < 2.5) {
        for (let i = 0; i < this.n; i++) {
          for (let j = 0; j < this.n; j++) {
            const dx = i - wave.x;
            const dy = j - wave.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            const diff = Math.abs(d - radius);
            if (diff < 3.5) {
              const strength = (1 - diff / 3.5) * Math.exp(-age * 1.5) * 4.0;
              this.forces[i * this.n + j] += strength * Math.sin(age * 12);
            }
          }
        }
      }
    }

    // Neighbor coupling from Processing code:
    // if (i<n-1) forces[i][j] -= magnets[i][j] - magnets[i+1][j];
    // if (i>0) forces[i][j] -= magnets[i][j] - magnets[i-1][j];
    // if (j<n-1) forces[i][j] -= magnets[i][j] - magnets[i][j+1];
    // if (j>0) forces[i][j] -= magnets[i][j] - magnets[i][j-1];
    // magnets[i][j] += 0.3 * forces[i][j];
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        const idx = i * this.n + j;
        const currentMag = this.magnets[idx];

        if (i < this.n - 1) {
          this.forces[idx] -= currentMag - this.magnets[(i + 1) * this.n + j];
        }
        if (i > 0) {
          this.forces[idx] -= currentMag - this.magnets[(i - 1) * this.n + j];
        }
        if (j < this.n - 1) {
          this.forces[idx] -= currentMag - this.magnets[i * this.n + (j + 1)];
        }
        if (j > 0) {
          this.forces[idx] -= currentMag - this.magnets[i * this.n + (j - 1)];
        }

        this.magnets[idx] += 0.3 * this.forces[idx];
      }
    }

    this.time++;
  }

  /**
   * Render directly to HTML5 Canvas in 1920x1080 design space
   */
  public renderToCanvas(
    ctx: CanvasRenderingContext2D,
    designWidth: number,
    designHeight: number,
    scale: number = 2.4
  ) {
    this.update();

    const spacingX = designWidth / this.n;
    const spacingY = designHeight / this.n;
    const lineLen = 10 * scale;
    const sWeight = 2 * scale;

    ctx.save();
    ctx.lineWidth = sWeight;
    ctx.lineCap = 'round';

    for (let i = 0; i < this.n; i++) {
      const posX = i * spacingX + spacingX * 0.5;
      for (let j = 0; j < this.n; j++) {
        const posY = j * spacingY + spacingY * 0.5;
        const idx = i * this.n + j;
        const angle = this.magnets[idx];

        const absMod = Math.abs(angle) % 3.12;
        let strokeColor = '';

        if (absMod < 0.2) {
          strokeColor = 'rgb(100, 50, 255)'; // Neon electric violet accent
        } else {
          const r = Math.min(255, Math.floor(50 * absMod));
          strokeColor = `rgb(${r}, 20, 200)`;
        }

        ctx.save();
        ctx.translate(posX, posY);
        ctx.rotate(angle);
        ctx.strokeStyle = strokeColor;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(lineLen, 0);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore();
  }

  /**
   * Get current needle snapshot for SVG export
   */
  public getNeedleSnapshot(
    designWidth: number,
    designHeight: number,
    scale: number = 2.4
  ): MagneticNeedle[] {
    const needles: MagneticNeedle[] = [];
    const spacingX = designWidth / this.n;
    const spacingY = designHeight / this.n;
    const lineLen = 10 * scale;
    const sWeight = 2 * scale;

    for (let i = 0; i < this.n; i++) {
      const posX = i * spacingX + spacingX * 0.5;
      for (let j = 0; j < this.n; j++) {
        const posY = j * spacingY + spacingY * 0.5;
        const idx = i * this.n + j;
        const angle = this.magnets[idx];
        const absMod = Math.abs(angle) % 3.12;

        let strokeColor = '';
        if (absMod < 0.2) {
          strokeColor = 'rgb(100, 50, 255)';
        } else {
          const r = Math.min(255, Math.floor(50 * absMod));
          strokeColor = `rgb(${r}, 20, 200)`;
        }

        needles.push({
          x: posX,
          y: posY,
          angle,
          length: lineLen,
          strokeWeight: sWeight,
          color: strokeColor
        });
      }
    }
    return needles;
  }
}

export const magneticSimulator = new MagneticFieldSimulator();
