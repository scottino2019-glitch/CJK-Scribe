import React, { useRef, useEffect } from 'react';
import { saveSelection } from '../utils/textFormatting';

interface EditableBlockProps {
  blockId: string;
  content: string;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  onFocus: () => void;
  onBlur: (html: string) => void;
  onChange: (html: string) => void;
}

export const EditableBlock: React.FC<EditableBlockProps> = ({
  blockId,
  content,
  className = '',
  style,
  placeholder,
  onFocus,
  onBlur,
  onChange,
}) => {
  const elRef = useRef<HTMLDivElement>(null);
  const isTypingRef = useRef(false);
  const isComposingRef = useRef(false);

  // Initial populate on mount
  useEffect(() => {
    if (elRef.current && elRef.current.innerHTML !== content) {
      elRef.current.innerHTML = content;
    }
  }, []);

  // Sync content ONLY when changed externally (e.g. undo/redo, template change, ruby insert)
  // NEVER overwrite innerHTML while user is actively focused or typing! This guarantees ZERO cursor jumping.
  useEffect(() => {
    if (elRef.current) {
      const isFocused = document.activeElement === elRef.current;
      if (!isFocused && elRef.current.innerHTML !== content) {
        elRef.current.innerHTML = content;
      }
    }
  }, [content]);

  const handleSelection = () => {
    saveSelection(blockId);
  };

  return (
    <div
      ref={elRef}
      data-block-id={blockId}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onFocus={() => {
        isTypingRef.current = true;
        onFocus();
        handleSelection();
      }}
      onClick={() => {
        onFocus();
        handleSelection();
      }}
      onInput={(e) => {
        isTypingRef.current = true;
        if (!isComposingRef.current) {
          onChange(e.currentTarget.innerHTML);
        }
        handleSelection();
      }}
      onCompositionStart={() => {
        isComposingRef.current = true;
      }}
      onCompositionEnd={(e) => {
        isComposingRef.current = false;
        onChange(e.currentTarget.innerHTML);
        handleSelection();
      }}
      onBlur={(e) => {
        isTypingRef.current = false;
        isComposingRef.current = false;
        onBlur(e.currentTarget.innerHTML);
      }}
      onMouseUp={handleSelection}
      onKeyUp={handleSelection}
      style={style}
      className={`outline-none transition-colors ${className}`}
    />
  );
};
