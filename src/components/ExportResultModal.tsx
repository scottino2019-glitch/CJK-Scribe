import React from 'react';
import { FileCheck, Download, ExternalLink, Printer, X, AlertTriangle, RefreshCw } from 'lucide-react';

interface ExportSuccessData {
  filename: string;
  blobUrl: string;
  fileSizeKb: number;
  format: string;
  pagesCount: number;
}

interface ExportResultModalProps {
  successData: ExportSuccessData | null;
  errorMessage: string | null;
  onClose: () => void;
  onRetry: () => void;
  onPrintFallback: () => void;
}

export const ExportResultModal: React.FC<ExportResultModalProps> = ({
  successData,
  errorMessage,
  onClose,
  onRetry,
  onPrintFallback,
}) => {
  if (!successData && !errorMessage) return null;

  const handleDownloadAgain = () => {
    if (!successData) return;
    const a = document.createElement('a');
    a.href = successData.blobUrl;
    a.download = successData.filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        document.body.removeChild(a);
      } catch (_) {}
    }, 1000);
  };

  const handleOpenTab = () => {
    if (!successData) return;
    window.open(successData.blobUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {successData ? (
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                <FileCheck className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-stone-900 text-sm">
                {successData ? 'Esportazione PDF Completata' : 'Problema Esportazione PDF'}
              </h3>
              <p className="text-xs text-stone-500">
                {successData
                  ? 'Il file è pronto per essere scaricato o visualizzato'
                  : 'Impossibile completare il download diretto'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {successData ? (
            <div className="space-y-4">
              <div className="bg-stone-50 rounded-lg p-3.5 border border-stone-200/80 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-500">Nome file:</span>
                  <span className="font-medium text-stone-800 font-mono">{successData.filename}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Dimensione stimata:</span>
                  <span className="font-medium text-stone-800">{successData.fileSizeKb} KB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Formato e pagine:</span>
                  <span className="font-medium text-stone-800">{successData.format} · {successData.pagesCount} pag.</span>
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                Il download automatico del file è stato avviato nel browser. Se il browser ha bloccato il download, puoi scaricarlo o aprirlo con i pulsanti sottostanti:
              </p>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={handleDownloadAgain}
                  className="w-full py-2 px-3 bg-amber-800 hover:bg-amber-900 text-white rounded-md text-xs font-medium flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Scarica File PDF
                </button>

                <button
                  onClick={handleOpenTab}
                  className="w-full py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md text-xs font-medium flex items-center justify-center gap-2 border border-stone-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Visualizza Anteprima nel Browser
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 leading-relaxed">
                {errorMessage}
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                Puoi utilizzare l'opzione <strong>Stampa / PDF</strong> che apre la finestra nativa di sistema: da lì puoi selezionare <em>"Salva come PDF"</em> per un risultato perfetto con caratteri vettoriali.
              </p>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => {
                    onClose();
                    onPrintFallback();
                  }}
                  className="w-full py-2 px-3 bg-stone-800 hover:bg-stone-900 text-white rounded-md text-xs font-medium flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Stampa / Salva come PDF di Sistema
                </button>

                <button
                  onClick={onRetry}
                  className="w-full py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md text-xs font-medium flex items-center justify-center gap-2 border border-stone-300 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Riprova Esportazione Diretta
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-50 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium rounded-md hover:bg-stone-200/50"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
