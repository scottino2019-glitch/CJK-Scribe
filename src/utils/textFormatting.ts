/**
 * Rich Text Selection Formatting Utility
 * Enables selective styling (font family, font size, ink color, bold, italic)
 * directly on user-selected text spans inside contentEditable blocks and cells,
 * preserving selection across toolbar interactions and normalizing font matching.
 */

export interface SelectionStyleState {
  hasSelection: boolean;
  blockId: string | null;
  cellId?: string | null;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

let lastSavedRange: Range | null = null;
let lastActiveBlockId: string | null = null;
let lastActiveCellId: string | null = null;
const selectionListeners = new Set<(state: SelectionStyleState) => void>();
let isTrackingInitialized = false;

/**
 * Extracts the primary font family name in lowercase without quotes
 * so "'Ma Shan Zheng', 'KaiTi', cursive, serif" matches "\"Ma Shan Zheng\", KaiTi, cursive, serif".
 */
export function extractPrimaryFontName(fontCss?: string | null): string {
  if (!fontCss) return '';
  const first = fontCss.split(',')[0] || '';
  return first.replace(/["']/g, '').trim().toLowerCase();
}

export function fontsMatch(a?: string | null, b?: string | null): boolean {
  const pa = extractPrimaryFontName(a);
  const pb = extractPrimaryFontName(b);
  return !!pa && !!pb && pa === pb;
}

const editableChangeHandlers = new WeakMap<HTMLElement, (html: string) => void>();

export function registerEditableChangeHandler(
  el: HTMLElement | null,
  handler: ((html: string) => void) | null
) {
  if (!el) return;
  if (handler) {
    editableChangeHandlers.set(el, handler);
  } else {
    editableChangeHandlers.delete(el);
  }
}

function findEditableElement(node: Node | null): HTMLElement | null {
  let curr: Node | null = node;
  while (curr && curr !== document.body && curr !== document.documentElement) {
    if (
      curr instanceof HTMLElement &&
      (curr.isContentEditable || curr.getAttribute('contenteditable') === 'true') &&
      (curr.hasAttribute('data-block-id') || curr.hasAttribute('data-cell-id'))
    ) {
      return curr;
    }
    curr = curr.parentNode;
  }
  return null;
}

function getEditableMeta(editableEl: HTMLElement): {
  parentBlockId: string | null;
  cellId: string | null;
} {
  const cellId = editableEl.getAttribute('data-cell-id');
  const parentBlockId =
    editableEl.getAttribute('data-parent-block-id') ||
    editableEl.getAttribute('data-block-id') ||
    null;
  return { parentBlockId, cellId };
}

interface EditableRangeTarget {
  editableEl: HTMLElement;
  safeRange: Range;
}

function resolveValidEditableRange(range: Range): EditableRangeTarget | null {
  const commonEl = findEditableElement(range.commonAncestorContainer);
  if (commonEl) {
    return { editableEl: commonEl, safeRange: range };
  }

  const startEl = findEditableElement(range.startContainer);
  const endEl = findEditableElement(range.endContainer);

  // Clamp to end of startEl when drag/triple-click ends outside startEl or at start of next td/list item
  if (startEl && startEl.contains(range.startContainer)) {
    const clamped = document.createRange();
    clamped.selectNodeContents(startEl);
    clamped.setStart(range.startContainer, range.startOffset);
    if (!clamped.collapsed && clamped.toString().length > 0) {
      return { editableEl: startEl, safeRange: clamped };
    }
  }

  if (endEl && !startEl && endEl.contains(range.endContainer)) {
    const clamped = document.createRange();
    clamped.selectNodeContents(endEl);
    clamped.setEnd(range.endContainer, range.endOffset);
    if (!clamped.collapsed && clamped.toString().length > 0) {
      return { editableEl: endEl, safeRange: clamped };
    }
  }

  return null;
}

function collectEditableTargets(
  range: Range,
  targetBlockId?: string | null
): EditableRangeTarget[] {
  const matchesTarget = (editableEl: HTMLElement): boolean => {
    if (!targetBlockId) return true;
    const { parentBlockId } = getEditableMeta(editableEl);
    return !parentBlockId || parentBlockId === targetBlockId;
  };

  const commonEl = findEditableElement(range.commonAncestorContainer);
  if (commonEl) {
    if (!range.collapsed && range.toString().length > 0 && matchesTarget(commonEl)) {
      return [{ editableEl: commonEl, safeRange: range }];
    }
    return [];
  }

  const ancestorEl =
    range.commonAncestorContainer instanceof Element
      ? range.commonAncestorContainer
      : range.commonAncestorContainer.parentElement;

  if (ancestorEl) {
    const cellEls = Array.from(
      ancestorEl.querySelectorAll('[data-cell-id]')
    ) as HTMLElement[];
    const targets: EditableRangeTarget[] = [];
    let sharedParentId: string | null = targetBlockId || null;

    for (const cellEl of cellEls) {
      if (!cellEl.isConnected) continue;
      let intersects = false;
      try {
        intersects = range.intersectsNode(cellEl);
      } catch {
        intersects = false;
      }
      if (!intersects) continue;

      const meta = getEditableMeta(cellEl);
      if (sharedParentId && meta.parentBlockId && meta.parentBlockId !== sharedParentId) {
        continue;
      }
      if (!sharedParentId && meta.parentBlockId) {
        sharedParentId = meta.parentBlockId;
      }

      const subRange = document.createRange();
      try {
        if (cellEl.contains(range.startContainer)) {
          subRange.setStart(range.startContainer, range.startOffset);
        } else {
          subRange.setStart(cellEl, 0);
        }
        if (cellEl.contains(range.endContainer)) {
          subRange.setEnd(range.endContainer, range.endOffset);
        } else {
          subRange.setEnd(cellEl, cellEl.childNodes.length);
        }
      } catch {
        continue;
      }

      if (!subRange.collapsed && subRange.toString().length > 0) {
        targets.push({ editableEl: cellEl, safeRange: subRange });
      }
    }

    if (targets.length > 0) {
      return targets;
    }
  }

  const single = resolveValidEditableRange(range);
  if (single && !single.safeRange.collapsed && single.safeRange.toString().length > 0 && matchesTarget(single.editableEl)) {
    return [single];
  }
  return [];
}

function rgbToHex(rgb: string): string | null {
  const m = rgb.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!m) return null;
  const toHex = (n: string) =>
    Math.max(0, Math.min(255, parseInt(n, 10)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(m[1])}${toHex(m[2])}${toHex(m[3])}`.toUpperCase();
}

function avoidRubyAnnotationNode(node: Node, editableEl: HTMLElement): Node {
  const hostEl = node instanceof HTMLElement ? node : node.parentElement;
  const rtOrRp = hostEl?.closest('rt, rp');
  if (rtOrRp) {
    const rubyEl = rtOrRp.closest('ruby');
    if (rubyEl && editableEl.contains(rubyEl)) {
      const rbEl = rubyEl.querySelector('rb');
      if (rbEl) return rbEl;
      return rubyEl;
    }
  }
  return node;
}

function getInspectionTargetNode(range: Range, editableEl: HTMLElement): Node {
  const startNode = range.startContainer;
  if (startNode.nodeType === Node.TEXT_NODE) {
    // If selection starts at the very end of a text node, check next sibling if present
    if (
      !range.collapsed &&
      range.startOffset >= (startNode.textContent?.length ?? 0) &&
      startNode.nextSibling
    ) {
      return avoidRubyAnnotationNode(startNode.nextSibling, editableEl);
    }
    return avoidRubyAnnotationNode(startNode, editableEl);
  }

  if (startNode instanceof HTMLElement) {
    const child = startNode.childNodes[range.startOffset];
    if (child) {
      if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName === 'RUBY') {
        const rb = (child as HTMLElement).querySelector('rb');
        return rb || child;
      }
      if (child.nodeType === Node.ELEMENT_NODE && child.firstChild) {
        return avoidRubyAnnotationNode(child.firstChild, editableEl);
      }
      return avoidRubyAnnotationNode(child, editableEl);
    }
  }

  return editableEl;
}

function inspectStyleAtNode(
  rawNode: Node | null,
  editableEl: HTMLElement
): Omit<SelectionStyleState, 'hasSelection' | 'blockId' | 'cellId'> {
  const node = rawNode ? avoidRubyAnnotationNode(rawNode, editableEl) : editableEl;
  let el: HTMLElement | null =
    node instanceof HTMLElement ? node : node?.parentElement || null;

  let fontSize: number | undefined;
  let fontFamily: string | undefined;
  let color: string | undefined;

  while (el && el !== editableEl.parentElement) {
    if (el.tagName !== 'RT' && el.tagName !== 'RP' && el.style) {
      if (fontSize === undefined && el.style.fontSize) {
        const fsRaw = el.style.fontSize.trim();
        // Only trust explicit px inline styles directly; em/%/rem/pt will be resolved accurately by getComputedStyle
        if (/^\d+(\.\d+)?px$/i.test(fsRaw)) {
          const parsed = parseFloat(fsRaw);
          if (!Number.isNaN(parsed) && parsed > 0) {
            fontSize = Math.round(parsed);
          }
        }
      }
      if (fontFamily === undefined && el.style.fontFamily) {
        fontFamily = el.style.fontFamily;
      }
      if (color === undefined && el.style.color && el.tagName !== 'RUBY') {
        color = el.style.color;
      }
    }
    if (el === editableEl) break;
    el = el.parentElement;
  }

  const targetEl = node instanceof HTMLElement ? node : node?.parentElement || editableEl;
  try {
    const cs = window.getComputedStyle(targetEl);
    if (fontSize === undefined && cs.fontSize) {
      const parsed = parseFloat(cs.fontSize);
      if (!Number.isNaN(parsed) && parsed > 0) {
        fontSize = Math.round(parsed);
      }
    }
    if (fontFamily === undefined && cs.fontFamily) {
      fontFamily = cs.fontFamily;
    }
    if (color === undefined && cs.color) {
      color = rgbToHex(cs.color) || cs.color;
    }
  } catch {
    // ignore computed style errors on detached nodes
  }

  if (color && color.startsWith('rgb')) {
    color = rgbToHex(color) || color;
  }

  return { fontSize, fontFamily, color };
}

function notifyListeners(state: SelectionStyleState) {
  selectionListeners.forEach((cb) => {
    try {
      cb(state);
    } catch {
      // ignore listener error
    }
  });
}

export function subscribeSelectionStyle(
  listener: (state: SelectionStyleState) => void
): () => void {
  ensureSelectionTracking();
  selectionListeners.add(listener);
  return () => {
    selectionListeners.delete(listener);
  };
}

let isPointerDownInsideEditable = false;

export function ensureSelectionTracking() {
  if (isTrackingInitialized || typeof document === 'undefined') return;
  isTrackingInitialized = true;

  document.addEventListener(
    'pointerdown',
    (e) => {
      const target = e.target as Node | null;
      isPointerDownInsideEditable = !!findEditableElement(target);
    },
    true
  );

  const clearPointerDownFlag = () => {
    setTimeout(() => {
      isPointerDownInsideEditable = false;
    }, 0);
  };
  document.addEventListener('pointerup', clearPointerDownFlag, true);
  document.addEventListener('pointercancel', clearPointerDownFlag, true);

  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      return;
    }
    const rawRange = sel.getRangeAt(0);
    const hasMultiTargets =
      !rawRange.collapsed &&
      rawRange.toString().length > 0 &&
      collectEditableTargets(rawRange).length > 0;
    const resolved = resolveValidEditableRange(rawRange);

    // If selection is outside editable blocks (e.g. toolbar input/select/popover),
    // keep lastSavedRange intact so toolbar controls can apply formatting to it.
    if (!resolved && !hasMultiTargets) {
      return;
    }

    if (hasMultiTargets && !rawRange.collapsed) {
      const targets = collectEditableTargets(rawRange);
      const firstTarget = targets[0];
      const { parentBlockId: blockId, cellId } = getEditableMeta(firstTarget.editableEl);
      lastSavedRange = rawRange.cloneRange();
      lastActiveBlockId = blockId;
      lastActiveCellId = targets.length > 1 ? null : cellId;

      const focusNode = getInspectionTargetNode(firstTarget.safeRange, firstTarget.editableEl);
      const inspected = inspectStyleAtNode(focusNode, firstTarget.editableEl);
      notifyListeners({
        hasSelection: true,
        blockId,
        cellId: targets.length > 1 ? null : cellId,
        ...inspected,
      });
      return;
    }

    if (!resolved) return;

    const { editableEl, safeRange } = resolved;
    const { parentBlockId: blockId, cellId } = getEditableMeta(editableEl);
    const hasText = !safeRange.collapsed && safeRange.toString().length > 0;

    if (hasText) {
      lastSavedRange = safeRange.cloneRange();
      lastActiveBlockId = blockId;
      lastActiveCellId = cellId;
    } else if (document.activeElement === editableEl || isPointerDownInsideEditable) {
      // Clear saved selection whenever caret collapses inside an active editable element
      // or during a pointer click inside an editable element.
      lastSavedRange = null;
      lastActiveBlockId = blockId;
      lastActiveCellId = cellId;
    } else {
      return;
    }

    const focusNode = getInspectionTargetNode(safeRange, editableEl);
    const inspected = inspectStyleAtNode(focusNode, editableEl);
    notifyListeners({
      hasSelection: hasText,
      blockId,
      cellId,
      ...inspected,
    });
  });
}

export function saveSelection(blockId?: string | null): Range | null {
  ensureSelectionTracking();
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const rawRange = sel.getRangeAt(0);
    const multiTargets =
      !rawRange.collapsed && rawRange.toString().length > 0
        ? collectEditableTargets(rawRange, blockId)
        : [];
    if (multiTargets.length > 1) {
      const first = multiTargets[0];
      const meta = getEditableMeta(first.editableEl);
      const bId = meta.parentBlockId || blockId || null;
      lastSavedRange = rawRange.cloneRange();
      lastActiveBlockId = bId;
      lastActiveCellId = null;
      const inspected = inspectStyleAtNode(
        getInspectionTargetNode(first.safeRange, first.editableEl),
        first.editableEl
      );
      notifyListeners({
        hasSelection: true,
        blockId: bId,
        cellId: null,
        ...inspected,
      });
      return lastSavedRange;
    }

    const resolved = resolveValidEditableRange(rawRange);
    if (resolved) {
      const { editableEl, safeRange } = resolved;
      const meta = getEditableMeta(editableEl);
      const bId = meta.parentBlockId || blockId || null;
      const cId = meta.cellId;
      const hasText = !safeRange.collapsed && safeRange.toString().length > 0;

      if (hasText) {
        lastSavedRange = safeRange.cloneRange();
        lastActiveBlockId = bId;
        lastActiveCellId = cId;
        const inspected = inspectStyleAtNode(
          getInspectionTargetNode(safeRange, editableEl),
          editableEl
        );
        notifyListeners({
          hasSelection: true,
          blockId: bId,
          cellId: cId,
          ...inspected,
        });
        return lastSavedRange;
      } else if (document.activeElement === editableEl || isPointerDownInsideEditable) {
        lastSavedRange = null;
        lastActiveBlockId = bId;
        lastActiveCellId = cId;
        const inspected = inspectStyleAtNode(
          getInspectionTargetNode(safeRange, editableEl),
          editableEl
        );
        notifyListeners({
          hasSelection: false,
          blockId: bId,
          cellId: cId,
          ...inspected,
        });
      }
    }
  }
  return null;
}

export function getLastSavedRange(): {
  range: Range | null;
  blockId: string | null;
  cellId: string | null;
} {
  return {
    range: lastSavedRange,
    blockId: lastActiveBlockId,
    cellId: lastActiveCellId,
  };
}

export function clearSavedSelection() {
  lastSavedRange = null;
  lastActiveBlockId = null;
  lastActiveCellId = null;
  notifyListeners({ hasSelection: false, blockId: null, cellId: null });
}

export function hasActiveSelection(targetBlockId?: string | null): boolean {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
    const targets = collectEditableTargets(sel.getRangeAt(0), targetBlockId);
    if (targets.length > 0) {
      return true;
    }
  }
  if (
    lastSavedRange &&
    !lastSavedRange.collapsed &&
    lastSavedRange.toString().length > 0 &&
    lastSavedRange.commonAncestorContainer.isConnected
  ) {
    const targets = collectEditableTargets(lastSavedRange, targetBlockId);
    if (targets.length > 0) {
      return true;
    }
  }
  return false;
}

export interface SelectionStyleOptions {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: 'bold' | 'normal';
  fontStyle?: 'italic' | 'normal';
}

function unwrapElement(el: HTMLElement) {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) {
    parent.insertBefore(el.firstChild, el);
  }
  parent.removeChild(el);
}

function cleanConflictingDescendantStyles(
  root: DocumentFragment | HTMLElement,
  options: SelectionStyleOptions
) {
  const elements = Array.from(root.querySelectorAll('*')) as HTMLElement[];
  for (const el of elements) {
    if (el.tagName === 'RT' || el.tagName === 'RP' || el.tagName === 'RUBY') {
      if (options.color && el.tagName === 'RUBY') {
        el.style.color = '';
      }
      continue;
    }

    // Handle legacy <font>, <big>, <small> tags produced by browser shortcuts or paste
    if (el.tagName === 'FONT') {
      if (options.fontSize !== undefined) el.removeAttribute('size');
      if (options.fontFamily !== undefined) el.removeAttribute('face');
      if (options.color !== undefined) el.removeAttribute('color');
    }

    if (options.fontFamily !== undefined) el.style.fontFamily = '';
    if (options.fontSize !== undefined) el.style.fontSize = '';
    if (options.color !== undefined) el.style.color = '';
    if (options.fontWeight !== undefined) el.style.fontWeight = '';
    if (options.fontStyle !== undefined) el.style.fontStyle = '';

    if (
      options.fontSize !== undefined &&
      (el.tagName === 'BIG' || el.tagName === 'SMALL')
    ) {
      unwrapElement(el);
      continue;
    }

    const styleAttr = el.getAttribute('style');
    if (styleAttr !== null && styleAttr.trim() === '') {
      el.removeAttribute('style');
    }

    if (
      (el.tagName === 'SPAN' || el.tagName === 'FONT') &&
      el.attributes.length === 0
    ) {
      unwrapElement(el);
    }
  }
}

/**
 * Removes a specific inline style property from inner <span> / <font> elements inside block HTML
 * when the user applies a block-level override (no text selected).
 */
export function stripInlineStyleFromHtml(
  html: string,
  prop: 'fontSize' | 'fontFamily' | 'color'
): string {
  if (
    !html ||
    typeof document === 'undefined' ||
    (!html.includes('style=') && !/<(font|big|small)\b/i.test(html))
  ) {
    return html;
  }
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;

  if (prop === 'fontSize') {
    for (const el of Array.from(wrapper.querySelectorAll('big, small')) as HTMLElement[]) {
      if (el.closest('rt')) continue;
      unwrapElement(el);
    }
  }

  const els = Array.from(wrapper.querySelectorAll('span, font')) as HTMLElement[];
  for (const el of els) {
    if (el.closest('rt')) continue;
    el.style[prop] = '';
    if (el.tagName === 'FONT') {
      if (prop === 'fontSize') el.removeAttribute('size');
      if (prop === 'fontFamily') el.removeAttribute('face');
      if (prop === 'color') el.removeAttribute('color');
    }
    const styleAttr = el.getAttribute('style');
    if (!styleAttr || styleAttr.trim() === '') {
      el.removeAttribute('style');
    }
    if (el.attributes.length === 0) {
      unwrapElement(el);
    }
  }
  return wrapper.innerHTML;
}

/**
 * Inserts plain text at the current or saved caret position inside an editable block or cell.
 */
export function insertTextAtSelection(
  text: string,
  targetBlockId?: string | null
): { blockId: string | null; isCell: boolean; newHtml: string } | null {
  const sel = window.getSelection();
  let range: Range | null = null;
  let editableEl: HTMLElement | null = null;

  if (sel && sel.rangeCount > 0) {
    const resolved = resolveValidEditableRange(sel.getRangeAt(0));
    if (resolved) {
      range = resolved.safeRange;
      editableEl = resolved.editableEl;
    }
  }

  if (!range && lastSavedRange && lastSavedRange.commonAncestorContainer.isConnected) {
    editableEl = findEditableElement(lastSavedRange.commonAncestorContainer);
    if (editableEl) {
      range = lastSavedRange;
    }
  }

  if (!range || !editableEl) return null;

  const blockId = editableEl.getAttribute('data-block-id') || targetBlockId || lastActiveBlockId;
  const cellId = editableEl.getAttribute('data-cell-id');

  try {
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);

    const newRange = document.createRange();
    newRange.setStartAfter(textNode);
    newRange.collapse(true);
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(newRange);
    }
    lastSavedRange = null;
    lastActiveBlockId = blockId;
    lastActiveCellId = cellId;

    if (cellId) {
      const handler = editableChangeHandlers.get(editableEl);
      if (handler) {
        handler(editableEl.innerHTML);
      } else {
        editableEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return { blockId: null, isCell: true, newHtml: editableEl.innerHTML };
    }

    return { blockId, isCell: false, newHtml: editableEl.innerHTML };
  } catch {
    return null;
  }
}

/**
 * Inspects a list item's HTML to see if its visible text is styled with a dominant
 * custom font size or color (so the list marker matches the item text size/color).
 */
export function inspectDominantItemStyle(html: string): {
  fontSize?: number;
  color?: string;
} {
  if (!html || typeof document === 'undefined' || !html.includes('style=')) {
    return {};
  }
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;

  const walker = document.createTreeWalker(wrapper, NodeFilter.SHOW_TEXT);
  let totalLen = 0;
  const sizeCounts = new Map<number, number>();
  const colorCounts = new Map<string, number>();

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = (node.textContent || '').trim();
    if (!text) continue;
    const hostEl = node.parentElement;
    if (hostEl?.closest('rt, rp')) continue;
    const len = text.length;
    totalLen += len;

    let fs: number | undefined;
    let col: string | undefined;
    let curr: HTMLElement | null = hostEl;
    while (curr && curr !== wrapper) {
      if (curr.style) {
        if (fs === undefined && curr.style.fontSize) {
          const m = curr.style.fontSize.trim().match(/^(\d+(?:\.\d+)?)px$/i);
          if (m) fs = Math.round(parseFloat(m[1]));
        }
        if (col === undefined && curr.style.color && curr.tagName !== 'RUBY') {
          col = curr.style.color;
        }
      }
      curr = curr.parentElement;
    }

    if (fs !== undefined) {
      sizeCounts.set(fs, (sizeCounts.get(fs) || 0) + len);
    }
    if (col !== undefined) {
      colorCounts.set(col, (colorCounts.get(col) || 0) + len);
    }
  }

  if (totalLen === 0) return {};

  let fontSize: number | undefined;
  for (const [sz, count] of sizeCounts.entries()) {
    if (count / totalLen >= 0.65) {
      fontSize = sz;
      break;
    }
  }

  let color: string | undefined;
  for (const [c, count] of colorCounts.entries()) {
    if (count / totalLen >= 0.65) {
      color = c;
      break;
    }
  }

  return { fontSize, color };
}

function applyStyleToSingleRange(
  editableEl: HTMLElement,
  range: Range,
  options: SelectionStyleOptions
): HTMLElement | null {
  let parentSpan: HTMLElement | null = null;
  if (
    range.commonAncestorContainer instanceof HTMLElement &&
    range.commonAncestorContainer.tagName === 'SPAN' &&
    range.commonAncestorContainer !== editableEl
  ) {
    parentSpan = range.commonAncestorContainer;
  } else if (
    range.commonAncestorContainer.nodeType === Node.TEXT_NODE &&
    range.commonAncestorContainer.parentElement?.tagName === 'SPAN' &&
    range.commonAncestorContainer.parentElement !== editableEl &&
    range.startOffset === 0 &&
    range.endOffset === (range.commonAncestorContainer.textContent?.length ?? 0) &&
    range.commonAncestorContainer.parentElement.childNodes.length === 1
  ) {
    parentSpan = range.commonAncestorContainer.parentElement;
  }

  let targetSpan: HTMLElement;
  if (parentSpan && parentSpan.textContent === range.toString()) {
    targetSpan = parentSpan;
    cleanConflictingDescendantStyles(targetSpan, options);
  } else {
    const span = document.createElement('span');
    const fragment = range.extractContents();
    cleanConflictingDescendantStyles(fragment, options);
    span.appendChild(fragment);
    range.insertNode(span);
    targetSpan = span;
  }

  if (options.fontFamily) {
    targetSpan.style.fontFamily = options.fontFamily;
  }
  if (options.fontSize) {
    targetSpan.style.fontSize = `${options.fontSize}px`;
  }
  if (options.color) {
    targetSpan.style.color = options.color;
  }
  if (options.fontWeight) {
    targetSpan.style.fontWeight = options.fontWeight;
  }
  if (options.fontStyle) {
    targetSpan.style.fontStyle = options.fontStyle;
  }

  const allSpans = Array.from(editableEl.querySelectorAll('span'));
  for (const s of allSpans) {
    if (s !== targetSpan && !s.textContent && !s.querySelector('img, ruby, br')) {
      s.remove();
    }
  }

  return targetSpan;
}

/**
 * Applies inline styling to the current or saved text selection (single block/cell OR multi-cell/multi-item).
 * Returns { blockId, isCell, newHtml } or null if no text selection was active.
 */
export function applyStyleToSelection(
  options: SelectionStyleOptions,
  targetBlockId?: string | null
): { blockId: string | null; isCell: boolean; newHtml: string } | null {
  const sel = window.getSelection();
  let targets: EditableRangeTarget[] = [];

  if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
    targets = collectEditableTargets(sel.getRangeAt(0), targetBlockId);
  }

  if (
    targets.length === 0 &&
    lastSavedRange &&
    !lastSavedRange.collapsed &&
    lastSavedRange.toString().length > 0 &&
    lastSavedRange.commonAncestorContainer.isConnected
  ) {
    targets = collectEditableTargets(lastSavedRange, targetBlockId);
  }

  if (targets.length === 0) {
    return null;
  }

  const firstMeta = getEditableMeta(targets[0].editableEl);
  const resolvedBlockId = firstMeta.parentBlockId || targetBlockId || lastActiveBlockId;

  if (targetBlockId && resolvedBlockId && resolvedBlockId !== targetBlockId) {
    return null;
  }
  if (!resolvedBlockId && !firstMeta.cellId) {
    return null;
  }

  try {
    const styledSpans: HTMLElement[] = [];
    let anyCell = false;

    for (const t of targets) {
      const span = applyStyleToSingleRange(t.editableEl, t.safeRange.cloneRange(), options);
      if (span) {
        styledSpans.push(span);
        const meta = getEditableMeta(t.editableEl);
        if (meta.cellId) {
          anyCell = true;
          const handler = editableChangeHandlers.get(t.editableEl);
          if (handler) {
            handler(t.editableEl.innerHTML);
          } else {
            t.editableEl.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      }
    }

    if (styledSpans.length === 0) {
      return null;
    }

    const firstSpan = styledSpans[0];
    const lastSpan = styledSpans[styledSpans.length - 1];
    const newRange = document.createRange();
    if (styledSpans.length === 1) {
      newRange.selectNodeContents(firstSpan);
    } else {
      newRange.setStartBefore(firstSpan);
      newRange.setEndAfter(lastSpan);
    }

    lastSavedRange = newRange.cloneRange();
    lastActiveBlockId = resolvedBlockId;
    lastActiveCellId = targets.length === 1 ? firstMeta.cellId : null;

    // Only restore browser visual selection if an external <input>/<select> isn't currently active
    const activeTag = document.activeElement?.tagName;
    const isExternalInputFocused = activeTag === 'INPUT' || activeTag === 'SELECT' || activeTag === 'TEXTAREA';
    if (sel && !isExternalInputFocused) {
      sel.removeAllRanges();
      sel.addRange(newRange);
    }

    const inspected = inspectStyleAtNode(firstSpan, targets[0].editableEl);
    notifyListeners({
      hasSelection: true,
      blockId: resolvedBlockId,
      cellId: targets.length === 1 ? firstMeta.cellId : null,
      ...inspected,
    });

    return {
      blockId: resolvedBlockId,
      isCell: anyCell,
      newHtml: targets[0].editableEl.innerHTML,
    };
  } catch (e) {
    console.warn('Could not wrap selection:', e);
    return null;
  }
}
