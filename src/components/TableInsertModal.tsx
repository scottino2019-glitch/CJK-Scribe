import React, { useState } from 'react';
import { TableBlockData, TableCell } from '../types/editor';
import { X, Table as TableIcon, Check } from 'lucide-react';

interface TableInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertTable: (tableData: TableBlockData) => void;
}

export const TableInsertModal: React.FC<TableInsertModalProps> = ({
  isOpen,
  onClose,
  onInsertTable,
}) => {
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(3);
  const [headers, setHeaders] = useState(true);
  const [bordered, setBordered] = useState(true);
  const [compact, setCompact] = useState(false);
  const [fontSize, setFontSize] = useState(16);

  if (!isOpen) return null;

  const handleCreate = () => {
    const cells: TableCell[][] = [];
    for (let r = 0; r < rows; r++) {
      const rowCells: TableCell[] = [];
      for (let c = 0; c < cols; c++) {
        const isHeader = headers && r === 0;
        let defaultContent = '';
        if (isHeader) {
          if (c === 0) defaultContent = 'Carattere (字)';
          else if (c === 1) defaultContent = 'Pronuncia (音)';
          else if (c === 2) defaultContent = 'Significato (义)';
          else defaultContent = `Colonna ${c + 1}`;
        }
        rowCells.push({
          id: `cell_${r}_${c}_${Date.now()}`,
          content: defaultContent,
          isHeader,
          align: 'center',
          background: isHeader ? '#F8FAFC' : undefined,
        });
      }
      cells.push(rowCells);
    }

    onInsertTable({
      rows,
      cols,
      headers,
      cells,
      bordered,
      compact,
      fontSize,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 no-print">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-amber-800" />
            <h3 className="font-semibold text-stone-900 text-sm">
              Inserisci Tabella CJK
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Righe
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={rows}
                onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Colonne
              </label>
              <input
                type="number"
                min={1}
                max={8}
                value={cols}
                onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Dimensione Font Tabella ({fontSize}pt)
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[12, 14, 16, 18, 22].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setFontSize(sz)}
                  className={`py-1 text-xs rounded border transition-colors font-medium ${
                    fontSize === sz
                      ? 'bg-amber-800 text-white border-amber-900 shadow-2xs font-bold'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {sz}pt
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-stone-100 text-xs text-stone-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={headers}
                onChange={(e) => setHeaders(e.target.checked)}
                className="rounded text-amber-800"
              />
              <span>Includi riga di intestazione</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={bordered}
                onChange={(e) => setBordered(e.target.checked)}
                className="rounded text-amber-800"
              />
              <span>Bordi completi per celle</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={compact}
                onChange={(e) => setCompact(e.target.checked)}
                className="rounded text-amber-800"
              />
              <span>Spaziatura compatta</span>
            </label>
          </div>
        </div>

        <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-md hover:bg-stone-200/60"
          >
            Annulla
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 text-xs font-medium text-white bg-amber-800 hover:bg-amber-900 rounded-md flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            Crea Tabella
          </button>
        </div>
      </div>
    </div>
  );
};
