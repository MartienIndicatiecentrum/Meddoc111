import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { toast } from 'sonner';
import { 
  UserCheck, 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Target,
  Calendar,
  Users,
  Search,
  Filter
} from 'lucide-react';

// Type definitions
interface Caregiver {
  id: string;
  naam: string;
  email?: string;
  telefoon?: string;
  specialisatie?: string;
  anders?: string;
  actief: boolean;
  created_at: string;
  updated_at: string;
}

// Mock data for initial setup
const mockCaregivers: Omit<Caregiver, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    naam: 'Dr. Sarah van der Berg',
    email: 'sarah.vandenberg@meddoc.nl',
    telefoon: '+31 6 12345678',
    specialisatie: 'Huisarts',
    actief: true
  },
  {
    naam: 'Verpleegkundige Lisa Jansen',
    email: 'lisa.jansen@meddoc.nl',
    telefoon: '+31 6 87654321',
    specialisatie: 'Verpleegkunde',
    actief: true
  },
  {
    naam: 'Fysiotherapeut Mark de Wit',
    email: 'mark.dewit@meddoc.nl',
    telefoon: '+31 6 11223344',
    specialisatie: 'Fysiotherapie',
    actief: true
  },
  {
    naam: 'Psycholoog Emma Bakker',
    email: 'emma.bakker@meddoc.nl',
    telefoon: '+31 6 55667788',
    specialisatie: 'Psychologie',
    actief: true
  },
  {
    naam: 'Diëtist Tom Visser',
    email: 'tom.visser@meddoc.nl',
    telefoon: '+31 6 99887766',
    specialisatie: 'Diëtetiek',
    actief: true
  }
];

// API functions
const fetchCaregivers = async (): Promise<Caregiver[]> => {
  try {
    const { data, error } = await supabase
      .from('caregivers')
      .select('*')
      .order('naam');

    if (error) {
      throw new Error(`Failed to fetch caregivers: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching caregivers:', error);
    throw error;
  }
};

const insertMockData = async () => {
  try {
    const { data, error } = await supabase
      .from('caregivers')
      .insert(mockCaregivers.map(caregiver => ({
        ...caregiver,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));

    if (error) {
      throw new Error(`Failed to insert mock data: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error inserting mock data:', error);
    throw error;
  }
};

// Main Medewerkers Component
const Medewerkers: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editCaregiver, setEditCaregiver] = useState<Caregiver | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const queryClient = useQueryClient();

  // Fetch caregivers
  const {
    data: caregivers = [],
    isLoading: loadingCaregivers,
    error: caregiversError
  } = useQuery<Caregiver[]>({
    queryKey: ['caregivers'],
    queryFn: fetchCaregivers,
    staleTime: 30000,
    retry: 3,
  });

  // Insert mock data mutation
  const insertMockDataMutation = useMutation({
    mutationFn: insertMockData,
    onSuccess: () => {
      toast.success('Mock data succesvol toegevoegd!');
      queryClient.invalidateQueries({ queryKey: ['caregivers'] });
    },
    onError: (error: Error) => {
      toast.error(`Fout bij toevoegen mock data: ${error.message}`);
    }
  });

  // Delete caregiver mutation
  const deleteCaregiverMutation = useMutation({
    mutationFn: async (caregiverId: string) => {
      const { error } = await supabase
        .from('caregivers')
        .delete()
        .eq('id', caregiverId);

      if (error) {
        throw new Error(`Fout bij verwijderen medewerker: ${error.message}`);
      }
    },
    onSuccess: () => {
      toast.success('Medewerker succesvol verwijderd!');
      queryClient.invalidateQueries({ queryKey: ['caregivers'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, actief }: { id: string; actief: boolean }) => {
      const { error } = await supabase
        .from('caregivers')
        .update({ 
          actief: !actief,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw new Error(`Fout bij wijzigen status: ${error.message}`);
      }
    },
    onSuccess: () => {
      toast.success('Status succesvol gewijzigd!');
      queryClient.invalidateQueries({ queryKey: ['caregivers'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Filter caregivers based on search and active status
  const filteredCaregivers = caregivers.filter(caregiver => {
    const matchesSearch = caregiver.naam.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caregiver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caregiver.specialisatie?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && caregiver.actief) ||
                         (filterActive === 'inactive' && !caregiver.actief);

    return matchesSearch && matchesFilter;
  });

  // Handle add caregiver
  const handleAddCaregiver = () => {
    setEditCaregiver(null);
    setShowForm(true);
  };

  // Handle edit caregiver
  const handleEditCaregiver = (caregiver: Caregiver) => {
    setEditCaregiver(caregiver);
    setShowForm(true);
  };

  // Handle delete caregiver
  const handleDeleteCaregiver = (caregiverId: string) => {
    if (confirm('Weet je zeker dat je deze medewerker wilt verwijderen?')) {
      deleteCaregiverMutation.mutate(caregiverId);
    }
  };

  // Handle toggle active status
  const handleToggleActive = (caregiver: Caregiver) => {
    toggleActiveMutation.mutate({ id: caregiver.id, actief: caregiver.actief });
  };

  // Add mock data if no caregivers exist
  useEffect(() => {
    if (caregivers.length === 0 && !loadingCaregivers && !caregiversError) {
      // Auto-insert mock data when no caregivers exist
      insertMockDataMutation.mutate();
    }
  }, [caregivers.length, loadingCaregivers, caregiversError]);

  // Error state
  if (caregiversError) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Er is een fout opgetreden
            </h2>
            <p className="text-red-600 mb-4">
              {caregiversError?.message || 'Onbekende fout bij laden medewerkers'}
            </p>
            <button
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              onClick={() => window.location.reload()}
            >
              Pagina vernieuwen
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Loading state
  if (loadingCaregivers) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Medewerkers laden...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Medewerkers</h1>
            <p className="text-gray-600">
              Beheer uw medewerkers en hun informatie
            </p>
          </div>
          <div className="flex gap-3">
            {caregivers.length === 0 && (
              <button
                onClick={() => insertMockDataMutation.mutate()}
                disabled={insertMockDataMutation.isPending}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                {insertMockDataMutation.isPending ? 'Bezig...' : 'Mock Data Toevoegen'}
              </button>
            )}
            <button
              onClick={handleAddCaregiver}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nieuwe Medewerker
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totaal Medewerkers</p>
                <p className="text-2xl font-bold text-gray-900">{caregivers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Actieve Medewerkers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {caregivers.filter(c => c.actief).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Specialisaties</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(caregivers.map(c => c.specialisatie).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Zoek medewerkers op naam, email of specialisatie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle medewerkers</option>
                <option value="active">Alleen actieve</option>
                <option value="inactive">Alleen inactieve</option>
              </select>
            </div>
          </div>
        </div>

        {/* Caregivers List */}
        {filteredCaregivers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterActive !== 'all' ? 'Geen medewerkers gevonden' : 'Nog geen medewerkers'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterActive !== 'all' 
                ? 'Probeer een andere zoekopdracht of filter'
                : 'Voeg uw eerste medewerker toe om te beginnen'
              }
            </p>
            {!searchTerm && filterActive === 'all' && (
              <button
                onClick={handleAddCaregiver}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Eerste medewerker toevoegen
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCaregivers.map((caregiver) => (
              <div
                key={caregiver.id}
                className={`bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow ${
                  !caregiver.actief ? 'opacity-60' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${caregiver.actief ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <UserCheck className={`w-5 h-5 ${caregiver.actief ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{caregiver.naam}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        caregiver.actief 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {caregiver.actief ? 'Actief' : 'Inactief'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditCaregiver(caregiver)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      title="Bewerk medewerker"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCaregiver(caregiver.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                      title="Verwijder medewerker"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  {caregiver.specialisatie && (
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <span>{caregiver.specialisatie}</span>
                    </div>
                  )}
                  
                  {caregiver.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{caregiver.email}</span>
                    </div>
                  )}
                  
                  {caregiver.telefoon && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{caregiver.telefoon}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Toegevoegd: {new Date(caregiver.created_at).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleToggleActive(caregiver)}
                    disabled={toggleActiveMutation.isPending}
                    className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      caregiver.actief
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    } disabled:opacity-50`}
                  >
                    {caregiver.actief ? 'Deactiveren' : 'Activeren'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Caregiver Form */}
        {showForm && (
          <CaregiverForm
            caregiver={editCaregiver}
            onClose={() => {
              setShowForm(false);
              setEditCaregiver(null);
            }}
            onSuccess={() => {
              setShowForm(false);
              setEditCaregiver(null);
              queryClient.invalidateQueries({ queryKey: ['caregivers'] });
            }}
          />
        )}
      </div>
    </AppLayout>
  );
};

// Caregiver Form Component
interface CaregiverFormProps {
  caregiver?: Caregiver | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CaregiverForm: React.FC<CaregiverFormProps> = ({ caregiver, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    naam: caregiver?.naam || '',
    email: caregiver?.email || '',
    telefoon: caregiver?.telefoon || '',
    specialisatie: caregiver?.specialisatie || '',
    anders: caregiver?.anders || '',
    actief: caregiver?.actief ?? true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const saveCaregiverMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (caregiver) {
        // Update existing caregiver
        const { error } = await supabase
          .from('caregivers')
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq('id', caregiver.id);

        if (error) {
          throw new Error(`Fout bij bijwerken medewerker: ${error.message}`);
        }
      } else {
        // Create new caregiver
        const { error } = await supabase
          .from('caregivers')
          .insert([{
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (error) {
          throw new Error(`Fout bij aanmaken medewerker: ${error.message}`);
        }
      }
    },
    onSuccess: () => {
      toast.success(caregiver ? 'Medewerker succesvol bijgewerkt!' : 'Medewerker succesvol aangemaakt!');
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.naam.trim()) {
      newErrors.naam = 'Naam is verplicht';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ongeldig email adres';
    }

    // Validate "anders" field if "Anders" is selected
    if (formData.specialisatie === 'Anders' && !formData.anders.trim()) {
      newErrors.anders = 'Andere specialisatie is verplicht';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      saveCaregiverMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {caregiver ? 'Medewerker Bewerken' : 'Nieuwe Medewerker'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Naam *
            </label>
            <input
              type="text"
              value={formData.naam}
              onChange={(e) => handleInputChange('naam', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.naam ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Voer de naam in"
            />
            {errors.naam && <p className="text-red-500 text-sm mt-1">{errors.naam}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="naam@voorbeeld.nl"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefoon
            </label>
            <input
              type="tel"
              value={formData.telefoon}
              onChange={(e) => handleInputChange('telefoon', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+31 6 12345678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specialisatie
            </label>
            <select
              value={formData.specialisatie}
              onChange={(e) => {
                handleInputChange('specialisatie', e.target.value);
                // Clear anders field if not selecting "Anders"
                if (e.target.value !== 'Anders') {
                  handleInputChange('anders', '');
                }
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
          {formData.specialisatie === 'Anders' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Andere specialisatie *
              </label>
              <input
                type="text"
                value={formData.anders}
                onChange={(e) => handleInputChange('anders', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.anders ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Voer de specialisatie in"
              />
              {errors.anders && <p className="text-red-500 text-sm mt-1">{errors.anders}</p>}
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="actief"
              checked={formData.actief}
              onChange={(e) => handleInputChange('actief', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="actief" className="ml-2 block text-sm text-gray-900">
              Actieve medewerker
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={saveCaregiverMutation.isPending}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saveCaregiverMutation.isPending ? 'Bezig...' : (caregiver ? 'Bijwerken' : 'Aanmaken')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Medewerkers;
