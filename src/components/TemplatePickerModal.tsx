import React from 'react';
import { TEMPLATES } from '../data/cjkPresets';
import { CJKDocument } from '../types/editor';
import { X, FileText, Check } from 'lucide-react';

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateDoc: CJKDocument) => void;
}

export const TemplatePickerModal: React.FC<TemplatePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 no-print">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <h3 className="font-semibold text-stone-900 text-sm">
              Modelli Pronti CJK (中文与韩语精品范本)
            </h3>
            <p className="text-xs text-stone-500">
              Scegli un modello pre-impostato per iniziare immediatamente la composizione
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Templates */}
        <div className="p-4 overflow-y-auto space-y-3">
          {TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              className="p-4 rounded-lg border border-stone-200 hover:border-amber-700 hover:shadow-md transition-all bg-white group cursor-pointer"
              onClick={() => {
                onSelectTemplate(tmpl.doc);
                onClose();
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-md bg-stone-100 flex items-center justify-center text-amber-800 shrink-0 group-hover:bg-amber-50 group-hover:text-amber-900 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-stone-900 text-sm group-hover:text-amber-900 transition-colors">
                        {tmpl.name}
                      </h4>
                      <span className="text-[11px] text-stone-500">
                        {tmpl.tag}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTemplate(tmpl.doc);
                    onClose();
                  }}
                  className="px-3 py-1.5 text-xs rounded border border-stone-300 text-stone-700 group-hover:bg-amber-800 group-hover:text-white group-hover:border-amber-800 transition-colors shrink-0 flex items-center gap-1 font-medium"
                >
                  <Check className="w-3.5 h-3.5" />
                  Carica
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-stone-200 bg-stone-50 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-md hover:bg-stone-200/60"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
