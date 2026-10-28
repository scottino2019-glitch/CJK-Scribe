import React, { useState, useEffect } from 'react';
import {
  CJKDocument,
  DocumentBlock,
  TableCell,
  SealData,
  BlockType,
  ImageData,
  ListNumberingType,
  WritingMode,
  PaperFormat,
  PaperStyle,
} from '../types/editor';
import {
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  Plus,
  PlusCircle,
  Settings2,
  Image as ImageIcon,
  Columns,
  AlignLeft,
  AlignCenter,
  Smartphone,
  Monitor,
  RotateCw,
  Sparkles,
  SlidersHorizontal,
  Layers,
} from 'lucide-react';
import {
  renderListMarker,
  LIST_STYLE_OPTIONS,
  LIST_STYLE_CATEGORIES,
} from '../utils/listStyles';
import { CJK_FONTS } from '../data/fonts';
import {
  PAPER_GRID_SPECS,
  getPaperBaseColorHex,
  getBlockExactGridStyle,
} from '../utils/gridAlignment';
import { EditableBlock } from './EditableBlock';

interface DocumentPaperProps {
  document: CJKDocument;
  activeBlockId: string | null;
  onSelectBlock: (blockId: string) => void;
  onUpdateBlock: (blockId: string, updates: Partial<DocumentBlock>) => void;
  onDeleteBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void;
  onDuplicateBlock: (blockId: string) => void;
  onAddBlockAfter: (afterBlockId: string, type: BlockType) => void;
  onEditSeal: (seal: SealData, blockId: string) => void;
  onEditImage: (blockId: string, initialData?: ImageData, currentContent?: string) => void;
  onOpenRubyModal?: () => void;
  onAddPage: () => void;
  onDeletePage: (pageIndex: number) => void;
  onWritingModeChange?: (mode: WritingMode) => void;
  onChangeFontSize?: (newSize: number) => void;
  onPaperFormatChange?: (format: PaperFormat) => void;
  onPaperStyleChange?: (style: PaperStyle) => void;
  onAlignTextToGrid?: () => void;
  onOpenPageSettings?: () => void;
  showMarginGuides?: boolean;
}

export const DocumentPaper: React.FC<DocumentPaperProps> = ({
  document: doc,
  activeBlockId,
  onSelectBlock,
  onUpdateBlock,
  onDeleteBlock,
  onMoveBlock,
  onDuplicateBlock,
  onAddBlockAfter,
  onEditSeal,
  onEditImage,
  onAddPage,
  onDeletePage,
  onWritingModeChange,
  onChangeFontSize,
  onPaperFormatChange,
  onPaperStyleChange,
  onAlignTextToGrid,
  onOpenPageSettings,
  showMarginGuides,
}) => {
  const isVertical = doc.writingMode === 'vertical-rl';

  // Paper base color in HEX for exact inline styling and PDF fidelity
  const paperBgHex = getPaperBaseColorHex(doc.paperStyle);

  // Pattern class for manuscript lines and grids
  const getPatternClass = () => {
    switch (doc.paperStyle) {
      case 'wongozhi':
        return 'pattern-wongozhi';
      case 'wongozhi-brick':
        return 'pattern-wongozhi-brick';
      case 'classical-vertical':
        return 'pattern-classical-vertical';
      case 'classical-vertical-slate':
        return 'pattern-classical-vertical-slate';
      case 'tianzige':
        return 'pattern-tianzige';
      case 'mizige':
        return 'pattern-mizige';
      case 'jiugongge':
        return 'pattern-jiugongge';
      case 'huigongge':
        return 'pattern-huigongge';
      case 'quadretti-5mm':
        return 'pattern-quadretti-5mm';
      case 'quadretti-10mm':
        return 'pattern-quadretti-10mm';
      case 'classical-horizontal':
        return 'pattern-classical-horizontal';
      default:
        return '';
    }
  };

  // Dimension per format
  const getPageDimensions = () => {
    switch (doc.paperFormat) {
      case 'B5':
        return { minHeight: 945, width: 665 };
      case 'Letter':
        return { minHeight: 1056, width: 816 };
      case 'A4':
      default:
        return { minHeight: 1123, width: 794 };
    }
  };

  const pageDim = getPageDimensions();

  // Render seal
  const renderSeal = (seal: SealData, blockId: string) => {
    const isYin = seal.style === 'yin';
    const isRound = seal.shape === 'round';
    const isOval = seal.shape === 'oval';

    const borderRadius = isRound ? '9999px' : isOval ? '50% / 40%' : '3px';
    const borderClass =
      seal.borderStyle === 'double'
        ? 'border-4 border-double'
        : 'border-2';

    return (
      <div
        key={seal.id}
        onClick={(e) => {
          e.stopPropagation();
          onEditSeal(seal, blockId);
        }}
        className={`cursor-pointer group relative inline-flex items-center justify-center select-none shadow-xs transition-transform hover:scale-105 active:scale-95 ${borderClass}`}
        style={{
          width: `${seal.size}px`,
          height: isOval ? `${Math.round(seal.size * 1.25)}px` : `${seal.size}px`,
          borderRadius,
          backgroundColor: isYin ? seal.color : '#ffffff',
          borderColor: seal.color,
          transform: `rotate(${seal.rotation}deg)`,
          padding: '3px',
        }}
        title="Clicca per modificare questo sigillo"
      >
        <div
          className="font-cjk-print-sc font-bold leading-tight tracking-wider text-center flex flex-wrap items-center justify-center"
          style={{
            color: isYin ? '#ffffff' : seal.color,
            fontSize: `${Math.max(11, Math.round(seal.size / (seal.text.length > 2 ? 2.3 : 1.7)))}px`,
            maxWidth: seal.text.length > 2 ? '80%' : '100%',
            writingMode: seal.text.length > 2 ? 'vertical-rl' : 'horizontal-tb',
          }}
        >
          {seal.text}
        </div>
      </div>
    );
  };

  // Render block content
  const renderBlockContent = (block: DocumentBlock) => {
    const blockFont = block.fontFamily || doc.defaultFontFamily;
    const blockFontSize = block.fontSize || doc.defaultFontSize;
    const blockColor = block.color || doc.primaryColor;
    const blockAlign = block.textAlign || 'left';

    const gridStyle = getBlockExactGridStyle(
      doc.paperStyle,
      doc.writingMode,
      block.fontSize || doc.defaultFontSize,
      blockFont
    );
    const isGridPaper = gridStyle.isGridPaper;

    const blockLineHeight = block.lineHeight ?? doc.lineSpacing ?? 1.5;
    const isNotebookPaper =
      doc.paperStyle === 'quadretti-5mm' ||
      doc.paperStyle === 'quadretti-10mm' ||
      doc.paperStyle === 'classical-horizontal';

    const hasRuby = block.content?.includes('<ruby>');
    const effectiveLineHeight = hasRuby
      ? Math.max(blockLineHeight, 1.8)
      : blockLineHeight;

    const blockTextAlign = isVertical
      ? 'left'
      : (isGridPaper && blockAlign === 'center' ? 'left' : blockAlign);

    const commonStyle: React.CSSProperties = isGridPaper
      ? {
          fontFamily: blockFont,
          fontSize: `${gridStyle.fontSize}px`,
          color: blockColor,
          textAlign: blockTextAlign,
          lineHeight: gridStyle.lineHeight,
          letterSpacing: gridStyle.letterSpacing,
          paddingLeft: gridStyle.paddingLeft || '0px',
          paddingTop: gridStyle.paddingTop || '0px',
          paddingRight: gridStyle.paddingRight || '0px',
          paddingBottom: '0px',
          margin: '0px',
          minHeight: `${gridStyle.pitch || 44}px`,
          boxSizing: 'border-box',
          fontWeight: block.fontWeight || 'normal',
          fontStyle: block.fontStyle || 'normal',
          wordBreak: isNotebookPaper ? 'break-word' : 'break-all',
          fontVariantEastAsian: isNotebookPaper ? undefined : 'full-width',
          textOrientation: isVertical ? 'upright' : undefined,
        }
      : {
          fontFamily: blockFont,
          fontSize: `${blockFontSize}px`,
          color: blockColor,
          textAlign: blockAlign,
          lineHeight: effectiveLineHeight,
          letterSpacing: `${block.letterSpacing ?? doc.characterSpacing}em`,
          fontWeight: block.fontWeight || 'normal',
          fontStyle: block.fontStyle || 'normal',
        };

    switch (block.type) {
      case 'heading1': {
        const h1FontSize = block.fontSize || (isGridPaper
          ? gridStyle.fontSize
          : Math.round(doc.defaultFontSize * 1.5));
        return (
          <EditableBlock
            blockId={block.id}
            content={block.content}
            placeholder="Inserisci Titolo Principale..."
            onFocus={() => onSelectBlock(block.id)}
            onChange={(html) => onUpdateBlock(block.id, { content: html })}
            onBlur={(html) => onUpdateBlock(block.id, { content: html })}
            style={{
              ...commonStyle,
              fontSize: `${h1FontSize}px`,
              fontWeight: 'bold',
            }}
            className={`whitespace-pre-wrap ${
              isGridPaper ? 'p-0 m-0' : 'py-1.5'
            } ${block.hasEmphasisDots ? 'cjk-emphasis-dot' : ''}`}
          />
        );
      }

      case 'heading2': {
        const h2FontSize = block.fontSize || (isGridPaper
          ? gridStyle.fontSize
          : Math.round(doc.defaultFontSize * 1.15));
        return (
          <EditableBlock
            blockId={block.id}
            content={block.content}
            placeholder="Inserisci Sottotitolo / Autore..."
            onFocus={() => onSelectBlock(block.id)}
            onChange={(html) => onUpdateBlock(block.id, { content: html })}
            onBlur={(html) => onUpdateBlock(block.id, { content: html })}
            style={{
              ...commonStyle,
              fontSize: `${h2FontSize}px`,
              color: block.color || '#475569',
              fontWeight: '600',
            }}
            className={`whitespace-pre-wrap ${
              isGridPaper ? 'p-0 m-0' : 'py-1'
            } ${block.hasEmphasisDots ? 'cjk-emphasis-dot' : ''}`}
          />
        );
      }

      case 'paragraph':
        return (
          <EditableBlock
            blockId={block.id}
            content={block.content}
            placeholder="Inizia a scrivere il testo del documento..."
            onFocus={() => onSelectBlock(block.id)}
            onChange={(html) => onUpdateBlock(block.id, { content: html })}
            onBlur={(html) => onUpdateBlock(block.id, { content: html })}
            style={commonStyle}
            className={`whitespace-pre-wrap ${
              isGridPaper ? 'p-0 m-0' : 'py-1'
            } ${block.hasEmphasisDots ? 'cjk-emphasis-dot' : ''}`}
          />
        );

      case 'poem-stanza':
        return (
          <EditableBlock
            blockId={block.id}
            content={block.content}
            placeholder="Inserisci versi poetici..."
            onFocus={() => onSelectBlock(block.id)}
            onChange={(html) => onUpdateBlock(block.id, { content: html })}
            onBlur={(html) => onUpdateBlock(block.id, { content: html })}
            style={{
              ...commonStyle,
              fontWeight: '500',
            }}
            className={`whitespace-pre-wrap ${
              isGridPaper ? 'p-0 m-0' : 'py-2'
            } ${block.hasEmphasisDots ? 'cjk-emphasis-dot' : ''}`}
          />
        );

      case 'divider': {
        if (isVertical) {
          const colWidth = isGridPaper ? (gridStyle.pitch || 48) : 32;
          return (
            <div
              className="h-full flex items-center justify-center select-none shrink-0 self-stretch my-auto"
              style={{ width: `${colWidth}px`, minWidth: `${colWidth}px` }}
            >
              <div
                className={`h-full ${
                  block.dividerStyle === 'double'
                    ? 'border-r-4 border-double border-stone-300'
                    : block.dividerStyle === 'dotted'
                    ? 'border-r-2 border-dotted border-stone-300'
                    : 'border-r border-stone-300'
                }`}
                style={{ minHeight: '180px', height: '100%' }}
              />
            </div>
          );
        }
        const rowHeight = isGridPaper ? (gridStyle.pitch || 36) : 32;
        return (
          <div
            className="flex items-center justify-center select-none w-full"
            style={{ height: `${rowHeight}px`, minHeight: `${rowHeight}px` }}
          >
            <div
              className={`w-full max-w-md ${
                block.dividerStyle === 'double'
                  ? 'border-t-4 border-double border-stone-300'
                  : block.dividerStyle === 'dotted'
                  ? 'border-t-2 border-dotted border-stone-300'
                  : 'border-t border-stone-300'
              }`}
            />
          </div>
        );
      }

      case 'seal-group':
        return (
          <div className="py-2.5 flex items-center justify-end gap-3 flex-wrap">
            {block.seals && block.seals.length > 0 ? (
              block.seals.map((s) => renderSeal(s, block.id))
            ) : (
              <span className="text-xs text-stone-400 italic">Nessun sigillo</span>
            )}
          </div>
        );

      case 'list': {
        const listData = block.listData || {
          style: 'chinese-num',
          items: [{ id: '1', text: '' }],
        };
        const currentStyle = listData.style || 'chinese-num';

        return (
          <div className="py-1.5 space-y-2">
            {/* List Header & Style Selector (Legible text size) */}
            <div className="no-print flex items-center justify-between gap-2 pb-1.5 border-b border-stone-200/80 bg-stone-50/70 p-2 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-800">Stile Elenco:</span>
                <select
                  value={currentStyle}
                  onChange={(e) => {
                    const newStyle = e.target.value as ListNumberingType;
                    onUpdateBlock(block.id, {
                      listData: { ...listData, style: newStyle },
                    });
                  }}
                  className="text-xs sm:text-sm bg-white border border-stone-300 rounded-md px-2.5 py-1 text-stone-800 font-medium focus:ring-1 focus:ring-amber-700 shadow-2xs max-w-[200px] truncate"
                >
                  {LIST_STYLE_CATEGORIES.map((cat) => (
                    <optgroup key={cat.id} label={cat.name}>
                      {LIST_STYLE_OPTIONS.filter((o) => o.category === cat.id).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label} ({opt.sample})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  const newItems = [
                    ...listData.items,
                    { id: `li_${Date.now()}`, text: '' },
                  ];
                  onUpdateBlock(block.id, {
                    listData: { ...listData, items: newItems },
                  });
                }}
                className="px-2.5 py-1 text-xs bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 rounded-md flex items-center gap-1 font-semibold shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-amber-800" />
                <span>+ Voce</span>
              </button>
            </div>

            {/* List items */}
            <div className="space-y-1.5 pl-1">
              {listData.items.map((item, idx) => {
                const marker = renderListMarker(currentStyle, idx, item.checked);
                const isCheckable = currentStyle === 'checkbox';

                return (
                  <div key={item.id} className="flex items-start gap-2.5 group/item">
                    <span
                      onClick={() => {
                        if (isCheckable) {
                          const newItems = listData.items.map((it) =>
                            it.id === item.id ? { ...it, checked: !it.checked } : it
                          );
                          onUpdateBlock(block.id, {
                            listData: { ...listData, items: newItems },
                          });
                        }
                      }}
                      className={`select-none shrink-0 font-bold min-w-[28px] text-right pt-0.5 ${
                        isCheckable
                          ? 'cursor-pointer text-amber-900 hover:scale-110'
                          : 'text-stone-700'
                      }`}
                      style={{
                        fontFamily: blockFont,
                        fontSize: `${blockFontSize}px`,
                      }}
                    >
                      {marker}
                    </span>

                    <div
                      contentEditable
                      suppressContentEditableWarning
                      data-placeholder="Scrivi elemento elenco..."
                      onFocus={() => onSelectBlock(block.id)}
                      onBlur={(e) => {
                        const newItems = listData.items.map((it) =>
                          it.id === item.id
                            ? { ...it, text: e.currentTarget.innerText }
                            : it
                        );
                        onUpdateBlock(block.id, {
                          listData: { ...listData, items: newItems },
                        });
                      }}
                      style={{
                        ...commonStyle,
                        textDecoration: item.checked ? 'line-through' : 'none',
                        opacity: item.checked ? 0.6 : 1,
                      }}
                      className="flex-1 outline-none min-h-[1.5em] py-0.5 whitespace-pre-wrap"
                    >
                      {item.text}
                    </div>

                    {listData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newItems = listData.items.filter((it) => it.id !== item.id);
                          onUpdateBlock(block.id, {
                            listData: { ...listData, items: newItems },
                          });
                        }}
                        className="no-print p-1 text-stone-300 hover:text-red-600 rounded transition-colors"
                        title="Rimuovi voce"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'table': {
        const tableData = block.tableData || {
          rows: 2,
          cols: 2,
          headers: true,
          cells: [
            [
              { id: 'c1', content: 'Titolo 1', isHeader: true },
              { id: 'c2', content: 'Titolo 2', isHeader: true },
            ],
            [
              { id: 'c3', content: 'Dato 1' },
              { id: 'c4', content: 'Dato 2' },
            ],
          ],
          bordered: true,
          compact: false,
          fontSize: 16,
        };

        const { cells, headers, bordered, compact } = tableData;
        const tableFontSize = block.fontSize || tableData.fontSize || doc.defaultFontSize || 16;
        const tableFontFamily = block.fontFamily || tableData.fontFamily || doc.defaultFontFamily;

        return (
          <div className="py-2.5 my-2 w-full space-y-2">
            {/* Inline Table Control Bar */}
            <div className="no-print bg-stone-100/90 border border-stone-200 p-2 rounded-lg flex items-center justify-between gap-2 flex-wrap text-xs shadow-2xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-stone-800">Tabella:</span>

                {/* Font Size controls for the table */}
                <div className="flex items-center gap-1 bg-white border border-stone-300 rounded px-1.5 py-0.5">
                  <span className="text-[11px] text-stone-500 font-medium">Font:</span>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const newSz = Math.max(10, tableFontSize - 2);
                      onUpdateBlock(block.id, {
                        fontSize: newSz,
                        tableData: { ...block.tableData!, fontSize: newSz },
                      });
                    }}
                    className="px-1.5 py-0.5 text-xs font-bold text-stone-700 hover:bg-stone-100 rounded"
                    title="Riduci font tabella"
                  >
                    A-
                  </button>
                  <span className="font-mono text-xs font-bold text-amber-900 min-w-[30px] text-center">
                    {tableFontSize}px
                  </span>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const newSz = Math.min(48, tableFontSize + 2);
                      onUpdateBlock(block.id, {
                        fontSize: newSz,
                        tableData: { ...block.tableData!, fontSize: newSz },
                      });
                    }}
                    className="px-1.5 py-0.5 text-xs font-bold text-stone-700 hover:bg-stone-100 rounded"
                    title="Aumenta font tabella"
                  >
                    A+
                  </button>
                  <select
                    value={tableFontSize}
                    onChange={(e) => {
                      const newSz = parseInt(e.target.value);
                      onUpdateBlock(block.id, {
                        fontSize: newSz,
                        tableData: { ...block.tableData!, fontSize: newSz },
                      });
                    }}
                    className="text-xs bg-stone-50 border border-stone-200 rounded px-1 py-0.5 font-medium ml-1"
                  >
                    {[12, 14, 16, 18, 20, 24, 28, 32].map((sz) => (
                      <option key={sz} value={sz}>{sz}px</option>
                    ))}
                  </select>
                </div>

                {/* Font Family selector for the table */}
                <select
                  value={tableFontFamily}
                  onChange={(e) => {
                    const newF = e.target.value;
                    onUpdateBlock(block.id, {
                      fontFamily: newF,
                      tableData: { ...block.tableData!, fontFamily: newF },
                    });
                  }}
                  className="text-xs bg-white border border-stone-300 rounded px-2 py-0.5 text-stone-900 font-serif max-w-[130px] truncate"
                >
                  <option value={doc.defaultFontFamily}>Font Predefinito</option>
                  {CJK_FONTS.map((f) => (
                    <option key={f.id} value={f.cssFamily}>{f.nativeName}</option>
                  ))}
                </select>
              </div>

              {/* Table structural buttons */}
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const newRow: TableCell[] = cells[0].map((_, cIdx) => ({
                      id: `cell_${cells.length}_${cIdx}_${Date.now()}`,
                      content: '—',
                      align: 'center',
                    }));
                    onUpdateBlock(block.id, {
                      tableData: {
                        ...block.tableData!,
                        rows: block.tableData!.rows + 1,
                        cells: [...cells, newRow],
                      },
                    });
                  }}
                  className="px-2 py-1 text-xs bg-white hover:bg-stone-100 border border-stone-200 rounded text-stone-700 flex items-center gap-1 font-medium"
                >
                  <Plus className="w-3 h-3 text-amber-800" /> + Riga
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const newCells = cells.map((r, ri) => [
                      ...r,
                      {
                        id: `cell_${ri}_${r.length}_${Date.now()}`,
                        content: ri === 0 && headers ? `Colonna ${r.length + 1}` : '—',
                        align: 'center' as const,
                      },
                    ]);
                    onUpdateBlock(block.id, {
                      tableData: {
                        ...block.tableData!,
                        cols: block.tableData!.cols + 1,
                        cells: newCells,
                      },
                    });
                  }}
                  className="px-2 py-1 text-xs bg-white hover:bg-stone-100 border border-stone-200 rounded text-stone-700 flex items-center gap-1 font-medium"
                >
                  <Plus className="w-3 h-3 text-amber-800" /> + Colonna
                </button>

                {cells.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateBlock(block.id, {
                        tableData: {
                          ...block.tableData!,
                          rows: block.tableData!.rows - 1,
                          cells: cells.slice(0, -1),
                        },
                      });
                    }}
                    className="px-2 py-1 text-xs bg-white hover:bg-red-50 text-red-700 border border-stone-200 rounded flex items-center gap-1"
                  >
                    - Riga
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onUpdateBlock(block.id, {
                      tableData: { ...block.tableData!, bordered: !bordered },
                    });
                  }}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    bordered ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold' : 'bg-white border-stone-200 text-stone-600'
                  }`}
                >
                  Bordi
                </button>
              </div>
            </div>

            {/* The Table itself with dynamic configurable font */}
            <table
              className={`w-full border-collapse ${bordered ? 'border border-stone-300' : ''}`}
              style={{
                fontFamily: tableFontFamily,
                fontSize: `${tableFontSize}px`,
              }}
            >
              <tbody>
                {cells.map((row, rIdx) => (
                  <tr key={`r_${rIdx}`} className={rIdx === 0 && headers ? 'font-semibold bg-stone-50/70' : ''}>
                    {row.map((cell, cIdx) => (
                      <td
                        key={cell.id}
                        style={{
                          backgroundColor: cell.background,
                          color: cell.textColor || doc.primaryColor,
                          textAlign: cell.align || 'center',
                          fontFamily: cell.fontFamily || tableFontFamily,
                          fontSize: `${cell.fontSize || tableFontSize}px`,
                          lineHeight: 1.4,
                        }}
                        className={`${compact ? 'p-1.5' : 'p-2.5 sm:p-3'} outline-none transition-colors ${
                          bordered ? 'border border-stone-200' : ''
                        }`}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const newCells = cells.map((r, ri) =>
                            r.map((c, ci) => {
                              if (ri === rIdx && ci === cIdx) {
                                return { ...c, content: e.currentTarget.innerText };
                              }
                              return c;
                            })
                          );
                          onUpdateBlock(block.id, {
                            tableData: { ...block.tableData!, cells: newCells },
                          });
                        }}
                      >
                        {cell.content}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'image': {
        const imgData = block.imageData;
        if (!imgData || !imgData.url) {
          return (
            <div className="py-4 flex justify-center">
              <button
                type="button"
                onClick={() => onEditImage(block.id, imgData, block.content)}
                className="no-print p-4 border-2 border-dashed border-stone-300 hover:border-amber-700 bg-stone-50/70 hover:bg-amber-50/50 rounded-xl text-center flex flex-col items-center gap-1.5 transition-all text-xs text-stone-600 hover:text-amber-900 group w-full max-w-md"
              >
                <ImageIcon className="w-6 h-6 text-amber-800/80 group-hover:scale-110 transition-transform" />
                <span className="font-semibold">Inserisci o Carica Immagine</span>
                <span className="text-[11px] text-stone-400">
                  Ridimensionabile con Testo Avvolgente CJK & Pinyin
                </span>
              </button>
            </div>
          );
        }

        const widthPct = imgData.widthPercent || (imgData.alignment === 'center' ? 60 : 40);
        const alignment = imgData.alignment || 'float-left';
        const borderStyle = imgData.borderStyle || 'thin';

        const getBorderClasses = () => {
          if (borderStyle === 'traditional') {
            return 'border-4 border-double border-stone-800 p-1 bg-white shadow-xs';
          }
          if (borderStyle === 'thin') {
            return 'border border-stone-300 rounded shadow-2xs';
          }
          return '';
        };

        // Rich default content if block content is empty or short, ensuring text visibly wraps
        const defaultRichPoem =
          '<ruby><rb>春</rb><rt>chūn</rt></ruby><ruby><rb>眠</rb><rt>mián</rt></ruby><ruby><rb>不</rb><rt>bù</rt></ruby><ruby><rb>觉</rb><rt>jué</rt></ruby><ruby><rb>晓</rb><rt>xiǎo</rt></ruby>，<ruby><rb>处</rb><rt>chù</rt></ruby><ruby><rb>处</rb><rt>chù</rt></ruby><ruby><rb>闻</rb><rt>wén</rt></ruby><ruby><rb>啼</rb><rt>tí</rt></ruby><ruby><rb>鸟</rb><rt>niǎo</rt></ruby>。<br/><ruby><rb>夜</rb><rt>yè</rt></ruby><ruby><rb>来</rb><rt>lái</rt></ruby><ruby><rb>风</rb><rt>fēng</rt></ruby><ruby><rb>雨</rb><rt>yǔ</rt></ruby><ruby><rb>声</rb><rt>shēng</rt></ruby>，<ruby><rb>花</rb><rt>huā</rt></ruby><ruby><rb>落</rb><rt>luò</rt></ruby><ruby><rb>知</rb><rt>zhī</rt></ruby><ruby><rb>多</rb><rt>duō</rt></ruby><ruby><rb>少</rb><rt>shǎo</rt></ruby>。<br/>【赏析】此诗描绘江南明媚春光，晨起闻啼鸟，夜来风雨不知落花多少。语浅意浓，景真情切，诗画互映，千古传诵。';

        const blockText =
          block.content && block.content.trim()
            ? block.content
            : imgData.sideText && imgData.sideText.trim()
            ? imgData.sideText
            : defaultRichPoem;

        const isFloatLeft = alignment === 'float-left';
        const isFloatRight = alignment === 'float-right';
        const isFloat = isFloatLeft || isFloatRight;

        // Quick alignment updater for inline toolbar
        const setQuickAlignment = (newAlign: ImageData['alignment']) => {
          onUpdateBlock(block.id, {
            imageData: { ...imgData, alignment: newAlign },
          });
        };

        const setQuickWidth = (newWidth: number) => {
          onUpdateBlock(block.id, {
            imageData: { ...imgData, widthPercent: newWidth },
          });
        };

        // Inline Action Bar for Image: layout, sizing, and modify
        const renderImageToolbar = () => (
          <div className="no-print mb-2 p-1.5 bg-stone-100/95 border border-stone-200 rounded-lg flex items-center justify-between gap-1 flex-wrap text-xs shadow-2xs">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-amber-800" /> Disposizione:
              </span>

              <button
                type="button"
                onClick={() => setQuickAlignment('float-left')}
                className={`px-2 py-0.5 rounded text-xs transition-colors flex items-center gap-1 ${
                  isFloatLeft
                    ? 'bg-amber-800 text-white font-semibold shadow-2xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                }`}
                title="Avvolgi a Sinistra: l'immagine sta a sinistra e il testo le scorre a destra e sotto"
              >
                <Columns className="w-3 h-3" />
                <span>Avvolgi Sinistra</span>
              </button>

              <button
                type="button"
                onClick={() => setQuickAlignment('float-right')}
                className={`px-2 py-0.5 rounded text-xs transition-colors flex items-center gap-1 ${
                  isFloatRight
                    ? 'bg-amber-800 text-white font-semibold shadow-2xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                }`}
                title="Avvolgi a Destra: l'immagine sta a destra e il testo le scorre a sinistra e sotto"
              >
                <Columns className="w-3 h-3 scale-x-[-1]" />
                <span>Avvolgi Destra</span>
              </button>

              <button
                type="button"
                onClick={() => setQuickAlignment('left')}
                className={`px-2 py-0.5 rounded text-xs transition-colors flex items-center gap-1 ${
                  alignment === 'left' || alignment === 'side-by-side'
                    ? 'bg-amber-800 text-white font-semibold shadow-2xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                }`}
                title="2 Colonne distinte senza scorrimento sotto"
              >
                <AlignLeft className="w-3 h-3" />
                <span className="hidden sm:inline">2 Colonne</span>
              </button>

              <button
                type="button"
                onClick={() => setQuickAlignment('center')}
                className={`px-2 py-0.5 rounded text-xs transition-colors flex items-center gap-1 ${
                  alignment === 'center'
                    ? 'bg-amber-800 text-white font-semibold shadow-2xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                }`}
                title="Immagine al centro sopra al testo"
              >
                <AlignCenter className="w-3 h-3" />
                <span className="hidden sm:inline">Centrata</span>
              </button>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[11px] text-stone-500 font-medium">Largh:</span>
              {[25, 40, 55, 100].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setQuickWidth(w)}
                  className={`px-1.5 py-0.5 text-[11px] rounded transition-colors ${
                    widthPct === w
                      ? 'bg-stone-800 text-white font-bold'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {w}%
                </button>
              ))}

              <button
                type="button"
                onClick={() => onEditImage(block.id, imgData, block.content)}
                className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded font-semibold flex items-center gap-1"
                title="Apri impostazioni immagine"
              >
                <Settings2 className="w-3 h-3 text-amber-700" />
                <span>Modifica</span>
              </button>
            </div>
          </div>
        );

        const renderImageBox = (
          customStyle?: React.CSSProperties,
          extraClasses = ''
        ) => (
          <div
            className={`group/img relative ${extraClasses}`}
            style={customStyle}
          >
            <div className="relative w-full">
              <img
                src={imgData.url}
                alt={imgData.alt || 'Illustrazione CJK'}
                className={`w-full object-cover transition-all ${getBorderClasses()}`}
                style={{
                  aspectRatio: imgData.aspectRatio === 'auto' ? undefined : imgData.aspectRatio,
                }}
              />
              {/* Always visible edit trigger button so touch phone users can tap it easily */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditImage(block.id, imgData, block.content);
                }}
                className="no-print absolute top-2 right-2 px-2 py-1 bg-stone-900/90 hover:bg-stone-900 text-white rounded-md shadow-md text-xs flex items-center gap-1 cursor-pointer z-20"
                title="Modifica immagine o layout avvolgente"
              >
                <Settings2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Modifica</span>
              </button>
            </div>
            {imgData.caption && (
              <span className="text-xs text-stone-500 font-serif italic mt-1.5 text-center block">
                {imgData.caption}
              </span>
            )}
          </div>
        );

        const renderTextArea = (extraClass = '') => (
          <div
            contentEditable
            suppressContentEditableWarning
            data-placeholder="Scrivi qui il testo che avvolge l'immagine..."
            onFocus={() => onSelectBlock(block.id)}
            onBlur={(e) => {
              onUpdateBlock(block.id, { content: e.currentTarget.innerHTML });
            }}
            dangerouslySetInnerHTML={{ __html: blockText }}
            style={{
              ...commonStyle,
              lineHeight: effectiveLineHeight,
              display: 'block', // Crucial for CSS float wrapping!
            }}
            className={`outline-none py-1 transition-all min-h-[4em] whitespace-pre-wrap ${
              block.hasEmphasisDots ? 'cjk-emphasis-dot' : ''
            } ${extraClass}`}
          />
        );

        // Real text wrapping: CSS Float
        if (isFloat) {
          const boundedFloatWidth = `${Math.min(Math.max(widthPct, 20), 45)}%`;
          return (
            <div className="py-2.5 my-2 w-full">
              {renderImageToolbar()}
              <div
                className="w-full clearfix"
                style={{
                  writingMode: isVertical ? 'horizontal-tb' : undefined,
                }}
              >
                {renderImageBox(
                  {
                    width: boundedFloatWidth,
                    float: isFloatLeft ? 'left' : 'right',
                    marginRight: isFloatLeft ? '1.25rem' : '0',
                    marginLeft: isFloatRight ? '1.25rem' : '0',
                    marginBottom: '0.75rem',
                  },
                  isFloatLeft ? 'float-left mr-5 mb-3' : 'float-right ml-5 mb-3'
                )}
                {renderTextArea('text-stone-900')}
                <div className="clear-both" />
              </div>
            </div>
          );
        }

        if (alignment === 'right') {
          return (
            <div className="py-2.5 my-2 w-full">
              {renderImageToolbar()}
              <div
                className={`flex gap-5 items-start w-full ${
                  isVertical ? 'flex-col md:flex-row' : 'flex-row'
                }`}
                style={{ writingMode: isVertical ? 'horizontal-tb' : undefined }}
              >
                <div className={`flex-1 min-w-0 ${isVertical ? 'min-h-[220px]' : ''}`}>
                  {renderTextArea()}
                </div>
                {renderImageBox({ width: `${Math.min(Math.max(widthPct, 20), 65)}%` }, 'shrink-0')}
              </div>
            </div>
          );
        }

        if (alignment === 'center') {
          return (
            <div className="py-2.5 my-2 w-full">
              {renderImageToolbar()}
              <div className="w-full flex flex-col items-center">
                {renderImageBox({ width: `${Math.min(Math.max(widthPct, 20), 100)}%` })}
                {blockText && blockText.trim() && (
                  <div className="w-full mt-3">
                    {renderTextArea('text-center')}
                  </div>
                )}
              </div>
            </div>
          );
        }

        // Default: side-by-side (left)
        return (
          <div className="py-2.5 my-2 w-full">
            {renderImageToolbar()}
            <div
              className={`flex gap-5 items-start w-full ${
                isVertical ? 'flex-col md:flex-row' : 'flex-row'
              }`}
              style={{ writingMode: isVertical ? 'horizontal-tb' : undefined }}
            >
              {renderImageBox({ width: `${Math.min(Math.max(widthPct, 20), 65)}%` }, 'shrink-0')}
              <div className={`flex-1 min-w-0 ${isVertical ? 'min-h-[220px]' : ''}`}>
                {renderTextArea()}
              </div>
            </div>
          </div>
        );
      }

      default:
        return <div>{block.content}</div>;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 flex flex-col items-center gap-6 bg-stone-300/40 print-area relative">
      {/* Pages Container */}
      {doc.pages.map((page, pageIdx) => {
        const pageElId = `cjk_page_${page.id}`;
        return (
          <div
            key={page.id}
            className="w-full flex justify-center overflow-x-auto pb-4"
          >
            <div
              id={pageElId}
              style={{
                width: `${pageDim.width}px`,
                maxWidth: `${pageDim.width}px`,
                minHeight: `${pageDim.minHeight}px`,
                backgroundColor: paperBgHex,
                padding: `${doc.marginMm}mm`,
                boxSizing: 'border-box',
              }}
              className="print-page shadow-xl border border-stone-200/80 transition-all relative flex flex-col justify-between shrink-0"
            >
              {/* Margin Visual Guide Rectangle (active when settings panel is open) */}
              {showMarginGuides && (
                <div
                  className="no-print absolute pointer-events-none transition-all z-20 border-2 border-dashed border-amber-600/70 rounded-xs"
                  style={{
                    top: `${doc.marginMm}mm`,
                    bottom: `${doc.marginMm}mm`,
                    left: `${doc.marginMm}mm`,
                    right: `${doc.marginMm}mm`,
                  }}
                >
                  <div className="absolute -top-3.5 left-2 bg-amber-800 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-xs font-bold flex items-center gap-1 select-none">
                    <span>Margine: {doc.marginMm} mm</span>
                  </div>
                </div>
              )}

              {/* Running Header */}
              {doc.headerText && (
                <div
                  className="relative z-10 text-stone-400 text-xs font-serif tracking-widest pb-2 mb-2 border-b border-stone-200/60 flex items-center justify-between select-none shrink-0"
                  style={{
                    writingMode: 'horizontal-tb',
                  }}
                >
                  <span>{doc.headerText}</span>
                  <span className="font-mono text-[11px]">
                    {pageIdx + 1} / {doc.pages.length}
                  </span>
                </div>
              )}

              {/* Main Content Area & Synced Grid Pattern */}
              <div className="relative flex-1 w-full min-h-[500px]">
                {/* Grid / Ruled Lines Overlay strictly bounded within the content container */}
                {getPatternClass() && (
                  <div
                    className={`grid-pattern-overlay absolute inset-0 pointer-events-none transition-opacity ${getPatternClass()}`}
                    style={{
                      opacity: doc.gridOpacity ?? 0.55,
                      backgroundPosition: isVertical ? 'right top' : 'left top',
                    }}
                  />
                )}

                {/* Traditional Outer Border */}
                {(doc.paperStyle === 'wongozhi' ||
                  doc.paperStyle === 'wongozhi-brick' ||
                  doc.paperStyle === 'classical-vertical' ||
                  doc.paperStyle === 'classical-vertical-slate') && (
                  <div
                    className="traditional-border-overlay absolute inset-0 pointer-events-none transition-all"
                    style={{
                      border: `1.5px solid ${
                        doc.paperStyle === 'wongozhi'
                          ? 'rgba(34, 110, 40, 0.8)'
                          : doc.paperStyle === 'wongozhi-brick'
                          ? 'rgba(160, 75, 35, 0.8)'
                          : doc.paperStyle === 'classical-vertical-slate'
                          ? 'rgba(30, 41, 59, 0.8)'
                          : 'rgba(195, 35, 30, 0.8)'
                      }`,
                      opacity: doc.gridOpacity ?? 0.65,
                    }}
                  />
                )}

                {/* Blocks Container */}
                <div
                  dir={isVertical ? 'rtl' : 'ltr'}
                  className={`relative z-10 w-full h-full ${
                    isVertical
                      ? 'vertical-writing-upright overflow-x-auto'
                      : 'horizontal-writing'
                  }`}
                >
                  {page.blocks.map((block) => {
                    const isActive = activeBlockId === block.id;
                    const spec = PAPER_GRID_SPECS[doc.paperStyle];
                    const isGrid = spec && spec.type !== 'plain';

                    return (
                      <div
                        key={block.id}
                        onClick={() => onSelectBlock(block.id)}
                        className={`relative group transition-all ${
                          isActive
                            ? 'bg-amber-500/10'
                            : 'hover:bg-stone-500/5'
                        } ${
                          isGrid
                            ? isVertical
                              ? 'inline-block align-top m-0 p-0'
                              : 'block m-0 p-0'
                            : isVertical
                            ? 'inline-block align-top my-0 px-0'
                            : 'my-1 py-0.5'
                        }`}
                      >
                        {/* Floating Actions: visible on hover OR when block is active */}
                        <div
                          className={`no-print absolute z-30 flex items-center gap-1 p-1 bg-stone-900/95 text-white rounded-lg shadow-lg backdrop-blur-xs text-xs transition-opacity ${
                            isActive
                              ? 'opacity-100 ring-2 ring-amber-500/60'
                              : 'opacity-0 group-hover:opacity-100'
                          } ${isVertical ? 'top-0 -left-10 flex-col' : '-top-8 right-2'}`}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveBlock(block.id, 'up');
                            }}
                            className="p-1 hover:bg-stone-700 rounded transition-colors"
                            title="Sposta prima"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveBlock(block.id, 'down');
                            }}
                            className="p-1 hover:bg-stone-700 rounded transition-colors"
                            title="Sposta dopo"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicateBlock(block.id);
                            }}
                            className="p-1 hover:bg-stone-700 rounded transition-colors"
                            title="Duplica"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteBlock(block.id);
                            }}
                            className="p-1 hover:bg-red-700 rounded text-red-300 hover:text-white transition-colors"
                            title="Elimina blocco"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Block Content */}
                        {renderBlockContent(block)}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Running Footer */}
              {(doc.footerText || doc.showPageNumbers) && (
                <div
                  className="text-stone-400 text-xs font-serif tracking-widest pt-3 mt-2 border-t border-stone-200/60 flex items-center justify-between select-none"
                  style={{
                    writingMode: 'horizontal-tb',
                  }}
                >
                  <span>{doc.footerText}</span>
                  {doc.showPageNumbers && (
                    <span className="font-mono text-[11px]">
                      Pagina {pageIdx + 1}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Add Page Footer Button */}
      <div className="no-print flex items-center gap-3 py-4">
        <button
          type="button"
          onClick={onAddPage}
          className="px-4 py-2 bg-white text-stone-800 hover:bg-stone-50 border border-stone-300 rounded-xl shadow-xs text-xs font-semibold flex items-center gap-2 transition-all hover:scale-102"
        >
          <Plus className="w-4 h-4 text-amber-800" />
          <span>Aggiungi Nuova Pagina ({doc.pages.length + 1})</span>
        </button>
        {doc.pages.length > 1 && (
          <button
            type="button"
            onClick={() => onDeletePage(doc.pages.length - 1)}
            className="px-3 py-2 bg-white text-red-600 hover:bg-red-50 border border-red-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Rimuovi Ultima Pagina
          </button>
        )}
      </div>
    </div>
  );
};
