import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export interface ExportPdfOptions {
  filename?: string;
  format?: 'A4' | 'B5' | 'Letter';
  paperBgColor?: string;
  marginMm?: number;
  onProgress?: (progress: number, stage: string) => void;
}

const FORMAT_SPECS: Record<
  'a4' | 'b5' | 'letter',
  {
    widthPx: number;
    heightPx: number;
    jsPdfFormat: string | [number, number];
    widthMm: number;
    heightMm: number;
  }
> = {
  a4: {
    widthPx: 794,
    heightPx: 1123,
    jsPdfFormat: 'a4',
    widthMm: 210,
    heightMm: 297,
  },
  b5: {
    widthPx: 665,
    heightPx: 945,
    jsPdfFormat: [176, 250],
    widthMm: 176,
    heightMm: 250,
  },
  letter: {
    widthPx: 816,
    heightPx: 1056,
    jsPdfFormat: 'letter',
    widthMm: 215.9,
    heightMm: 279.4,
  },
};

export interface ExportResult {
  blob: Blob;
  blobUrl: string;
  filename: string;
}

interface PositionedGlyphRun {
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  fontStyle: string;
  color: string;
  textDecoration: string;
  rotateDeg: number;
  isEmphasisEligible: boolean;
}

interface VerticalContainerSnapshot {
  width: number;
  height: number;
  hasEmphasisDots: boolean;
  runs: PositionedGlyphRun[];
}

const ROTATED_VERTICAL_PUNCTUATION = new Set([
  '「', '」', '『', '』', '（', '）', '〔', '〕', '【', '】',
  '《', '》', '〈', '〉', '—', '–', '―', '…', '‥', '～', '~',
  '(', ')', '[', ']', '{', '}', '─', '━',
]);

const SKIP_EMPHASIS_PUNCTUATION = new Set([
  '，', '。', '、', '；', '：', '？', '！', '·', '…', '—',
  '「', '」', '『', '』', '（', '）', '〔', '〕', '【', '】',
  '《', '》', '〈', '〉', '.', ',', ';', ':', '?', '!',
]);

function isCjkOrFullwidthChar(ch: string): boolean {
  const cp = ch.codePointAt(0);
  if (!cp) return false;
  return (
    (cp >= 0x4e00 && cp <= 0x9fff) || // CJK Unified Ideographs
    (cp >= 0x3400 && cp <= 0x4dbf) || // CJK Extension A
    (cp >= 0xf900 && cp <= 0xfaff) || // CJK Compatibility Ideographs
    (cp >= 0x3000 && cp <= 0x303f) || // CJK Symbols and Punctuation
    (cp >= 0x3040 && cp <= 0x30ff) || // Hiragana & Katakana
    (cp >= 0xac00 && cp <= 0xd7af) || // Hangul Syllables
    (cp >= 0x1100 && cp <= 0x11ff) || // Hangul Jamo
    (cp >= 0x3130 && cp <= 0x318f) || // Hangul Compatibility Jamo
    (cp >= 0xff00 && cp <= 0xffef) || // Halfwidth and Fullwidth Forms
    (cp >= 0x20000 && cp <= 0x2fa1f) // CJK Extensions B-F
  );
}

function getGraphemes(text: string): Array<{ segment: string; index: number }> {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const SegmenterCtor = (Intl as unknown as { Segmenter: new (loc?: string, opts?: { granularity: string }) => { segment: (s: string) => Iterable<{ segment: string; index: number }> } }).Segmenter;
    const segmenter = new SegmenterCtor(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text));
  }
  const result: Array<{ segment: string; index: number }> = [];
  let idx = 0;
  for (const ch of text) {
    result.push({ segment: ch, index: idx });
    idx += ch.length;
  }
  return result;
}

function getNormalizedColor(cs: CSSStyleDeclaration): string {
  const c = cs.color;
  if (!c || c === 'rgba(0, 0, 0, 0)' || c === 'transparent') {
    return '#1c1917';
  }
  return c;
}

/**
 * Snapshots exact browser-measured positions for every glyph and ruby annotation
 * inside a vertical-writing container BEFORE html2canvas-pro clones it.
 * This completely bypasses html2canvas-pro's broken iterateVerticalGlyphs / ruby renderers.
 */
function captureVerticalContainerSnapshot(
  container: HTMLElement
): VerticalContainerSnapshot | null {
  const containerRect = container.getBoundingClientRect();
  if (containerRect.width <= 0 || containerRect.height <= 0) {
    return null;
  }

  const hasEmphasisDots = container.classList.contains('cjk-emphasis-dot');
  const runs: PositionedGlyphRun[] = [];
  const doc = container.ownerDocument;

  const measureTextNode = (
    textNode: Text,
    styleEl: HTMLElement,
    insideRt: boolean
  ) => {
    const text = textNode.textContent || '';
    if (!text.trim()) return;

    const cs = window.getComputedStyle(styleEl);
    const fontFamily = cs.fontFamily || 'serif';
    const fontSize = cs.fontSize || '18px';
    const fontWeight = cs.fontWeight || 'normal';
    const fontStyle = cs.fontStyle || 'normal';
    const color = getNormalizedColor(cs);
    const textDecoration = cs.textDecorationLine && cs.textDecorationLine !== 'none' ? cs.textDecorationLine : '';
    const textOrientation = cs.textOrientation || 'upright';
    const isTateChuYoko =
      cs.textCombineUpright === 'all' || styleEl.classList.contains('tatechuyoko');

    // Tate-chu-yoko: render whole short horizontal span intact
    if (isTateChuYoko) {
      const range = doc.createRange();
      range.selectNodeContents(textNode);
      const rect = range.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        runs.push({
          text: text.trim(),
          left: rect.left - containerRect.left,
          top: rect.top - containerRect.top,
          width: rect.width,
          height: rect.height,
          fontFamily,
          fontSize,
          fontWeight,
          fontStyle,
          color,
          textDecoration,
          rotateDeg: 0,
          isEmphasisEligible: false,
        });
      }
      return;
    }

    // Inside <rt> or mixed orientation with non-CJK run (e.g. Pinyin "chūn"):
    // Browser renders non-CJK words sideways (+90deg) as a single continuous run.
    if ((insideRt || textOrientation === 'mixed') && !isCjkOrFullwidthChar(text.trim()[0] || '')) {
      const trimmed = text.trim();
      if (trimmed.length > 0 && !/[\u4e00-\u9fff\uac00-\ud7af\u3040-\u30ff]/.test(trimmed)) {
        const range = doc.createRange();
        const startOffset = text.indexOf(trimmed);
        range.setStart(textNode, Math.max(0, startOffset));
        range.setEnd(textNode, Math.min(text.length, startOffset + trimmed.length));
        const rect = range.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          runs.push({
            text: trimmed,
            left: rect.left - containerRect.left,
            top: rect.top - containerRect.top,
            width: rect.width,
            height: rect.height,
            fontFamily,
            fontSize,
            fontWeight,
            fontStyle,
            color,
            textDecoration,
            rotateDeg: 90,
            isEmphasisEligible: false,
          });
          return;
        }
      }
    }

    const graphemes = getGraphemes(text);
    const range = doc.createRange();

    for (const g of graphemes) {
      const seg = g.segment;
      if (!seg || /^\s+$/.test(seg)) continue;

      try {
        range.setStart(textNode, g.index);
        range.setEnd(textNode, g.index + seg.length);
      } catch {
        continue;
      }

      const clientRects = range.getClientRects();
      const rect = clientRects.length > 0 ? clientRects[0] : range.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) continue;

      const isPunctRotated = ROTATED_VERTICAL_PUNCTUATION.has(seg);
      const isMixedNonCjk =
        (insideRt || textOrientation === 'mixed') && !isCjkOrFullwidthChar(seg);
      const rotateDeg = isPunctRotated || isMixedNonCjk ? 90 : 0;

      runs.push({
        text: seg,
        left: rect.left - containerRect.left,
        top: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height,
        fontFamily,
        fontSize,
        fontWeight,
        fontStyle,
        color,
        textDecoration,
        rotateDeg,
        isEmphasisEligible: !insideRt && !SKIP_EMPHASIS_PUNCTUATION.has(seg),
      });
    }
  };

  const walk = (node: Node, insideRt: boolean) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const parentEl = node.parentElement || container;
      measureTextNode(node as Text, parentEl, insideRt);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;

    if (
      el.classList.contains('no-print') ||
      el.getAttribute('data-no-export') === 'true'
    ) {
      return;
    }

    const cs = window.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;

    // Skip <rp> fallback parentheses inside <ruby>
    if (el.tagName === 'RP') return;

    const childInsideRt = insideRt || el.tagName === 'RT';
    for (let i = 0; i < el.childNodes.length; i++) {
      walk(el.childNodes[i], childInsideRt);
    }
  };

  walk(container, false);

  return {
    width: containerRect.width,
    height: containerRect.height,
    hasEmphasisDots,
    runs,
  };
}

/**
 * Replaces a cloned vertical-writing element's DOM with horizontal-tb absolutely positioned
 * glyph boxes using exact coordinates measured from the live DOM.
 */
function applyVerticalSnapshotToClone(
  clonedDoc: Document,
  cloneEl: HTMLElement,
  snapshot: VerticalContainerSnapshot
) {
  cloneEl.innerHTML = '';
  cloneEl.style.position = 'relative';
  cloneEl.style.width = `${snapshot.width}px`;
  cloneEl.style.minWidth = `${snapshot.width}px`;
  cloneEl.style.height = `${snapshot.height}px`;
  cloneEl.style.minHeight = `${snapshot.height}px`;
  cloneEl.style.writingMode = 'horizontal-tb';
  cloneEl.style.textOrientation = 'mixed';
  cloneEl.style.letterSpacing = '0px';
  cloneEl.style.lineHeight = '1';
  cloneEl.style.padding = '0px';
  cloneEl.style.boxSizing = 'border-box';
  cloneEl.classList.remove('cjk-emphasis-dot', 'vertical-writing-upright', 'vertical-writing-mixed');

  for (const run of snapshot.runs) {
    const glyphSpan = clonedDoc.createElement('span');
    glyphSpan.textContent = run.text;
    glyphSpan.style.position = 'absolute';
    glyphSpan.style.writingMode = 'horizontal-tb';
    glyphSpan.style.fontFamily = run.fontFamily;
    glyphSpan.style.fontSize = run.fontSize;
    glyphSpan.style.fontWeight = run.fontWeight;
    glyphSpan.style.fontStyle = run.fontStyle;
    glyphSpan.style.color = run.color;
    glyphSpan.style.lineHeight = '1';
    glyphSpan.style.whiteSpace = 'nowrap';
    glyphSpan.style.margin = '0px';
    glyphSpan.style.padding = '0px';
    if (run.textDecoration) {
      glyphSpan.style.textDecoration = run.textDecoration;
    }

    if (run.rotateDeg !== 0) {
      const cx = run.left + run.width / 2;
      const cy = run.top + run.height / 2;
      glyphSpan.style.left = `${cx}px`;
      glyphSpan.style.top = `${cy}px`;
      glyphSpan.style.transform = `translate(-50%, -50%) rotate(${run.rotateDeg}deg)`;
      glyphSpan.style.transformOrigin = 'center center';
      glyphSpan.style.textAlign = 'center';
    } else {
      glyphSpan.style.left = `${run.left}px`;
      glyphSpan.style.top = `${run.top}px`;
      glyphSpan.style.width = `${run.width}px`;
      glyphSpan.style.height = `${run.height}px`;
      glyphSpan.style.display = 'flex';
      glyphSpan.style.alignItems = 'center';
      glyphSpan.style.justifyContent = 'center';
    }

    cloneEl.appendChild(glyphSpan);

    if (snapshot.hasEmphasisDots && run.isEmphasisEligible) {
      const dotSpan = clonedDoc.createElement('span');
      dotSpan.textContent = '•';
      dotSpan.style.position = 'absolute';
      dotSpan.style.writingMode = 'horizontal-tb';
      dotSpan.style.left = `${run.left + run.width + 1}px`;
      dotSpan.style.top = `${run.top + run.height / 2}px`;
      dotSpan.style.transform = 'translateY(-50%)';
      dotSpan.style.fontSize = `${Math.max(8, Math.round(parseFloat(run.fontSize) * 0.45))}px`;
      dotSpan.style.color = run.color;
      dotSpan.style.lineHeight = '1';
      cloneEl.appendChild(dotSpan);
    }
  }
}

/**
 * Converts horizontal-mode <ruby> elements into inline-flex stacked boxes
 * so html2canvas-pro renders Pinyin cleanly centered above CJK characters.
 */
function normalizeHorizontalRubyInClone(clonedDoc: Document, root: HTMLElement) {
  const rubies = Array.from(root.querySelectorAll('ruby'));
  for (const ruby of rubies) {
    const r = ruby as HTMLElement;
    const rt = r.querySelector('rt') as HTMLElement | null;
    const rb = r.querySelector('rb') as HTMLElement | null;
    const rps = r.querySelectorAll('rp');
    rps.forEach((rp) => rp.remove());

    if (!rt) continue;

    // Collect base text/nodes if <rb> wrapper is absent
    if (!rb) {
      const baseSpan = clonedDoc.createElement('span');
      const toMove: ChildNode[] = [];
      for (let i = 0; i < r.childNodes.length; i++) {
        const child = r.childNodes[i];
        if (child !== rt) {
          toMove.push(child);
        }
      }
      toMove.forEach((n) => baseSpan.appendChild(n));
      r.insertBefore(baseSpan, rt);
    } else {
      rb.style.display = 'block';
      rb.style.lineHeight = '1.15';
      rb.style.textAlign = 'center';
    }

    r.style.display = 'inline-flex';
    r.style.flexDirection = 'column-reverse';
    r.style.alignItems = 'center';
    r.style.verticalAlign = 'bottom';
    r.style.lineHeight = '1';
    r.style.margin = '0 0.12em';

    rt.style.display = 'block';
    rt.style.writingMode = 'horizontal-tb';
    rt.style.textAlign = 'center';
    rt.style.lineHeight = '1.05';
    rt.style.marginLeft = '0px';
    rt.style.marginBottom = '2px';
  }
}

export async function exportDocumentToPdf(
  elementIds: string[],
  options: ExportPdfOptions = {}
): Promise<ExportResult> {
  const {
    filename = 'cjk_document.pdf',
    format = 'A4',
    paperBgColor = '#ffffff',
    marginMm = 20,
    onProgress,
  } = options;

  try {
    onProgress?.(10, 'Preparazione pagine...');

    const pdfFormat = format.toLowerCase() as 'a4' | 'b5' | 'letter';
    const spec = FORMAT_SPECS[pdfFormat] || FORMAT_SPECS.a4;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: spec.jsPdfFormat,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Ensure all web fonts are fully loaded before measuring & capturing
    if (document.fonts) {
      onProgress?.(15, 'Caricamento font calligrafici...');
      await document.fonts.ready;
    }

    let renderedCount = 0;

    for (let i = 0; i < elementIds.length; i++) {
      const elId = elementIds[i];
      const el = document.getElementById(elId);
      if (!el) {
        console.warn(`Element with ID "${elId}" not found for PDF export.`);
        continue;
      }

      onProgress?.(
        Math.round(20 + ((i + 1) / elementIds.length) * 65),
        `Elaborazione pagina ${i + 1} di ${elementIds.length}...`
      );

      // Preload all images in the page
      const pageImages = Array.from(el.querySelectorAll('img'));
      if (pageImages.length > 0) {
        await Promise.all(
          pageImages.map(
            (img) =>
              new Promise((resolve) => {
                if (img.complete && img.naturalHeight !== 0) {
                  resolve(true);
                } else {
                  img.onload = () => resolve(true);
                  img.onerror = () => resolve(false);
                  setTimeout(resolve, 2500);
                }
              })
          )
        );
      }

      const marginPx = Math.round(marginMm * 3.7795);
      const liveHeight = Math.max(spec.heightPx, Math.ceil(el.scrollHeight));

      // Tag & snapshot all vertical-writing blocks + vertical seal texts BEFORE cloning
      const blockSnapshots = new Map<string, VerticalContainerSnapshot>();
      const taggedSealIds: Array<{ node: HTMLElement; id: string }> = [];

      const liveBlocks = Array.from(el.querySelectorAll('[data-block-id]')) as HTMLElement[];
      for (const liveBlock of liveBlocks) {
        const blockId = liveBlock.getAttribute('data-block-id');
        if (!blockId) continue;
        const cs = window.getComputedStyle(liveBlock);
        if (cs.writingMode && cs.writingMode.startsWith('vertical')) {
          const snap = captureVerticalContainerSnapshot(liveBlock);
          if (snap) {
            blockSnapshots.set(blockId, snap);
          }
        }
      }

      // Also snapshot vertical seal text divs (4-char seals use writingMode: vertical-rl)
      let sealIdx = 0;
      const sealDivs = Array.from(el.querySelectorAll('div')) as HTMLElement[];
      for (const div of sealDivs) {
        if (div.closest('[data-block-id]')) continue;
        if (div.style.writingMode === 'vertical-rl') {
          const snap = captureVerticalContainerSnapshot(div);
          if (snap) {
            const tempId = `seal_snap_${i}_${sealIdx++}`;
            div.setAttribute('data-vertical-seal-id', tempId);
            taggedSealIds.push({ node: div, id: tempId });
            blockSnapshots.set(`__seal__${tempId}`, snap);
          }
        }
      }

      let canvas: HTMLCanvasElement;
      try {
        canvas = await html2canvas(el, {
          width: spec.widthPx,
          height: liveHeight,
          windowWidth: spec.widthPx,
          windowHeight: liveHeight,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
          scale: 2.5,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: paperBgColor,
          ignoreElements: (element) => {
            return (
              element.classList?.contains('no-print') ||
              element.getAttribute('data-no-export') === 'true'
            );
          },
          onclone: (clonedDoc, clonedPageArg) => {
            const clonedPage =
              (clonedPageArg as HTMLElement | undefined) ||
              clonedDoc.getElementById(elId);
            if (!clonedPage) return;

            // Remove editor-only UI elements from cloned DOM
            const noPrints = clonedPage.querySelectorAll('.no-print, [data-no-export="true"]');
            noPrints.forEach((np) => np.remove());

            // Strip contenteditable so browser/canvas doesn't draw caret/editing artifacts
            const allEditables = clonedPage.querySelectorAll('[contenteditable]');
            allEditables.forEach((ed) => {
              (ed as HTMLElement).removeAttribute('contenteditable');
            });

            // Remove active outlines & selection highlights
            const activeRings = clonedPage.querySelectorAll(
              '.ring-1, .ring-2, .bg-amber-500\\/5, .bg-amber-500\\/10'
            );
            activeRings.forEach((ring) => {
              ring.classList.remove(
                'ring-1',
                'ring-2',
                'ring-amber-700/60',
                'ring-amber-500/60',
                'border-amber-600/60',
                'ring-amber-500/20',
                'bg-amber-500/5',
                'bg-amber-500/10'
              );
            });

            // Sync live contents & typography for horizontal blocks / cells,
            // and apply pre-measured glyph snapshots for vertical blocks.
            const cloneBlocks = Array.from(
              clonedPage.querySelectorAll('[data-block-id]')
            ) as HTMLElement[];

            for (const cloneBlock of cloneBlocks) {
              const blockId = cloneBlock.getAttribute('data-block-id');
              if (!blockId) continue;

              const vertSnap = blockSnapshots.get(blockId);
              if (vertSnap) {
                applyVerticalSnapshotToClone(clonedDoc, cloneBlock, vertSnap);
              } else {
                const liveBlock = el.querySelector(`[data-block-id="${blockId}"]`) as HTMLElement | null;
                if (liveBlock) {
                  cloneBlock.innerHTML = liveBlock.innerHTML;
                  const cs = window.getComputedStyle(liveBlock);
                  if (cs.fontFamily) cloneBlock.style.fontFamily = cs.fontFamily;
                  if (cs.fontSize) cloneBlock.style.fontSize = cs.fontSize;
                  if (cs.fontWeight) cloneBlock.style.fontWeight = cs.fontWeight;
                  if (cs.fontStyle) cloneBlock.style.fontStyle = cs.fontStyle;
                  cloneBlock.style.color = getNormalizedColor(cs);
                  if (cs.lineHeight) cloneBlock.style.lineHeight = cs.lineHeight;
                  if (cs.letterSpacing) cloneBlock.style.letterSpacing = cs.letterSpacing;
                  if (cs.textAlign) cloneBlock.style.textAlign = cs.textAlign;
                  cloneBlock.style.visibility = 'visible';
                  cloneBlock.style.opacity = '1';
                }
              }
            }

            // Apply vertical snapshots to 4-char seals
            const cloneSeals = Array.from(
              clonedPage.querySelectorAll('[data-vertical-seal-id]')
            ) as HTMLElement[];
            for (const cloneSeal of cloneSeals) {
              const tempId = cloneSeal.getAttribute('data-vertical-seal-id');
              if (!tempId) continue;
              const snap = blockSnapshots.get(`__seal__${tempId}`);
              if (snap) {
                applyVerticalSnapshotToClone(clonedDoc, cloneSeal, snap);
              }
            }

            // Sync table cell & list item contents/styles
            const liveCells = el.querySelectorAll('[data-cell-id], td, th');
            const cloneCells = clonedPage.querySelectorAll('[data-cell-id], td, th');
            for (let idx = 0; idx < liveCells.length && idx < cloneCells.length; idx++) {
              const lc = liveCells[idx] as HTMLElement;
              const cc = cloneCells[idx] as HTMLElement;
              if (lc && cc) {
                cc.innerHTML = lc.innerHTML;
                const cs = window.getComputedStyle(lc);
                if (cs.fontFamily) cc.style.fontFamily = cs.fontFamily;
                if (cs.fontSize) cc.style.fontSize = cs.fontSize;
                cc.style.color = getNormalizedColor(cs);
                if (cs.textAlign) cc.style.textAlign = cs.textAlign;
              }
            }

            // Convert remaining horizontal <ruby> tags into flex columns so html2canvas renders Pinyin above base chars
            normalizeHorizontalRubyInClone(clonedDoc, clonedPage);

            // Prevent any images from overflowing
            const allImages = clonedPage.querySelectorAll('img');
            allImages.forEach((img) => {
              img.style.maxWidth = '100%';
              img.style.objectFit = 'contain';
            });

            // Force grid and traditional border overlays to fill their container cleanly
            const gridPattern = clonedPage.querySelector('.grid-pattern-overlay') as HTMLElement | null;
            if (gridPattern) {
              gridPattern.style.top = '0px';
              gridPattern.style.left = '0px';
              gridPattern.style.right = '0px';
              gridPattern.style.bottom = '0px';
              gridPattern.style.width = '100%';
              gridPattern.style.height = '100%';
              gridPattern.style.position = 'absolute';
              gridPattern.style.display = 'block';
              gridPattern.style.pointerEvents = 'none';
            }

            const borderOverlay = clonedPage.querySelector('.traditional-border-overlay') as HTMLElement | null;
            if (borderOverlay) {
              borderOverlay.style.top = '0px';
              borderOverlay.style.left = '0px';
              borderOverlay.style.right = '0px';
              borderOverlay.style.bottom = '0px';
              borderOverlay.style.width = '100%';
              borderOverlay.style.height = '100%';
              borderOverlay.style.position = 'absolute';
              borderOverlay.style.display = 'block';
            }

            // Isolate clonedPage at (0, 0) in clonedDoc.body so parent scroll/flex wrappers never offset it
            clonedDoc.documentElement.style.margin = '0';
            clonedDoc.documentElement.style.padding = '0';
            clonedDoc.documentElement.style.overflow = 'visible';
            clonedDoc.documentElement.style.width = `${spec.widthPx}px`;
            clonedDoc.documentElement.style.height = `${liveHeight}px`;

            clonedDoc.body.style.margin = '0';
            clonedDoc.body.style.padding = '0';
            clonedDoc.body.style.overflow = 'visible';
            clonedDoc.body.style.width = `${spec.widthPx}px`;
            clonedDoc.body.style.height = `${liveHeight}px`;
            clonedDoc.body.style.backgroundColor = paperBgColor;
            clonedDoc.body.style.display = 'block';
            clonedDoc.body.replaceChildren(clonedPage);

            clonedPage.style.position = 'relative';
            clonedPage.style.left = '0px';
            clonedPage.style.top = '0px';
            clonedPage.style.margin = '0px';
            clonedPage.style.transform = 'none';
            clonedPage.style.boxShadow = 'none';
            clonedPage.style.border = 'none';
            clonedPage.style.borderRadius = '0px';
            clonedPage.style.outline = 'none';
            clonedPage.style.width = `${spec.widthPx}px`;
            clonedPage.style.maxWidth = `${spec.widthPx}px`;
            clonedPage.style.minWidth = `${spec.widthPx}px`;
            clonedPage.style.height = `${liveHeight}px`;
            clonedPage.style.minHeight = `${liveHeight}px`;
            clonedPage.style.maxHeight = 'none';
            clonedPage.style.boxSizing = 'border-box';
            clonedPage.style.overflow = 'visible';
            clonedPage.style.backgroundColor = paperBgColor;
            clonedPage.style.padding = `${marginPx}px`;
          },
        });
      } finally {
        for (const item of taggedSealIds) {
          item.node.removeAttribute('data-vertical-seal-id');
        }
      }

      const imgData = canvas.toDataURL('image/png');

      if (renderedCount > 0) {
        pdf.addPage(spec.jsPdfFormat, 'portrait');
      }

      // Strictly preserve geometric aspect ratio: NEVER stretch characters
      const canvasRatio = canvas.width / canvas.height;
      const targetRatio = pageWidth / pageHeight;

      let drawWidth = pageWidth;
      let drawHeight = pageHeight;
      let posX = 0;
      let posY = 0;

      if (Math.abs(canvasRatio - targetRatio) > 0.002) {
        if (canvasRatio > targetRatio) {
          drawHeight = pageWidth / canvasRatio;
          posY = (pageHeight - drawHeight) / 2;
        } else {
          drawWidth = pageHeight * canvasRatio;
          posX = (pageWidth - drawWidth) / 2;
        }
      }

      pdf.addImage(imgData, 'PNG', posX, posY, drawWidth, drawHeight, undefined, 'FAST');
      renderedCount++;
    }

    if (renderedCount === 0) {
      throw new Error('Nessuna pagina trovata da esportare.');
    }

    onProgress?.(92, 'Generazione file PDF...');

    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);

    try {
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = blobUrl;
      downloadAnchor.download = filename;
      downloadAnchor.style.display = 'none';
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();

      setTimeout(() => {
        try {
          document.body.removeChild(downloadAnchor);
        } catch (_) {}
      }, 5000);
    } catch (downloadErr) {
      console.warn('Programmatic download anchor triggered fallback:', downloadErr);
    }

    onProgress?.(100, 'Completato!');

    return {
      blob: pdfBlob,
      blobUrl,
      filename,
    };
  } catch (error) {
    console.error("Errore durante l'esportazione del PDF:", error);
    throw error;
  }
}

export function printDocumentDirectly(): void {
  window.print();
}
