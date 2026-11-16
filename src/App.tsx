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
import {
  subscribeSelectionStyle,
  SelectionStyleState,
  stripInlineStyleFromHtml,
  insertTextAtSelection,
} from './utils/textFormatting';
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
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [addBlockTargetPageId, setAddBlockTargetPageId] = useState<string | null>(null);
  const [selectionStyle, setSelectionStyle] = useState<SelectionStyleState | null>(null);

  // History Stacks for Undo & Redo
  const [history, setHistory] = useState<CJKDocument[]>([]);
  const [future, setFuture] = useState<CJKDocument[]>([]);

  // Subscribe to selection style changes inside editable blocks
  useEffect(() => {
    const unsub = subscribeSelectionStyle((st) => {
      setSelectionStyle(st);
    });
    return unsub;
  }, []);

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

  const focusBlockById = (blockId: string, scrollIntoView = false) => {
    setTimeout(() => {
      const el = document.querySelector(`[data-block-id="${blockId}"]`) as HTMLElement | null;
      if (el) {
        if (scrollIntoView) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        el.focus();
      }
    }, 50);
  };

  // Helper to update doc while preserving undo history
  const updateDoc = (
    updater: (prev: CJKDocument) => CJKDocument,
    recordHistory = true
  ) => {
    setDoc((prev) => {
      const next = updater(prev);
      if (next === prev) return prev;
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

  // Block updates (supports partial object or functional updater to avoid stale closures across cells/items)
  const handleUpdateBlock = (
    blockId: string,
    updates:
      | Partial<DocumentBlock>
      | ((prevBlock: DocumentBlock) => Partial<DocumentBlock>)
  ) => {
    updateDoc((prev) => {
      let changed = false;
      const newPages = prev.pages.map((page) => ({
        ...page,
        blocks: page.blocks.map((b) => {
          if (b.id !== blockId) return b;
          const resolved = typeof updates === 'function' ? updates(b) : updates;
          if (!resolved || Object.keys(resolved).length === 0) return b;
          changed = true;
          return { ...b, ...resolved };
        }),
      }));
      return changed ? { ...prev, pages: newPages } : prev;
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
    const newId = `blk_${Date.now()}`;
    updateDoc((prev) => {
      const newPages = prev.pages.map((page) => {
        const idx = page.blocks.findIndex((b) => b.id === blockId);
        if (idx === -1) return page;
        const target = page.blocks[idx];
        const clone: DocumentBlock = {
          ...JSON.parse(JSON.stringify(target)),
          id: newId,
        };
        const newBlocks = [...page.blocks];
        newBlocks.splice(idx + 1, 0, clone);
        return { ...page, blocks: newBlocks };
      });
      return { ...prev, pages: newPages };
    });
    setActiveBlockId(newId);
  };

  // Resolve target page index for block insertions
  const resolveTargetPageIndex = (
    pages: CJKDocument['pages'],
    afterBlockId?: string,
    explicitPageId?: string | null
  ): number => {
    if (afterBlockId) {
      const pIdx = pages.findIndex((p) => p.blocks.some((b) => b.id === afterBlockId));
      if (pIdx !== -1) return pIdx;
    }
    if (explicitPageId) {
      const pIdx = pages.findIndex((p) => p.id === explicitPageId);
      if (pIdx !== -1) return pIdx;
    }
    if (activeBlockId) {
      const pIdx = pages.findIndex((p) => p.blocks.some((b) => b.id === activeBlockId));
      if (pIdx !== -1) return pIdx;
    }
    if (activePageId) {
      const pIdx = pages.findIndex((p) => p.id === activePageId);
      if (pIdx !== -1) return pIdx;
    }
    return 0;
  };

  // Add block (inserts right after afterBlockId or activeBlockId on the active page, or at end of explicitPageId)
  const handleAddBlock = (
    type: BlockType,
    afterBlockId?: string,
    explicitPageId?: string | null,
    listStyleOverride?: ListNumberingType
  ) => {
    const newBlockId = `blk_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newBlock: DocumentBlock = {
      id: newBlockId,
      type,
      content: '', // Clean and empty by default
      fontFamily: doc.defaultFontFamily,
      fontSize:
        type === 'heading1'
          ? Math.round(doc.defaultFontSize * 1.5)
          : type === 'heading2'
          ? Math.round(doc.defaultFontSize * 1.15)
          : type === 'list'
          ? Math.min(doc.defaultFontSize || 16, 22)
          : doc.defaultFontSize,
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
      newBlock.lineHeight = 1.6;
      newBlock.listData = {
        style: listStyleOverride || getDefaultListStyle(doc),
        items: [{ id: `li_1_${Date.now()}`, text: '' }],
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

    let insertedPageId = activePageId;
    updateDoc((prev) => {
      const targetIdx = resolveTargetPageIndex(prev.pages, afterBlockId, explicitPageId);
      const targetPage = prev.pages[targetIdx];
      if (!targetPage) return prev;
      insertedPageId = targetPage.id;

      const updatedBlocks = [...targetPage.blocks];
      const anchorId = afterBlockId || (!explicitPageId ? activeBlockId : undefined);
      if (anchorId) {
        const idx = updatedBlocks.findIndex((b) => b.id === anchorId);
        if (idx !== -1) {
          updatedBlocks.splice(idx + 1, 0, newBlock);
        } else {
          updatedBlocks.push(newBlock);
        }
      } else {
        updatedBlocks.push(newBlock);
      }

      const newPages = prev.pages.map((p, i) =>
        i === targetIdx ? { ...p, blocks: updatedBlocks } : p
      );
      return { ...prev, pages: newPages };
    });

    setActiveBlockId(newBlockId);
    if (insertedPageId) setActivePageId(insertedPageId);

    // If new block is image, open the configuration modal right away for smooth UX
    if (type === 'image') {
      setImageModalBlockId(newBlockId);
      setImageModalInitialData(newBlock.imageData);
      setImageModalInitialContent(newBlock.content);
      setIsImageModalOpen(true);
    } else if (
      type === 'paragraph' ||
      type === 'heading1' ||
      type === 'heading2' ||
      type === 'poem-stanza'
    ) {
      focusBlockById(newBlockId, true);
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
    const ts = Date.now();
    const newPageId = `page_${ts}`;
    const newBlockId = `blk_${ts}_p`;
    updateDoc((prev) => {
      const newPageNumber = prev.pages.length + 1;
      const newPage = {
        id: newPageId,
        pageNumber: newPageNumber,
        blocks: [
          {
            id: newBlockId,
            type: 'paragraph' as BlockType,
            content: '',
            fontFamily: prev.defaultFontFamily,
            fontSize: prev.defaultFontSize,
            color: prev.primaryColor,
            textAlign: 'left' as const,
          },
        ],
      };
      return {
        ...prev,
        pages: [...prev.pages, newPage],
      };
    });
    setActivePageId(newPageId);
    setActiveBlockId(newBlockId);
    focusBlockById(newBlockId, true);
  };

  // Delete Page
  const handleDeletePage = (pageIdx: number) => {
    if (doc.pages.length <= 1) return;
    updateDoc((prev) => {
      const newPages = prev.pages.filter((_, idx) => idx !== pageIdx);
      return { ...prev, pages: newPages };
    });
    const fallbackPage = doc.pages[Math.max(0, pageIdx - 1)];
    if (fallbackPage) {
      setActivePageId(fallbackPage.id);
      setActiveBlockId(fallbackPage.blocks[0]?.id || null);
    }
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
      updateDoc((prev) => ({
        ...prev,
        pages: prev.pages.map((p) => ({
          ...p,
          blocks: p.blocks.map((b) => {
            if (b.id !== activeBlockId) return b;
            const cleanedContent = stripInlineStyleFromHtml(b.content, 'fontFamily');
            if (b.type === 'table' && b.tableData) {
              return {
                ...b,
                content: cleanedContent,
                fontFamily: fontCss,
                tableData: {
                  ...b.tableData,
                  fontFamily: fontCss,
                  cells: b.tableData.cells.map((row) =>
                    row.map((c) => ({
                      ...c,
                      fontFamily: undefined,
                      content: stripInlineStyleFromHtml(c.content, 'fontFamily'),
                    }))
                  ),
                },
              };
            }
            if (b.type === 'list' && b.listData) {
              return {
                ...b,
                content: cleanedContent,
                fontFamily: fontCss,
                listData: {
                  ...b.listData,
                  items: b.listData.items.map((it) => ({
                    ...it,
                    text: stripInlineStyleFromHtml(it.text, 'fontFamily'),
                  })),
                },
              };
            }
            return { ...b, content: cleanedContent, fontFamily: fontCss };
          }),
        })),
      }));
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
            blocks: p.blocks.map((b) => {
              if (b.id !== activeBlockId) return b;
              const cleanedContent = stripInlineStyleFromHtml(b.content, 'fontSize');
              if (b.type === 'table' && b.tableData) {
                return {
                  ...b,
                  content: cleanedContent,
                  fontSize: boundedSize,
                  tableData: {
                    ...b.tableData,
                    fontSize: boundedSize,
                    cells: b.tableData.cells.map((row) =>
                      row.map((c) => ({
                        ...c,
                        fontSize: undefined,
                        content: stripInlineStyleFromHtml(c.content, 'fontSize'),
                      }))
                    ),
                  },
                };
              }
              if (b.type === 'list' && b.listData) {
                return {
                  ...b,
                  content: cleanedContent,
                  fontSize: boundedSize,
                  listData: {
                    ...b.listData,
                    items: b.listData.items.map((it) => ({
                      ...it,
                      text: stripInlineStyleFromHtml(it.text, 'fontSize'),
                    })),
                  },
                };
              }
              return {
                ...b,
                content: cleanedContent,
                fontSize: boundedSize,
              };
            }),
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
              const cur =
                b.type === 'table'
                  ? b.fontSize || b.tableData?.fontSize || prev.defaultFontSize
                  : b.fontSize || prev.defaultFontSize;
              const next = Math.max(10, Math.min(72, cur + delta));
              return {
                ...b,
                content: stripInlineStyleFromHtml(b.content, 'fontSize'),
                fontSize: next,
                tableData: b.tableData
                  ? {
                      ...b.tableData,
                      fontSize: next,
                      cells: b.tableData.cells.map((row) =>
                        row.map((c) => ({
                          ...c,
                          fontSize: undefined,
                          content: stripInlineStyleFromHtml(c.content, 'fontSize'),
                        }))
                      ),
                    }
                  : undefined,
                listData: b.listData
                  ? {
                      ...b.listData,
                      items: b.listData.items.map((it) => ({
                        ...it,
                        text: stripInlineStyleFromHtml(it.text, 'fontSize'),
                      })),
                    }
                  : undefined,
              };
            }),
          })),
        };
      }
    });
  };

  const handleColorChange = (color: string) => {
    if (activeBlockId) {
      updateDoc((prev) => ({
        ...prev,
        pages: prev.pages.map((p) => ({
          ...p,
          blocks: p.blocks.map((b) => {
            if (b.id !== activeBlockId) return b;
            const cleanedContent = stripInlineStyleFromHtml(b.content, 'color');
            if (b.type === 'table' && b.tableData) {
              return {
                ...b,
                content: cleanedContent,
                color,
                tableData: {
                  ...b.tableData,
                  cells: b.tableData.cells.map((row) =>
                    row.map((c) => ({
                      ...c,
                      textColor: undefined,
                      content: stripInlineStyleFromHtml(c.content, 'color'),
                    }))
                  ),
                },
              };
            }
            if (b.type === 'list' && b.listData) {
              return {
                ...b,
                content: cleanedContent,
                color,
                listData: {
                  ...b.listData,
                  items: b.listData.items.map((it) => ({
                    ...it,
                    text: stripInlineStyleFromHtml(it.text, 'color'),
                  })),
                },
              };
            }
            return {
              ...b,
              content: cleanedContent,
              color,
            };
          }),
        })),
      }));
    } else {
      updateDoc((prev) => ({ ...prev, primaryColor: color }));
    }
  };

  const handleTextAlignChange = (align: 'left' | 'center' | 'right' | 'justify') => {
    const applyAlignToBlock = (b: DocumentBlock): DocumentBlock => {
      if (b.type === 'table' && b.tableData) {
        const cellAlign: 'left' | 'center' | 'right' =
          align === 'justify' ? 'left' : align;
        return {
          ...b,
          textAlign: align,
          tableData: {
            ...b.tableData,
            cells: b.tableData.cells.map((row) =>
              row.map((c) => ({ ...c, align: cellAlign }))
            ),
          },
        };
      }
      return { ...b, textAlign: align };
    };

    updateDoc((prev) => {
      if (activeBlockId) {
        return {
          ...prev,
          pages: prev.pages.map((p) => ({
            ...p,
            blocks: p.blocks.map((b) =>
              b.id === activeBlockId ? applyAlignToBlock(b) : b
            ),
          })),
        };
      } else {
        return {
          ...prev,
          pages: prev.pages.map((p) => ({
            ...p,
            blocks: p.blocks.map(applyAlignToBlock),
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
    const val = Math.max(1.0, Math.min(4.0, Math.round(newSpacing * 10) / 10));
    updateDoc((prev) => ({
      ...prev,
      lineSpacing: val,
      autoGridAlign: false,
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
    updateDoc((prev) => alignDocumentToPaperGrid({ ...prev, autoGridAlign: true }));
  };

  const handleCharacterSpacingChange = (newSpacing: number, applyToAllBlocks = true) => {
    const val = Math.max(0, Math.min(0.6, Math.round(newSpacing * 100) / 100));
    updateDoc((prev) => ({
      ...prev,
      characterSpacing: val,
      autoGridAlign: false,
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
    const targetIdx = resolveTargetPageIndex(doc.pages);
    const targetPage = doc.pages[targetIdx];
    const targetId = activeBlockId || targetPage?.blocks[0]?.id;
    const targetBlock = doc.pages.flatMap((p) => p.blocks).find((b) => b.id === targetId);

    if (action === 'new-block' || !targetBlock) {
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
      updateDoc((prev) => {
        const pIdx = resolveTargetPageIndex(prev.pages);
        const page = prev.pages[pIdx];
        if (!page) return prev;
        const blocks = [...page.blocks];
        const aIdx = activeBlockId ? blocks.findIndex((b) => b.id === activeBlockId) : -1;
        if (aIdx !== -1) {
          blocks.splice(aIdx + 1, 0, newBlock);
        } else {
          blocks.push(newBlock);
        }
        return {
          ...prev,
          pages: prev.pages.map((p, i) => (i === pIdx ? { ...p, blocks } : p)),
        };
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
      const sealBlock: DocumentBlock = {
        id: `blk_seal_${Date.now()}`,
        type: 'seal-group',
        content: '',
        seals: [newSeal],
      };
      updateDoc((prev) => {
        const pIdx = resolveTargetPageIndex(prev.pages);
        const page = prev.pages[pIdx];
        if (!page) return prev;
        const blocks = [...page.blocks];
        const aIdx = activeBlockId ? blocks.findIndex((b) => b.id === activeBlockId) : -1;
        if (aIdx !== -1) {
          blocks.splice(aIdx + 1, 0, sealBlock);
        } else {
          blocks.push(sealBlock);
        }
        return {
          ...prev,
          pages: prev.pages.map((p, i) => (i === pIdx ? { ...p, blocks } : p)),
        };
      });
      setActiveBlockId(sealBlock.id);
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
      const pIdx = resolveTargetPageIndex(prev.pages);
      const page = prev.pages[pIdx];
      if (!page) return prev;
      const blocks = [...page.blocks];
      const aIdx = activeBlockId ? blocks.findIndex((b) => b.id === activeBlockId) : -1;
      if (aIdx !== -1) {
        blocks.splice(aIdx + 1, 0, tableBlock);
      } else {
        blocks.push(tableBlock);
      }
      return {
        ...prev,
        pages: prev.pages.map((p, i) => (i === pIdx ? { ...p, blocks } : p)),
      };
    });
    setActiveBlockId(tableBlock.id);
  };

  // Special character click
  const handleInsertChar = (char: string) => {
    const inserted = insertTextAtSelection(char, activeBlockId);
    if (inserted) {
      if (!inserted.isCell && inserted.blockId) {
        handleUpdateBlock(inserted.blockId, { content: inserted.newHtml });
      }
      return;
    }
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
    printDocumentDirectly(doc.paperFormat);
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
        paperStyle: doc.paperStyle,
        paperBgColor,
        gridOpacity: doc.gridOpacity ?? 0.55,
        writingMode: doc.writingMode,
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

  const isGridPaperActive =
    doc.paperStyle !== 'plain' &&
    doc.paperStyle !== 'xuan' &&
    doc.paperStyle !== 'hanji';

  const effectiveActiveFontSize =
    activeBlock?.type === 'table'
      ? activeBlock.fontSize ||
        activeBlock.tableData?.fontSize ||
        doc.defaultFontSize ||
        16
      : activeBlock?.type === 'list'
      ? activeBlock.fontSize || Math.min(doc.defaultFontSize || 16, 22)
      : activeBlock?.fontSize ||
        (isGridPaperActive
          ? doc.defaultFontSize
          : activeBlock?.type === 'heading1'
          ? Math.round(doc.defaultFontSize * 1.5)
          : activeBlock?.type === 'heading2'
          ? Math.round(doc.defaultFontSize * 1.15)
          : doc.defaultFontSize);

  const effectiveActiveFontFamily =
    activeBlock?.type === 'table'
      ? activeBlock.fontFamily ||
        activeBlock.tableData?.fontFamily ||
        doc.defaultFontFamily
      : activeBlock?.fontFamily || doc.defaultFontFamily;

  return (
    <div className="app-shell min-h-screen flex flex-col bg-stone-100 text-stone-900 font-sans selection:bg-amber-200">
      {/* Top Bar honoring 3-zone contract */}
      <TopNav
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onToggleSpecialChars={() => setIsSpecialCharsOpen((prev) => !prev)}
        onOpenAddMenu={() => {
          setAddBlockTargetPageId(null);
          setIsAddBlockOpen(true);
        }}
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
        activeFontFamily={effectiveActiveFontFamily}
        onFontFamilyChange={handleFontFamilyChange}
        activeFontSize={effectiveActiveFontSize}
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
        onInsertParagraph={() => handleAddBlock('paragraph', activeBlockId || undefined)}
        onInsertList={(style) => handleAddBlock('list', activeBlockId || undefined, null, style)}
        onInsertDivider={() => handleAddBlock('divider', activeBlockId || undefined)}
        onInsertImage={handleInsertImageFromToolbar}
        onToggleEmphasisDots={handleToggleEmphasisDots}
        hasEmphasisDots={!!activeBlock?.hasEmphasisDots}
        activeBlockType={activeBlock?.type}
        activeListStyle={activeBlock?.listData?.style}
        onListStyleChange={(style) => {
          if (activeBlockId) {
            handleUpdateBlock(activeBlockId, (prevBlock) =>
              prevBlock.listData
                ? { listData: { ...prevBlock.listData, style } }
                : {}
            );
          }
        }}
        isKorean={isKoreanDocument(doc)}
        canUndo={history.length > 0}
        onUndo={handleUndo}
        canRedo={future.length > 0}
        onRedo={handleRedo}
        canDelete={!!activeBlockId}
        onDeleteActiveBlock={handleDeleteActiveBlock}
        onMoveActiveBlock={(dir) => activeBlockId && handleMoveBlock(activeBlockId, dir)}
        onDuplicateActiveBlock={() => activeBlockId && handleDuplicateBlock(activeBlockId)}
        onClearSheet={() => setIsClearSheetModalOpen(true)}
        onOpenSettings={() => setIsDocSettingsOpen(true)}
        onAlignTextToGrid={handleAlignTextToPaperGrid}
        activeBlockId={activeBlockId}
        onUpdateBlockContent={(id, html) => handleUpdateBlock(id, { content: html })}
        selectionStyle={selectionStyle}
      />

      {/* Main Workspace Canvas */}
      <div className="workspace-container flex-1 flex overflow-hidden relative">
        <DocumentPaper
          document={doc}
          activeBlockId={activeBlockId}
          activePageId={activePageId}
          onSelectBlock={(id, pageId) => {
            setActiveBlockId(id);
            if (pageId) setActivePageId(pageId);
          }}
          onSelectPage={(pageId) => {
            setActivePageId(pageId);
            setActiveBlockId((prevId) => {
              const page = doc.pages.find((p) => p.id === pageId);
              if (!page) return prevId;
              // Preserve prevId if it belongs to this page or was just inserted on it
              const belongsToAnotherPage = doc.pages.some(
                (p) => p.id !== pageId && p.blocks.some((b) => b.id === prevId)
              );
              if (!belongsToAnotherPage && prevId) return prevId;
              return page.blocks[page.blocks.length - 1]?.id || null;
            });
          }}
          onUpdateBlock={handleUpdateBlock}
          onDeleteBlock={handleDeleteBlock}
          onMoveBlock={handleMoveBlock}
          onDuplicateBlock={handleDuplicateBlock}
          onAddBlockAfter={(afterId, type) => handleAddBlock(type, afterId)}
          onAddBlockOnPage={(pageId, type) => handleAddBlock(type, undefined, pageId)}
          onOpenAddMenuOnPage={(pageId) => {
            setAddBlockTargetPageId(pageId);
            setIsAddBlockOpen(true);
          }}
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
          selectionStyle={selectionStyle}
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
        onClose={() => {
          setIsAddBlockOpen(false);
          setAddBlockTargetPageId(null);
        }}
        onSelectType={(type) => {
          handleAddBlock(
            type,
            addBlockTargetPageId ? undefined : activeBlockId || undefined,
            addBlockTargetPageId
          );
          setAddBlockTargetPageId(null);
        }}
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
