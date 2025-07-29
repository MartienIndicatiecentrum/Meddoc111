import React, { useState, useRef, useEffect } from 'react';
import { User, Search, ChevronDown, X } from 'lucide-react';

interface Client {
  id: string;
  naam: string;
  telefoon?: string;
  adres?: string;
  email?: string;
}

interface SearchableClientDropdownProps {
  clients: Client[];
  value: string;
  onChange: (clientId: string) => void;
  error?: string;
  placeholder?: string;
}

const SearchableClientDropdown: React.FC<SearchableClientDropdownProps> = ({
  clients,
  value,
  onChange,
  error,
  placeholder = "Zoek en selecteer een cliënt..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get selected client info
  const selectedClient = clients.find(client => client.id === value);

  // Filter clients based on search term
  const filteredClients = clients.filter(client =>
    client.naam.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setIsOpen(true);
    setHighlightedIndex(-1);

    // If search term is empty, clear selection
    if (newSearchTerm === '') {
      onChange('');
    }
  };

  // Handle client selection
  const handleClientSelect = (client: Client) => {
    onChange(client.id);
    setSearchTerm(client.naam);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredClients.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredClients.length - 1
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredClients[highlightedIndex]) {
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

  // Handle clear selection
  const handleClear = () => {
    onChange('');
    setSearchTerm('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
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

  // Update search term when value changes externally
  useEffect(() => {
    if (selectedClient) {
      setSearchTerm(selectedClient.naam);
    } else {
      setSearchTerm('');
    }
  }, [selectedClient]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.querySelector(
        `[data-index="${highlightedIndex}"]`
      ) as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
        <User className="w-4 h-4" />
        Cliënt *
      </label>

      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />

          {/* Search icon */}
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

          {/* Clear button */}
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Dropdown arrow */}
          <ChevronDown
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredClients.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-center">
                {searchTerm ? 'Geen cliënten gevonden' : 'Geen cliënten beschikbaar'}
              </div>
            ) : (
              <>
                {searchTerm && filteredClients.length > 0 && (
                  <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                    {filteredClients.length} resultaten gevonden
                  </div>
                )}

                {filteredClients.map((client, index) => (
                  <div
                    key={client.id}
                    data-index={index}
                    onClick={() => handleClientSelect(client)}
                    className={`px-4 py-3 cursor-pointer transition-colors ${
                      index === highlightedIndex
                        ? 'bg-blue-50 text-blue-900'
                        : 'hover:bg-gray-50'
                    } ${
                      client.id === value ? 'bg-blue-100 text-blue-900 font-medium' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {/* Highlight matching text */}
                          {searchTerm ? (
                            <>
                              {client.naam.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) => (
                                <span
                                  key={i}
                                  className={
                                    part.toLowerCase() === searchTerm.toLowerCase()
                                      ? 'bg-yellow-200 font-semibold'
                                      : ''
                                  }
                                >
                                  {part}
                                </span>
                              ))}
                            </>
                          ) : (
                            client.naam
                          )}
                        </div>

                        {/* Show additional client info if available */}
                        {(client.telefoon || client.email) && (
                          <div className="text-sm text-gray-500 mt-1">
                            {client.telefoon && (
                              <span className="mr-3">📞 {client.telefoon}</span>
                            )}
                            {client.email && (
                              <span>✉️ {client.email}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {client.id === value && (
                        <div className="text-blue-600">
                          ✓
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}

      {/* Helper text */}
      {!error && (
        <p className="text-gray-500 text-xs mt-1">
          Type om te zoeken of gebruik pijltjestoetsen om te navigeren
        </p>
      )}
    </div>
  );
};

export default SearchableClientDropdown;
