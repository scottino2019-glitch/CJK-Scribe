import React, { useState } from 'react';
import { SealData } from '../types/editor';
import { X, Check } from 'lucide-react';

interface SealConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSeal: (seal: SealData) => void;
  existingSeal?: SealData;
}

export const SealConfigModal: React.FC<SealConfigModalProps> = ({
  isOpen,
  onClose,
  onAddSeal,
  existingSeal,
}) => {
  const [text, setText] = useState(existingSeal?.text || '墨缘');
  const [shape, setShape] = useState<'square' | 'round' | 'oval'>(
    existingSeal?.shape || 'square'
  );
  const [style, setStyle] = useState<'yin' | 'yang'>(
    existingSeal?.style || 'yin'
  );
  const [color, setColor] = useState(existingSeal?.color || '#B92B27');
  const [size, setSize] = useState(existingSeal?.size || 58);
  const [borderStyle, setBorderStyle] = useState<'solid' | 'rough' | 'double'>(
    existingSeal?.borderStyle || 'rough'
  );
  const [rotation, setRotation] = useState(existingSeal?.rotation || -1);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!text.trim()) return;
    const seal: SealData = {
      id: existingSeal?.id || `seal_${Date.now()}`,
      text: text.trim().slice(0, 4),
      shape,
      style,
      color,
      size,
      borderStyle,
      rotation,
    };
    onAddSeal(seal);
    onClose();
  };

  // Render seal preview
  const renderSealGraphic = () => {
    const isYin = style === 'yin'; // White text, red background
    const isRound = shape === 'round';
    const isOval = shape === 'oval';

    const borderRadius = isRound ? '9999px' : isOval ? '50% / 40%' : '3px';
    const borderClass =
      borderStyle === 'double'
        ? 'border-4 border-double'
        : borderStyle === 'rough'
        ? 'border-2'
        : 'border-2';

    return (
      <div
        className={`inline-flex items-center justify-center select-none shadow-sm transition-transform ${borderClass}`}
        style={{
          width: `${size}px`,
          height: isOval ? `${Math.round(size * 1.25)}px` : `${size}px`,
          borderRadius,
          backgroundColor: isYin ? color : '#ffffff',
          borderColor: color,
          transform: `rotate(${rotation}deg)`,
          padding: '4px',
        }}
      >
        <div
          className={`font-cjk-print-sc font-bold leading-tight tracking-wider text-center flex flex-wrap items-center justify-center`}
          style={{
            color: isYin ? '#ffffff' : color,
            fontSize: `${Math.max(12, Math.round(size / (text.length > 2 ? 2.3 : 1.7)))}px`,
            maxWidth: text.length > 2 ? '80%' : '100%',
            writingMode: text.length > 2 ? 'vertical-rl' : 'horizontal-tb',
          }}
        >
          {text}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-2 sm:p-4 no-print overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-150 max-h-[88vh] flex flex-col my-auto">
        <div className="p-3 sm:p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
          <h3 className="font-semibold text-stone-900 text-sm">
            Crea / Modifica Sigillo CJK (印章 / 도장)
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 sm:p-4 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Caratteri del Sigillo (1-4 caratteri)
              </label>
              <input
                type="text"
                maxLength={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="es. 墨缘, 李白, 동주"
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-base font-serif focus:outline-none focus:ring-1 focus:ring-amber-700"
              />
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {['墨缘', '清心', '静观', '弘益', '지혜', '덕재'].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setText(sample)}
                    className="text-[11px] px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Forma del Sigillo
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'square', label: 'Quadrato (方)' },
                  { id: 'round', label: 'Rotondo (圆)' },
                  { id: 'oval', label: 'Ovale (椭圆)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setShape(s.id as any)}
                    className={`flex-1 py-1.5 px-2 text-xs rounded border transition-colors ${
                      shape === s.id
                        ? 'bg-amber-50 border-amber-800 text-amber-900 font-medium'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Stile d'Incisione
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStyle('yin')}
                  className={`flex-1 py-1.5 px-2 text-xs rounded border transition-colors ${
                    style === 'yin'
                      ? 'bg-amber-50 border-amber-800 text-amber-900 font-medium'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  Baiwen · 白文 (Sfondo rosso)
                </button>
                <button
                  type="button"
                  onClick={() => setStyle('yang')}
                  className={`flex-1 py-1.5 px-2 text-xs rounded border transition-colors ${
                    style === 'yang'
                      ? 'bg-amber-50 border-amber-800 text-amber-900 font-medium'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  Zhuwen · 朱文 (Tratto rosso)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Colore Ceralacca CJK
              </label>
              <div className="flex items-center gap-2">
                {[
                  { name: 'Cinnabar', hex: '#B92B27' },
                  { name: 'Carmine', hex: '#991B1B' },
                  { name: 'Crimson KR', hex: '#BE123C' },
                  { name: 'Vermilion', hex: '#DC2626' },
                  { name: 'Black Ink', hex: '#1C1917' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      color === c.hex
                        ? 'border-stone-900 scale-110 shadow-xs'
                        : 'border-white hover:scale-105'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Dimensione ({size}px)
                </label>
                <input
                  type="range"
                  min={40}
                  max={84}
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full accent-amber-800"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Inclinazione ({rotation}°)
                </label>
                <input
                  type="range"
                  min={-4}
                  max={4}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full accent-amber-800"
                />
              </div>
            </div>
          </div>

          {/* Live Preview Display */}
          <div className="flex flex-col items-center justify-center p-6 bg-stone-50 rounded-lg border border-stone-200">
            <span className="text-xs text-stone-400 mb-4 font-sans uppercase tracking-wider">
              Anteprima Reale
            </span>
            <div className="p-8 bg-[#FCF9F2] rounded-md shadow-inner border border-stone-200 flex items-center justify-center min-w-[140px] min-h-[140px]">
              {renderSealGraphic()}
            </div>
            <span className="text-[11px] text-stone-500 mt-4 text-center">
              Il sigillo verrà posizionato con orientamento tipografico orientale.
            </span>
          </div>
        </div>

        <div className="p-3 sm:p-4 border-t border-stone-200 bg-stone-50 flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-md hover:bg-stone-200/60"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-medium text-white bg-amber-800 hover:bg-amber-900 rounded-md flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            Salva Sigillo
          </button>
        </div>
      </div>
    </div>
  );
};
