/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CJKDocument,
  DocumentBlock,
  WritingMode,
  PaperStyle,
  PaperFormat,
  BlockType,
  SealData,
  TableBlockData,
  ImageData,
  ListNumberingType,
} from './types/editor';
import { INITIAL_DOCUMENT } from './data/cjkPresets';
import { isKoreanDocument, getDefaultListStyle } from './utils/listStyles';
import { TopNav } from './components/TopNav';
import { FormatToolbar } from './components/FormatToolbar';
import { DocumentPaper } from './components/DocumentPaper';
import { SpecialCharDrawer } from './components/SpecialCharDrawer';
import { RubyInsertModal } from './components/RubyInsertModal';
import { SealConfigModal } from './components/SealConfigModal';
import { TableInsertModal } from './components/TableInsertModal';
import { TemplatePickerModal } from './components/TemplatePickerModal';
import { AddBlockModal } from './components/AddBlockModal';
import { ImageConfigModal } from './components/ImageConfigModal';
import { ExportResultModal } from './components/ExportResultModal';
import { RubyTargetAction } from './components/RubyInsertModal';
import { ClearSheetConfirmModal } from './components/ClearSheetConfirmModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PageSettingsDrawer } from './components/PageSettingsDrawer';
import { exportDocumentToPdf, printDocumentDirectly } from './utils/pdfExport';
import {
  alignDocumentToPaperGrid,
  getPaperBaseColorHex,
  PAPER_GRID_SPECS,
} from './utils/gridAlignment';
import { SlidersHorizontal, Eye, Save, RotateCcw, HelpCircle, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'cjk_scribe_saved_doc';

export default function App() {
  const [doc, setDoc] = useState<CJKDocument>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.gridOpacity === undefined) {
          parsed.gridOpacity = 0.55;
        }
        const paperStyle = parsed.paperStyle as PaperStyle;
        const spec = paperStyle ? PAPER_GRID_SPECS[paperStyle] : undefined;
        if (spec && spec.type !== 'plain') {
          return alignDocumentToPaperGrid(parsed);
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Impossibile caricare documento salvato:', e);
    }
    return alignDocumentToPaperGrid(INITIAL_DOCUMENT);
  });

  const [activeBlockId, setActiveBlockId] = useState<string | null>('blk_title');

  // History Stacks for Undo & Redo
  const [history, setHistory] = useState<CJKDocument[]>([]);
  const [future, setFuture] = useState<CJKDocument[]>([]);

  // Modals state
  const [isSpecialCharsOpen, setIsSpecialCharsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isRubyModalOpen, setIsRubyModalOpen] = useState(false);
  const [isSealModalOpen, setIsSealModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [isDocSettingsOpen, setIsDocSettingsOpen] = useState(false);
  const [showMarginGuides, setShowMarginGuides] = useState(true);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isClearSheetModalOpen, setIsClearSheetModalOpen] = useState(false);

  // Helper to update doc while preserving undo history
  const updateDoc = (
    updater: (prev: CJKDocument) => CJKDocument,
    recordHistory = true
  ) => {
    setDoc((prev) => {
      const next = updater(prev);
      if (recordHistory) {
        setHistory((h) => [...h.slice(-30), prev]);
        setFuture([]);
      }
      return next;
    });
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    setFuture((f) => [doc, ...f]);
    setHistory(newHistory);
    setDoc(prev);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setHistory((h) => [...h, doc]);
    setFuture(newFuture);
    setDoc(next);
  };

  // Global keyboard shortcuts for Undo & Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      const isInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA';
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (!isInput) {
          e.preventDefault();
          handleUndo();
        }
      } else if (
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') ||
        ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        if (!isInput) {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, future, doc]);

  // Image block configuration modal state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageModalBlockId, setImageModalBlockId] = useState<string | null>(null);
  const [imageModalInitialData, setImageModalInitialData] = useState<ImageData | undefined>(undefined);
  const [imageModalInitialContent, setImageModalInitialContent] = useState<string>('');

  // Active seal being edited
  const [editingSeal, setEditingSeal] = useState<{
    seal?: SealData;
    blockId: string;
  } | null>(null);

  // Export progress and result states
  const [isExporting, setIsExporting] = useState(false);
  const [exportStage, setExportStage] = useState('');
  const [exportSuccessData, setExportSuccessData] = useState<{
    filename: string;
    blobUrl: string;
    fileSizeKb: number;
    format: string;
    pagesCount: number;
  } | null>(null);
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(null);

  // Auto-save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
    } catch (e) {
      console.warn('Errore salvataggio LocalStorage:', e);
    }
  }, [doc]);

  // Find active block
  const getActiveBlock = (): DocumentBlock | undefined => {
    if (!activeBlockId) return undefined;
    for (const page of doc.pages) {
      const found = page.blocks.find((b) => b.id === activeBlockId);
      if (found) return found;
    }
    return undefined;
  };

  const activeBlock = getActiveBlock();

  // Block updates
  const handleUpdateBlock = (blockId: string, updates: Partial<DocumentBlock>) => {
    updateDoc((prev) => {
      const newPages = prev.pages.map((page) => ({
        ...page,
        blocks: page.blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b)),
      }));
      return { ...prev, pages: newPages };
    });
  };

  // Block deletion
  const handleDeleteBlock = (blockId: string) => {
    updateDoc((prev) => {
      const newPages = prev.pages.map((page) => ({
        ...page,
        blocks: page.blocks.filter((b) => b.id !== blockId),
      }));
      return { ...prev, pages: newPages };
    });
    if (activeBlockId === blockId) {
      setActiveBlockId(null);
    }
  };

  const handleDeleteActiveBlock = () => {
    if (activeBlockId) {
      handleDeleteBlock(activeBlockId);
    }
  };

  const handleConfirmClearSheet = () => {
    updateDoc((prev) => {
      const newPages = prev.pages.map((p, idx) => {
        if (idx === 0) {
          return {
            ...p,
            blocks: [
              {
                id: `blk_${Date.now()}`,
                type: 'paragraph' as BlockType,
                content: '',
                fontFamily: prev.defaultFontFamily,
                fontSize: prev.defaultFontSize,
                color: prev.primaryColor,
                textAlign: 'left' as const,
              },
            ],
          };
        }
        return p;
      });
      return { ...prev, pages: newPages };
    });
    setActiveBlockId(null);
  };

  // Block reorder
  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    updateDoc((prev) => {
      const newPages = prev.pages.map((page) => {
        const idx = page.blocks.findIndex((b) => b.id === blockId);
        if (idx === -1) return page;
        const newBlocks = [...page.blocks];
        if (direction === 'up' && idx > 0) {
          const temp = newBlocks[idx - 1];
          newBlocks[idx - 1] = newBlocks[idx];
          newBlocks[idx] = temp;
        } else if (direction === 'down' && idx < newBlocks.length - 1) {
          const temp = newBlocks[idx + 1];
          newBlocks[idx + 1] = newBlocks[idx];
          newBlocks[idx] = temp;
        }
        return { ...page, blocks: newBlocks };
      });
      return { ...prev, pages: newPages };
    });
  };

  // Block duplicate
  const handleDuplicateBlock = (blockId: string) => {
    setDoc((prev) => {
      const newPages = prev.pages.map((page) => {
        const idx = page.blocks.findIndex((b) => b.id === blockId);
        if (idx === -1) return page;
        const target = page.blocks[idx];
        const clone: DocumentBlock = {
          ...target,
          id: `blk_${Date.now()}`,
        };
        const newBlocks = [...page.blocks];
        newBlocks.splice(idx + 1, 0, clone);
        return { ...page, blocks: newBlocks };
      });
      return { ...prev, pages: newPages };
    });
  };

  // Add block
  const handleAddBlock = (type: BlockType, afterBlockId?: string) => {
    const newBlock: DocumentBlock = {
      id: `blk_${Date.now()}`,
      type,
      content: '', // Clean and empty by default
      fontFamily: doc.defaultFontFamily,
      fontSize:
        type === 'heading1' ? 32 : type === 'heading2' ? 20 : doc.defaultFontSize,
      color: doc.primaryColor,
      textAlign: 'left',
    };

    if (type === 'seal-group') {
      newBlock.seals = [
        {
          id: `seal_${Date.now()}`,
          text: '墨宝',
          shape: 'square',
          style: 'yin',
          color: '#B92B27',
          size: 54,
          borderStyle: 'rough',
          rotation: -1,
        },
      ];
    }

    if (type === 'list') {
      newBlock.listData = {
        style: 'chinese-num',
        items: [
          { id: `li_1_${Date.now()}`, text: '' },
        ],
      };
    }

    if (type === 'image') {
      newBlock.content =
        '<ruby><rb>春</rb><rt>chūn</rt></ruby><ruby><rb>眠</rb><rt>mián</rt></ruby><ruby><rb>不</rb><rt>bù</rt></ruby><ruby><rb>觉</rb><rt>jué</rt></ruby><ruby><rb>晓</rb><rt>xiǎo</rt></ruby>，<ruby><rb>处</rb><rt>chù</rt></ruby><ruby><rb>处</rb><rt>chù</rt></ruby><ruby><rb>闻</rb><rt>wén</rt></ruby><ruby><rb>啼</rb><rt>tí</rt></ruby><ruby><rb>鸟</rb><rt>niǎo</rt></ruby>。<br/><ruby><rb>夜</rb><rt>yè</rt></ruby><ruby><rb>来</rb><rt>lái</rt></ruby><ruby><rb>风</rb><rt>fēng</rt></ruby><ruby><rb>雨</rb><rt>yǔ</rt></ruby><ruby><rb>声</rb><rt>shēng</rt></ruby>，<ruby><rb>花</rb><rt>huā</rt></ruby><ruby><rb>落</rb><rt>luò</rt></ruby><ruby><rb>知</rb><rt>zhī</rt></ruby><ruby><rb>多</rb><rt>duō</rt></ruby><ruby><rb>少</rb><rt>shǎo</rt></ruby>。<br/>【赏析】此诗描绘江南明媚春光，晨起闻啼鸟，夜来风雨不知落花多少。语浅意浓，景真情切，诗画互映，千古传诵。';
      newBlock.lineHeight = 2.2;
      newBlock.imageData = {
        url: '',
        widthPercent: 40,
        alignment: 'float-left',
        borderStyle: 'thin',
        caption: 'Illustrazione CJK',
      };
    }

    setDoc((prev) => {
      const newPages = [...prev.pages];
      const targetPage = newPages[0];
      if (!targetPage) return prev;

      if (afterBlockId) {
        const idx = targetPage.blocks.findIndex((b) => b.id === afterBlockId);
        if (idx !== -1) {
          targetPage.blocks.splice(idx + 1, 0, newBlock);
        } else {
          targetPage.blocks.push(newBlock);
        }
      } else {
        targetPage.blocks.push(newBlock);
      }

      return { ...prev, pages: newPages };
    });

    setActiveBlockId(newBlock.id);

    // If new block is image, open the configuration modal right away for smooth UX
    if (type === 'image') {
      setImageModalBlockId(newBlock.id);
      setImageModalInitialData(newBlock.imageData);
      setImageModalInitialContent(newBlock.content);
      setIsImageModalOpen(true);
    }
  };

  const handleEditImage = (
    blockId: string,
    initialData?: ImageData,
    currentContent?: string
  ) => {
    setImageModalBlockId(blockId);
    setImageModalInitialData(initialData);
    setImageModalInitialContent(currentContent || '');
    setIsImageModalOpen(true);
  };

  const handleSaveImageConfig = (data: ImageData, newContent?: string) => {
    if (imageModalBlockId) {
      const updates: Partial<DocumentBlock> = {
        imageData: data,
        lineHeight: 2.2,
      };
      if (typeof newContent === 'string' && newContent.trim()) {
        updates.content = newContent;
      }
      handleUpdateBlock(imageModalBlockId, updates);
    }
  };

  const handleInsertImageFromToolbar = () => {
    if (
      activeBlock &&
      (activeBlock.type === 'paragraph' ||
        activeBlock.type === 'poem-stanza' ||
        activeBlock.type === 'heading1' ||
        activeBlock.type === 'heading2')
    ) {
      // Convert active text block into an image-with-text block preserving all text and Pinyin!
      handleUpdateBlock(activeBlock.id, {
        type: 'image',
        imageData: {
          url: '',
          widthPercent: 40,
          alignment: 'float-left',
          borderStyle: 'thin',
          caption: 'Illustrazione CJK',
        },
        lineHeight: Math.max(activeBlock.lineHeight || 2.2, 2.2),
      });
      handleEditImage(
        activeBlock.id,
        {
          url: '',
          widthPercent: 40,
          alignment: 'float-left',
          borderStyle: 'thin',
          caption: 'Illustrazione CJK',
        },
        activeBlock.content
      );
      return;
    }
    handleAddBlock('image');
  };

  // Add Page
  const handleAddPage = () => {
    setDoc((prev) => {
      const newPageNumber = prev.pages.length + 1;
      const newPage = {
        id: `page_${Date.now()}`,
        pageNumber: newPageNumber,
        blocks: [
          {
            id: `blk_p${newPageNumber}_1`,
            type: 'paragraph' as BlockType,
            content: '第二页正文... (Testo pagina ' + newPageNumber + ')',
            fontFamily: prev.defaultFontFamily,
            fontSize: prev.defaultFontSize,
            color: prev.primaryColor,
          },
        ],
      };
      return {
        ...prev,
        pages: [...prev.pages, newPage],
      };
    });
  };

  // Delete Page
  const handleDeletePage = (pageIdx: number) => {
    if (doc.pages.length <= 1) return;
    setDoc((prev) => {
      const newPages = prev.pages.filter((_, idx) => idx !== pageIdx);
      return { ...prev, pages: newPages };
    });
  };

  const handleWritingModeChange = (mode: WritingMode) => {
    updateDoc((prev) => {
      const nextDoc = { ...prev, writingMode: mode };
      const spec = PAPER_GRID_SPECS[prev.paperStyle];
      if (spec && spec.type !== 'plain') {
        return alignDocumentToPaperGrid(nextDoc);
      }
      return nextDoc;
    });
  };

  const handlePaperStyleChange = (style: PaperStyle) => {
    updateDoc((prev) => {
      let targetWritingMode = prev.writingMode;
      if (style === 'classical-horizontal' && prev.writingMode === 'vertical-rl') {
        targetWritingMode = 'horizontal-tb';
      } else if (
        (style === 'classical-vertical' || style === 'classical-vertical-slate') &&
        prev.writingMode === 'horizontal-tb'
      ) {
        targetWritingMode = 'vertical-rl';
      }

      const nextDoc = { ...prev, paperStyle: style, writingMode: targetWritingMode };
      const spec = PAPER_GRID_SPECS[style];
      if (spec && spec.type !== 'plain') {
        return alignDocumentToPaperGrid(nextDoc);
      }
      return nextDoc;
    });
  };

  const handlePaperFormatChange = (format: PaperFormat) => {
    updateDoc((prev) => ({ ...prev, paperFormat: format }));
  };

  const handleFontFamilyChange = (fontCss: string) => {
    if (activeBlockId) {
      if (activeBlock?.type === 'table' && activeBlock.tableData) {
        handleUpdateBlock(activeBlockId, {
          fontFamily: fontCss,
          tableData: { ...activeBlock.tableData, fontFamily: fontCss },
        });
      } else {
        handleUpdateBlock(activeBlockId, { fontFamily: fontCss });
      }
    } else {
      updateDoc((prev) => ({ ...prev, defaultFontFamily: fontCss }));
    }
  };

  const handleFontSizeChange = (size: number) => {
    const boundedSize = Math.max(10, Math.min(72, size));

    updateDoc((prev) => {
      if (activeBlockId) {
        return {
          ...prev,
          pages: prev.pages.map((p) => ({
            ...p,
            blocks: p.blocks.map((b) =>
              b.id === activeBlockId
                ? {
                    ...b,
                    fontSize: boundedSize,
                    tableData: b.tableData ? { ...b.tableData, fontSize: boundedSize } : undefined,
                  }
                : b
            ),
          })),
        };
      } else {
        const delta = boundedSize - prev.defaultFontSize;
        return {
          ...prev,
          defaultFontSize: boundedSize,
          pages: prev.pages.map((p) => ({
            ...p,
            blocks: p.blocks.map((b) => {
              const cur = b.fontSize || prev.defaultFontSize;
              const next = Math.max(10, Math.min(72, cur + delta));
              return {
                ...b,
                fontSize: next,
                tableData: b.tableData ? { ...b.tableData, fontSize: next } : undefined,
              };
            }),
          })),
        };
      }
    });
  };

  const handleColorChange = (color: string) => {
    if (activeBlockId) {
      handleUpdateBlock(activeBlockId, { color });
    } else {
      setDoc((prev) => ({ ...prev, primaryColor: color }));
    }
  };

  const handleTextAlignChange = (align: 'left' | 'center' | 'right' | 'justify') => {
    updateDoc((prev) => {
      if (activeBlockId) {
        return {
          ...prev,
          pages: prev.pages.map((p) => ({
            ...p,
            blocks: p.blocks.map((b) => (b.id === activeBlockId ? { ...b, textAlign: align } : b)),
          })),
        };
      } else {
        return {
          ...prev,
          pages: prev.pages.map((p) => ({
            ...p,
            blocks: p.blocks.map((b) => ({ ...b, textAlign: align })),
          })),
        };
      }
    });
  };

  const handleMarginChange = (newMarginMm: number) => {
    const val = Math.max(6, Math.min(50, newMarginMm));
    updateDoc((prev) => ({ ...prev, marginMm: val }));
  };

  const handleGridOpacityChange = (newOpacity: number) => {
    const val = Math.max(0.1, Math.min(1.0, Math.round(newOpacity * 100) / 100));
    updateDoc((prev) => ({ ...prev, gridOpacity: val }));
  };

  const handleLineSpacingChange = (newSpacing: number, applyToAllBlocks = true) => {
    const val = Math.max(1.0, Math.min(4.0, Math.round(newSpacing * 100) / 100));
    updateDoc((prev) => ({
      ...prev,
      lineSpacing: val,
      pages: applyToAllBlocks
        ? prev.pages.map((p) => ({
            ...p,
            blocks: p.blocks.map((b) => ({
              ...b,
              lineHeight: val,
            })),
          }))
        : prev.pages.map((p) => ({
            ...p,
            blocks: p.blocks.map((b) => (b.id === activeBlockId ? { ...b, lineHeight: val } : b)),
          })),
    }));
  };

  const handleAlignTextToPaperGrid = () => {
    updateDoc((prev) => alignDocumentToPaperGrid(prev));
  };

  const handleCharacterSpacingChange = (newSpacing: number, applyToAllBlocks = true) => {
    const val = Math.max(0, Math.min(0.6, Math.round(newSpacing * 100) / 100));
    updateDoc((prev) => ({
      ...prev,
      characterSpacing: val,
      pages: applyToAllBlocks
        ? prev.pages.map((p) => ({
            ...p,
            blocks: p.blocks.map((b) => ({
              ...b,
              letterSpacing: val,
            })),
          }))
        : prev.pages.map((p) => ({
            ...p,
            blocks: p.blocks.map((b) => (b.id === activeBlockId ? { ...b, letterSpacing: val } : b)),
          })),
    }));
  };

  const handleToggleEmphasisDots = () => {
    if (activeBlockId && activeBlock) {
      handleUpdateBlock(activeBlockId, {
        hasEmphasisDots: !activeBlock.hasEmphasisDots,
      });
    }
  };

  // Insert Ruby text
  const handleInsertRuby = (
    rubyHtml: string,
    action: RubyTargetAction = 'replace'
  ) => {
    // Determine target block: explicit active block, or first block of first page
    const targetId = activeBlockId || doc.pages[0]?.blocks[0]?.id;
    const targetBlock = doc.pages.flatMap((p) => p.blocks).find((b) => b.id === targetId);

    if (action === 'new-block' || !targetBlock) {
      // Create a dedicated paragraph block for the ruby text
      const newBlock: DocumentBlock = {
        id: `blk_${Date.now()}`,
        type: 'paragraph',
        content: rubyHtml,
        fontFamily: doc.defaultFontFamily,
        fontSize: doc.defaultFontSize > 22 ? doc.defaultFontSize : 22,
        color: doc.primaryColor,
        textAlign: 'center',
        lineHeight: 2.2,
      };
      setDoc((prev) => {
        const newPages = [...prev.pages];
        newPages[0]?.blocks.push(newBlock);
        return { ...prev, pages: newPages };
      });
      setActiveBlockId(newBlock.id);
    } else if (action === 'append') {
      const prevContent = targetBlock.content || '';
      handleUpdateBlock(targetBlock.id, {
        content: prevContent ? `${prevContent} ${rubyHtml}` : rubyHtml,
        lineHeight: Math.max(targetBlock.lineHeight || 2.2, 2.2),
      });
      setActiveBlockId(targetBlock.id);
    } else {
      // 'replace': directly replace the selected block content with the ruby-annotated sentence
      handleUpdateBlock(targetBlock.id, {
        content: rubyHtml,
        lineHeight: Math.max(targetBlock.lineHeight || 2.2, 2.2),
      });
      setActiveBlockId(targetBlock.id);
    }
  };

  // Seal editing
  const handleEditSeal = (seal: SealData, blockId: string) => {
    setEditingSeal({ seal, blockId });
    setIsSealModalOpen(true);
  };

  const handleSaveSeal = (newSeal: SealData) => {
    if (editingSeal?.blockId) {
      const target = doc.pages
        .flatMap((p) => p.blocks)
        .find((b) => b.id === editingSeal.blockId);
      if (target && target.seals) {
        const exists = target.seals.some((s) => s.id === newSeal.id);
        const updated = exists
          ? target.seals.map((s) => (s.id === newSeal.id ? newSeal : s))
          : [...target.seals, newSeal];
        handleUpdateBlock(editingSeal.blockId, { seals: updated });
      }
    } else {
      // Add a seal block
      const sealBlock: DocumentBlock = {
        id: `blk_seal_${Date.now()}`,
        type: 'seal-group',
        content: '',
        seals: [newSeal],
      };
      setDoc((prev) => {
        const newPages = [...prev.pages];
        newPages[0]?.blocks.push(sealBlock);
        return { ...prev, pages: newPages };
      });
    }
    setEditingSeal(null);
  };

  // Insert Table
  const handleInsertTable = (tableData: TableBlockData) => {
    const tableBlock: DocumentBlock = {
      id: `blk_tbl_${Date.now()}`,
      type: 'table',
      content: '',
      fontSize: tableData.fontSize || doc.defaultFontSize || 16,
      fontFamily: tableData.fontFamily || doc.defaultFontFamily,
      tableData: {
        ...tableData,
        fontSize: tableData.fontSize || doc.defaultFontSize || 16,
      },
    };
    updateDoc((prev) => {
      const newPages = [...prev.pages];
      newPages[0]?.blocks.push(tableBlock);
      return { ...prev, pages: newPages };
    });
    setActiveBlockId(tableBlock.id);
  };

  // Special character click
  const handleInsertChar = (char: string) => {
    if (activeBlockId && activeBlock) {
      handleUpdateBlock(activeBlockId, {
        content: `${activeBlock.content}${char}`,
      });
    }
  };

  // Template selection
  const handleSelectTemplate = (templateDoc: CJKDocument) => {
    // Deep clone to detach all object references and assign fresh IDs
    const cloned: CJKDocument = JSON.parse(JSON.stringify(templateDoc));
    cloned.id = `doc_${Date.now()}`;
    cloned.pages = cloned.pages.map((p, pIdx) => ({
      ...p,
      id: `p_${Date.now()}_${pIdx}`,
      blocks: p.blocks.map((b, bIdx) => ({
        ...b,
        id: `blk_${Date.now()}_${pIdx}_${bIdx}`,
      })),
    }));
    setDoc(cloned);
    setActiveBlockId(cloned.pages[0]?.blocks[0]?.id || null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cloned));
    } catch (e) {
      console.warn('Errore salvataggio template:', e);
    }
  };

  // PDF Export Handlers
  const handlePrintPdf = () => {
    printDocumentDirectly();
  };

  const handleDownloadDirectPdf = async () => {
    setIsExporting(true);
    setExportStage('Inizializzazione...');
    setExportErrorMessage(null);
    try {
      const pageElementIds = doc.pages.map((p) => `cjk_page_${p.id}`);
      const cleanTitle = (doc.title || 'documento_cjk')
        .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\uac00-\ud7af_-]/g, '_')
        .slice(0, 30);

      const paperBgColor = getPaperBaseColorHex(doc.paperStyle);

      const result = await exportDocumentToPdf(pageElementIds, {
        filename: `${cleanTitle}.pdf`,
        format: doc.paperFormat,
        paperBgColor,
        marginMm: doc.marginMm,
        onProgress: (_, stage) => setExportStage(stage),
      });

      const fileSizeKb = Math.max(1, Math.round(result.blob.size / 1024));
      setExportSuccessData({
        filename: result.filename,
        blobUrl: result.blobUrl,
        fileSizeKb,
        format: doc.paperFormat,
        pagesCount: doc.pages.length,
      });
    } catch (err: unknown) {
      console.error('Errore esportazione PDF:', err);
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      setExportErrorMessage(
        `Si è verificato un errore durante la generazione del PDF (${msg}). Puoi usare il pulsante "Stampa / Salva come PDF di Sistema" per salvare il documento in formato PDF vettoriale perfetto.`
      );
    } finally {
      setIsExporting(false);
      setExportStage('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 text-stone-900 font-sans selection:bg-amber-200">
      {/* Top Bar honoring 3-zone contract */}
      <TopNav
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onToggleSpecialChars={() => setIsSpecialCharsOpen((prev) => !prev)}
        onOpenAddMenu={() => setIsAddBlockOpen(true)}
        onPrintPdf={handlePrintPdf}
        onDownloadDirectPdf={handleDownloadDirectPdf}
        isExporting={isExporting}
        exportStage={exportStage}
        canUndo={history.length > 0}
        onUndo={handleUndo}
        canRedo={future.length > 0}
        onRedo={handleRedo}
        canDelete={!!activeBlockId}
        onDeleteActiveBlock={handleDeleteActiveBlock}
        onClearSheet={() => setIsClearSheetModalOpen(true)}
        onOpenSettings={() => setIsDocSettingsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Formatting & Typesetting Toolbar */}
      <FormatToolbar
        writingMode={doc.writingMode}
        onWritingModeChange={handleWritingModeChange}
        paperStyle={doc.paperStyle}
        onPaperStyleChange={handlePaperStyleChange}
        gridOpacity={doc.gridOpacity ?? 0.55}
        onGridOpacityChange={(opacity) => updateDoc((prev) => ({ ...prev, gridOpacity: opacity }))}
        paperFormat={doc.paperFormat}
        onPaperFormatChange={handlePaperFormatChange}
        activeFontFamily={activeBlock?.fontFamily || doc.defaultFontFamily}
        onFontFamilyChange={handleFontFamilyChange}
        activeFontSize={activeBlock?.fontSize || doc.defaultFontSize}
        onFontSizeChange={handleFontSizeChange}
        activeColor={activeBlock?.color || doc.primaryColor}
        onColorChange={handleColorChange}
        textAlign={activeBlock?.textAlign || 'left'}
        onTextAlignChange={handleTextAlignChange}
        lineHeight={activeBlock?.lineHeight || doc.lineSpacing}
        onLineHeightChange={(lh) => handleLineSpacingChange(lh, false)}
        letterSpacing={activeBlock?.letterSpacing ?? doc.characterSpacing}
        onLetterSpacingChange={(ls) => handleCharacterSpacingChange(ls, false)}
        onOpenRubyModal={() => setIsRubyModalOpen(true)}
        onOpenSealModal={() => {
          setEditingSeal(null);
          setIsSealModalOpen(true);
        }}
        onOpenTableModal={() => setIsTableModalOpen(true)}
        onInsertList={() => handleAddBlock('list')}
        onInsertDivider={() => handleAddBlock('divider')}
        onInsertImage={handleInsertImageFromToolbar}
        onToggleEmphasisDots={handleToggleEmphasisDots}
        hasEmphasisDots={!!activeBlock?.hasEmphasisDots}
        activeBlockType={activeBlock?.type}
        activeListStyle={activeBlock?.listData?.style}
        onListStyleChange={(style) => {
          if (activeBlockId && activeBlock?.listData) {
            handleUpdateBlock(activeBlockId, {
              listData: { ...activeBlock.listData, style },
            });
          }
        }}
        canUndo={history.length > 0}
        onUndo={handleUndo}
        canRedo={future.length > 0}
        onRedo={handleRedo}
        canDelete={!!activeBlockId}
        onDeleteActiveBlock={handleDeleteActiveBlock}
        onClearSheet={() => setIsClearSheetModalOpen(true)}
        onOpenSettings={() => setIsDocSettingsOpen(true)}
        onAlignTextToGrid={handleAlignTextToPaperGrid}
        activeBlockId={activeBlockId}
        onUpdateBlockContent={(id, html) => handleUpdateBlock(id, { content: html })}
      />

      {/* Main Workspace Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        <DocumentPaper
          document={doc}
          activeBlockId={activeBlockId}
          onSelectBlock={(id) => setActiveBlockId(id)}
          onUpdateBlock={handleUpdateBlock}
          onDeleteBlock={handleDeleteBlock}
          onMoveBlock={handleMoveBlock}
          onDuplicateBlock={handleDuplicateBlock}
          onAddBlockAfter={(afterId, type) => handleAddBlock(type, afterId)}
          onEditSeal={handleEditSeal}
          onEditImage={handleEditImage}
          onOpenRubyModal={() => setIsRubyModalOpen(true)}
          onAddPage={handleAddPage}
          onDeletePage={handleDeletePage}
          onWritingModeChange={handleWritingModeChange}
          onChangeFontSize={handleFontSizeChange}
          onPaperFormatChange={handlePaperFormatChange}
          onPaperStyleChange={handlePaperStyleChange}
          onAlignTextToGrid={handleAlignTextToPaperGrid}
          onOpenPageSettings={() => setIsDocSettingsOpen(true)}
          showMarginGuides={isDocSettingsOpen && showMarginGuides}
        />
      </div>

      {/* Document Settings Drawer / Side Inspector */}
      <PageSettingsDrawer
        document={doc}
        isOpen={isDocSettingsOpen}
        onClose={() => setIsDocSettingsOpen(false)}
        onMarginChange={handleMarginChange}
        onGridOpacityChange={handleGridOpacityChange}
        onLineSpacingChange={handleLineSpacingChange}
        onCharacterSpacingChange={handleCharacterSpacingChange}
        onAlignTextToGrid={handleAlignTextToPaperGrid}
        onPaperStyleChange={handlePaperStyleChange}
        onPaperFormatChange={handlePaperFormatChange}
        onWritingModeChange={handleWritingModeChange}
        onFontSizeChange={handleFontSizeChange}
        onHeaderTextChange={(text) => updateDoc((p) => ({ ...p, headerText: text }))}
        onFooterTextChange={(text) => updateDoc((p) => ({ ...p, footerText: text }))}
        onTogglePageNumbers={(show) => updateDoc((p) => ({ ...p, showPageNumbers: show }))}
        activeBlockId={activeBlockId}
        showMarginGuides={showMarginGuides}
        onToggleMarginGuides={setShowMarginGuides}
      />

      {/* Typography Guide Drawer */}
      {isHelpOpen && (
        <div className="fixed bottom-14 left-4 z-40 w-96 bg-white border border-stone-200 rounded-xl shadow-2xl p-5 no-print animate-in slide-in-from-bottom-2 duration-150 max-h-[75vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-200">
            <h4 className="font-semibold text-sm text-stone-900">
              Guida Tipografica CJK (Cinese & Coreano)
            </h4>
            <button
              onClick={() => setIsHelpOpen(false)}
              className="text-stone-400 hover:text-stone-700 text-xs"
            >
              ✕
            </button>
          </div>
          <div className="text-xs text-stone-600 space-y-3 leading-relaxed">
            <p>
              <strong>Layout Verticale (竖排 / 세로쓰기):</strong> La scrittura verticale tradizionale dell'Asia orientale scorre dall'alto verso il basso, procedendo da destra verso sinistra. Le parentesi e le virgolette CJK (「」『』《》) si orientano automaticamente.
            </p>
            <p>
              <strong>Font Corsivi vs Stampatello:</strong>
              <br />• <em>Cinese Corsivo (行书/草书/楷书):</em> Ma Shan Zheng, Zhi Mang Xing, Long Cang, Liu Jian Mao Cao.
              <br />• <em>Cinese Stampatello (宋体/明体/黑体):</em> Noto Serif SC, Noto Sans SC, ZCOOL XiaoWei.
              <br />• <em>Coreano Corsivo (궁서/붓글씨/손글씨):</em> Nanum Brush Script, Nanum Pen Script, Yeon Sung, Dongle.
              <br />• <em>Coreano Stampatello (바탕/명조/고딕):</em> Noto Serif KR, Song Myung, Gowun Batang, Noto Sans KR.
            </p>
            <p>
              <strong>Annotazioni Ruby:</strong> Permettono di mostrare la pronuncia (Pinyin o Hanja-Hangul) direttamente sopra o a lato di ciascun carattere.
            </p>
            <p>
              <strong>Sigilli Tradizionali (印章 / 도장):</strong> Simboli in ceralacca rossa, sia nello stile <em>Baiwen</em> (caratteri bianchi su fondo rosso) sia <em>Zhuwen</em> (caratteri rossi su fondo chiaro).
            </p>
            <p>
              <strong>Esportazione PDF:</strong> Il pulsante <em>Stampa / PDF</em> apre il visualizzatore di stampa ad alta definizione per generare PDF vettoriali impeccabili; il pulsante <em>Scarica PDF</em> genera direttamente il file scaricabile in memoria senza server o API esterne.
            </p>
          </div>
        </div>
      )}

      {/* Modals */}
      <SpecialCharDrawer
        isOpen={isSpecialCharsOpen}
        onClose={() => setIsSpecialCharsOpen(false)}
        onInsertChar={handleInsertChar}
      />

      <TemplatePickerModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <RubyInsertModal
        isOpen={isRubyModalOpen}
        onClose={() => setIsRubyModalOpen(false)}
        onInsertRuby={handleInsertRuby}
        hasActiveBlock={!!activeBlock}
        activeBlockName={
          activeBlock
            ? activeBlock.type === 'heading1'
              ? 'Titolo Principale'
              : activeBlock.type === 'heading2'
              ? 'Sottotitolo / Autore'
              : activeBlock.type === 'poem-stanza'
              ? 'Versi Poetici'
              : activeBlock.type === 'image'
              ? 'Testo affiancato all\'Immagine'
              : 'Paragrafo'
            : 'Primo blocco del documento'
        }
        activeBlockCurrentText={activeBlock?.content || ''}
      />

      <SealConfigModal
        isOpen={isSealModalOpen}
        onClose={() => {
          setIsSealModalOpen(false);
          setEditingSeal(null);
        }}
        onAddSeal={handleSaveSeal}
        existingSeal={editingSeal?.seal}
      />

      <TableInsertModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        onInsertTable={handleInsertTable}
      />

      <AddBlockModal
        isOpen={isAddBlockOpen}
        onClose={() => setIsAddBlockOpen(false)}
        onSelectType={(type) => handleAddBlock(type)}
      />

      <ImageConfigModal
        isOpen={isImageModalOpen}
        onClose={() => {
          setIsImageModalOpen(false);
          setImageModalBlockId(null);
          setImageModalInitialData(undefined);
          setImageModalInitialContent('');
        }}
        initialData={imageModalInitialData}
        initialContent={imageModalInitialContent}
        onSave={handleSaveImageConfig}
      />

      <ExportResultModal
        successData={exportSuccessData}
        errorMessage={exportErrorMessage}
        onClose={() => {
          setExportSuccessData(null);
          setExportErrorMessage(null);
        }}
        onRetry={handleDownloadDirectPdf}
        onPrintFallback={handlePrintPdf}
      />

      {/* Clear Sheet Confirmation Modal */}
      <ClearSheetConfirmModal
        isOpen={isClearSheetModalOpen}
        onClose={() => setIsClearSheetModalOpen(false)}
        onConfirm={handleConfirmClearSheet}
      />

      {/* PWA Offline Mode Indicator */}
      <OfflineIndicator />
    </div>
  );
}
