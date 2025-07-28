import React from 'react';
import { useClientStore } from '../../store/clientStore';
import { Download, Trash, Tag, Edit } from 'lucide-react';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onBulkDelete?: () => void;
  onBulkExport?: () => void;
  onBulkTag?: () => void;
  onBulkEdit?: () => void;
}

const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({ selectedCount, onBulkDelete, onBulkExport, onBulkTag, onBulkEdit }) => {
  if (selectedCount === 0) return null;
  return (
    <div className="fixed bottom-0 left-0 w-full z-40 bg-white border-t shadow flex items-center gap-4 px-6 py-3 animate-fade-in">
      <span className="font-medium text-sm">{selectedCount} geselecteerd</span>
      <button className="btn btn-xs btn-outline" onClick={onBulkEdit} aria-label="Bulk bewerken"><Edit className="w-4 h-4 mr-1" /> Bewerken</button>
      <button className="btn btn-xs btn-outline" onClick={onBulkTag} aria-label="Bulk taggen"><Tag className="w-4 h-4 mr-1" /> Tags</button>
      <button className="btn btn-xs btn-outline" onClick={onBulkExport} aria-label="Bulk exporteren"><Download className="w-4 h-4 mr-1" /> Export</button>
      <button className="btn btn-xs btn-danger" onClick={onBulkDelete} aria-label="Bulk verwijderen"><Trash className="w-4 h-4 mr-1" /> Verwijderen</button>
    </div>
  );
};

export default BulkActionsToolbar;
