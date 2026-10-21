import React from 'react';
import {
  X,
  SlidersHorizontal,
  Sparkles,
  Layers,
  FileText,
  RotateCw,
  Check,
} from 'lucide-react';
import { CJKDocument, PaperStyle, PaperFormat, WritingMode } from '../types/editor';

interface PageSettingsDrawerProps {
  document: CJKDocument;
  isOpen: boolean;
  onClose: () => void;
  onMarginChange: (marginMm: number) => void;
  onGridOpacityChange: (opacity: number) => void;
  onLineSpacingChange: (spacing: number, applyToAll: boolean) => void;
  onCharacterSpacingChange: (spacing: number, applyToAll: boolean) => void;
  onAlignTextToGrid: () => void;
  onPaperStyleChange: (style: PaperStyle) => void;
  onPaperFormatChange: (format: PaperFormat) => void;
  onWritingModeChange?: (mode: WritingMode) => void;
  onFontSizeChange?: (newSize: number) => void;
  onHeaderTextChange: (text: string) => void;
  onFooterTextChange: (text: string) => void;
  onTogglePageNumbers: (show: boolean) => void;
  activeBlockId: string | null;
  showMarginGuides: boolean;
  onToggleMarginGuides: (show: boolean) => void;
}

const PAPER_STYLES: {
  id: PaperStyle;
  name: string;
  sub: string;
  icon: string;
  category: 'plain' | 'classical' | 'grid';
}[] = [
  { id: 'plain', name: 'Bianco Pulito', sub: 'Nessuna riga o quadretto', icon: '📄', category: 'plain' },
  { id: 'xuan', name: 'Carta Xuan (宣纸)', sub: 'Trama naturale carta di riso', icon: '📜', category: 'plain' },
  { id: 'hanji', name: 'Carta Hanji (한지)', sub: 'Trama tradizionale coreana', icon: '🌾', category: 'plain' },
  { id: 'classical-vertical', name: 'Zhu Si Lan (朱丝栏)', sub: 'Colonne verticali rosse cinabro', icon: '🎋', category: 'classical' },
  { id: 'classical-vertical-slate', name: 'Wu Si Lan (乌丝栏)', sub: 'Colonne verticali inchiostro scuro', icon: '🪨', category: 'classical' },
  { id: 'classical-horizontal', name: 'Righe Orizzontali', sub: 'Righe continue quaderno (36px)', icon: '📝', category: 'classical' },
  { id: 'tianzige', name: 'Tianzige (田字格)', sub: 'Quadretti con croce interna (+ 44px)', icon: '🔲', category: 'grid' },
  { id: 'mizige', name: 'Mizige (米字格)', sub: 'Quadretti a stella 8 vie (* 44px)', icon: '✴️', category: 'grid' },
  { id: 'jiugongge', name: 'Jiugongge (九宫格)', sub: 'Quadretti a 9 riquadri (3x3 48px)', icon: '▦', category: 'grid' },
  { id: 'huigongge', name: 'Huigongge (回宫格)', sub: 'Doppio riquadro concentrico blu', icon: '▣', category: 'grid' },
  { id: 'wongozhi', name: 'Wongozhi Verde (원고지)', sub: 'Manoscritto coreano verde smeraldo (40px)', icon: '📗', category: 'grid' },
  { id: 'wongozhi-brick', name: 'Wongozhi Terracotta', sub: 'Manoscritto coreano color terracotta', icon: '🧱', category: 'grid' },
  { id: 'quadretti-5mm', name: 'Quadretti 5mm (Quaderno)', sub: 'Quaderno a quadretti classico 5mm (24px)', icon: '📐', category: 'grid' },
  { id: 'quadretti-10mm', name: 'Quadretti Grandi 10mm (1 cm)', sub: 'Quadretti grandi scuola elementare (48px)', icon: '📘', category: 'grid' },
];

export const PageSettingsDrawer: React.FC<PageSettingsDrawerProps> = ({
  document: doc,
  isOpen,
  onClose,
  onMarginChange,
  onGridOpacityChange,
  onLineSpacingChange,
  onCharacterSpacingChange,
  onAlignTextToGrid,
  onPaperStyleChange,
  onPaperFormatChange,
  onWritingModeChange,
  onFontSizeChange,
  onHeaderTextChange,
  onFooterTextChange,
  onTogglePageNumbers,
  showMarginGuides,
  onToggleMarginGuides,
}) => {
  if (!isOpen) return null;

  const hasGrid =
    doc.paperStyle !== 'plain' &&
    doc.paperStyle !== 'xuan' &&
    doc.paperStyle !== 'hanji';

  return (
    <div className="fixed inset-0 z-50 flex justify-end no-print bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Background click to dismiss */}
      <div className="flex-1" onClick={onClose} />

      {/* Main Drawer Panel */}
      <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-stone-200 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-900">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-stone-900 text-sm">Impostazioni Foglio & Pagina</h2>
              <p className="text-[11px] text-stone-500">Configura dimensioni, carta, margini e griglia</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
            title="Chiudi pannello"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-stone-700">
          {/* 1. Formato & Orientamento */}
          <section className="space-y-2.5">
            <h3 className="font-bold text-stone-900 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-800" />
              <span>Formato & Orientamento</span>
            </h3>

            {/* Formato Carta */}
            <div className="grid grid-cols-3 gap-2">
              {(['A4', 'B5', 'Letter'] as PaperFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => onPaperFormatChange(fmt)}
                  className={`py-2 px-3 rounded-lg border font-semibold text-xs flex flex-col items-center gap-0.5 transition-all ${
                    doc.paperFormat === fmt
                      ? 'border-amber-800 bg-amber-50 text-amber-950 ring-1 ring-amber-800 shadow-2xs'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <span className="font-bold">{fmt}</span>
                  <span className="text-[10px] text-stone-400 font-normal">
                    {fmt === 'A4' ? '210×297 mm' : fmt === 'B5' ? '176×250 mm' : '8.5×11 in'}
                  </span>
                </button>
              ))}
            </div>

            {/* Orientamento Scrittura */}
            {onWritingModeChange && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onWritingModeChange('vertical-rl')}
                  className={`py-2 px-3 rounded-lg border font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                    doc.writingMode === 'vertical-rl'
                      ? 'border-amber-800 bg-amber-50 text-amber-950 ring-1 ring-amber-800 shadow-2xs'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <RotateCw className="w-3.5 h-3.5 rotate-90 text-amber-800" />
                  <span>Verticale (竖排 · 세로)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onWritingModeChange('horizontal-tb')}
                  className={`py-2 px-3 rounded-lg border font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                    doc.writingMode === 'horizontal-tb'
                      ? 'border-amber-800 bg-amber-50 text-amber-950 ring-1 ring-amber-800 shadow-2xs'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <span className="font-mono text-xs">A→</span>
                  <span>Orizzontale (横排)</span>
                </button>
              </div>
            )}
          </section>

          {/* 2. Stile del Foglio */}
          <section className="space-y-2.5">
            <h3 className="font-bold text-stone-900 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-800" />
              <span>Stile Carta & Manoscritto</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {PAPER_STYLES.map((ps) => {
                const isSelected = doc.paperStyle === ps.id;
                return (
                  <button
                    key={ps.id}
                    type="button"
                    onClick={() => onPaperStyleChange(ps.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1 ${
                      isSelected
                        ? 'border-amber-800 bg-amber-50/80 ring-1 ring-amber-800 shadow-2xs'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base">{ps.icon}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-800" />}
                    </div>
                    <span className="font-bold text-stone-900 text-xs leading-tight">
                      {ps.name}
                    </span>
                    <span className="text-[10px] text-stone-500 leading-tight">
                      {ps.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3. Margini del Foglio */}
          <section className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-900">📐 Margini del Foglio</span>
              <span className="font-mono text-amber-950 font-bold px-2 py-0.5 bg-amber-100 rounded-md text-xs">
                {doc.marginMm} mm
              </span>
            </div>

            <input
              type="range"
              min={10}
              max={40}
              step={1}
              value={doc.marginMm}
              onChange={(e) => onMarginChange(parseInt(e.target.value, 10))}
              className="w-full accent-amber-800 cursor-pointer"
            />

            <div className="flex items-center justify-between gap-1 pt-1">
              {[12, 16, 20, 25, 30].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onMarginChange(m)}
                  className={`px-2 py-1 rounded text-[11px] font-semibold border ${
                    doc.marginMm === m
                      ? 'bg-amber-800 text-white border-amber-800'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {m}mm
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1 text-[11px] text-stone-600">
              <input
                type="checkbox"
                checked={showMarginGuides}
                onChange={(e) => onToggleMarginGuides(e.target.checked)}
                className="rounded text-amber-800 focus:ring-amber-700 w-3.5 h-3.5"
              />
              <span>Mostra guide tratteggiate margine sullo schermo</span>
            </label>
          </section>

          {/* 4. Griglia & Righe (solo se carta con griglia) */}
          {hasGrid && (
            <section className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900">✨ Intensità Righe / Quadretti</span>
                <span className="font-mono text-amber-950 font-bold px-2 py-0.5 bg-amber-100 rounded-md text-xs">
                  {Math.round((doc.gridOpacity ?? 0.55) * 100)}%
                </span>
              </div>

              <input
                type="range"
                min={0.1}
                max={1.0}
                step={0.05}
                value={doc.gridOpacity ?? 0.55}
                onChange={(e) => onGridOpacityChange(parseFloat(e.target.value))}
                className="w-full accent-amber-800 cursor-pointer"
              />

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onAlignTextToGrid}
                  className="w-full py-2 px-3 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-800" />
                  <span>Allinea Perfettamente alla Griglia</span>
                </button>
              </div>
            </section>
          )}

          {/* 5. Dimensione, Interlinea & Spaziatura Caratteri */}
          <section className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-3">
            <h4 className="font-bold text-stone-900">📏 Tipografia & Spaziatura Testo</h4>

            {/* Dimensione Carattere */}
            {onFontSizeChange && (
              <div className="space-y-1.5 pb-2 border-b border-stone-200">
                <div className="flex items-center justify-between">
                  <span className="text-stone-700 font-medium">Dimensione Carattere (Font Size):</span>
                  <span className="font-mono text-amber-950 font-bold px-1.5 py-0.5 bg-amber-100 rounded text-xs">
                    {doc.defaultFontSize} pt
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={12}
                    max={48}
                    step={1}
                    value={doc.defaultFontSize}
                    onChange={(e) => onFontSizeChange(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-800 cursor-pointer"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onFontSizeChange(Math.max(10, doc.defaultFontSize - 2))}
                      className="px-2 py-0.5 text-xs font-bold bg-white border border-stone-300 rounded hover:bg-stone-100 transition-colors"
                      title="Riduci font (A-)"
                    >
                      A-
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onFontSizeChange(Math.min(72, doc.defaultFontSize + 2))}
                      className="px-2 py-0.5 text-xs font-bold bg-white border border-stone-300 rounded hover:bg-stone-100 transition-colors"
                      title="Aumenta font (A+)"
                    >
                      A+
                    </button>
                  </div>
                </div>
              </div>
            )}

            {hasGrid ? (
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-800" />
                  <span>Sincronizzazione Griglia Attiva</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Su questa carta con quadretti o righe, ogni carattere è calibrato con precisione geometrica al passo della cella per rimanere esattamente centrato nei quadretti o tra le righe.
                </p>
                <button
                  type="button"
                  onClick={onAlignTextToGrid}
                  className="w-full py-2 px-3 bg-amber-800 hover:bg-amber-900 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Centra & Allinea Testo alla Griglia</span>
                </button>
              </div>
            ) : (
              <>
                {/* Interlinea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-700 font-medium">Interlinea (Line Spacing):</span>
                    <span className="font-mono text-amber-950 font-bold px-1.5 py-0.5 bg-amber-100 rounded text-xs">
                      {doc.lineSpacing.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1.2}
                    max={3.5}
                    step={0.05}
                    value={doc.lineSpacing}
                    onChange={(e) => onLineSpacingChange(parseFloat(e.target.value), true)}
                    className="w-full accent-amber-800 cursor-pointer"
                  />
                </div>

                {/* Spaziatura Caratteri */}
                <div className="space-y-1.5 pt-2 border-t border-stone-200">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-700 font-medium">Spaziatura Caratteri (Letter Spacing):</span>
                    <span className="font-mono text-amber-950 font-bold px-1.5 py-0.5 bg-amber-100 rounded text-xs">
                      {(doc.characterSpacing ?? 0.15).toFixed(2)} em
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={0.5}
                    step={0.02}
                    value={doc.characterSpacing ?? 0.15}
                    onChange={(e) => onCharacterSpacingChange(parseFloat(e.target.value), true)}
                    className="w-full accent-amber-800 cursor-pointer"
                  />
                </div>
              </>
            )}
          </section>

          {/* 6. Intestazione & Numeri di Pagina */}
          <section className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-3">
            <h4 className="font-bold text-stone-900">📝 Intestazione & Piè di Pagina</h4>

            <div className="space-y-1">
              <label className="text-[11px] text-stone-600 font-medium">
                Testo Intestazione (In alto):
              </label>
              <input
                type="text"
                value={doc.headerText || ''}
                onChange={(e) => onHeaderTextChange(e.target.value)}
                placeholder="es. 中华古籍 · 诗文萃选"
                className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-md text-xs text-stone-900 focus:ring-1 focus:ring-amber-700 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-stone-600 font-medium">
                Testo Piè di Pagina (In basso):
              </label>
              <input
                type="text"
                value={doc.footerText || ''}
                onChange={(e) => onFooterTextChange(e.target.value)}
                placeholder="es. CJK Scribe 文房典藏"
                className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-md text-xs text-stone-900 focus:ring-1 focus:ring-amber-700 focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1 text-[11px] text-stone-700">
              <input
                type="checkbox"
                checked={doc.showPageNumbers}
                onChange={(e) => onTogglePageNumbers(e.target.checked)}
                className="rounded text-amber-800 focus:ring-amber-700 w-3.5 h-3.5"
              />
              <span>Mostra numerazione pagina (Pagina 1, 2...)</span>
            </label>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
          >
            Chiudi Impostazioni
          </button>
        </div>
      </div>
    </div>
  );
};
