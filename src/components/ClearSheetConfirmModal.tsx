import React from 'react';
import { Eraser, AlertTriangle, X, Check } from 'lucide-react';

interface ClearSheetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ClearSheetConfirmModal: React.FC<ClearSheetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 no-print animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-amber-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
              <Eraser className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                Pulisci Foglio di Lavoro
              </h3>
              <p className="text-xs text-stone-500">
                Svuota il contenuto della pagina
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 text-xs leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>Attenzione:</strong> Questa azione rimuoverà tutti i blocchi di testo, tabelle, immagini ed elenchi presenti sul foglio attuale, lasciando un nuovo foglio vuoto pronto per scrivere.
            </div>
          </div>
          <p className="text-xs text-stone-600">
            Non preoccuparti: potrai sempre recuperare il foglio immediatamente usando il pulsante <strong>Annulla (Undo)</strong> o premendo <strong>Ctrl+Z</strong>.
          </p>
        </div>

        <div className="p-4 border-t border-stone-100 bg-stone-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-200/60 transition-colors"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Eraser className="w-3.5 h-3.5" />
            Sì, Pulisci Foglio
          </button>
        </div>
      </div>
    </div>
  );
};
