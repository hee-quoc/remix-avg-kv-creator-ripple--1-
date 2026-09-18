import { KVLayoutConfig, KVTemplateId, KVLayoutMode, KVTextBlock, KVGraphicElement } from '../types';

export const KV_TEMPLATE_DEFINITIONS: {
  id: KVTemplateId;
  name: string;
  mode: KVLayoutMode;
  description: string;
}[] = [
  {
    id: 'question_bar',
    name: 'Question Bar',
    mode: 'with_ui',
    description: 'Centered text inside an editable rectangular bar with category badge and accents'
  },
  {
    id: 'brand_spread',
    name: 'Brand Spread',
    mode: 'with_ui',
    description: 'Large editorial typography with asymmetrical positioning, metadata tags and vertical divider'
  },
  {
    id: 'poster_pair',
    name: 'Poster Pair',
    mode: 'with_ui',
    description: 'Dual composition split layout with paired content panels and framing'
  },
  {
    id: 'promo_card',
    name: 'Promo Card',
    mode: 'with_ui',
    description: 'Effect visual paired with graphic containers, date badge, and structured headline'
  },
  {
    id: 'report_cover',
    name: 'Report Cover',
    mode: 'with_ui',
    description: 'Editorial cover layout with bold masthead, volume tags, and supporting executive summary'
  },
  {
    id: 'cut_poster',
    name: 'Cut Poster',
    mode: 'with_ui',
    description: 'Geometric framed poster with diagonal corner cuts and high-impact typographic hierarchy'
  },
  {
    id: 'hero_layout',
    name: 'Hero Layout',
    mode: 'with_ui',
    description: 'Spacious hero composition with dominant headline, supporting subhead, and CTA pill button'
  },
  {
    id: 'article_strip',
    name: 'Article Strip',
    mode: 'with_ui',
    description: 'Modular bento strip with framed visual container and structured typographic column'
  },
  {
    id: 'clean_focus',
    name: 'Clean Typography',
    mode: 'without_ui',
    description: 'Pure generative focus with clean unconstrained typography; zero cards, borders, or graphic frames'
  }
];

export function getDefaultKVLayout(mode: KVLayoutMode = 'with_ui', templateId: KVTemplateId = 'question_bar'): KVLayoutConfig {
  return createTemplateLayout(templateId, mode);
}

export function createTemplateLayout(
  templateId: KVTemplateId,
  mode: KVLayoutMode,
  existingTextBlocks?: KVTextBlock[]
): KVLayoutConfig {
  // Mode B: Without UI ignores graphic containers
  if (mode === 'without_ui') {
    const headlineText = existingTextBlocks?.[0]?.text || 'KINETIC VISION';
    const subheadText = existingTextBlocks?.[1]?.text || 'EXPLORATION OF GENERATIVE RADIAL MOTION';

    return {
      enabled: true,
      mode: 'without_ui',
      templateId: 'clean_focus',
      textBlocks: [
        {
          id: 'text-clean-head',
          name: 'Clean Headline',
          text: headlineText,
          x: 960,
          y: 860,
          fontSize: 84,
          fontFamily: existingTextBlocks?.[0]?.fontFamily || 'Space Grotesk',
          fontWeight: 700,
          letterSpacing: 4,
          lineHeight: 1.0,
          textAlign: 'center',
          color: '#ffffff',
          opacity: 1.0,
          uppercase: true
        },
        {
          id: 'text-clean-sub',
          name: 'Clean Subhead',
          text: subheadText,
          x: 960,
          y: 930,
          fontSize: 20,
          fontFamily: existingTextBlocks?.[1]?.fontFamily || 'Inter',
          fontWeight: 400,
          letterSpacing: 6,
          lineHeight: 1.2,
          textAlign: 'center',
          color: '#94a3b8',
          opacity: 0.85,
          uppercase: true
        }
      ],
      graphicElements: []
    };
  }

  // Mode A: With UI (8 templates inspired by reference)
  const defaultHeadline = existingTextBlocks?.find(t => t.id.includes('head') || t.fontSize > 40)?.text || 'HOW CAN GENERATIVE AI SHAPE THE NEXT KV?';
  const defaultSubhead = existingTextBlocks?.find(t => t.id.includes('sub') || (t.fontSize <= 40 && t.fontSize > 16))?.text || 'ANNUAL CREATIVE INTELLIGENCE REPORT';
  const defaultTag = existingTextBlocks?.find(t => t.id.includes('tag'))?.text || 'ISSUE #04 // VOL. 26';

  switch (templateId) {
    case 'question_bar':
      return {
        enabled: true,
        mode: 'with_ui',
        templateId: 'question_bar',
        graphicElements: [
          // Centered rectangular question bar
          {
            id: 'el-qbar-bg',
            name: 'Question Bar Container',
            type: 'bar',
            x: 240,
            y: 780,
            width: 1440,
            height: 140,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            borderColor: 'rgba(56, 189, 248, 0.4)',
            borderWidth: 2,
            borderRadius: 16,
            opacity: 0.95
          },
          // Category badge in top left of bar
          {
            id: 'el-qbar-badge',
            name: 'Topic Tag Badge',
            type: 'badge',
            x: 270,
            y: 745,
            width: 170,
            height: 32,
            backgroundColor: '#38bdf8',
            borderColor: '#38bdf8',
            borderWidth: 1,
            borderRadius: 6,
            opacity: 1.0,
            textLabel: 'RESEARCH QUESTION',
            textColor: '#0a0d14',
            textFontSize: 11
          }
        ],
        textBlocks: [
          {
            id: 'text-qbar-main',
            name: 'Question Headline',
            text: defaultHeadline,
            x: 960,
            y: 860,
            fontSize: 38,
            fontFamily: existingTextBlocks?.[0]?.fontFamily || 'Space Grotesk',
            fontWeight: 700,
            letterSpacing: 2,
            lineHeight: 1.1,
            textAlign: 'center',
            color: '#f8fafc',
            opacity: 1.0
          },
          {
            id: 'text-qbar-meta',
            name: 'Top Status Tag',
            text: defaultTag,
            x: 960,
            y: 80,
            fontSize: 14,
            fontFamily: 'JetBrains Mono',
            fontWeight: 700,
            letterSpacing: 4,
            lineHeight: 1.0,
            textAlign: 'center',
            color: '#38bdf8',
            opacity: 0.9,
            uppercase: true
          }
        ]
      };

    case 'brand_spread':
      return {
        enabled: true,
        mode: 'with_ui',
        templateId: 'brand_spread',
        graphicElements: [
          // Vertical accent line
          {
            id: 'el-bspread-line',
            name: 'Vertical Rule',
            type: 'line',
            x: 140,
            y: 120,
            width: 3,
            height: 840,
            backgroundColor: 'rgba(56, 189, 248, 0.6)',
            opacity: 0.8
          },
          // Top metadata bar
          {
            id: 'el-bspread-topbar',
            name: 'Header Pill',
            type: 'badge',
            x: 180,
            y: 120,
            width: 190,
            height: 36,
            backgroundColor: 'rgba(30, 41, 59, 0.7)',
            borderColor: 'rgba(148, 163, 184, 0.3)',
            borderWidth: 1,
            borderRadius: 8,
            opacity: 1.0,
            textLabel: 'AVG BRAND SPREAD',
            textColor: '#38bdf8',
            textFontSize: 12
          }
        ],
        textBlocks: [
          {
            id: 'text-bspread-head',
            name: 'Editorial Headline',
            text: defaultHeadline.replace(/\?/g, '') || 'KINETIC ENERGY',
            x: 180,
            y: 340,
            fontSize: 92,
            fontFamily: existingTextBlocks?.[0]?.fontFamily || 'Syne',
            fontWeight: 800,
            letterSpacing: -1,
            lineHeight: 0.95,
            textAlign: 'left',
            color: '#ffffff',
            opacity: 1.0,
            uppercase: true
          },
          {
            id: 'text-bspread-sub',
            name: 'Supporting Copy',
            text: 'Autonomous algorithmic typography generated via vector forces and concentric wavefront harmonic frequencies.',
            x: 180,
            y: 470,
            fontSize: 20,
            fontFamily: 'Space Grotesk',
            fontWeight: 400,
            letterSpacing: 1,
            lineHeight: 1.4,
            textAlign: 'left',
            color: '#94a3b8',
            opacity: 0.9
          },
          {
            id: 'text-bspread-footer',
            name: 'Dateline Tag',
            text: 'TOKYO // BERLIN // SAN FRANCISCO // 2026',
            x: 180,
            y: 920,
            fontSize: 14,
            fontFamily: 'JetBrains Mono',
            fontWeight: 700,
            letterSpacing: 4,
            lineHeight: 1.0,
            textAlign: 'left',
            color: '#38bdf8',
            opacity: 0.8
          }
        ]
      };

    case 'poster_pair':
      return {
        enabled: true,
        mode: 'with_ui',
        templateId: 'poster_pair',
        graphicElements: [
          // Left Card Container
          {
            id: 'el-ppair-left',
            name: 'Left Card Panel',
            type: 'box',
            x: 100,
            y: 100,
            width: 820,
            height: 880,
            backgroundColor: 'rgba(10, 15, 26, 0.65)',
            borderColor: 'rgba(56, 189, 248, 0.25)',
            borderWidth: 1,
            borderRadius: 16,
            opacity: 0.95
          },
          // Right Card Container
          {
            id: 'el-ppair-right',
            name: 'Right Card Panel',
            type: 'box',
            x: 1000,
            y: 100,
            width: 820,
            height: 880,
            backgroundColor: 'rgba(10, 15, 26, 0.4)',
            borderColor: 'rgba(148, 163, 184, 0.2)',
            borderWidth: 1,
            borderRadius: 16,
            opacity: 0.85
          }
        ],
        textBlocks: [
          {
            id: 'text-ppair-sideA',
            name: 'Side A Title',
            text: 'SIDE A // SIGNAL',
            x: 150,
            y: 180,
            fontSize: 24,
            fontFamily: 'JetBrains Mono',
            fontWeight: 800,
            letterSpacing: 3,
            lineHeight: 1.0,
            textAlign: 'left',
            color: '#38bdf8',
            opacity: 1.0
          },
          {
            id: 'text-ppair-main',
            name: 'Headline',
            text: defaultHeadline,
            x: 150,
            y: 310,
            fontSize: 54,
            fontFamily: existingTextBlocks?.[0]?.fontFamily || 'Space Grotesk',
            fontWeight: 700,
            letterSpacing: 1,
            lineHeight: 1.1,
            textAlign: 'left',
            color: '#ffffff',
            opacity: 1.0
          },
          {
            id: 'text-ppair-sideB',
            name: 'Side B Title',
            text: 'SIDE B // RESPONSE',
            x: 1050,
            y: 180,
            fontSize: 24,
            fontFamily: 'JetBrains Mono',
            fontWeight: 800,
            letterSpacing: 3,
            lineHeight: 1.0,
            textAlign: 'left',
            color: '#a855f7',
            opacity: 1.0
          },
          {
            id: 'text-ppair-sub',
            name: 'Description Block',
            text: defaultSubhead,
            x: 1050,
            y: 280,
            fontSize: 28,
            fontFamily: 'Space Grotesk',
            fontWeight: 500,
            letterSpacing: 2,
            lineHeight: 1.3,
            textAlign: 'left',
            color: '#cbd5e1',
            opacity: 0.95
          }
        ]
      };

    case 'promo_card':
      return {
        enabled: true,
        mode: 'with_ui',
        templateId: 'promo_card',
        graphicElements: [
          // Bottom promo container card
          {
            id: 'el-pcard-box',
            name: 'Promo Card Base',
            type: 'box',
            x: 460,
            y: 720,
            width: 1000,
            height: 260,
            backgroundColor: 'rgba(15, 23, 42, 0.88)',
            borderColor: 'rgba(56, 189, 248, 0.5)',
            borderWidth: 2,
            borderRadius: 24,
            opacity: 0.98
          },
          // Date tag pill
          {
            id: 'el-pcard-pill',
            name: 'Launch Pill',
            type: 'pill_button',
            x: 520,
            y: 760,
            width: 150,
            height: 38,
            backgroundColor: 'rgba(56, 189, 248, 0.2)',
            borderColor: '#38bdf8',
            borderWidth: 1,
            borderRadius: 19,
            opacity: 1.0,
            textLabel: 'GLOBAL RELEASE',
            textColor: '#38bdf8',
            textFontSize: 12
          }
        ],
        textBlocks: [
          {
            id: 'text-pcard-title',
            name: 'Promo Title',
            text: defaultHeadline,
            x: 520,
            y: 860,
            fontSize: 48,
            fontFamily: existingTextBlocks?.[0]?.fontFamily || 'Anton',
            fontWeight: 400,
            letterSpacing: 2,
            lineHeight: 1.0,
            textAlign: 'left',
            color: '#ffffff',
            opacity: 1.0
          },
          {
            id: 'text-pcard-desc',
            name: 'Promo Details',
            text: defaultSubhead,
            x: 520,
            y: 920,
            fontSize: 18,
            fontFamily: 'Inter',
            fontWeight: 500,
            letterSpacing: 2,
            lineHeight: 1.2,
            textAlign: 'left',
            color: '#94a3b8',
            opacity: 0.9
          }
        ]
      };

    case 'report_cover':
      return {
        enabled: true,
        mode: 'with_ui',
        templateId: 'report_cover',
        graphicElements: [
          // Full outer hairline border
          {
            id: 'el-rep-frame',
            name: 'Outer Document Border',
            type: 'frame',
            x: 60,
            y: 60,
            width: 1800,
            height: 960,
            backgroundColor: 'transparent',
            borderColor: 'rgba(255, 255, 255, 0.25)',
            borderWidth: 1,
            borderRadius: 8,
            opacity: 0.9
          },
          // Header divider rule
          {
            id: 'el-rep-line',
            name: 'Header Divider',
            type: 'line',
            x: 100,
            y: 160,
            width: 1720,
            height: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            opacity: 0.8
          }
        ],
        textBlocks: [
          {
            id: 'text-rep-masthead',
            name: 'Masthead Header',
            text: 'ADVANCED VISUAL GENERATIVE LAB // 2026',
            x: 100,
            y: 125,
            fontSize: 16,
            fontFamily: 'JetBrains Mono',
            fontWeight: 700,
            letterSpacing: 4,
            lineHeight: 1.0,
            textAlign: 'left',
            color: '#38bdf8',
            opacity: 1.0
          },
          {
            id: 'text-rep-vol',
            name: 'Volume Tag',
            text: defaultTag,
            x: 1820,
            y: 125,
            fontSize: 16,
            fontFamily: 'JetBrains Mono',
            fontWeight: 700,
            letterSpacing: 2,
            lineHeight: 1.0,
            textAlign: 'right',
            color: '#ffffff',
            opacity: 0.85
          },
          {
            id: 'text-rep-title',
            name: 'Cover Title',
            text: defaultHeadline,
            x: 100,
            y: 840,
            fontSize: 68,
            fontFamily: existingTextBlocks?.[0]?.fontFamily || 'Instrument Serif',
            fontWeight: 700,
            letterSpacing: 0,
            lineHeight: 1.0,
            textAlign: 'left',
            color: '#ffffff',
            opacity: 1.0
          },
          {
            id: 'text-rep-abstract',
            name: 'Executive Abstract',
            text: defaultSubhead,
            x: 100,
            y: 910,
            fontSize: 18,
            fontFamily: 'Space Grotesk',
            fontWeight: 500,
            letterSpacing: 2,
            lineHeight: 1.3,
            textAlign: 'left',
            color: '#94a3b8',
            opacity: 0.85
          }
        ]
      };

    case 'cut_poster':
      return {
        enabled: true,
        mode: 'with_ui',
        templateId: 'cut_poster',
        graphicElements: [
          // Geometric cut corner frame
          {
            id: 'el-cut-frame',
            name: 'Cut Corner Border',
            type: 'cut_frame',
            x: 120,
            y: 90,
            width: 1680,
            height: 900,
            backgroundColor: 'transparent',
            borderColor: 'rgba(56, 189, 248, 0.45)',
            borderWidth: 2,
            borderRadius: 0,
            opacity: 0.95
          },
          // Top left corner accent block
          {
            id: 'el-cut-corner',
            name: 'Corner Tag',
            type: 'badge',
            x: 120,
            y: 90,
            width: 220,
            height: 40,
            backgroundColor: '#38bdf8',
            borderColor: '#38bdf8',
            borderWidth: 1,
            borderRadius: 0,
            opacity: 1.0,
            textLabel: 'CYBER KV EDITION',
            textColor: '#0a0d14',
            textFontSize: 12
          }
        ],
        textBlocks: [
          {
            id: 'text-cut-title',
            name: 'Poster Title',
            text: defaultHeadline,
            x: 960,
            y: 260,
            fontSize: 78,
            fontFamily: existingTextBlocks?.[0]?.fontFamily || 'Syne',
            fontWeight: 800,
            letterSpacing: 2,
            lineHeight: 0.95,
            textAlign: 'center',
            color: '#ffffff',
            opacity: 1.0,
            uppercase: true
          },
          {
            id: 'text-cut-bottom',
            name: 'Bottom Tagline',
            text: 'PRECISION VECTOR SIMULATION // DYNAMIC TENSOR FORCE FIELD',
            x: 960,
            y: 930,
            fontSize: 16,
            fontFamily: 'JetBrains Mono',
            fontWeight: 700,
            letterSpacing: 5,
            lineHeight: 1.0,
            textAlign: 'center',
            color: '#38bdf8',
            opacity: 0.9
          }
        ]
      };

    case 'hero_layout':
      return {
        enabled: true,
        mode: 'with_ui',
        templateId: 'hero_layout',
        graphicElements: [
          // Bottom CTA pill button
          {
            id: 'el-hero-cta',
            name: 'Action Button',
            type: 'pill_button',
            x: 820,
            y: 900,
            width: 280,
            height: 58,
            backgroundColor: '#38bdf8',
            borderColor: '#38bdf8',
            borderWidth: 1,
            borderRadius: 29,
            opacity: 1.0,
            textLabel: 'EXPLORE GENERATION →',
            textColor: '#0a0d14',
            textFontSize: 14
          }
        ],
        textBlocks: [
          {
            id: 'text-hero-headline',
            name: 'Hero Headline',
            text: defaultHeadline,
            x: 960,
            y: 760,
            fontSize: 70,
            fontFamily: existingTextBlocks?.[0]?.fontFamily || 'Space Grotesk',
            fontWeight: 800,
            letterSpacing: -0.5,
            lineHeight: 1.05,
            textAlign: 'center',
            color: '#ffffff',
            opacity: 1.0
          },
          {
            id: 'text-hero-subhead',
            name: 'Hero Subtitle',
            text: defaultSubhead,
            x: 960,
            y: 840,
            fontSize: 22,
            fontFamily: 'Inter',
            fontWeight: 400,
            letterSpacing: 4,
            lineHeight: 1.2,
            textAlign: 'center',
            color: '#94a3b8',
            opacity: 0.9,
            uppercase: true
          }
        ]
      };

    case 'article_strip':
      return {
        enabled: true,
        mode: 'with_ui',
        templateId: 'article_strip',
        graphicElements: [
          // Left visual bento container
          {
            id: 'el-strip-card',
            name: 'Article Card Base',
            type: 'box',
            x: 1200,
            y: 140,
            width: 620,
            height: 800,
            backgroundColor: 'rgba(15, 23, 42, 0.82)',
            borderColor: 'rgba(56, 189, 248, 0.35)',
            borderWidth: 2,
            borderRadius: 20,
            opacity: 0.98
          },
          // Status badge inside card
          {
            id: 'el-strip-badge',
            name: 'Article Category Tag',
            type: 'badge',
            x: 1250,
            y: 190,
            width: 140,
            height: 32,
            backgroundColor: 'rgba(56, 189, 248, 0.2)',
            borderColor: '#38bdf8',
            borderWidth: 1,
            borderRadius: 6,
            opacity: 1.0,
            textLabel: 'FEATURE STORY',
            textColor: '#38bdf8',
            textFontSize: 11
          }
        ],
        textBlocks: [
          {
            id: 'text-strip-title',
            name: 'Article Headline',
            text: defaultHeadline,
            x: 1250,
            y: 310,
            fontSize: 44,
            fontFamily: existingTextBlocks?.[0]?.fontFamily || 'Space Grotesk',
            fontWeight: 700,
            letterSpacing: 1,
            lineHeight: 1.15,
            textAlign: 'left',
            color: '#ffffff',
            opacity: 1.0,
            maxWidth: 520
          },
          {
            id: 'text-strip-body',
            name: 'Story Summary',
            text: 'Visual generative typography creates a visceral resonance between physical sound waves and digital brand identities.',
            x: 1250,
            y: 490,
            fontSize: 18,
            fontFamily: 'Inter',
            fontWeight: 400,
            letterSpacing: 0.5,
            lineHeight: 1.5,
            textAlign: 'left',
            color: '#94a3b8',
            opacity: 0.9,
            maxWidth: 520
          }
        ]
      };

    default:
      return getDefaultKVLayout('with_ui', 'question_bar');
  }
}

/**
 * Renders the KV Layout Layer onto an HTML5 Canvas context.
 * Strictly decoupled from wave and particle distortion.
 */
export function renderKVLayoutToCanvas(
  ctx: CanvasRenderingContext2D,
  kvLayout: KVLayoutConfig | undefined,
  designWidth: number,
  designHeight: number,
  selectedElementId?: string | null
): void {
  if (!kvLayout || !kvLayout.enabled) return;

  ctx.save();

  // 1. Render Graphic UI Elements (Containers, Borders, Bars, Badges, Buttons)
  if (kvLayout.mode === 'with_ui') {
    for (const elem of kvLayout.graphicElements) {
      ctx.save();
      ctx.globalAlpha = elem.opacity ?? 1.0;

      const { x, y, width, height, borderRadius = 0, borderWidth = 0 } = elem;

      if (elem.type === 'line') {
        ctx.fillStyle = elem.backgroundColor || '#38bdf8';
        ctx.fillRect(x, y, width, height);
      } else if (elem.type === 'cut_frame') {
        // Geometric frame with diagonal cut corners
        const cut = 36;
        ctx.beginPath();
        ctx.moveTo(x + cut, y);
        ctx.lineTo(x + width - cut, y);
        ctx.lineTo(x + width, y + cut);
        ctx.lineTo(x + width, y + height - cut);
        ctx.lineTo(x + width - cut, y + height);
        ctx.lineTo(x + cut, y + height);
        ctx.lineTo(x, y + height - cut);
        ctx.lineTo(x, y + cut);
        ctx.closePath();

        if (elem.backgroundColor && elem.backgroundColor !== 'transparent') {
          ctx.fillStyle = elem.backgroundColor;
          ctx.fill();
        }
        if (elem.borderColor && borderWidth > 0) {
          ctx.strokeStyle = elem.borderColor;
          ctx.lineWidth = borderWidth;
          ctx.stroke();
        }
      } else {
        // Standard rectangular box / pill / frame
        ctx.beginPath();
        if ('roundRect' in ctx && typeof ctx.roundRect === 'function' && borderRadius > 0) {
          ctx.roundRect(x, y, width, height, borderRadius);
        } else {
          ctx.rect(x, y, width, height);
        }

        if (elem.backgroundColor && elem.backgroundColor !== 'transparent') {
          ctx.fillStyle = elem.backgroundColor;
          ctx.fill();
        }
        if (elem.borderColor && borderWidth > 0) {
          ctx.strokeStyle = elem.borderColor;
          ctx.lineWidth = borderWidth;
          ctx.stroke();
        }
      }

      // Optional text inside badge / pill CTA button
      if (elem.textLabel) {
        ctx.fillStyle = elem.textColor || '#ffffff';
        ctx.font = `700 ${elem.textFontSize || 12}px "JetBrains Mono", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(elem.textLabel, x + width / 2, y + height / 2 + 1);
      }

      // Draw active selection indicator
      if (selectedElementId === elem.id) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(x - 4, y - 4, width + 8, height + 8);
        ctx.setLineDash([]);
      }

      ctx.restore();
    }
  }

  // 2. Render Independent Text Blocks
  for (const block of kvLayout.textBlocks) {
    ctx.save();
    ctx.globalAlpha = block.opacity;
    ctx.fillStyle = block.color;

    const fontSize = block.fontSize || 36;
    const fontFamily = block.fontFamily || 'Space Grotesk';
    const fontWeight = block.fontWeight || 700;
    const lineHeight = fontSize * (block.lineHeight || 1.1);

    ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
    ctx.textAlign = block.textAlign || 'center';
    ctx.textBaseline = 'alphabetic';

    ctx.translate(block.x, block.y);
    if (block.rotation) {
      ctx.rotate((block.rotation * Math.PI) / 180);
    }
    if (block.scale && block.scale !== 1.0) {
      ctx.scale(block.scale, block.scale);
    }

    const lines = block.text.split('\n');
    const totalH = lines.length * lineHeight;
    let startY = 0;

    lines.forEach((lineText, idx) => {
      const displayText = block.uppercase ? lineText.toUpperCase() : lineText;
      ctx.fillText(displayText, 0, startY + idx * lineHeight);
    });

    // Draw active selection bounding box if selected
    if (selectedElementId === block.id) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);

      // Approximate text bounds for selection visual
      const longestLine = lines.reduce((a, b) => (a.length > b.length ? a : b), '');
      const metrics = ctx.measureText(longestLine);
      const textW = Math.max(80, metrics.width + 20);
      let boxX = -textW / 2;
      if (block.textAlign === 'left') boxX = -8;
      else if (block.textAlign === 'right') boxX = -textW + 8;

      ctx.strokeRect(boxX, -fontSize * 0.85, textW, totalH + 12);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Renders the KV Layout Layer to SVG for vector export.
 */
export function renderKVLayoutToSVG(
  svgGroup: SVGGElement,
  kvLayout: KVLayoutConfig | undefined,
  width: number,
  height: number,
  svgDoc: Document
): void {
  if (!kvLayout || !kvLayout.enabled) return;

  const SVG_NS = 'http://www.w3.org/2000/svg';

  // 1. Graphic UI Elements
  if (kvLayout.mode === 'with_ui') {
    const gfxG = svgDoc.createElementNS(SVG_NS, 'g');
    gfxG.setAttribute('id', 'kv-graphic-containers');

    for (const elem of kvLayout.graphicElements) {
      const rect = svgDoc.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', elem.x.toString());
      rect.setAttribute('y', elem.y.toString());
      rect.setAttribute('width', elem.width.toString());
      rect.setAttribute('height', elem.height.toString());
      rect.setAttribute('rx', (elem.borderRadius ?? 0).toString());
      rect.setAttribute('fill', elem.backgroundColor || 'none');
      if (elem.borderColor && elem.borderWidth) {
        rect.setAttribute('stroke', elem.borderColor);
        rect.setAttribute('stroke-width', elem.borderWidth.toString());
      }
      rect.setAttribute('opacity', (elem.opacity ?? 1.0).toString());
      gfxG.appendChild(rect);

      if (elem.textLabel) {
        const text = svgDoc.createElementNS(SVG_NS, 'text');
        text.setAttribute('x', (elem.x + elem.width / 2).toString());
        text.setAttribute('y', (elem.y + elem.height / 2 + 4).toString());
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-family', 'JetBrains Mono, monospace');
        text.setAttribute('font-size', (elem.textFontSize || 12).toString());
        text.setAttribute('font-weight', '700');
        text.setAttribute('fill', elem.textColor || '#ffffff');
        text.textContent = elem.textLabel;
        gfxG.appendChild(text);
      }
    }
    svgGroup.appendChild(gfxG);
  }

  // 2. Independent Text Blocks
  const textG = svgDoc.createElementNS(SVG_NS, 'g');
  textG.setAttribute('id', 'kv-layout-text-blocks');

  for (const block of kvLayout.textBlocks) {
    const g = svgDoc.createElementNS(SVG_NS, 'g');
    let transform = `translate(${block.x}, ${block.y})`;
    if (block.rotation) {
      transform += ` rotate(${block.rotation})`;
    }
    if (block.scale && block.scale !== 1.0) {
      transform += ` scale(${block.scale})`;
    }
    g.setAttribute('transform', transform);
    g.setAttribute('opacity', block.opacity.toString());

    const lines = block.text.split('\n');
    const fontSize = block.fontSize || 36;
    const lineHeight = fontSize * (block.lineHeight || 1.1);

    lines.forEach((lineText, idx) => {
      const textEl = svgDoc.createElementNS(SVG_NS, 'text');
      textEl.setAttribute('x', '0');
      textEl.setAttribute('y', (idx * lineHeight).toString());
      textEl.setAttribute('text-anchor', block.textAlign === 'center' ? 'middle' : block.textAlign === 'right' ? 'end' : 'start');
      textEl.setAttribute('font-family', `"${block.fontFamily || 'Space Grotesk'}", sans-serif`);
      textEl.setAttribute('font-size', fontSize.toString());
      textEl.setAttribute('font-weight', (block.fontWeight || 700).toString());
      textEl.setAttribute('fill', block.color);
      textEl.setAttribute('letter-spacing', (block.letterSpacing || 0).toString());
      textEl.textContent = block.uppercase ? lineText.toUpperCase() : lineText;
      g.appendChild(textEl);
    });

    textG.appendChild(g);
  }

  svgGroup.appendChild(textG);
}
