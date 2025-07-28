import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, X } from "lucide-react";

type Client = {
  id: string;
  naam: string;
  geboortedatum?: string;
  email?: string;
  adres?: string;
  telefoon?: string;
  woonplaats?: string;
  postcode?: string;
  verzekeraar?: string;
  polisnummer?: string;
  bsn?: string;
  notities?: string;
};

interface KiesClientDropdownProps {
  onSelect: (clientId: string) => void;
  onClientSelect?: (clientId: string, clientName: string) => void;
  value?: string;
}

const KiesClientDropdown: React.FC<KiesClientDropdownProps> = ({ onSelect, onClientSelect, value }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Helper function to get display name
  const getDisplayName = (client: Client) => {
    return client.naam || 'Naam onbekend';
  };

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select("id,naam,geboortedatum,email,adres,telefoon,woonplaats,postcode,verzekeraar,polisnummer,bsn,notities")
        .is('deleted_at', null)
        .order("naam");
      if (error) {
        console.error('[KiesClientDropdown] Database error:', error);
      } else if (data) {
        setClients(data);
      }
      setLoading(false);
    };
    fetchClients();
    const subscription = supabase.channel('public:clients')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, payload => {
        fetchClients();
      })
      .subscribe();
    return () => {
      if (subscription && subscription.unsubscribe) subscription.unsubscribe();
    };
  }, []);

  const selectedClient = clients.find(client => client.id === value);

  useEffect(() => {
    if (selectedClient) {
      setSearch(getDisplayName(selectedClient));
    } else if (!value) {
      setSearch("");
    }
  }, [value, selectedClient]);

  const filteredClients = clients.filter(client => {
    const q = search.toLowerCase();
    return (
      getDisplayName(client).toLowerCase().includes(q) ||
      (client.email && client.email.toLowerCase().includes(q)) ||
      (client.geboortedatum && client.geboortedatum.includes(q)) ||
      (client.adres && client.adres.toLowerCase().includes(q)) ||
      (client.woonplaats && client.woonplaats.toLowerCase().includes(q)) ||
      (client.bsn && client.bsn.includes(q))
    );
  });

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setSearch(inputValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
    
    // If input is cleared, clear selection
    if (!inputValue) {
      onSelect("");
    }
  };

  // Handle client selection
  const handleClientSelect = (client: Client) => {
    const clientName = getDisplayName(client);
    setSearch(clientName);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onSelect(client.id);
    if (onClientSelect) {
      onClientSelect(client.id, clientName);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredClients.length ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > -1 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex === -1) {
          // Select "All clients"
          setSearch("");
          onSelect("");
          if (onClientSelect) {
            onClientSelect("", "Alle cliënten");
          }
          setIsOpen(false);
          setHighlightedIndex(-1);
        } else if (highlightedIndex >= 0 && filteredClients[highlightedIndex]) {
          handleClientSelect(filteredClients[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear selection
  const clearSelection = () => {
    setSearch("");
    onSelect("");
    if (onClientSelect) {
      onClientSelect("", "Alle cliënten");
    }
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="min-w-[200px] max-w-full w-96 relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-lg text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Zoek cliënt..."
          value={search}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          disabled={loading}
          autoComplete="off"
        />
        
        {/* Right side icons */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {selectedClient && (
            <button
              onClick={clearSelection}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              type="button"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
          <ChevronDown 
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-2 text-gray-500">Laden...</div>
          ) : (
            <>
              {/* All clients option */}
              <div
                className={`px-3 py-2 cursor-pointer transition-colors border-b border-gray-200 ${
                  highlightedIndex === -1
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50'
                } ${
                  !value ? 'bg-blue-100 text-blue-800 font-medium' : ''
                }`}
                onClick={() => {
                  setSearch("");
                  onSelect("");
                  if (onClientSelect) {
                    onClientSelect("", "Alle cliënten");
                  }
                  setIsOpen(false);
                  setHighlightedIndex(-1);
                }}
                onMouseEnter={() => setHighlightedIndex(-1)}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-blue-600">Alle cliënten</span>
                </div>
              </div>
              
              {/* Client list */}
              {filteredClients.length === 0 ? (
                <div className="px-3 py-2 text-gray-500">
                  {search ? 'Geen cliënten gevonden' : 'Geen cliënten beschikbaar'}
                </div>
              ) : (
                filteredClients.map((client, index) => (
              <div
                key={client.id}
                className={`px-3 py-2 cursor-pointer transition-colors ${
                  index === highlightedIndex
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50'
                } ${
                  client.id === value ? 'bg-blue-100 text-blue-800 font-medium' : ''
                }`}
                onClick={() => handleClientSelect(client)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{getDisplayName(client)}</span>
                  {client.geboortedatum && (
                    <span className="text-sm text-gray-500">
                      {new Date(client.geboortedatum).toLocaleDateString('nl-NL')}
                    </span>
                  )}
                </div>
                {client.email && (
                  <div className="text-sm text-gray-500 mt-1">
                    {client.email}
                  </div>
                )}
              </div>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default KiesClientDropdown; 