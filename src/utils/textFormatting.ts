/**
 * Rich Text Selection Formatting Utility
 * Enables styling (font family, font size, ink color, bold, italic)
 * directly on user-selected text spans inside contentEditable blocks.
 */

let lastSavedRange: Range | null = null;
let lastActiveBlockId: string | null = null;

export function saveSelection(blockId?: string | null): Range | null {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    // Ensure the range is not collapsed (user has actually selected text)
    if (!range.collapsed) {
      lastSavedRange = range.cloneRange();
      if (blockId) lastActiveBlockId = blockId;
      return lastSavedRange;
    }
  }
  return null;
}

export function getLastSavedRange(): { range: Range | null; blockId: string | null } {
  return { range: lastSavedRange, blockId: lastActiveBlockId };
}

export function clearSavedSelection() {
  lastSavedRange = null;
  lastActiveBlockId = null;
}

export function hasActiveSelection(): boolean {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0 && !sel.isCollapsed && sel.toString().trim().length > 0) {
    return true;
  }
  if (lastSavedRange && !lastSavedRange.collapsed && lastSavedRange.toString().trim().length > 0) {
    return true;
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

/**
 * Applies inline styling to the current or saved text selection.
 * Returns the modified HTML of the containing block, or null if no selection was formatted.
 */
export function applyStyleToSelection(
  options: SelectionStyleOptions,
  targetBlockId?: string | null
): { blockId: string; newHtml: string } | null {
  const sel = window.getSelection();
  let range: Range | null = null;

  if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
    range = sel.getRangeAt(0);
  } else if (lastSavedRange && !lastSavedRange.collapsed) {
    range = lastSavedRange;
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  if (!range || range.collapsed) {
    return null;
  }

  // Find the parent contenteditable block container
  let container: Node | null = range.commonAncestorContainer;
  while (container && container !== document.body) {
    if (
      container instanceof HTMLElement &&
      (container.hasAttribute('data-block-id') || container.getAttribute('contenteditable') === 'true')
    ) {
      break;
    }
    container = container.parentNode;
  }

  const blockEl = container as HTMLElement | null;
  const blockId = blockEl?.getAttribute('data-block-id') || targetBlockId || lastActiveBlockId;

  if (!blockEl || !blockId) {
    return null;
  }

  // Wrap the selection in a styled span
  const span = document.createElement('span');
  if (options.fontFamily) {
    span.style.fontFamily = options.fontFamily;
  }
  if (options.fontSize) {
    span.style.fontSize = `${options.fontSize}px`;
  }
  if (options.color) {
    span.style.color = options.color;
  }
  if (options.fontWeight) {
    span.style.fontWeight = options.fontWeight;
  }
  if (options.fontStyle) {
    span.style.fontStyle = options.fontStyle;
  }

  try {
    const fragment = range.extractContents();
    span.appendChild(fragment);
    range.insertNode(span);

    // Keep selection on the newly formatted span
    if (sel) {
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(newRange);
      lastSavedRange = newRange.cloneRange();
      lastActiveBlockId = blockId;
    }

    const newHtml = blockEl.innerHTML;
    return { blockId, newHtml };
  } catch (e) {
    console.warn('Could not wrap selection:', e);
    return null;
  }
}
