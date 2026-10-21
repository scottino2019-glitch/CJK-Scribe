import React, { useState } from 'react';
import { SPECIAL_CHARACTER_GROUPS } from '../data/cjkPresets';
import { X, Copy, Check, Sparkles, BookOpen } from 'lucide-react';

interface SpecialCharDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertChar: (char: string) => void;
}

// Quick pinyin number tone converter
const PINYIN_TONE_MAP: Record<string, string[]> = {
  a: ['ā', 'á', 'ǎ', 'à', 'a'],
  o: ['ō', 'ó', 'ǒ', 'ò', 'o'],
  e: ['ē', 'é', 'ě', 'è', 'e'],
  i: ['ī', 'í', 'ǐ', 'ì', 'i'],
  u: ['ū', 'ú', 'ǔ', 'ù', 'u'],
  v: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
};

function convertPinyinNumbered(input: string): string {
  // Simple regex for pinyin syllable followed by tone number 1-5
  const toneRegex = /([a-züv]+)([1-5])/gi;
  return input.replace(toneRegex, (_, syllable: string, toneStr: string) => {
    const tone = parseInt(toneStr, 10);
    if (tone < 1 || tone > 5) return syllable;
    const lower = syllable.toLowerCase();
    
    // Standard pinyin vowel placement priority: a, o, e, then iu/ui, otherwise last vowel
    const vowels = ['a', 'o', 'e'];
    for (const v of vowels) {
      const idx = lower.indexOf(v);
      if (idx !== -1) {
        const char = syllable[idx];
        const isUpper = char === char.toUpperCase();
        const replaced = PINYIN_TONE_MAP[v.toLowerCase()]?.[tone - 1] || v;
        const resultChar = isUpper ? replaced.toUpperCase() : replaced;
        return syllable.substring(0, idx) + resultChar + syllable.substring(idx + 1);
      }
    }

    if (lower.includes('iu')) {
      const idx = lower.indexOf('u');
      const isUpper = syllable[idx] === syllable[idx].toUpperCase();
      const replaced = PINYIN_TONE_MAP['u'][tone - 1];
      return syllable.substring(0, idx) + (isUpper ? replaced.toUpperCase() : replaced) + syllable.substring(idx + 1);
    }

    if (lower.includes('ui')) {
      const idx = lower.indexOf('i');
      const isUpper = syllable[idx] === syllable[idx].toUpperCase();
      const replaced = PINYIN_TONE_MAP['i'][tone - 1];
      return syllable.substring(0, idx) + (isUpper ? replaced.toUpperCase() : replaced) + syllable.substring(idx + 1);
    }

    for (let i = syllable.length - 1; i >= 0; i--) {
      const char = lower[i];
      if (PINYIN_TONE_MAP[char]) {
        const isUpper = syllable[i] === syllable[i].toUpperCase();
        const replaced = PINYIN_TONE_MAP[char][tone - 1];
        return syllable.substring(0, i) + (isUpper ? replaced.toUpperCase() : replaced) + syllable.substring(i + 1);
      }
    }
    return syllable;
  });
}

export const SpecialCharDrawer: React.FC<SpecialCharDrawerProps> = ({
  isOpen,
  onClose,
  onInsertChar,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [copiedChar, setCopiedChar] = useState<string | null>(null);
  const [pinyinInput, setPinyinInput] = useState('');
  const [convertedPinyin, setConvertedPinyin] = useState('');

  if (!isOpen) return null;

  const handleCharClick = (char: string) => {
    onInsertChar(char);
    setCopiedChar(char);
    setTimeout(() => setCopiedChar(null), 1200);
  };

  const handleConvertPinyin = () => {
    const res = convertPinyinNumbered(pinyinInput);
    setConvertedPinyin(res);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 md:w-96 bg-white border-l border-stone-200 shadow-2xl flex flex-col no-print animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-700" />
          <h3 className="font-semibold text-stone-900 text-sm tracking-wide">
            Caratteri Speciali & Pinyin CJK
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-stone-500 hover:text-stone-800 hover:bg-stone-200 transition-colors"
          title="Chiudi"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-stone-200 px-2 py-1.5 gap-1 bg-stone-100 text-xs scrollbar-none">
        {SPECIAL_CHARACTER_GROUPS.map((group, idx) => (
          <button
            key={group.title}
            onClick={() => setActiveTab(idx)}
            className={`px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors font-medium ${
              activeTab === idx
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            {group.title.split(' ')[0]}
          </button>
        ))}
        <button
          onClick={() => setActiveTab(99)}
          className={`px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors font-medium flex items-center gap-1 ${
            activeTab === 99
              ? 'bg-amber-100 text-amber-900 shadow-sm border border-amber-300'
              : 'text-amber-800 hover:text-amber-950 hover:bg-amber-50'
          }`}
        >
          <Sparkles className="w-3 h-3" /> Converti Pinyin
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 99 ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Scrivi con numero di tono (es: <code className="text-amber-800 bg-amber-50 px-1 py-0.5 rounded">ni3 hao3</code> o <code className="text-amber-800 bg-amber-50 px-1 py-0.5 rounded">zhong1 guo2</code>)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pinyinInput}
                  onChange={(e) => {
                    setPinyinInput(e.target.value);
                    setConvertedPinyin(convertPinyinNumbered(e.target.value));
                  }}
                  placeholder="es. bei3 jing1 huan1 ying2 ni3"
                  className="flex-1 px-3 py-1.5 text-sm border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-700 font-mono"
                />
              </div>
            </div>

            {convertedPinyin && (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg">
                <div className="text-xs text-amber-800 font-medium mb-1">Risultato Pinyin con toni:</div>
                <div className="text-lg font-serif text-stone-900 break-words mb-2 select-all">
                  {convertedPinyin}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCharClick(convertedPinyin)}
                    className="flex-1 px-2.5 py-1 text-xs bg-amber-800 text-white rounded hover:bg-amber-900 font-medium transition-colors"
                  >
                    Inserisci nel documento
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(convertedPinyin);
                      setCopiedChar(convertedPinyin);
                      setTimeout(() => setCopiedChar(null), 1200);
                    }}
                    className="px-2.5 py-1 text-xs border border-amber-300 text-amber-900 rounded hover:bg-amber-100 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copia
                  </button>
                </div>
              </div>
            )}

            <div className="text-xs text-stone-500 leading-relaxed bg-stone-50 p-2.5 rounded border border-stone-200">
              <strong>Guida toni:</strong> 1 = primo tono (ā), 2 = secondo tono (á), 3 = terzo tono (ǎ), 4 = quarto tono (à), 5 = tono neutro (a). Per ü usa la lettera <code className="font-mono text-stone-800">v</code> (es: <code className="font-mono">lv4</code> = lǜ).
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-700">
                {SPECIAL_CHARACTER_GROUPS[activeTab]?.title}
              </span>
              <span className="text-[11px] text-stone-400">Clicca per inserire</span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5">
              {SPECIAL_CHARACTER_GROUPS[activeTab]?.characters.map((char, i) => (
                <button
                  key={`${char}-${i}`}
                  onClick={() => handleCharClick(char)}
                  className="h-10 text-base font-serif flex items-center justify-center rounded border border-stone-200 bg-stone-50/50 hover:bg-amber-100 hover:border-amber-300 hover:text-amber-950 transition-colors shadow-2xs active:scale-95 text-stone-800"
                  title={`Inserisci: ${char}`}
                >
                  {char}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Feedback Bar */}
      <div className="p-3 border-t border-stone-200 bg-stone-50 text-xs text-stone-600 flex items-center justify-between">
        {copiedChar ? (
          <span className="text-emerald-700 font-medium flex items-center gap-1 animate-pulse">
            <Check className="w-3.5 h-3.5" /> Inserito: {copiedChar}
          </span>
        ) : (
          <span>Seleziona un carattere per aggiungerlo al testo.</span>
        )}
      </div>
    </div>
  );
};
