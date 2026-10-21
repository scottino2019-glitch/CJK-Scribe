import React, { useState } from 'react';
import {
  Printer,
  Download,
  Sparkles,
  LayoutTemplate,
  PlusCircle,
  Loader2,
  Undo2,
  Redo2,
  Trash2,
  Eraser,
  Menu,
  X,
  SlidersHorizontal,
  HelpCircle,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface TopNavProps {
  onOpenTemplates: () => void;
  onToggleSpecialChars: () => void;
  onOpenAddMenu: () => void;
  onPrintPdf: () => void;
  onDownloadDirectPdf: () => void;
  isExporting: boolean;
  exportStage: string;
  canUndo: boolean;
  onUndo: () => void;
  canRedo: boolean;
  onRedo: () => void;
  canDelete: boolean;
  onDeleteActiveBlock: () => void;
  onClearSheet: () => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenTemplates,
  onToggleSpecialChars,
  onOpenAddMenu,
  onPrintPdf,
  onDownloadDirectPdf,
  isExporting,
  exportStage,
  canUndo,
  onUndo,
  canRedo,
  onRedo,
  canDelete,
  onDeleteActiveBlock,
  onClearSheet,
  onOpenSettings,
  onOpenHelp,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="no-print h-14 border-b border-stone-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 flex items-center justify-between gap-2">
        {/* Left Zone: Brand + History (Undo / Redo) */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-bold tracking-tight text-stone-900 font-serif whitespace-nowrap">
              CJK Scribe
            </span>
            <span className="hidden lg:inline text-xs text-stone-400 font-serif">
              · 华韩书仪
            </span>
          </div>

          {/* Undo & Redo buttons (Prominent in navbar) */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 text-stone-700 hover:text-stone-950 hover:bg-white rounded-md disabled:opacity-35 disabled:cursor-not-allowed transition-all"
              title="Annulla ultima modifica (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 text-stone-700 hover:text-stone-950 hover:bg-white rounded-md disabled:opacity-35 disabled:cursor-not-allowed transition-all"
              title="Ripristina modifica (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Delete & Clear Sheet quick buttons */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={onDeleteActiveBlock}
              disabled={!canDelete}
              className="px-2 py-1 text-xs text-stone-700 hover:text-red-700 hover:bg-red-50 rounded-md border border-stone-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-medium"
              title="Elimina blocco selezionato"
            >
              <Trash2 className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden md:inline">Elimina</span>
            </button>

            <button
              type="button"
              onClick={onClearSheet}
              className="px-2 py-1 text-xs text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded-md border border-stone-200 transition-colors flex items-center gap-1 font-medium"
              title="Pulisci foglio (rimuove tutti i blocchi dalla pagina)"
            >
              <Eraser className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden md:inline">Pulisci Foglio</span>
            </button>
          </div>
        </div>

        {/* Center Zone: Quick desktop links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-stone-600">
          <button
            type="button"
            onClick={onOpenTemplates}
            className="hover:text-stone-900 transition-colors flex items-center gap-1.5 py-1 px-2.5 rounded-md hover:bg-stone-100"
            title="Scegli modello"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-stone-500" />
            <span>Modelli</span>
          </button>

          <button
            type="button"
            onClick={onToggleSpecialChars}
            className="hover:text-stone-900 transition-colors flex items-center gap-1.5 py-1 px-2.5 rounded-md hover:bg-stone-100"
            title="Caratteri speciali e toni Pinyin"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Caratteri Speciali</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddMenu}
            className="hover:text-stone-900 transition-colors flex items-center gap-1.5 py-1 px-2.5 rounded-md hover:bg-stone-100"
            title="Aggiungi blocco o elemento"
          >
            <PlusCircle className="w-3.5 h-3.5 text-stone-500" />
            <span>Nuovo Blocco</span>
          </button>

          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="hover:text-stone-900 transition-colors flex items-center gap-1.5 py-1 px-2.5 rounded-md hover:bg-stone-100"
              title="Parametri documento, margini, intensità e interlinea"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
              <span>Impostazioni Pagina</span>
            </button>
          )}
        </nav>

        {/* Right Zone: PWA Install + PDF Export + Mobile Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* PWA Install Button */}
          <PWAInstallButton />

          <button
            type="button"
            onClick={onPrintPdf}
            disabled={isExporting}
            className="hidden md:flex px-2.5 sm:px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-md transition-colors items-center gap-1.5 whitespace-nowrap"
            title="Stampa con layout PDF ad alta fedeltà o salva come PDF di sistema"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Stampa / PDF</span>
          </button>

          <button
            type="button"
            onClick={onDownloadDirectPdf}
            disabled={isExporting}
            className="px-2.5 sm:px-3.5 py-1.5 text-xs font-medium text-white bg-amber-800 hover:bg-amber-900 rounded-md transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap disabled:opacity-75 disabled:cursor-wait"
            title="Scarica direttamente il file .pdf nel browser"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {isExporting ? exportStage || 'Esportazione...' : 'Scarica PDF'}
            </span>
            <span className="sm:hidden">PDF</span>
          </button>

          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md border border-stone-200"
            title="Menu opzioni e strumenti"
          >
            {isMobileMenuOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Drawer / Sheet when hamburger is clicked */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs no-print animate-in fade-in">
          <div className="bg-white rounded-t-2xl p-5 shadow-2xl border-t border-stone-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <span className="font-bold text-stone-900 text-sm font-serif">
                Menu CJK Scribe
              </span>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Undo / Redo / Delete / Clear Sheet mobile grid */}
            <div>
              <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">
                Azioni Rapide
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => {
                    onUndo();
                    setIsMobileMenuOpen(false);
                  }}
                  disabled={!canUndo}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 disabled:opacity-40"
                >
                  <Undo2 className="w-4 h-4 text-stone-700" />
                  <span>Annulla (Undo)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRedo();
                    setIsMobileMenuOpen(false);
                  }}
                  disabled={!canRedo}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 disabled:opacity-40"
                >
                  <Redo2 className="w-4 h-4 text-stone-700" />
                  <span>Ripristina (Redo)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteActiveBlock();
                    setIsMobileMenuOpen(false);
                  }}
                  disabled={!canDelete}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-red-200 bg-red-50/70 text-red-800 disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <span>Elimina Blocco</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClearSheet();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800"
                >
                  <Eraser className="w-4 h-4 text-stone-600" />
                  <span>Pulisci Foglio</span>
                </button>
              </div>
            </div>

            {/* Navigation & Tools */}
            <div>
              <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">
                Strumenti di Scrittura
              </div>
              <div className="space-y-1.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => {
                    onOpenAddMenu();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-stone-200 hover:bg-amber-50/60 text-stone-800"
                >
                  <PlusCircle className="w-4 h-4 text-amber-800" />
                  <span>Aggiungi Nuovo Blocco (Testo, Tabella, Sigillo...)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenTemplates();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-800"
                >
                  <LayoutTemplate className="w-4 h-4 text-stone-600" />
                  <span>Modelli Documento CJK Preimpostati</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onToggleSpecialChars();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-800"
                >
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>Tastiera Caratteri Speciali & Pinyin</span>
                </button>
                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenSettings();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-800"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-stone-600" />
                    <span>Impostazioni Foglio, Margini & Header</span>
                  </button>
                )}
                {onOpenHelp && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenHelp();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-800"
                  >
                    <HelpCircle className="w-4 h-4 text-stone-600" />
                    <span>Guida Tipografica CJK</span>
                  </button>
                )}
              </div>
            </div>

            {/* Export Actions */}
            <div>
              <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">
                Esportazione e Stampa
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => {
                    onPrintPdf();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-800"
                >
                  <Printer className="w-4 h-4" />
                  <span>Stampa / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDownloadDirectPdf();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white shadow-xs font-semibold"
                >
                  <Download className="w-4 h-4" />
                  <span>Scarica PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
