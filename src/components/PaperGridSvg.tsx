import React from 'react';
import { PaperStyle, WritingMode } from '../types/editor';

interface PaperGridSvgProps {
  paperStyle: PaperStyle;
  opacity?: number;
  writingMode?: WritingMode;
  pageId?: string;
}

export const PaperGridSvg: React.FC<PaperGridSvgProps> = ({
  paperStyle,
  opacity = 0.55,
  writingMode = 'horizontal-tb',
  pageId = 'default',
}) => {
  const isVertical = writingMode === 'vertical-rl';
  const patId = `grid_pat_${paperStyle}_${pageId}`;

  if (paperStyle === 'plain' || paperStyle === 'xuan' || paperStyle === 'hanji') {
    return null;
  }

  const renderPatternContent = () => {
    switch (paperStyle) {
      // 1. Korean Wongozhi Green (원고지 녹색 · 40x40px)
      case 'wongozhi':
        return (
          <pattern
            id={patId}
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <rect
              x="0.5"
              y="0.5"
              width="39"
              height="39"
              fill="none"
              stroke="#15803D"
              strokeWidth="1.2"
            />
          </pattern>
        );

      // 2. Korean Wongozhi Brick (원고지 황토 · 40x40px)
      case 'wongozhi-brick':
        return (
          <pattern
            id={patId}
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <rect
              x="0.5"
              y="0.5"
              width="39"
              height="39"
              fill="none"
              stroke="#B45309"
              strokeWidth="1.2"
            />
          </pattern>
        );

      // 3. Classical Vertical Red Lines (朱丝栏 · 48px columns)
      case 'classical-vertical':
        return (
          <pattern
            id={patId}
            width="48"
            height="100"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="100"
              stroke="#B91C1C"
              strokeWidth="1.6"
            />
          </pattern>
        );

      // 4. Classical Vertical Slate / Ink Lines (乌丝栏 · 48px columns)
      case 'classical-vertical-slate':
        return (
          <pattern
            id={patId}
            width="48"
            height="100"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="100"
              stroke="#1E293B"
              strokeWidth="1.6"
            />
          </pattern>
        );

      // 5. Tianzige (田字格 · 44x44px with dashed cross)
      case 'tianzige':
        return (
          <pattern
            id={patId}
            width="44"
            height="44"
            patternUnits="userSpaceOnUse"
          >
            <rect
              x="0.5"
              y="0.5"
              width="43"
              height="43"
              fill="none"
              stroke="#C62828"
              strokeWidth="1.3"
            />
            <line
              x1="0"
              y1="22"
              x2="44"
              y2="22"
              stroke="#EF5350"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <line
              x1="22"
              y1="0"
              x2="22"
              y2="44"
              stroke="#EF5350"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          </pattern>
        );

      // 6. Mizige (米字格 · 44x44px with star 8-way diagonals)
      case 'mizige':
        return (
          <pattern
            id={patId}
            width="44"
            height="44"
            patternUnits="userSpaceOnUse"
          >
            <rect
              x="0.5"
              y="0.5"
              width="43"
              height="43"
              fill="none"
              stroke="#991B1B"
              strokeWidth="1.3"
            />
            <line
              x1="0"
              y1="22"
              x2="44"
              y2="22"
              stroke="#DC2626"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <line
              x1="22"
              y1="0"
              x2="22"
              y2="44"
              stroke="#DC2626"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <line
              x1="0"
              y1="0"
              x2="44"
              y2="44"
              stroke="#F87171"
              strokeWidth="0.9"
              strokeDasharray="2.5 2.5"
            />
            <line
              x1="44"
              y1="0"
              x2="0"
              y2="44"
              stroke="#F87171"
              strokeWidth="0.9"
              strokeDasharray="2.5 2.5"
            />
          </pattern>
        );

      // 7. Jiugongge (九宫格 · 48x48px 3x3)
      case 'jiugongge':
        return (
          <pattern
            id={patId}
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <rect
              x="0.5"
              y="0.5"
              width="47"
              height="47"
              fill="none"
              stroke="#1E293B"
              strokeWidth="1.3"
            />
            <line
              x1="16"
              y1="0"
              x2="16"
              y2="48"
              stroke="#475569"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
            <line
              x1="32"
              y1="0"
              x2="32"
              y2="48"
              stroke="#475569"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
            <line
              x1="0"
              y1="16"
              x2="48"
              y2="16"
              stroke="#475569"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
            <line
              x1="0"
              y1="32"
              x2="48"
              y2="32"
              stroke="#475569"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
          </pattern>
        );

      // 8. Huigongge (回宫格 · 44x44px double concentric frame)
      case 'huigongge':
        return (
          <pattern
            id={patId}
            width="44"
            height="44"
            patternUnits="userSpaceOnUse"
          >
            <rect
              x="0.5"
              y="0.5"
              width="43"
              height="43"
              fill="none"
              stroke="#1D4ED8"
              strokeWidth="1.3"
            />
            <rect
              x="10.5"
              y="10.5"
              width="23"
              height="23"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1.1"
              strokeDasharray="3 2"
            />
          </pattern>
        );

      // 9. Quadretti 5mm (Quaderno classico · 24x24px)
      case 'quadretti-5mm':
        return (
          <pattern
            id={patId}
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <rect
              x="0.5"
              y="0.5"
              width="23"
              height="23"
              fill="none"
              stroke="#60A5FA"
              strokeWidth="0.9"
              opacity="0.85"
            />
          </pattern>
        );

      // 10. Quadretti Grandi 10mm (1 cm · 48x48px)
      case 'quadretti-10mm':
        return (
          <pattern
            id={patId}
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <rect
              x="0.5"
              y="0.5"
              width="47"
              height="47"
              fill="none"
              stroke="#2563EB"
              strokeWidth="1.2"
              opacity="0.9"
            />
          </pattern>
        );

      // 11. Classical Horizontal Lines (Righe Quaderno · 36px)
      case 'classical-horizontal':
        return (
          <pattern
            id={patId}
            width="100"
            height="36"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="36"
              x2="100"
              y2="36"
              stroke="#475569"
              strokeWidth="1"
            />
          </pattern>
        );

      default:
        return null;
    }
  };

  return (
    <svg
      className="grid-pattern-overlay absolute inset-0 w-full h-full pointer-events-none select-none z-0"
      style={{
        opacity,
        display: 'block',
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
    >
      <defs>{renderPatternContent()}</defs>
      <rect
        width="100%"
        height="100%"
        fill={`url(#${patId})`}
        style={{
          transformOrigin: isVertical ? 'right top' : 'left top',
        }}
      />
    </svg>
  );
};
