import React, { useState } from 'react';
import {
  WritingMode,
  PaperStyle,
  PaperFormat,
  BlockType,
  ListNumberingType,
} from '../types/editor';
import { CJK_FONTS, TRADITIONAL_COLORS } from '../data/fonts';
import {
  LIST_STYLE_CATEGORIES,
  LIST_STYLE_OPTIONS,
} from '../utils/listStyles';
import {
  applyStyleToSelection,
  hasActiveSelection,
} from '../utils/textFormatting';
import {
  PAPER_GRID_SPECS,
  isCursiveFont,
} from '../utils/gridAlignment';

const COMMON_FONT_SIZES = [12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 48, 56, 72];
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  RotateCw,
  Stamp,
  Table as TableIcon,
  ListOrdered,
  Minus,
  Image as ImageIcon,
  ChevronDown,
  Undo2,
  Redo2,
  Trash2,
  Eraser,
  Sliders,
  Type,
  Layers,
  Sparkles,
} from 'lucide-react';

interface FormatToolbarProps {
  writingMode: WritingMode;
  onWritingModeChange: (mode: WritingMode) => void;
  paperStyle: PaperStyle;
  onPaperStyleChange: (style: PaperStyle) => void;
  gridOpacity: number;
  onGridOpacityChange: (opacity: number) => void;
  paperFormat: PaperFormat;
  onPaperFormatChange: (format: PaperFormat) => void;
  activeFontFamily: string;
  onFontFamilyChange: (fontCss: string) => void;
  activeFontSize: number;
  onFontSizeChange: (size: number) => void;
  activeColor: string;
  onColorChange: (color: string) => void;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  onTextAlignChange: (align: 'left' | 'center' | 'right' | 'justify') => void;
  lineHeight: number;
  onLineHeightChange: (lh: number) => void;
  letterSpacing: number;
  onLetterSpacingChange: (ls: number) => void;
  onOpenRubyModal: () => void;
  onOpenSealModal: () => void;
  onOpenTableModal: () => void;
  onInsertList: (style?: ListNumberingType) => void;
  onInsertDivider: () => void;
  onInsertImage: () => void;
  onToggleEmphasisDots: () => void;
  hasEmphasisDots: boolean;
  activeBlockType?: BlockType;
  activeListStyle?: ListNumberingType;
  onListStyleChange?: (style: ListNumberingType) => void;
  isKorean?: boolean;
  canUndo?: boolean;
  onUndo?: () => void;
  canRedo?: boolean;
  onRedo?: () => void;
  canDelete?: boolean;
  onDeleteActiveBlock?: () => void;
  onClearSheet?: () => void;
  onOpenSettings?: () => void;
  onAlignTextToGrid?: () => void;
  activeBlockId?: string | null;
  onUpdateBlockContent?: (blockId: string, content: string) => void;
}

export const FormatToolbar: React.FC<FormatToolbarProps> = ({
  writingMode,
  onWritingModeChange,
  paperStyle,
  onPaperStyleChange,
  gridOpacity,
  onGridOpacityChange,
  paperFormat,
  onPaperFormatChange,
  activeFontFamily,
  onFontFamilyChange,
  activeFontSize,
  onFontSizeChange,
  activeColor,
  onColorChange,
  textAlign,
  onTextAlignChange,
  lineHeight,
  onLineHeightChange,
  letterSpacing,
  onLetterSpacingChange,
  onOpenRubyModal,
  onOpenSealModal,
  onOpenTableModal,
  onInsertList,
  onInsertDivider,
  onInsertImage,
  onToggleEmphasisDots,
  hasEmphasisDots,
  activeBlockType,
  activeListStyle,
  onListStyleChange,
  isKorean = false,
  canUndo = false,
  onUndo,
  canRedo = false,
  onRedo,
  canDelete = false,
  onDeleteActiveBlock,
  onClearSheet,
  onOpenSettings,
  onAlignTextToGrid,
  activeBlockId,
  onUpdateBlockContent,
}) => {
  const [showColorPopover, setShowColorPopover] = useState(false);
  const [showListDropdown, setShowListDropdown] = useState(false);
  const [mobileTab, setMobileTab] = useState<'font' | 'paper' | 'insert' | 'actions'>('font');

  const isTableActive = activeBlockType === 'table';

  const handleFontSelect = (fontCss: string) => {
    if (hasActiveSelection()) {
      const res = applyStyleToSelection({ fontFamily: fontCss }, activeBlockId);
      if (res && onUpdateBlockContent) {
        onUpdateBlockContent(res.blockId, res.newHtml);
        return;
      }
    }
    onFontFamilyChange(fontCss);
  };

  const handleFontSizeSelect = (size: number) => {
    if (hasActiveSelection()) {
      const res = applyStyleToSelection({ fontSize: size }, activeBlockId);
      if (res && onUpdateBlockContent) {
        onUpdateBlockContent(res.blockId, res.newHtml);
        return;
      }
    }
    onFontSizeChange(size);
  };

  const handleColorSelect = (colorHex: string) => {
    if (hasActiveSelection()) {
      const res = applyStyleToSelection({ color: colorHex }, activeBlockId);
      if (res && onUpdateBlockContent) {
        onUpdateBlockContent(res.blockId, res.newHtml);
      }
    }
    onColorChange(colorHex);
  };

  return (
    <div className="no-print bg-stone-50 border-b border-stone-200 px-3 sm:px-4 py-2 text-stone-700 shadow-2xs">
      {/* Mobile Toolbar Category Switcher (Visible on small screens) */}
      <div className="flex md:hidden items-center justify-between gap-1 pb-2 mb-2 border-b border-stone-200/70 overflow-x-auto text-xs font-medium">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMobileTab('font')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
              mobileTab === 'font'
                ? 'bg-amber-800 text-white font-semibold shadow-2xs'
                : 'text-stone-600 bg-white border border-stone-200 hover:bg-stone-100'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Testo & Font</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('paper')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
              mobileTab === 'paper'
                ? 'bg-amber-800 text-white font-semibold shadow-2xs'
                : 'text-stone-600 bg-white border border-stone-200 hover:bg-stone-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Foglio</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('insert')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
              mobileTab === 'insert'
                ? 'bg-amber-800 text-white font-semibold shadow-2xs'
                : 'text-stone-600 bg-white border border-stone-200 hover:bg-stone-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Inserisci</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('actions')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
              mobileTab === 'actions'
                ? 'bg-amber-800 text-white font-semibold shadow-2xs'
                : 'text-stone-600 bg-white border border-stone-200 hover:bg-stone-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Azioni</span>
          </button>
        </div>

        {/* Quick mobile undo/redo */}
        <div className="flex items-center bg-white border border-stone-200 rounded p-0.5 shrink-0">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1 text-stone-600 disabled:opacity-30"
            title="Annulla"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1 text-stone-600 disabled:opacity-30"
            title="Ripristina"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Toolbar Body (Responsive Flex: tabs on mobile, full grid on desktop) */}
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
        {/* Actions section on desktop or when 'actions' tab is active */}
        <div className={`items-center gap-1 bg-white p-0.5 rounded-md border border-stone-200 ${
          mobileTab === 'actions' ? 'flex' : 'hidden md:flex'
        }`}>
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 text-stone-600 hover:text-stone-900 rounded disabled:opacity-30 transition-colors"
            title="Annulla ultima azione (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 text-stone-600 hover:text-stone-900 rounded disabled:opacity-30 transition-colors"
            title="Ripristina azione (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-stone-200 mx-0.5" />
          <button
            type="button"
            onClick={onDeleteActiveBlock}
            disabled={!canDelete}
            className="px-2 py-1 text-xs text-stone-600 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-30 flex items-center gap-1 transition-colors"
            title="Elimina blocco selezionato"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
            <span className="hidden sm:inline">Elimina</span>
          </button>
          <button
            type="button"
            onClick={onClearSheet}
            className="px-2 py-1 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded flex items-center gap-1 transition-colors"
            title="Pulisci foglio (rimuove tutti i blocchi dalla pagina)"
          >
            <Eraser className="w-3.5 h-3.5 text-amber-800" />
            <span className="hidden sm:inline">Pulisci Foglio</span>
          </button>
        </div>

        {/* Layout: Vertical vs Horizontal */}
        <div className={`items-center gap-1 bg-white p-0.5 rounded-md border border-stone-200 ${
          mobileTab === 'paper' ? 'flex' : 'hidden md:flex'
        }`}>
          <button
            type="button"
            onClick={() => onWritingModeChange('vertical-rl')}
            className={`px-2.5 py-1 text-xs rounded transition-all font-medium flex items-center gap-1.5 ${
              writingMode === 'vertical-rl'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
            title="Orientamento Verticale tradizionale Est-Asiatico (da destra a sinistra)"
          >
            <RotateCw className="w-3 h-3 rotate-90" />
            <span>Verticale (竖排)</span>
          </button>
          <button
            type="button"
            onClick={() => onWritingModeChange('horizontal-tb')}
            className={`px-2.5 py-1 text-xs rounded transition-all font-medium flex items-center gap-1.5 ${
              writingMode === 'horizontal-tb'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
            title="Orientamento Orizzontale moderno"
          >
            <span className="font-mono text-xs">A→</span>
            <span>Orizzontale (横排)</span>
          </button>
        </div>

        {/* Paper Background & Grid */}
        <div className={`items-center gap-1.5 text-xs flex-wrap ${
          mobileTab === 'paper' ? 'flex' : 'hidden md:flex'
        }`}>
          <span className="text-stone-400 font-medium">Foglio:</span>
          <select
            value={paperStyle}
            onChange={(e) => onPaperStyleChange(e.target.value as PaperStyle)}
            className="px-2 py-1 bg-white border border-stone-200 rounded text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-700 font-medium max-w-[210px] truncate"
          >
            <optgroup label="Manoscritti Coreani (한국 원고지)">
              <option value="wongozhi">Wongozhi Verde (원고지 · 녹색 40px)</option>
              <option value="wongozhi-brick">Wongozhi Terracotta (원고지 · 황토 40px)</option>
              <option value="hanji">Carta Hanji (전통 한지)</option>
            </optgroup>
            <optgroup label="Carte e Griglie Cinesi (中华传统信笺)">
              <option value="classical-vertical">Righe Rosse 朱丝栏 (Colonne 48px)</option>
              <option value="classical-vertical-slate">Righe Inchiostro 乌丝栏 (Colonne 48px)</option>
              <option value="tianzige">Griglia Tianzige 田字格 (Croce + 44px)</option>
              <option value="mizige">Griglia Mizige 米字格 (Stella * 44px)</option>
              <option value="jiugongge">Griglia Jiugongge 九宫格 (3x3 48px)</option>
              <option value="huigongge">Griglia Huigongge 回宫格 (Doppio Riquadro 44px)</option>
              <option value="xuan">Carta Xuan 宣纸</option>
            </optgroup>
            <optgroup label="Quadretti e Righe Generali">
              <option value="quadretti-5mm">Quadretti 5mm (Quaderno 24px)</option>
              <option value="quadretti-10mm">Quadretti Grandi 10mm (1 cm · 48px)</option>
              <option value="classical-horizontal">Righe Orizzontali (Quaderno 36px)</option>
              <option value="plain">Bianco Pulito (Senza righe)</option>
            </optgroup>
          </select>

          {paperStyle !== 'plain' && paperStyle !== 'xuan' && paperStyle !== 'hanji' && (
            <div className="flex items-center gap-1 bg-white border border-stone-200 px-2 py-1 rounded shadow-2xs">
              <span className="text-[11px] text-stone-500 whitespace-nowrap">Righe:</span>
              <input
                type="range"
                min={0.1}
                max={1.0}
                step={0.05}
                value={gridOpacity}
                onChange={(e) => onGridOpacityChange(parseFloat(e.target.value))}
                className="w-14 sm:w-16 accent-amber-800 cursor-pointer h-1.5"
                title="Intensità visiva delle righe o dei quadretti"
              />
              <span className="text-[10px] font-mono font-medium text-stone-700 min-w-[24px]">
                {Math.round(gridOpacity * 100)}%
              </span>
            </div>
          )}

          {/* Formato */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-stone-400 font-medium">Formato:</span>
            <select
              value={paperFormat}
              onChange={(e) => onPaperFormatChange(e.target.value as PaperFormat)}
              className="px-2 py-1 bg-white border border-stone-200 rounded text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-700"
            >
              <option value="A4">A4</option>
              <option value="B5">B5</option>
              <option value="Letter">Letter</option>
            </select>
          </div>

          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-2 py-1 text-xs bg-white hover:bg-stone-100 border border-stone-200 rounded text-stone-700 flex items-center gap-1 font-medium transition-colors shadow-2xs"
              title="Apri impostazioni pagina: margini, intensità griglia, interlinea, intestazione"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-800" />
              <span>Impostazioni Foglio</span>
            </button>
          )}
        </div>

        <div className="h-5 w-px bg-stone-300 hidden xl:block" />

        {/* Font Selector & Size */}
        <div className={`items-center gap-2 text-xs flex-wrap ${
          mobileTab === 'font' ? 'flex' : 'hidden md:flex'
        }`}>
          <div className="flex items-center gap-1">
            <span className="text-stone-400 font-medium">Font:</span>
            <select
              value={activeFontFamily}
              onChange={(e) => handleFontSelect(e.target.value)}
              className="max-w-[170px] sm:max-w-[210px] truncate px-2 py-1 bg-white border border-stone-200 rounded text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-700 font-serif"
              title="Modifica font (applica al testo selezionato o all'intero blocco)"
            >
              <optgroup label="Cinese · Corsivo (行书/草书/楷书)">
                {CJK_FONTS.filter((f) => f.language === 'zh' && f.category === 'cursive').map((f) => (
                  <option key={f.id} value={f.cssFamily}>
                    {f.nativeName}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Cinese · Stampatello (宋体/黑体)">
                {CJK_FONTS.filter((f) => f.language === 'zh' && f.category === 'print').map((f) => (
                  <option key={f.id} value={f.cssFamily}>
                    {f.nativeName}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Coreano · Corsivo & Pennello (붓글씨/손글씨)">
                {CJK_FONTS.filter((f) => f.language === 'ko' && f.category === 'cursive').map((f) => (
                  <option key={f.id} value={f.cssFamily}>
                    {f.nativeName}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Coreano · Stampatello (바탕/명조/고딕)">
                {CJK_FONTS.filter((f) => f.language === 'ko' && f.category === 'print').map((f) => (
                  <option key={f.id} value={f.cssFamily}>
                    {f.nativeName}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Font Size & Steppers (Works for selected text, paragraphs, headings AND tables!) */}
          <div className="flex items-center gap-1">
            <span className="text-stone-400 font-medium">
              {isTableActive ? 'Font Tabella:' : 'Dim:'}
            </span>
            <div className="flex items-center bg-white border border-stone-200 rounded shadow-2xs">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleFontSizeSelect(Math.max(10, activeFontSize - 2))}
                className="px-2 py-0.5 text-stone-700 hover:text-stone-950 hover:bg-stone-100 font-bold text-xs"
                title="Riduci font (A-)"
              >
                A-
              </button>
              <select
                value={activeFontSize}
                onChange={(e) => handleFontSizeSelect(parseInt(e.target.value, 10))}
                className="px-1 py-0.5 text-center font-mono font-bold text-xs text-amber-950 bg-transparent focus:outline-none cursor-pointer border-x border-stone-100"
                title="Seleziona grandezza font"
              >
                {COMMON_FONT_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}pt
                  </option>
                ))}
              </select>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleFontSizeSelect(Math.min(72, activeFontSize + 2))}
                className="px-2 py-0.5 text-stone-700 hover:text-stone-950 hover:bg-stone-100 font-bold text-xs"
                title="Aumenta font (A+)"
              >
                A+
              </button>
            </div>
          </div>

          {/* Color Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColorPopover(!showColorPopover)}
              className="flex items-center gap-1.5 px-2 py-1 bg-white border border-stone-200 rounded text-xs hover:border-stone-400 transition-colors shadow-2xs"
              title="Colore inchiostro"
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-stone-300 inline-block shadow-2xs"
                style={{ backgroundColor: activeColor }}
              />
              <span className="text-xs font-mono text-stone-700 hidden sm:inline">{activeColor}</span>
            </button>

            {showColorPopover && (
              <div className="absolute top-full left-0 mt-1 z-50 p-3 bg-white border border-stone-200 rounded-xl shadow-2xl w-64">
                <div className="text-xs font-bold text-stone-700 mb-2">
                  Tavolozza Tradizionale CJK
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {TRADITIONAL_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => {
                        handleColorSelect(col.hex);
                        setShowColorPopover(false);
                      }}
                      className="flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-stone-50 group"
                      title={col.name}
                    >
                      <span
                        className="w-6 h-6 rounded-full border border-stone-200 shadow-2xs group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span className="text-[10px] text-stone-600 truncate w-full text-center">
                        {col.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-stone-100 text-xs">
                  <span className="text-stone-500 font-medium">Personalizzato:</span>
                  <input
                    type="color"
                    value={activeColor}
                    onChange={(e) => handleColorSelect(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border border-stone-300"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Text Align */}
          <div className="flex items-center bg-white border border-stone-200 rounded p-0.5">
            <button
              type="button"
              onClick={() => onTextAlignChange('left')}
              className={`p-1 rounded text-stone-600 hover:text-stone-900 ${
                textAlign === 'left' ? 'bg-stone-200 text-stone-900' : ''
              }`}
              title="Allinea in alto (verticale) / A sinistra (orizzontale)"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onTextAlignChange('center')}
              className={`p-1 rounded text-stone-600 hover:text-stone-900 ${
                textAlign === 'center' ? 'bg-stone-200 text-stone-900' : ''
              }`}
              title="Allinea al centro (centra verticalmente nel foglio / colonna)"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onTextAlignChange('right')}
              className={`p-1 rounded text-stone-600 hover:text-stone-900 ${
                textAlign === 'right' ? 'bg-stone-200 text-stone-900' : ''
              }`}
              title="Allinea in basso (verticale) / A destra (orizzontale)"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onTextAlignChange('justify')}
              className={`p-1 rounded text-stone-600 hover:text-stone-900 ${
                textAlign === 'justify' ? 'bg-stone-200 text-stone-900' : ''
              }`}
              title="Giustificato"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>

          {paperStyle !== 'plain' && paperStyle !== 'xuan' && paperStyle !== 'hanji' ? (
            <div className="flex items-center gap-1.5 bg-amber-50/90 border border-amber-300 px-2.5 py-1 rounded shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-800" />
              <span className="text-xs font-semibold text-amber-950">
                Allineamento Griglia Attivo
              </span>
              {onAlignTextToGrid && (
                <button
                  type="button"
                  onClick={onAlignTextToGrid}
                  className="ml-1 px-2 py-0.5 text-[11px] bg-amber-800 hover:bg-amber-900 text-white rounded font-bold transition-colors shadow-2xs flex items-center gap-1"
                  title="Forza riallineamento perfetto di ogni carattere nei quadretti o sulle righe"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Riallinea</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Interlinea (Spaziatura Righe / Colonne per carta bianca/xuan) */}
              <div className="flex items-center gap-1 bg-white border border-stone-200 px-1.5 py-0.5 rounded shadow-2xs">
                <span className="text-[11px] text-stone-500 font-medium whitespace-nowrap">Interlinea:</span>
                <button
                  type="button"
                  onClick={() => onLineHeightChange(Math.max(1.0, Math.round((lineHeight - 0.1) * 10) / 10))}
                  className="px-1.5 py-0.5 text-stone-600 hover:text-stone-950 hover:bg-stone-100 font-bold rounded"
                  title="Riduci interlinea (-0.1)"
                >
                  -
                </button>
                <span className="px-1 py-0.5 min-w-[28px] text-center font-mono font-bold text-xs text-amber-950">
                  {lineHeight.toFixed(1)}
                </span>
                <button
                  type="button"
                  onClick={() => onLineHeightChange(Math.min(4.0, Math.round((lineHeight + 0.1) * 10) / 10))}
                  className="px-1.5 py-0.5 text-stone-600 hover:text-stone-950 hover:bg-stone-100 font-bold rounded"
                  title="Aumenta interlinea (+0.1)"
                >
                  +
                </button>
              </div>

              {/* Spaziatura Caratteri */}
              <div className="flex items-center gap-1 bg-white border border-stone-200 px-1.5 py-0.5 rounded shadow-2xs">
                <span className="text-[11px] text-stone-500 font-medium whitespace-nowrap">Spaz. Caratteri:</span>
                <button
                  type="button"
                  onClick={() => onLetterSpacingChange(Math.max(0, Math.round((letterSpacing - 0.05) * 100) / 100))}
                  className="px-1.5 py-0.5 text-stone-600 hover:text-stone-950 hover:bg-stone-100 font-bold rounded"
                  title="Riduci spaziatura caratteri"
                >
                  -
                </button>
                <span className="px-1 py-0.5 min-w-[34px] text-center font-mono font-bold text-xs text-amber-950">
                  {letterSpacing.toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => onLetterSpacingChange(Math.min(0.5, Math.round((letterSpacing + 0.05) * 100) / 100))}
                  className="px-1.5 py-0.5 text-stone-600 hover:text-stone-950 hover:bg-stone-100 font-bold rounded"
                  title="Aumenta spaziatura caratteri"
                >
                  +
                </button>
              </div>
            </>
          )}

          {/* Emphasis Dots */}
          <button
            type="button"
            onClick={onToggleEmphasisDots}
            className={`px-2 py-1 text-xs rounded border transition-colors flex items-center gap-1 ${
              hasEmphasisDots
                ? 'bg-amber-100 border-amber-800 text-amber-900 font-semibold'
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
            }`}
            title="Aggiungi punti di enfasi CJK (着重号)"
          >
            <span className="font-serif">字·</span>
            <span className="hidden sm:inline">Enfasi CJK</span>
          </button>
        </div>

        {/* Special CJK Inserters */}
        <div className={`items-center gap-1.5 flex-wrap ${
          mobileTab === 'insert' ? 'flex' : 'hidden md:flex'
        }`}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onOpenRubyModal}
            className="px-2.5 py-1 text-xs bg-white hover:bg-stone-100 border border-stone-200 rounded text-stone-800 flex items-center gap-1 transition-colors shadow-2xs"
            title="Inserisci annotazione fonetica Ruby (Pinyin / Hangul)"
          >
            <span className="font-serif text-xs font-bold text-amber-800">
              漢<sup className="text-[9px] text-stone-500">hàn</sup>
            </span>
            <span>Ruby / Pinyin</span>
          </button>

          <button
            type="button"
            onClick={onOpenSealModal}
            className="px-2.5 py-1 text-xs bg-white hover:bg-stone-100 border border-stone-200 rounded text-stone-800 flex items-center gap-1 transition-colors shadow-2xs"
            title="Inserisci Sigillo CJK (印章 / 도장)"
          >
            <Stamp className="w-3.5 h-3.5 text-red-700" />
            <span>Sigillo</span>
          </button>

          <button
            type="button"
            onClick={onOpenTableModal}
            className="px-2.5 py-1 text-xs bg-white hover:bg-stone-100 border border-stone-200 rounded text-stone-800 flex items-center gap-1 transition-colors shadow-2xs"
            title="Inserisci tabella"
          >
            <TableIcon className="w-3.5 h-3.5 text-stone-600" />
            <span>Tabella</span>
          </button>

          {/* Elenco numerato con menu a discesa migliorato e font confortevole */}
          <div className="relative inline-flex items-center">
            <button
              type="button"
              onClick={() => onInsertList(isKorean ? 'arabic-dot' : 'arabic-dot')}
              className="px-2.5 py-1 text-xs bg-white hover:bg-stone-100 border border-stone-200 rounded-l text-stone-800 flex items-center gap-1 transition-colors shadow-2xs font-medium"
              title="Inserisci elenco"
            >
              <ListOrdered className="w-3.5 h-3.5 text-amber-800" />
              <span>Lista</span>
            </button>
            <button
              type="button"
              onClick={() => setShowListDropdown(!showListDropdown)}
              className="px-2 py-1 text-xs bg-white hover:bg-stone-100 border-t border-b border-r border-stone-200 rounded-r text-stone-600 transition-colors shadow-2xs"
              title="Scegli stile elenco (font e stili chiari)"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {/* List styles popover with CLEAR, GENEROUS TYPOGRAPHY */}
            {showListDropdown && (
              <div className="absolute top-full left-0 mt-1 z-50 p-3 bg-white border border-stone-200 rounded-2xl shadow-2xl w-80 sm:w-96 text-left max-h-[75vh] overflow-y-auto">
                <div className="pb-2 mb-2 border-b border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ListOrdered className="w-4 h-4 text-amber-800" />
                    <span className="text-sm font-bold text-stone-900">
                      Scegli Stile Elenco
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowListDropdown(false)}
                    className="text-xs text-stone-400 hover:text-stone-700"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-3">
                  {LIST_STYLE_CATEGORIES.map((cat) => (
                    <div key={cat.id} className="space-y-1">
                      <div className="text-xs font-bold text-amber-950 bg-amber-100/70 px-2.5 py-1 rounded-md">
                        {cat.name}
                      </div>
                      <div className="space-y-1 pl-1">
                        {LIST_STYLE_OPTIONS.filter((o) => o.category === cat.id).map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              onInsertList(opt.value);
                              setShowListDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-stone-800 hover:bg-amber-50 hover:text-amber-950 rounded-lg flex items-center justify-between group transition-colors border border-transparent hover:border-amber-200"
                          >
                            <span className="font-medium text-xs sm:text-sm text-stone-800 group-hover:text-amber-950">
                              {opt.label}
                            </span>
                            <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100/60 px-2 py-0.5 rounded shrink-0 ml-2">
                              {opt.sample}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onInsertDivider}
            className="px-2 py-1 text-xs bg-white hover:bg-stone-100 border border-stone-200 rounded text-stone-800 flex items-center gap-1 transition-colors shadow-2xs"
            title="Inserisci separatore ornamentale"
          >
            <Minus className="w-3.5 h-3.5 text-stone-600" />
            <span>Separatore</span>
          </button>

          <button
            type="button"
            onClick={onInsertImage}
            className="px-2.5 py-1 text-xs bg-white hover:bg-amber-50 hover:border-amber-300 border border-stone-200 rounded text-amber-900 font-semibold flex items-center gap-1 transition-colors shadow-2xs"
            title="Inserisci immagine"
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-800" />
            <span>Immagine</span>
          </button>
        </div>
      </div>
    </div>
  );
};
