import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, ArrowRight, CornerDownLeft, Trash2, Edit3, Type } from 'lucide-react';
import {
  getAutoPronunciation,
  generateFullSentenceRuby,
  convertNumberedPinyin,
  parseTextAndPronunciationPairs,
  CharacterPair,
} from '../data/pinyinDict';

export type RubyTargetAction = 'replace' | 'append' | 'new-block';

interface RubyInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertRuby: (rubyHtml: string, action: RubyTargetAction) => void;
  hasActiveBlock: boolean;
  activeBlockName?: string;
  activeBlockCurrentText?: string;
}

export const RubyInsertModal: React.FC<RubyInsertModalProps> = ({
  isOpen,
  onClose,
  onInsertRuby,
  hasActiveBlock,
  activeBlockName = 'Blocco selezionato',
  activeBlockCurrentText = '',
}) => {
  const [sourceText, setSourceText] = useState('春眠不觉晓，处处闻啼鸟。');
  const [pronunciationText, setPronunciationText] = useState('chūn mián bù jué xiǎo chù chù wén tí niǎo');
  const [pinyinColor, setPinyinColor] = useState('#57534e');
  const [displayStyle, setDisplayStyle] = useState<'ruby' | 'interlinear'>('ruby');
  const [targetAction, setTargetAction] = useState<RubyTargetAction>(
    hasActiveBlock ? 'replace' : 'new-block'
  );

  // When modal opens, pre-fill with current block's text if available
  useEffect(() => {
    if (isOpen) {
      if (activeBlockCurrentText && activeBlockCurrentText.trim()) {
        // Strip existing HTML tags and rt to get pure base text
        const plain = activeBlockCurrentText
          .replace(/<rt>[^<]*<\/rt>/gi, '')
          .replace(/<[^>]+>/g, '')
          .trim();
        if (plain) {
          setSourceText(plain);
          const auto = getAutoPronunciation(plain);
          setPronunciationText(auto);
          setTargetAction('replace');
          return;
        }
      }
      setTargetAction(hasActiveBlock ? 'replace' : 'new-block');
    }
  }, [isOpen, activeBlockCurrentText, hasActiveBlock]);

  if (!isOpen) return null;

  // Quick sample sentences
  const samplePhrases = [
    { text: '春眠不觉晓，处处闻啼鸟。', label: 'Poesia Tang (春晓)' },
    { text: '床前明月光，疑是地上霜。', label: 'Poesia Tang (静夜思)' },
    { text: '你好，很高兴见到你！', label: 'Saluto Cinese' },
    { text: '学而时习之，不亦说乎。', label: 'Confucio (论语)' },
    { text: '안녕하세요, 반갑습니다.', label: 'Saluto Coreano' },
    { text: '하늘과 바람과 별과 시', label: 'Poesia Coreana' },
  ];

  // Auto-generate pronunciation button handler
  const handleAutoGenerate = () => {
    if (!sourceText.trim()) return;
    const generated = getAutoPronunciation(sourceText);
    setPronunciationText(generated);
  };

  // When source text changes, optionally auto-update pronunciation if it was matching
  const handleSourceTextChange = (newText: string) => {
    setSourceText(newText);
    const auto = getAutoPronunciation(newText);
    setPronunciationText(auto);
  };

  // Convert numbered pinyin on change (e.g. ni3 hao3 -> nǐ hǎo)
  const handlePronunciationChange = (val: string) => {
    const converted = convertNumberedPinyin(val);
    setPronunciationText(converted);
  };

  // Parse pairs for interactive character-by-character review
  const pairs: CharacterPair[] = parseTextAndPronunciationPairs(sourceText, pronunciationText);

  // Update a single character's pronunciation in the breakdown table
  const handlePairSyllableChange = (cjkCharIndex: number, newSyllable: string) => {
    const converted = convertNumberedPinyin(newSyllable);
    let targetIdx = 0;
    const newPairs = pairs.map((p) => {
      if (!p.isPunctuation) {
        if (targetIdx === cjkCharIndex) {
          targetIdx++;
          return { ...p, pronunciation: converted };
        }
        targetIdx++;
      }
      return p;
    });

    const newPronunStr = newPairs
      .filter((p) => !p.isPunctuation && p.pronunciation)
      .map((p) => p.pronunciation)
      .join(' ');
    setPronunciationText(newPronunStr);
  };

  const previewHtml = generateFullSentenceRuby(sourceText, pronunciationText, {
    color: pinyinColor,
    style: displayStyle,
  });

  const handleApply = () => {
    if (!sourceText.trim()) return;
    const finalHtml = generateFullSentenceRuby(sourceText, pronunciationText, {
      color: pinyinColor,
      style: displayStyle,
    });
    onInsertRuby(finalHtml, targetAction);
    onClose();
  };

  // Revert / strip ruby from current block
  const handleRemoveRuby = () => {
    const plain = sourceText.replace(/<rt>[^<]*<\/rt>/gi, '').replace(/<[^>]+>/g, '').trim();
    if (plain) {
      onInsertRuby(plain, 'replace');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 no-print">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <h3 className="font-semibold text-stone-900 text-sm flex items-center gap-2">
              <span className="font-serif text-amber-800 text-base">拼音 / Ruby</span>
              <span>Inserimento Fonetica Pinyin & Hangul</span>
            </h3>
            <p className="text-xs text-stone-500">
              Composizione pulita e ordinata: ogni ideogramma è perfettamente allineato alla propria pronuncia
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Quick presets */}
          <div>
            <div className="text-[11px] font-medium text-stone-500 mb-1.5 flex items-center justify-between">
              <span>Frasi d'esempio veloci:</span>
              <span className="text-[10px] text-stone-400">Clicca per provare</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {samplePhrases.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    setSourceText(s.text);
                    const auto = getAutoPronunciation(s.text);
                    setPronunciationText(auto);
                  }}
                  className="px-2.5 py-1 rounded text-xs bg-stone-100 hover:bg-amber-100 text-stone-800 hover:text-amber-900 border border-stone-200 transition-colors font-serif"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 1. Chinese/Korean Text Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-stone-700">
                1. Testo Cinese o Coreano (Frase, poesia o paragrafo)
              </label>
              {activeBlockCurrentText && (
                <button
                  type="button"
                  onClick={() => {
                    const plain = activeBlockCurrentText
                      .replace(/<rt>[^<]*<\/rt>/gi, '')
                      .replace(/<[^>]+>/g, '')
                      .trim();
                    setSourceText(plain);
                    setPronunciationText(getAutoPronunciation(plain));
                  }}
                  className="text-[11px] text-amber-800 hover:underline flex items-center gap-1 font-medium"
                >
                  <CornerDownLeft className="w-3 h-3" />
                  Prendi dal blocco selezionato
                </button>
              )}
            </div>
            <textarea
              rows={2}
              value={sourceText}
              onChange={(e) => handleSourceTextChange(e.target.value)}
              placeholder="Incolla o scrivi qui il testo in cinese o coreano..."
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-base font-serif focus:outline-none focus:ring-1 focus:ring-amber-700 resize-none leading-relaxed"
            />
          </div>

          {/* 2. Pinyin / Pronunciation Input with Auto-Generate Button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-stone-700">
                2. Pronuncia Pinyin (separata da spazi, con toni o numeri)
              </label>
              <button
                type="button"
                onClick={handleAutoGenerate}
                className="px-2.5 py-1 text-xs bg-amber-800 hover:bg-amber-900 text-white rounded font-medium shadow-2xs flex items-center gap-1 transition-colors"
                title="Genera o ricalcola automaticamente i toni Pinyin per ciascun carattere"
              >
                <Sparkles className="w-3 h-3" />
                Ricalcola Pinyin Automatico
              </button>
            </div>
            <textarea
              rows={2}
              value={pronunciationText}
              onChange={(e) => handlePronunciationChange(e.target.value)}
              placeholder="es. chūn mián bù jué xiǎo... oppure chun1 mian2 bu4 jue2 xiao3"
              className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm font-sans focus:outline-none focus:ring-1 focus:ring-amber-700 resize-none font-mono"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              Suggerimento: puoi anche digitare con numeri (es: <code className="bg-stone-100 px-1 rounded">ni3 hao3</code> diventa <code className="bg-stone-100 px-1 rounded">nǐ hǎo</code>). La punteggiatura non riceve pinyin e non altera l'allineamento.
            </p>
          </div>

          {/* 3. Interactive Character-by-Character Verification Grid */}
          <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
            <div className="text-[11px] font-semibold text-stone-700 mb-2 flex items-center justify-between">
              <span>Allineamento Ideogramma ↔ Pronuncia:</span>
              <span className="text-[10px] text-stone-500 font-normal">
                Puoi modificare ogni singola sillaba direttamente qui sotto
              </span>
            </div>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 bg-white rounded border border-stone-200">
              {(() => {
                let cjkCount = 0;
                return pairs.map((pair, idx) => {
                  if (pair.isNewline) {
                    return (
                      <div key={`nl_${idx}`} className="w-full text-[10px] text-stone-400 font-mono py-0.5 border-b border-dashed border-stone-200">
                        ↵ a capo
                      </div>
                    );
                  }
                  if (pair.isPunctuation) {
                    return (
                      <div
                        key={`punct_${idx}`}
                        className="flex flex-col items-center justify-end px-1.5 py-1 text-stone-400 font-serif"
                      >
                        <span className="text-sm font-medium">{pair.char}</span>
                        <span className="text-[9px] text-stone-400 italic font-mono">-</span>
                      </div>
                    );
                  }

                  const currentCjkIdx = cjkCount++;
                  return (
                    <div
                      key={`char_${idx}`}
                      className="flex flex-col items-center p-1 rounded bg-stone-50 border border-stone-200 shadow-2xs hover:border-amber-400 transition-colors"
                    >
                      <span className="text-base font-serif font-medium text-stone-900 leading-tight">
                        {pair.char}
                      </span>
                      <input
                        type="text"
                        value={pair.pronunciation}
                        onChange={(e) => handlePairSyllableChange(currentCjkIdx, e.target.value)}
                        placeholder="pinyin"
                        className="w-14 mt-1 px-1 py-0.5 text-center text-xs font-mono font-medium rounded border border-stone-300 focus:outline-none focus:border-amber-700 bg-white"
                        style={{ color: pinyinColor }}
                      />
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* 4. Formatting and Appearance options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Style mode */}
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
              <span className="font-semibold text-stone-800 block mb-1.5">Stile di visualizzazione:</span>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="displayStyle"
                    checked={displayStyle === 'ruby'}
                    onChange={() => setDisplayStyle('ruby')}
                    className="text-amber-800"
                  />
                  <span>
                    <strong>Ruby Sovrapposto</strong> (Pinyin compatto sopra o a destra)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="displayStyle"
                    checked={displayStyle === 'interlinear'}
                    onChange={() => setDisplayStyle('interlinear')}
                    className="text-amber-800"
                  />
                  <span>
                    <strong>Interlineare (Due Righe)</strong> (Ideogrammi con riga Pinyin sotto)
                  </span>
                </label>
              </div>
            </div>

            {/* Pinyin Color */}
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
              <span className="font-semibold text-stone-800 block mb-1.5">Colore del Pinyin:</span>
              <div className="flex items-center gap-2">
                {[
                  { name: 'Inchiostro Morbido', hex: '#57534e' },
                  { name: 'Grigio Ardesia', hex: '#64748b' },
                  { name: 'Rosso Cinabro', hex: '#b91c1c' },
                  { name: 'Nero Inchiostro', hex: '#1c1917' },
                ].map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => setPinyinColor(col.hex)}
                    className={`flex items-center gap-1 px-2 py-1 rounded border text-[11px] transition-all ${
                      pinyinColor === col.hex
                        ? 'border-amber-800 bg-amber-50 font-semibold'
                        : 'border-stone-200 bg-white hover:bg-stone-100'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-stone-300"
                      style={{ backgroundColor: col.hex }}
                    />
                    <span>{col.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Destination selector */}
          <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200 space-y-2">
            <div className="text-xs font-semibold text-amber-950 flex items-center justify-between">
              <span>Destinazione inserimento nel foglio:</span>
              <span className="font-normal text-[11px] text-amber-800">
                {hasActiveBlock ? `Attivo: ${activeBlockName}` : 'Nessun blocco attivo'}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 text-xs text-stone-800">
              {hasActiveBlock && (
                <>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="targetAction"
                      checked={targetAction === 'replace'}
                      onChange={() => setTargetAction('replace')}
                      className="text-amber-800"
                    />
                    <span>Sostituisci testo nel blocco attuale</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="targetAction"
                      checked={targetAction === 'append'}
                      onChange={() => setTargetAction('append')}
                      className="text-amber-800"
                    />
                    <span>Aggiungi in fondo al blocco attuale</span>
                  </label>
                </>
              )}
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="targetAction"
                  checked={targetAction === 'new-block'}
                  onChange={() => setTargetAction('new-block')}
                  className="text-amber-800"
                />
                <span>Crea nuovo blocco separato</span>
              </label>
            </div>
          </div>

          {/* Live Preview */}
          <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 text-center">
            <span className="text-[11px] text-stone-500 block mb-2 font-sans font-medium">
              Anteprima Tipografica Pulita:
            </span>
            <div
              className="text-xl font-serif text-stone-900 inline-block py-3 px-6 bg-white rounded border border-stone-200 shadow-2xs leading-relaxed max-w-full overflow-x-auto"
              dangerouslySetInnerHTML={{
                __html: previewHtml || '<span class="text-stone-400 text-sm">Nessun testo</span>',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {hasActiveBlock && activeBlockCurrentText.includes('<ruby>') && (
              <button
                type="button"
                onClick={handleRemoveRuby}
                className="px-2.5 py-1.5 text-xs text-stone-600 hover:text-red-700 hover:bg-red-50 rounded border border-stone-300 transition-colors flex items-center gap-1"
                title="Rimuovi le annotazioni fonetiche Ruby mantenendo solo gli ideogrammi puliti"
              >
                <Trash2 className="w-3 h-3" />
                Rimuovi Pinyin
              </button>
            )}
            <span className="text-xs text-stone-500 hidden sm:inline">
              {targetAction === 'replace'
                ? `Verrà aggiornato il blocco: ${activeBlockName}`
                : targetAction === 'append'
                ? `Verrà aggiunto al blocco: ${activeBlockName}`
                : 'Verrà creato un nuovo blocco'}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-md hover:bg-stone-200/60"
            >
              Annulla
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-xs font-medium text-white bg-amber-800 hover:bg-amber-900 rounded-md flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Applica Ruby al Documento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
