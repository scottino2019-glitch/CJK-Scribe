import React, { useState, useRef } from 'react';
import { ImageData } from '../types/editor';
import { CJK_ARTWORK_PRESETS } from '../data/cjkArtworkPresets';
import {
  Upload,
  Link as LinkIcon,
  Palette,
  X,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Columns,
  Image as ImageIcon,
  Sliders,
  Trash2,
} from 'lucide-react';

interface ImageConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ImageData;
  initialContent?: string;
  onSave: (data: ImageData, newContent?: string) => void;
}

export const ImageConfigModal: React.FC<ImageConfigModalProps> = ({
  isOpen,
  onClose,
  initialData,
  initialContent,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const [url, setUrl] = useState<string>(initialData?.url || '');
  const [alt, setAlt] = useState<string>(initialData?.alt || '');
  const [caption, setCaption] = useState<string>(initialData?.caption || '');
  const [widthPercent, setWidthPercent] = useState<number>(initialData?.widthPercent || 40);
  const [alignment, setAlignment] = useState<'center' | 'left' | 'right' | 'float-left' | 'float-right' | 'side-by-side'>(
    initialData?.alignment || 'left'
  );
  const [blockText, setBlockText] = useState<string>(
    initialContent ||
      initialData?.sideText ||
      '<ruby><rb>春</rb><rt>chūn</rt></ruby><ruby><rb>眠</rb><rt>mián</rt></ruby><ruby><rb>不</rb><rt>bù</rt></ruby><ruby><rb>觉</rb><rt>jué</rt></ruby><ruby><rb>晓</rb><rt>xiǎo</rt></ruby>，<ruby><rb>处</rb><rt>chù</rt></ruby><ruby><rb>处</rb><rt>chù</rt></ruby><ruby><rb>闻</rb><rt>wén</rt></ruby><ruby><rb>啼</rb><rt>tí</rt></ruby><ruby><rb>鸟</rb><rt>niǎo</rt></ruby>。'
  );
  const [borderStyle, setBorderStyle] = useState<'none' | 'thin' | 'traditional'>(
    initialData?.borderStyle || 'thin'
  );
  const [previewError, setPreviewError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Seleziona un file immagine valido (PNG, JPG, WebP, SVG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      if (result) {
        setUrl(result);
        setPreviewError(false);
        if (!caption) {
          setCaption(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = (presetUrl: string, title: string, cjkTitle: string) => {
    setUrl(presetUrl);
    setPreviewError(false);
    setCaption(`${cjkTitle} · ${title}`);
  };

  const handleApply = () => {
    if (!url.trim()) {
      alert('Seleziona o carica prima un\'immagine');
      return;
    }

    onSave(
      {
        url,
        alt: alt.trim() || caption.trim() || 'Immagine CJK',
        caption: caption.trim(),
        widthPercent,
        alignment,
        borderStyle,
      },
      blockText
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 md:p-6 no-print overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-800 text-white rounded-md shadow-xs">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900 text-sm">
                Configura Immagine & Disposizione
              </h3>
              <p className="text-[11px] text-stone-500">
                Ridimensiona, allinea e affianca l'illustrazione al testo CJK
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-100/60 px-4 pt-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'upload'
                ? 'border-amber-800 text-amber-900 bg-white rounded-t-md'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Carica dal PC
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'preset'
                ? 'border-amber-800 text-amber-900 bg-white rounded-t-md'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Arte Tradizionale CJK
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'url'
                ? 'border-amber-800 text-amber-900 bg-white rounded-t-md'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            URL Web
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[72vh] overflow-y-auto">
          {/* Tab 1: Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-300 hover:border-amber-700 bg-stone-50/60 hover:bg-amber-50/30 rounded-xl p-6 text-center cursor-pointer transition-all"
              >
                <Upload className="w-8 h-8 mx-auto text-amber-800 mb-2 opacity-80" />
                <div className="text-xs font-semibold text-stone-800">
                  Clicca qui per selezionare un'immagine dal tuo computer
                </div>
                <div className="text-[11px] text-stone-500 mt-1">
                  Supporta PNG, JPG, JPEG, WebP, SVG. Convertita in locale (garantita nell'esportazione PDF senza tagli).
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Art presets */}
          {activeTab === 'preset' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700 block">
                Scegli un'illustrazione classica a inchiostro CJK:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CJK_ARTWORK_PRESETS.map((preset) => {
                  const isSelected = url === preset.svgDataUrl;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        handlePresetSelect(preset.svgDataUrl, preset.title, preset.cjkTitle)
                      }
                      className={`p-2 rounded-lg border text-left transition-all flex flex-col items-center ${
                        isSelected
                          ? 'border-amber-800 bg-amber-50/50 ring-2 ring-amber-800/20'
                          : 'border-stone-200 hover:border-stone-400 bg-white'
                      }`}
                    >
                      <img
                        src={preset.svgDataUrl}
                        alt={preset.title}
                        className="w-full h-24 object-contain rounded bg-stone-50 border border-stone-100 mb-1.5"
                      />
                      <span className="text-xs font-serif font-bold text-stone-800">
                        {preset.cjkTitle}
                      </span>
                      <span className="text-[10px] text-stone-500 truncate w-full text-center">
                        {preset.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: URL input */}
          {activeTab === 'url' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700 block">
                Indirizzo Web Immagine (URL HTTPS):
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setPreviewError(false);
                }}
                placeholder="https://example.com/immagine.jpg"
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-700"
              />
              <p className="text-[10px] text-stone-500">
                Suggerimento: caricare l'immagine dal computer (Tab 1) garantisce la massima risoluzione e previene blocchi CORS durante il download del PDF.
              </p>
            </div>
          )}

          {/* Preview banner if url exists */}
          {url && (
            <div className="space-y-2">
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg flex items-center gap-3">
                <div className="w-16 h-16 shrink-0 rounded bg-white border border-stone-200 overflow-hidden flex items-center justify-center">
                  {previewError ? (
                    <span className="text-[10px] text-red-500 text-center px-1">Errore caricamento</span>
                  ) : (
                    <img
                      src={url}
                      alt="Anteprima"
                      onError={() => setPreviewError(true)}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-stone-800 truncate">
                    Immagine Pronta
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Larghezza: <strong className="text-amber-900">{widthPercent}%</strong> · Disposizione:{' '}
                    <strong className="text-amber-900">
                      {alignment === 'float-left'
                        ? 'Avvolgente a Sinistra'
                        : alignment === 'float-right'
                        ? 'Avvolgente a Destra'
                        : alignment === 'right'
                        ? '2 Colonne (Destra)'
                        : alignment === 'left' || alignment === 'side-by-side'
                        ? '2 Colonne (Sinistra)'
                        : 'Centrata'}
                    </strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUrl('')}
                  className="p-1 text-stone-400 hover:text-red-600 rounded"
                  title="Rimuovi immagine"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Preview of layout and text wrapping */}
              <div className="p-3 bg-amber-50/40 border border-amber-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-800" />
                    Anteprima Disposizione & Testo Avvolgente:
                  </span>
                  <span className="text-[11px] text-amber-900 font-medium">
                    {alignment === 'float-left'
                      ? 'Avvolgente (Immagine a sinistra)'
                      : alignment === 'float-right'
                      ? 'Avvolgente (Immagine a destra)'
                      : alignment === 'right'
                      ? '2 Colonne (Immagine a destra)'
                      : alignment === 'left' || alignment === 'side-by-side'
                      ? '2 Colonne (Immagine a sinistra)'
                      : 'Centrata sopra al testo'}
                  </span>
                </div>

                {/* Live wrapping simulation box */}
                <div className="bg-white p-3 rounded-lg border border-amber-200/60 text-xs text-stone-800 max-h-48 overflow-y-auto font-serif">
                  {alignment === 'float-left' ? (
                    <div className="clearfix">
                      <img
                        src={url}
                        alt="Anteprima"
                        className="float-left mr-3 mb-2 rounded border border-stone-300 shadow-2xs object-cover"
                        style={{ width: `${Math.min(Math.max(widthPercent, 20), 50)}%` }}
                      />
                      <div
                        dangerouslySetInnerHTML={{
                          __html:
                            blockText ||
                            '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。唐诗经典，意境清幽，文字自然流淌于插画身旁与下方。',
                        }}
                        className="leading-relaxed"
                      />
                      <div className="clear-both" />
                    </div>
                  ) : alignment === 'float-right' ? (
                    <div className="clearfix">
                      <img
                        src={url}
                        alt="Anteprima"
                        className="float-right ml-3 mb-2 rounded border border-stone-300 shadow-2xs object-cover"
                        style={{ width: `${Math.min(Math.max(widthPercent, 20), 50)}%` }}
                      />
                      <div
                        dangerouslySetInnerHTML={{
                          __html:
                            blockText ||
                            '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。唐诗经典，意境清幽，文字自然流淌于插画身旁与下方。',
                        }}
                        className="leading-relaxed"
                      />
                      <div className="clear-both" />
                    </div>
                  ) : alignment === 'right' ? (
                    <div className="flex gap-3 items-start">
                      <div
                        className="flex-1 min-w-0 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: blockText }}
                      />
                      <img
                        src={url}
                        alt="Anteprima"
                        className="rounded border border-stone-300 shadow-2xs shrink-0 object-cover"
                        style={{ width: `${Math.min(Math.max(widthPercent, 20), 50)}%` }}
                      />
                    </div>
                  ) : alignment === 'center' ? (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <img
                        src={url}
                        alt="Anteprima"
                        className="rounded border border-stone-300 shadow-2xs object-cover"
                        style={{ width: `${Math.min(Math.max(widthPercent, 30), 80)}%` }}
                      />
                      <div
                        className="w-full leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: blockText }}
                      />
                    </div>
                  ) : (
                    <div className="flex gap-3 items-start">
                      <img
                        src={url}
                        alt="Anteprima"
                        className="rounded border border-stone-300 shadow-2xs shrink-0 object-cover"
                        style={{ width: `${Math.min(Math.max(widthPercent, 20), 50)}%` }}
                      />
                      <div
                        className="flex-1 min-w-0 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: blockText }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Alignment & Wrapping Selection Buttons */}
          <div className="space-y-2 pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-800 block">
                Disposizione dell'Immagine & Testo Avvolgente:
              </label>
              <span className="text-[10px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Pinyin & Caratteri CJK
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setAlignment('float-left')}
                className={`p-2 rounded-lg border text-left transition-all flex flex-col items-center gap-1 ${
                  alignment === 'float-left'
                    ? 'border-amber-800 bg-amber-50 text-amber-950 font-semibold ring-2 ring-amber-800/20'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Columns className="w-4 h-4 text-amber-800" />
                <span className="text-xs font-bold">Avvolgi a Sinistra</span>
                <span className="text-[10px] text-stone-500 text-center">
                  Immagine a sinistra, il testo scorre a destra e continua sotto
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAlignment('float-right')}
                className={`p-2 rounded-lg border text-left transition-all flex flex-col items-center gap-1 ${
                  alignment === 'float-right'
                    ? 'border-amber-800 bg-amber-50 text-amber-950 font-semibold ring-2 ring-amber-800/20'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Columns className="w-4 h-4 text-amber-800 scale-x-[-1]" />
                <span className="text-xs font-bold">Avvolgi a Destra</span>
                <span className="text-[10px] text-stone-500 text-center">
                  Immagine a destra, il testo scorre a sinistra e continua sotto
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAlignment('left')}
                className={`p-2 rounded-lg border text-left transition-all flex flex-col items-center gap-1 ${
                  alignment === 'left' || alignment === 'side-by-side'
                    ? 'border-amber-800 bg-amber-50 text-amber-950 font-semibold ring-2 ring-amber-800/20'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <AlignLeft className="w-4 h-4 text-amber-800" />
                <span className="text-xs font-bold">2 Colonne Separate</span>
                <span className="text-[10px] text-stone-500 text-center">
                  Immagine in colonna 1, testo in colonna 2
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAlignment('center')}
                className={`p-2 rounded-lg border text-left transition-all flex flex-col items-center gap-1 ${
                  alignment === 'center'
                    ? 'border-amber-800 bg-amber-50 text-amber-950 font-semibold ring-2 ring-amber-800/20'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <AlignCenter className="w-4 h-4 text-amber-800" />
                <span className="text-xs font-bold">Centrata</span>
                <span className="text-[10px] text-stone-500 text-center">
                  Immagine sopra centrata, testo sotto
                </span>
              </button>
            </div>
          </div>

          {/* Testo affiancato / contestuale */}
          <div className="space-y-1.5 p-3 bg-amber-50/50 border border-amber-200/90 rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label className="text-xs font-semibold text-amber-950 block">
                Testo che avvolge o affianca l'immagine:
              </label>
              <button
                type="button"
                onClick={() =>
                  setBlockText(
                    '<ruby><rb>春</rb><rt>chūn</rt></ruby><ruby><rb>眠</rb><rt>mián</rt></ruby><ruby><rb>不</rb><rt>bù</rt></ruby><ruby><rb>觉</rb><rt>jué</rt></ruby><ruby><rb>晓</rb><rt>xiǎo</rt></ruby>，<ruby><rb>处</rb><rt>chù</rt></ruby><ruby><rb>处</rb><rt>chù</rt></ruby><ruby><rb>闻</rb><rt>wén</rt></ruby><ruby><rb>啼</rb><rt>tí</rt></ruby><ruby><rb>鸟</rb><rt>niǎo</rt></ruby>。<br/><ruby><rb>夜</rb><rt>yè</rt></ruby><ruby><rb>来</rb><rt>lái</rt></ruby><ruby><rb>风</rb><rt>fēng</rt></ruby><ruby><rb>雨</rb><rt>yǔ</rt></ruby><ruby><rb>声</rb><rt>shēng</rt></ruby>，<ruby><rb>花</rb><rt>huā</rt></ruby><ruby><rb>落</rb><rt>luò</rt></ruby><ruby><rb>知</rb><rt>zhī</rt></ruby><ruby><rb>多</rb><rt>duō</rt></ruby><ruby><rb>少</rb><rt>shǎo</rt></ruby>。<br/>【赏析】此诗描绘江南明媚春光，清晨醒来处处鸟语花香，夜来风雨不知吹落多少繁花，语浅意浓，千古传诵。'
                  )
                }
                className="text-[11px] text-amber-900 underline hover:text-amber-950 font-semibold"
              >
                + Carica Poesia Lunga con Pinyin per testare l'avvolgimento
              </button>
            </div>
            <textarea
              value={blockText}
              onChange={(e) => setBlockText(e.target.value)}
              rows={4}
              placeholder="Scrivi o incolla qui il testo CJK che avvolge l'immagine..."
              className="w-full p-2.5 text-xs border border-amber-300 rounded-lg bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-700 font-serif leading-relaxed"
            />
            <p className="text-[10px] text-stone-500">
              💡 Nel documento puoi anche cliccare direttamente sul testo e modificarlo dal vivo, oppure selezionare parole e premere <strong>Ruby / Pinyin</strong> per aggiungere annotazioni fonetiche!
            </p>
          </div>

          {/* Caption & Border */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-200">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Didascalia / Titolo opera:
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="es. 图一 · 清明上河图 (Didascalia opzionale)"
                className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-700"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Stile Cornice:
              </label>
              <select
                value={borderStyle}
                onChange={(e) =>
                  setBorderStyle(e.target.value as 'none' | 'thin' | 'traditional')
                }
                className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-700"
              >
                <option value="none">Nessuna cornice (Immagine pulita)</option>
                <option value="thin">Bordo sottile moderno</option>
                <option value="traditional">Cornice calligrafica CJK tradizionale (Doppia linea)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-md hover:bg-stone-200/60"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-1.5 text-xs font-medium text-white bg-amber-800 hover:bg-amber-900 rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Inserisci / Aggiorna Immagine
          </button>
        </div>
      </div>
    </div>
  );
};
