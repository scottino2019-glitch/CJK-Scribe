import React from 'react';
import { BlockType } from '../types/editor';
import {
  Heading1,
  Heading2,
  Pilcrow,
  Scroll,
  Table as TableIcon,
  ListOrdered,
  Stamp,
  Minus,
  Image as ImageIcon,
  X,
} from 'lucide-react';

interface AddBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: BlockType) => void;
}

export const AddBlockModal: React.FC<AddBlockModalProps> = ({
  isOpen,
  onClose,
  onSelectType,
}) => {
  if (!isOpen) return null;

  const blockOptions: {
    type: BlockType;
    title: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      type: 'heading1',
      title: 'Titolo Principale (标题 / 대제목)',
      description: 'Testo di grandi dimensioni ideale per titolo opera o capitolo.',
      icon: <Heading1 className="w-5 h-5 text-amber-800" />,
    },
    {
      type: 'heading2',
      title: 'Sottotitolo / Autore (副标题 / 작가)',
      description: 'Indicazione autore, dinastia, datazione o sezione.',
      icon: <Heading2 className="w-5 h-5 text-amber-700" />,
    },
    {
      type: 'poem-stanza',
      title: 'Versi Poetici (诗词绝句 / 시)',
      description: 'Testo formattato con a capo conservati e spaziatura metrica.',
      icon: <Scroll className="w-5 h-5 text-stone-700" />,
    },
    {
      type: 'paragraph',
      title: 'Paragrafo di Testo (正文段落 / 본문)',
      description: 'Blocco di testo narrativo, commento o prosa classica/moderna.',
      icon: <Pilcrow className="w-5 h-5 text-stone-700" />,
    },
    {
      type: 'table',
      title: 'Tabella Comparativa (表格 / 대조표)',
      description: 'Tabella con colonne per Hanzi, Pinyin, Hangul, pronunce e note.',
      icon: <TableIcon className="w-5 h-5 text-stone-700" />,
    },
    {
      type: 'list',
      title: 'Elenco CJK (编号列表 / 목록)',
      description: 'Lista numerata con 一二三, 가나다 o numeri cerchiati ①②③.',
      icon: <ListOrdered className="w-5 h-5 text-stone-700" />,
    },
    {
      type: 'seal-group',
      title: 'Sigilli Tradizionali (印章 / 도장)',
      description: 'Sigilli rossi in ceralacca con caratteri calligrafici.',
      icon: <Stamp className="w-5 h-5 text-red-700" />,
    },
    {
      type: 'divider',
      title: 'Separatore Ornamentale (分割线)',
      description: 'Linea doppia, sottile o tratteggiata per suddividere le sezioni.',
      icon: <Minus className="w-5 h-5 text-stone-600" />,
    },
    {
      type: 'image',
      title: 'Immagine / Illustrazione (插图 / 삽화)',
      description: 'Inserisci un\'immagine ridimensionabile, affiancata al testo o centrata.',
      icon: <ImageIcon className="w-5 h-5 text-amber-800" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 no-print">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <h3 className="font-semibold text-stone-900 text-sm">
            Aggiungi Nuovo Blocco al Documento
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
          {blockOptions.map((opt) => (
            <button
              key={opt.type}
              type="button"
              onClick={() => {
                onSelectType(opt.type);
                onClose();
              }}
              className="p-3 text-left rounded-lg border border-stone-200 hover:border-amber-700 hover:bg-amber-50/40 transition-all flex items-start gap-3 group"
            >
              <div className="p-2 rounded bg-stone-100 group-hover:bg-white transition-colors shrink-0">
                {opt.icon}
              </div>
              <div>
                <div className="text-xs font-semibold text-stone-900 group-hover:text-amber-900">
                  {opt.title}
                </div>
                <div className="text-[11px] text-stone-500 leading-snug mt-0.5">
                  {opt.description}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-stone-200 bg-stone-50 text-right">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-md hover:bg-stone-200/60"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
};
