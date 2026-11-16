import React, { useRef, useEffect } from 'react';
import {
  saveSelection,
  ensureSelectionTracking,
  registerEditableChangeHandler,
} from '../utils/textFormatting';

interface EditableBlockProps {
  blockId: string;
  parentBlockId?: string;
  content: string;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  tagName?: 'div' | 'td';
  dataAttrName?: 'data-block-id' | 'data-cell-id';
  onFocus: () => void;
  onBlur: (html: string) => void;
  onChange: (html: string) => void;
}

export const EditableBlock: React.FC<EditableBlockProps> = ({
  blockId,
  parentBlockId,
  content,
  className = '',
  style,
  placeholder,
  tagName = 'div',
  dataAttrName = 'data-block-id',
  onFocus,
  onBlur,
  onChange,
}) => {
  const elRef = useRef<HTMLElement>(null);
  const isComposingRef = useRef(false);
  const lastSyncedContentRef = useRef(content);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    ensureSelectionTracking();
    const el = elRef.current;
    if (el) {
      registerEditableChangeHandler(el, (html) => {
        lastSyncedContentRef.current = html;
        onChangeRef.current(html);
      });
    }
    return () => {
      if (el) registerEditableChangeHandler(el, null);
    };
  }, []);

  // Initial populate on mount
  useEffect(() => {
    if (elRef.current && elRef.current.innerHTML !== content) {
      elRef.current.innerHTML = content;
    }
    lastSyncedContentRef.current = content;
  }, []);

  // Sync content whenever it changes externally (toolbar style strip, undo/redo, template change, ruby insert)
  // WITHOUT overwriting live user typing where content matches lastSyncedContentRef.current
  useEffect(() => {
    if (elRef.current) {
      const isExternalChange = content !== lastSyncedContentRef.current;
      if (isExternalChange && elRef.current.innerHTML !== content) {
        elRef.current.innerHTML = content;
        lastSyncedContentRef.current = content;
      } else if (document.activeElement !== elRef.current && elRef.current.innerHTML !== content) {
        elRef.current.innerHTML = content;
        lastSyncedContentRef.current = content;
      } else {
        lastSyncedContentRef.current = content;
      }
    }
  }, [content]);

  const resolvedParentBlockId =
    parentBlockId || (dataAttrName === 'data-block-id' ? blockId : undefined);

  const handleSelection = () => {
    saveSelection(resolvedParentBlockId || null);
  };

  const Tag = tagName as any;
  const dataProps = {
    [dataAttrName]: blockId,
    ...(resolvedParentBlockId ? { 'data-parent-block-id': resolvedParentBlockId } : {}),
  };

  return (
    <Tag
      ref={elRef}
      {...dataProps}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onFocus={() => {
        onFocus();
        handleSelection();
      }}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        onFocus();
        handleSelection();
      }}
      onInput={(e: React.FormEvent<HTMLElement>) => {
        if (!isComposingRef.current) {
          const html = e.currentTarget.innerHTML;
          lastSyncedContentRef.current = html;
          onChange(html);
        }
        handleSelection();
      }}
      onCompositionStart={() => {
        isComposingRef.current = true;
      }}
      onCompositionEnd={(e: React.CompositionEvent<HTMLElement>) => {
        isComposingRef.current = false;
        const html = e.currentTarget.innerHTML;
        lastSyncedContentRef.current = html;
        onChange(html);
        handleSelection();
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        isComposingRef.current = false;
        const html = e.currentTarget.innerHTML;
        lastSyncedContentRef.current = html;
        onBlur(html);
      }}
      onMouseUp={handleSelection}
      onKeyUp={handleSelection}
      style={style}
      className={`outline-none transition-colors ${className}`}
    />
  );
};
