import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserCheck, Search, ChevronDown, X, Plus } from 'lucide-react';

interface Caregiver {
  id: string;
  naam: string;
  email?: string;
  telefoon?: string;
  specialisatie?: string;
  anders?: string;
  actief: boolean;
}

interface SearchableCaregiverDropdownProps {
  caregivers: Caregiver[];
  value: string;
  onChange: (caregiverId: string) => void;
  error?: string;
  placeholder?: string;
  onCaregiverAdded?: () => void;
}

const SearchableCaregiverDropdown: React.FC<SearchableCaregiverDropdownProps> = ({
  caregivers,
  value,
  onChange,
  error,
  placeholder = "Zoek en selecteer een medewerker...",
  onCaregiverAdded
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCaregiverData, setNewCaregiverData] = useState({
    naam: '',
    email: '',
    telefoon: '',
    specialisatie: '',
    anders: '',
    actief: true
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Get selected caregiver info
  const selectedCaregiver = caregivers.find(caregiver => caregiver.id === value);

  // Filter active caregivers based on search term
  const filteredCaregivers = caregivers
    .filter(caregiver => caregiver.actief)
    .filter(caregiver =>
      caregiver.naam.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Add caregiver mutation
  const addCaregiverMutation = useMutation({
    mutationFn: async (newCaregiverData: any) => {
      const { data, error } = await supabase
        .from('caregivers')
        .insert([{
          naam: newCaregiverData.naam.trim(),
          email: newCaregiverData.email,
          telefoon: newCaregiverData.telefoon,
          specialisatie: newCaregiverData.specialisatie,
          anders: newCaregiverData.anders,
          actief: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Fout bij toevoegen medewerker: ${error.message}`);
      }

      return data;
    },
    onSuccess: (newCaregiver) => {
      toast.success('Medewerker succesvol toegevoegd!');
      queryClient.invalidateQueries({ queryKey: ['caregivers'] });
      onChange(newCaregiver.id);
      setSearchTerm(newCaregiver.naam);
      setNewCaregiverData({
        naam: '',
        email: '',
        telefoon: '',
        specialisatie: '',
        anders: '',
        actief: true
      });
      setShowAddForm(false);
      setIsOpen(false);
      onCaregiverAdded?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setIsOpen(true);
    setHighlightedIndex(-1);
    setShowAddForm(false);

    // If search term is empty, clear selection
    if (newSearchTerm === '') {
      onChange('');
    }
  };

  // Handle caregiver selection
  const handleCaregiverSelect = (caregiver: Caregiver) => {
    onChange(caregiver.id);
    setSearchTerm(caregiver.naam);
    setIsOpen(false);
    setHighlightedIndex(-1);
    setShowAddForm(false);
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

    const totalItems = filteredCaregivers.length + (searchTerm && filteredCaregivers.length === 0 ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < totalItems - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : totalItems - 1
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          if (highlightedIndex < filteredCaregivers.length) {
            handleCaregiverSelect(filteredCaregivers[highlightedIndex]);
          } else {
            // Add new caregiver option selected
            setShowAddForm(true);
            setNewCaregiverData({
              naam: searchTerm,
              email: '',
              telefoon: '',
              specialisatie: '',
              anders: '',
              actief: true
            });
          }
        }
        break;

      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        setShowAddForm(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle clear selection
  const handleClear = () => {
    onChange('');
    setSearchTerm('');
    setIsOpen(false);
    setShowAddForm(false);
    inputRef.current?.focus();
  };

  // Handle add new caregiver
  const handleCreateCaregiver = async () => {
    if (!newCaregiverData.naam.trim()) {
      toast.error('Naam is verplicht');
      return;
    }

    if (newCaregiverData.email && !/\S+@\S+\.\S+/.test(newCaregiverData.email)) {
      toast.error('Ongeldig email adres');
      return;
    }

    if (newCaregiverData.specialisatie === 'Anders' && !newCaregiverData.anders.trim()) {
      toast.error('Andere specialisatie is verplicht');
      return;
    }

    addCaregiverMutation.mutate(newCaregiverData);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
        setShowAddForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update search term when value changes externally
  useEffect(() => {
    if (selectedCaregiver) {
      setSearchTerm(selectedCaregiver.naam);
    } else {
      setSearchTerm('');
    }
  }, [selectedCaregiver]);

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
        <UserCheck className="w-4 h-4" />
        Medewerker
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
            {filteredCaregivers.length === 0 && !searchTerm ? (
              <div className="px-4 py-3 text-gray-500 text-center">
                Geen medewerkers beschikbaar
              </div>
            ) : filteredCaregivers.length === 0 && searchTerm ? (
              <div>
                <div className="px-4 py-3 text-gray-500 text-center">
                  Geen medewerkers gevonden voor "{searchTerm}"
                </div>
                <div
                  data-index="0"
                  onClick={() => {
                    setShowAddForm(true);
                    setNewCaregiverData({
                      naam: searchTerm,
                      email: '',
                      telefoon: '',
                      specialisatie: '',
                      anders: '',
                      actief: true
                    });
                  }}
                  className={`px-4 py-3 cursor-pointer transition-colors border-t ${
                    highlightedIndex === 0 ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-medium">
                      Nieuwe medewerker toevoegen: "{searchTerm}"
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {searchTerm && filteredCaregivers.length > 0 && (
                  <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                    {filteredCaregivers.length} resultaten gevonden
                  </div>
                )}

                {filteredCaregivers.map((caregiver, index) => (
                  <div
                    key={caregiver.id}
                    data-index={index}
                    onClick={() => handleCaregiverSelect(caregiver)}
                    className={`px-4 py-3 cursor-pointer transition-colors ${
                      index === highlightedIndex
                        ? 'bg-blue-50 text-blue-900'
                        : 'hover:bg-gray-50'
                    } ${
                      caregiver.id === value ? 'bg-blue-100 text-blue-900 font-medium' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {/* Highlight matching text */}
                          {searchTerm ? (
                            <>
                              {caregiver.naam.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) => (
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
                            caregiver.naam
                          )}
                        </div>

                        {/* Show additional caregiver info if available */}
                        {(caregiver.specialisatie || caregiver.email || caregiver.anders) && (
                          <div className="text-sm text-gray-500 mt-1">
                            {caregiver.specialisatie && (
                              <span className="mr-3">🎯 {caregiver.specialisatie}</span>
                            )}
                            {caregiver.email && (
                              <span>✉️ {caregiver.email}</span>
                            )}
                            {caregiver.anders && (
                              <span>📝 {caregiver.anders}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {caregiver.id === value && (
                        <div className="text-blue-600">
                          ✓
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add new caregiver option */}
                {searchTerm && (
                  <div
                    data-index={filteredCaregivers.length}
                    onClick={() => {
                      setShowAddForm(true);
                      setNewCaregiverData({
                        naam: searchTerm,
                        email: '',
                        telefoon: '',
                        specialisatie: '',
                        anders: '',
                        actief: true
                      });
                    }}
                    className={`px-4 py-3 cursor-pointer transition-colors border-t ${
                      highlightedIndex === filteredCaregivers.length
                        ? 'bg-blue-50 text-blue-900'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 font-medium">
                        Nieuwe medewerker toevoegen: "{searchTerm}"
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Add Caregiver Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Nieuwe Medewerker Toevoegen
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Naam *
              </label>
              <input
                type="text"
                value={newCaregiverData.naam}
                onChange={(e) => setNewCaregiverData(prev => ({ ...prev, naam: e.target.value }))}
                placeholder="Voer de naam van de medewerker in"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={newCaregiverData.email}
                onChange={(e) => setNewCaregiverData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Voer het email adres van de medewerker in"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefoon
              </label>
              <input
                type="tel"
                value={newCaregiverData.telefoon}
                onChange={(e) => setNewCaregiverData(prev => ({ ...prev, telefoon: e.target.value }))}
                placeholder="Voer het telefoonnummer van de medewerker in"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specialisatie
              </label>
              <select
                value={newCaregiverData.specialisatie}
                onChange={(e) => {
                  setNewCaregiverData(prev => ({
                    ...prev,
                    specialisatie: e.target.value,
                    // Clear anders field if not selecting "Anders"
                    anders: e.target.value !== 'Anders' ? '' : prev.anders
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecteer een specialisatie</option>
                <option value="Verzorgende">Verzorgende</option>
                <option value="Verzorgende IG">Verzorgende IG</option>
                <option value="Verpleegkundige">Verpleegkundige</option>
                <option value="Gesp. verpleegkundige">Gesp. verpleegkundige</option>
                <option value="Technisch thuiszorg verpleegkundige">Technisch thuiszorg verpleegkundige</option>
                <option value="Wijkverpleegkundige">Wijkverpleegkundige</option>
                <option value="Wijkverpleegkundige indicatiesteller">Wijkverpleegkundige indicatiesteller</option>
                <option value="Huisarts">Huisarts</option>
                <option value="Anders">Anders</option>
              </select>
            </div>

            {/* Anders text field - only show if "Anders" is selected */}
            {newCaregiverData.specialisatie === 'Anders' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Andere specialisatie *
                </label>
                <input
                  type="text"
                  value={newCaregiverData.anders}
                  onChange={(e) => setNewCaregiverData(prev => ({ ...prev, anders: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Voer de specialisatie in"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewCaregiverData({
                    naam: '',
                    email: '',
                    telefoon: '',
                    specialisatie: '',
                    anders: '',
                    actief: true
                  });
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={addCaregiverMutation.isPending}
              >
                Annuleren
              </button>
              <button
                onClick={handleCreateCaregiver}
                disabled={!newCaregiverData.naam.trim() || addCaregiverMutation.isPending}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addCaregiverMutation.isPending ? 'Bezig...' : 'Toevoegen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}

      {/* Helper text */}
      {!error && (
        <p className="text-gray-500 text-xs mt-1">
          Type om te zoeken of voeg een nieuwe medewerker toe
        </p>
      )}
    </div>
  );
};

export default SearchableCaregiverDropdown;
