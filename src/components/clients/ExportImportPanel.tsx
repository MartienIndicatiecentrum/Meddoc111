import React from 'react';
import { Upload, Download } from 'lucide-react';

interface ExportImportPanelProps {
  onExport?: (format: 'pdf' | 'xlsx' | 'csv') => void;
  onImport?: (file: File) => void;
}

const ExportImportPanel: React.FC<ExportImportPanelProps> = ({ onExport, onImport }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onImport) {
      onImport(e.target.files[0]);
    }
  };

  return (
    <div className="flex gap-2 items-center mt-2">
      <button className="btn btn-xs btn-outline" onClick={() => onExport && onExport('pdf')} aria-label="Exporteer PDF">
        <Download className="w-4 h-4 mr-1" /> PDF
      </button>
      <button className="btn btn-xs btn-outline" onClick={() => onExport && onExport('xlsx')} aria-label="Exporteer Excel">
        <Download className="w-4 h-4 mr-1" /> Excel
      </button>
      <button className="btn btn-xs btn-outline" onClick={() => onExport && onExport('csv')} aria-label="Exporteer CSV">
        <Download className="w-4 h-4 mr-1" /> CSV
      </button>
      <button className="btn btn-xs btn-outline" onClick={handleImportClick} aria-label="Importeer bestand">
        <Upload className="w-4 h-4 mr-1" /> Import
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls,.json"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Bestand uploaden"
      />
    </div>
  );
};

export default ExportImportPanel;
