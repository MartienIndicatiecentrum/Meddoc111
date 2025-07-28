import React, { useState, useEffect, useRef } from 'react';
import { useClientStore } from '../../store/clientStore';
import { Client, ClientStatus, CareLevel } from './types';
import Fuse from 'fuse.js';
import { X, Search, Filter } from 'lucide-react';

interface ClientSearchAndFiltersProps {
  allClients: Client[];
}

const statusOptions: { value: ClientStatus; label: string }[] = [
  { value: 'intake_pending', label: 'Intake' },
  { value: 'assessment_phase', label: 'Assessment' },
  { value: 'care_planning', label: 'Zorgplan' },
  { value: 'active_care', label: 'Actief' },
  { value: 'care_suspended', label: 'Opgeschort' },
  { value: 'care_ended', label: 'Beëindigd' },
  { value: 'transferred', label: 'Overgedragen' },
];

const careLevelOptions: { value: CareLevel; label: string }[] = [
  { value: 'wlz_1', label: 'WLZ 1' },
  { value: 'wlz_2', label: 'WLZ 2' },
  { value: 'wlz_3', label: 'WLZ 3' },
  { value: 'wlz_4', label: 'WLZ 4' },
  { value: 'wlz_5', label: 'WLZ 5' },
  { value: 'wmo', label: 'WMO' },
  { value: 'zvw', label: 'ZVW' },
];

const fuseOptions = {
  keys: [
    'fullName',
    'firstName',
    'lastName',
    'bsn',
    'address.city',
    'address.street',
    'address.postalCode',
  ],
  threshold: 0.3,
  includeScore: true,
};

const ClientSearchAndFilters: React.FC<ClientSearchAndFiltersProps> = ({ allClients }) => {
  const { searchFilters, setSearchFilters } = useClientStore();
  const [searchTerm, setSearchTerm] = useState(searchFilters.searchTerm || '');
  const [status, setStatus] = useState<ClientStatus[]>(searchFilters.status || []);
  const [careLevel, setCareLevel] = useState<CareLevel[]>(searchFilters.careLevel || []);
  const [filteredClients, setFilteredClients] = useState<Client[]>(allClients);
  const fuse = useRef(new Fuse(allClients, fuseOptions));

  useEffect(() => {
    fuse.current = new Fuse(allClients, fuseOptions);
  }, [allClients]);

  useEffect(() => {
    let result = allClients;
    if (searchTerm) {
      result = fuse.current.search(searchTerm).map(r => r.item);
    }
    if (status.length > 0) {
      result = result.filter(c => status.includes(c.care.status));
    }
    if (careLevel.length > 0) {
      result = result.filter(c => careLevel.includes(c.care.careLevel));
    }
    setFilteredClients(result);
    setSearchFilters({ searchTerm, status, careLevel });
  }, [searchTerm, status, careLevel, allClients, setSearchFilters]);

  return (
    <div className="flex flex-col md:flex-row gap-2 items-start md:items-center mb-4">
      {/* Search bar */}
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 text-gray-400 w-5 h-5" />
        <input
          type="text"
          className="pl-9 pr-8 py-2 rounded border border-gray-300 w-full focus:outline-none focus:ring focus:border-blue-400"
          placeholder="Zoek op naam, adres, BSN..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          aria-label="Zoek cliënten"
        />
        {searchTerm && (
          <button className="absolute right-2 top-2.5" onClick={() => setSearchTerm('')} aria-label="Wis zoekterm">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>
      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {statusOptions.map(opt => (
          <button
            key={opt.value}
            className={`px-2 py-1 rounded text-xs font-medium border ${status.includes(opt.value) ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-white border-gray-300 text-gray-500'}`}
            onClick={() => setStatus(s => s.includes(opt.value) ? s.filter(v => v !== opt.value) : [...s, opt.value])}
            aria-pressed={status.includes(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {/* Carelevel filter */}
      <div className="flex gap-2 flex-wrap">
        {careLevelOptions.map(opt => (
          <button
            key={opt.value}
            className={`px-2 py-1 rounded text-xs font-medium border ${careLevel.includes(opt.value) ? 'bg-cyan-100 border-cyan-400 text-cyan-800' : 'bg-white border-gray-300 text-gray-500'}`}
            onClick={() => setCareLevel(s => s.includes(opt.value) ? s.filter(v => v !== opt.value) : [...s, opt.value])}
            aria-pressed={careLevel.includes(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {/* Filter icon for advanced (future) */}
      <button className="ml-2 p-2 rounded bg-gray-100 border border-gray-200 hover:bg-gray-200" aria-label="Meer filters">
        <Filter className="w-5 h-5 text-gray-500" />
      </button>
    </div>
  );
};

export default ClientSearchAndFilters;
