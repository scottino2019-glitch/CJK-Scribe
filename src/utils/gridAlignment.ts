import { CJKDocument, PaperStyle, WritingMode } from '../types/editor';

export interface GridSpec {
  id: PaperStyle;
  pitch: number; // in pixels
  type: 'square' | 'vertical-column' | 'horizontal-line' | 'plain';
  recommendedFontSize: number;
  name: string;
  nativeLabel: string;
}

export const PAPER_GRID_SPECS: Record<PaperStyle, GridSpec> = {
  plain: {
    id: 'plain',
    pitch: 0,
    type: 'plain',
    recommendedFontSize: 20,
    name: 'Bianco Pulito',
    nativeLabel: '白纸',
  },
  xuan: {
    id: 'xuan',
    pitch: 0,
    type: 'plain',
    recommendedFontSize: 22,
    name: 'Carta Xuan',
    nativeLabel: '宣纸',
  },
  hanji: {
    id: 'hanji',
    pitch: 0,
    type: 'plain',
    recommendedFontSize: 20,
    name: 'Carta Hanji',
    nativeLabel: '한지',
  },
  tianzige: {
    id: 'tianzige',
    pitch: 44,
    type: 'square',
    recommendedFontSize: 26,
    name: 'Tianzige (田字格)',
    nativeLabel: '田字格',
  },
  mizige: {
    id: 'mizige',
    pitch: 44,
    type: 'square',
    recommendedFontSize: 26,
    name: 'Mizige (米字格)',
    nativeLabel: '米字格',
  },
  jiugongge: {
    id: 'jiugongge',
    pitch: 48,
    type: 'square',
    recommendedFontSize: 26,
    name: 'Jiugongge (九宫格)',
    nativeLabel: '九宫格',
  },
  huigongge: {
    id: 'huigongge',
    pitch: 44,
    type: 'square',
    recommendedFontSize: 26,
    name: 'Huigongge (回宫格)',
    nativeLabel: '回宫格',
  },
  wongozhi: {
    id: 'wongozhi',
    pitch: 40,
    type: 'square',
    recommendedFontSize: 24,
    name: 'Wongozhi Verde (원고지)',
    nativeLabel: '원고지',
  },
  'wongozhi-brick': {
    id: 'wongozhi-brick',
    pitch: 40,
    type: 'square',
    recommendedFontSize: 24,
    name: 'Wongozhi Terracotta',
    nativeLabel: '원고지 황토',
  },
  'quadretti-5mm': {
    id: 'quadretti-5mm',
    pitch: 24,
    type: 'square',
    recommendedFontSize: 15,
    name: 'Quadretti 5mm (Quaderno)',
    nativeLabel: '5mm 方格',
  },
  'quadretti-10mm': {
    id: 'quadretti-10mm',
    pitch: 48,
    type: 'square',
    recommendedFontSize: 26,
    name: 'Quadretti Grandi 10mm (1 cm)',
    nativeLabel: '10mm 大方格',
  },
  'classical-vertical': {
    id: 'classical-vertical',
    pitch: 48,
    type: 'vertical-column',
    recommendedFontSize: 22,
    name: 'Zhu Si Lan (朱丝栏)',
    nativeLabel: '朱丝栏',
  },
  'classical-vertical-slate': {
    id: 'classical-vertical-slate',
    pitch: 48,
    type: 'vertical-column',
    recommendedFontSize: 22,
    name: 'Wu Si Lan (乌丝栏)',
    nativeLabel: '乌丝栏',
  },
  'classical-horizontal': {
    id: 'classical-horizontal',
    pitch: 36,
    type: 'horizontal-line',
    recommendedFontSize: 20,
    name: 'Righe Orizzontali',
    nativeLabel: '横线格',
  },
};

export function isCursiveFont(fontFamily?: string): boolean {
  if (!fontFamily) return false;
  const f = fontFamily.toLowerCase();
  return (
    f.includes('ma shan zheng') ||
    f.includes('zhi mang xing') ||
    f.includes('long cang') ||
    f.includes('liu jian mao cao') ||
    f.includes('nanum brush') ||
    f.includes('nanum pen') ||
    f.includes('yeon sung') ||
    f.includes('gaegu') ||
    f.includes('dongle') ||
    f.includes('cursive') ||
    f.includes('kaiti') ||
    f.includes('brush')
  );
}

export function getPaperBaseColorHex(paperStyle: PaperStyle): string {
  switch (paperStyle) {
    case 'xuan':
      return '#FCF9F2';
    case 'hanji':
      return '#FAF7EE';
    case 'classical-vertical':
      return '#FDFBF7';
    case 'classical-vertical-slate':
      return '#F8FAFC';
    case 'wongozhi':
      return '#FAFBF7';
    case 'wongozhi-brick':
      return '#FAF7F2';
    case 'quadretti-5mm':
      return '#F8FAFC';
    case 'quadretti-10mm':
    case 'tianzige':
    case 'mizige':
    case 'jiugongge':
    case 'huigongge':
    case 'classical-horizontal':
    case 'plain':
    default:
      return '#FFFFFF';
  }
}

export interface BlockExactGridStyle {
  fontSize: number;
  lineHeight: string | number;
  letterSpacing: string;
  isGridPaper: boolean;
  pitch: number;
  paddingLeft?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
}

/**
 * Returns exact mathematical CSS styling so that CJK characters land with pixel perfection
 * centered inside the squares (Tianzige, Mizige, Wongozhi, Jiugongge, Quadretti) or centered on lines.
 * Accommodates flexible user font size changes and protects cursive scripts from colliding or bleeding.
 */
export function getBlockExactGridStyle(
  paperStyle: PaperStyle,
  writingMode: WritingMode,
  customFontSize?: number,
  _fontFamily?: string
): BlockExactGridStyle {
  const spec = PAPER_GRID_SPECS[paperStyle] || PAPER_GRID_SPECS.plain;
  const isVertical = writingMode === 'vertical-rl';

  if (spec.type === 'plain' || spec.pitch === 0) {
    const fs = customFontSize || spec.recommendedFontSize;
    return {
      fontSize: fs,
      lineHeight: isVertical ? 2.0 : 1.75,
      letterSpacing: isVertical ? '0.10em' : '0.04em',
      isGridPaper: false,
      pitch: 0,
      paddingLeft: '0px',
      paddingTop: '0px',
      paddingRight: '0px',
      paddingBottom: '0px',
    };
  }

  const pitch = spec.pitch;

  // Quadretti Notebooks (5mm & 10mm): Authentic continuous handwriting along grid rows
  if (paperStyle === 'quadretti-5mm') {
    const fs = customFontSize ? Math.max(10, Math.min(72, customFontSize)) : 15;
    // For sizes <= 24px, 1 row (24px). If > 24px and <= 48px, 2 rows (48px). If > 48px, 3 rows (72px).
    const rows = fs <= 24 ? 1 : fs <= 48 ? 2 : 3;
    const lineHeightPx = rows * 24;
    return {
      fontSize: fs,
      lineHeight: `${lineHeightPx}px`,
      letterSpacing: '0.03em',
      paddingLeft: '0px',
      paddingTop: '0px',
      paddingRight: '0px',
      paddingBottom: '0px',
      isGridPaper: true,
      pitch: 24,
    };
  }

  if (paperStyle === 'quadretti-10mm') {
    const fs = customFontSize ? Math.max(10, Math.min(72, customFontSize)) : 26;
    const rows = fs <= 48 ? 1 : 2;
    const lineHeightPx = rows * 48;
    return {
      fontSize: fs,
      lineHeight: `${lineHeightPx}px`,
      letterSpacing: '0.04em',
      paddingLeft: '0px',
      paddingTop: '0px',
      paddingRight: '0px',
      paddingBottom: '0px',
      isGridPaper: true,
      pitch: 48,
    };
  }

  // Asian Practice Square Grids (Tianzige, Mizige, Jiugongge, Huigongge, Wongozhi):
  // 1 CJK character centered in each square box
  if (spec.type === 'square') {
    const fs = customFontSize
      ? Math.max(10, Math.min(72, customFontSize))
      : spec.recommendedFontSize;

    const offset = Math.max(0, Math.round((pitch - fs) / 2));
    const spacingPx = Math.max(0, pitch - fs);

    if (isVertical) {
      return {
        fontSize: fs,
        lineHeight: `${pitch}px`,
        letterSpacing: `${spacingPx}px`,
        paddingTop: `${offset}px`,
        paddingRight: '0px',
        paddingLeft: '0px',
        paddingBottom: '0px',
        isGridPaper: true,
        pitch,
      };
    } else {
      return {
        fontSize: fs,
        lineHeight: `${pitch}px`,
        letterSpacing: `${spacingPx}px`,
        paddingLeft: `${offset}px`,
        paddingTop: '0px',
        paddingRight: '0px',
        paddingBottom: '0px',
        isGridPaper: true,
        pitch,
      };
    }
  }

  if (spec.type === 'vertical-column') {
    // Classical columns (Zhu Si Lan, Wu Si Lan - 48px columns)
    const fs = customFontSize
      ? Math.max(10, Math.min(72, customFontSize))
      : spec.recommendedFontSize;

    if (isVertical) {
      return {
        fontSize: fs,
        lineHeight: `${pitch}px`,
        letterSpacing: '0.10em',
        paddingLeft: '0px',
        paddingTop: '0px',
        paddingRight: '0px',
        paddingBottom: '0px',
        isGridPaper: true,
        pitch,
      };
    } else {
      return {
        fontSize: fs,
        lineHeight: 1.8,
        letterSpacing: '0.05em',
        paddingLeft: '0px',
        paddingTop: '0px',
        paddingRight: '0px',
        paddingBottom: '0px',
        isGridPaper: false,
        pitch,
      };
    }
  }

  // Horizontal lines (Classical horizontal - 36px ruled lines)
  const fs = customFontSize
    ? Math.max(10, Math.min(72, customFontSize))
    : spec.recommendedFontSize;
  const rows = fs <= 36 ? 1 : 2;

  if (!isVertical) {
    return {
      fontSize: fs,
      lineHeight: `${rows * 36}px`,
      letterSpacing: '0.04em',
      paddingLeft: '0px',
      paddingTop: '0px',
      paddingRight: '0px',
      paddingBottom: '0px',
      isGridPaper: true,
      pitch,
    };
  } else {
    return {
      fontSize: fs,
      lineHeight: 1.8,
      letterSpacing: '0.10em',
      paddingLeft: '0px',
      paddingTop: '0px',
      paddingRight: '0px',
      paddingBottom: '0px',
      isGridPaper: false,
      pitch,
    };
  }
}

/**
 * Calculates numeric typography metrics for document state storage.
 */
export function calculateGridTypographyMetrics(
  paperStyle: PaperStyle,
  writingMode: WritingMode,
  currentFontSize?: number,
  _fontFamily?: string
): {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
} {
  const spec = PAPER_GRID_SPECS[paperStyle] || PAPER_GRID_SPECS.plain;
  const isVertical = writingMode === 'vertical-rl';

  if (spec.type === 'plain' || spec.pitch === 0) {
    const fs = currentFontSize || spec.recommendedFontSize;
    return {
      fontSize: fs,
      lineHeight: isVertical ? 2.0 : 1.75,
      letterSpacing: isVertical ? 0.10 : 0.04,
    };
  }

  const pitch = spec.pitch;

  if (paperStyle === 'quadretti-5mm') {
    const fs = currentFontSize ? Math.max(10, Math.min(72, currentFontSize)) : 15;
    const rows = fs <= 24 ? 1 : fs <= 48 ? 2 : 3;
    const lh = Math.round(((rows * 24) / fs) * 100) / 100;
    return {
      fontSize: fs,
      lineHeight: lh,
      letterSpacing: 0.03,
    };
  }

  if (paperStyle === 'quadretti-10mm') {
    const fs = currentFontSize ? Math.max(10, Math.min(72, currentFontSize)) : 26;
    const rows = fs <= 48 ? 1 : 2;
    const lh = Math.round(((rows * 48) / fs) * 100) / 100;
    return {
      fontSize: fs,
      lineHeight: lh,
      letterSpacing: 0.04,
    };
  }

  if (spec.type === 'square') {
    const targetFontSize = currentFontSize
      ? Math.max(10, Math.min(72, currentFontSize))
      : spec.recommendedFontSize;
    const lineHeight = Math.round((pitch / targetFontSize) * 100) / 100;

    return {
      fontSize: targetFontSize,
      lineHeight,
      letterSpacing: isVertical ? 0.08 : 0.05,
    };
  }

  if (spec.type === 'vertical-column') {
    const targetFontSize = currentFontSize
      ? Math.max(10, Math.min(72, currentFontSize))
      : spec.recommendedFontSize;
    const lineHeight = Math.round((pitch / targetFontSize) * 100) / 100;

    return {
      fontSize: targetFontSize,
      lineHeight,
      letterSpacing: isVertical ? 0.10 : 0.05,
    };
  }

  // Horizontal lines
  const targetFontSize = currentFontSize
    ? Math.max(10, Math.min(72, currentFontSize))
    : spec.recommendedFontSize;
  const rows = targetFontSize <= 36 ? 1 : 2;
  const lineHeight = Math.round(((rows * 36) / targetFontSize) * 100) / 100;

  return {
    fontSize: targetFontSize,
    lineHeight,
    letterSpacing: 0.04,
  };
}

/**
 * Aligns the entire document (all blocks and default settings)
 * so that text perfectly snaps to the current paper grid and starts cleanly at column/row top.
 */
export function alignDocumentToPaperGrid(doc: CJKDocument): CJKDocument {
  const metrics = calculateGridTypographyMetrics(
    doc.paperStyle,
    doc.writingMode,
    doc.defaultFontSize,
    doc.defaultFontFamily
  );
  const spec = PAPER_GRID_SPECS[doc.paperStyle];
  const isVertical = doc.writingMode === 'vertical-rl';

  return {
    ...doc,
    defaultFontSize: doc.defaultFontSize || metrics.fontSize,
    lineSpacing: metrics.lineHeight,
    characterSpacing: metrics.letterSpacing,
    pages: doc.pages.map((p) => ({
      ...p,
      blocks: p.blocks.map((b) => {
        const bFont = b.fontFamily || doc.defaultFontFamily;
        const bFontSize = b.fontSize || doc.defaultFontSize || metrics.fontSize;

        const bMetrics = calculateGridTypographyMetrics(
          doc.paperStyle,
          doc.writingMode,
          bFontSize,
          bFont
        );

        return {
          ...b,
          fontSize: bMetrics.fontSize,
          lineHeight: bMetrics.lineHeight,
          letterSpacing: bMetrics.letterSpacing,
          textAlign: isVertical
            ? 'left'
            : (spec.type !== 'plain' && b.textAlign === 'center' ? 'left' : (b.textAlign || 'left')),
        };
      }),
    })),
  };
}
