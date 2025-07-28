import React, { useState } from 'react';
import { Search, Mic, Filter, X } from 'lucide-react';

interface MobileSearchProps {
  value: string;
  onChange: (val: string) => void;
  onVoiceSearch?: () => void;
  onOpenFilters?: () => void;
}

const MobileSearch: React.FC<MobileSearchProps> = ({ value, onChange, onVoiceSearch, onOpenFilters }) => {
  const [showClear, setShowClear] = useState(false);
  return (
    <div className="flex items-center gap-2 p-2 bg-white rounded shadow mb-2 sticky top-0 z-30">
      <Search className="w-5 h-5 text-gray-400" />
      <input
        type="text"
        className="flex-1 px-2 py-1 text-sm border-none focus:ring-0 bg-transparent"
        placeholder="Zoek cliënten..."
        value={value}
        onChange={e => { onChange(e.target.value); setShowClear(!!e.target.value); }}
        aria-label="Zoek cliënten"
      />
      {value && showClear && (
        <button onClick={() => { onChange(''); setShowClear(false); }} aria-label="Wis zoekterm"><X className="w-5 h-5 text-gray-400" /></button>
      )}
      <button onClick={onVoiceSearch} aria-label="Voice search" className="p-1"><Mic className="w-5 h-5 text-gray-400" /></button>
      <button onClick={onOpenFilters} aria-label="Filters" className="p-1"><Filter className="w-5 h-5 text-gray-400" /></button>
    </div>
  );
};

export default MobileSearch;
