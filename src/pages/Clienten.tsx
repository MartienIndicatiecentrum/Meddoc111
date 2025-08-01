import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Client, ClientStatus, CareLevel } from '../components/clients/types';
import ClientGrid from '../components/clients/ClientGrid';
import ClientFilters from '../components/clients/ClientFilters';
import ClientDetailsModal from '../components/clients/ClientDetailsModal';
import ClientEditModal from '../components/clients/ClientEditModal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Search, Plus, Filter, X, Home as HomeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dialog } from '../components/ui/dialog';

// Filter state types
interface ClientFilterState {
  status: ClientStatus[];
  careLevel: CareLevel[];
  assignedTo: string[];
  client: string[];
  hasActiveTasks: boolean | null;
}

// Helper functie voor address parsing
const parseAddress = (addressString: string) => {
  if (!addressString) {
    return null;
  }

  // Simpele parsing van database adres formaat
  const parts = addressString.split(',').map(part => part.trim());
  const streetPart = parts[0] || '';
  const city = parts[1] || '';

  // Probeer straat en huisnummer te scheiden
  const streetMatch = streetPart.match(/^(.+?)\s+(\d+[a-zA-Z]*)$/);

  return {
    street: streetMatch ? streetMatch[1] : streetPart,
    houseNumber: streetMatch ? streetMatch[2] : '',
    city: city,
  };
};

// Mock coordinators voor filtering (beperkt voor filter functionaliteit)
const mockCoordinators = ['Geen informatie beschikbaar'];

// Helper functie om database client om te zetten naar Client type
const transformDbClientToClient = (dbClient: any): Client => {
  const parsedAddress = parseAddress(dbClient.adres);

  return {
    id: dbClient.id,
    bsn: dbClient.bsn || 'Geen informatie beschikbaar',
    firstName: dbClient.naam?.split(' ')[0] || 'Geen informatie beschikbaar',
    lastName: dbClient.naam?.split(' ').slice(1).join(' ') || '',
    fullName: dbClient.naam || 'Naam niet beschikbaar',
    dateOfBirth: dbClient.geboortedatum
      ? new Date(dbClient.geboortedatum)
      : new Date('1900-01-01'),
    gender: 'prefer_not_to_say' as const,
    profilePhoto: dbClient.profile_photo || undefined,
    contact: {
      phone: dbClient.telefoon || 'Geen informatie beschikbaar',
      mobile: undefined,
      email: dbClient.email || 'Geen informatie beschikbaar',
      emergencyContact: {
        name: 'Geen informatie beschikbaar',
        relationship: 'Geen informatie beschikbaar',
        phone: 'Geen informatie beschikbaar',
      },
      preferredContactMethod: 'phone' as const,
    },
    address: {
      street: parsedAddress?.street || 'Geen informatie beschikbaar',
      houseNumber: parsedAddress?.houseNumber || '',
      houseNumberAddition: undefined,
      postalCode: dbClient.postcode || 'Geen informatie beschikbaar',
      city:
        dbClient.woonplaats ||
        parsedAddress?.city ||
        'Geen informatie beschikbaar',
      municipality:
        dbClient.woonplaats ||
        parsedAddress?.city ||
        'Geen informatie beschikbaar',
      accessInstructions: undefined,
    },
    care: {
      startDate: dbClient.created_at
        ? new Date(dbClient.created_at)
        : new Date(),
      endDate: undefined,
      status: 'active_care' as const,
      careLevel: 'wmo' as const,
      insuranceNumber: dbClient.polisnummer || 'Geen informatie beschikbaar',
      insuranceCompany: dbClient.verzekeraar || 'Geen informatie beschikbaar',
      primaryDiagnosis: [],
      secondaryDiagnoses: undefined,
      allergies: undefined,
      indicationNumber: dbClient.machtigingsnummer || undefined,
    },
    workflow: {
      intakeCompleted: true,
      omahaAssessment: null,
      careplanApproved: false,
      indicationSubmitted: false,
      activeServices: [],
    },
    createdAt: dbClient.created_at ? new Date(dbClient.created_at) : new Date(),
    updatedAt: new Date(),
    createdBy: 'Geen informatie beschikbaar',
    assignedCareCoordinator: 'Geen informatie beschikbaar',
    tags: [],
    notes: 'Geen informatie beschikbaar',
    isActive: true,
  };
};

const Clienten = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deletedClients, setDeletedClients] = useState<Client[]>([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(
    null
  );

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClientForEdit, setSelectedClientForEdit] =
    useState<Client | null>(null);

  // Filter state
  const [filters, setFilters] = useState<ClientFilterState>({
    status: [],
    careLevel: [],
    assignedTo: [],
    client: [],
    hasActiveTasks: null,
  });

  // Modal state
  const [selectedClientForDetails, setSelectedClientForDetails] =
    useState<Client | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Fixed useEffect for handling click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const filterElement = document.querySelector(
        '[data-filter-dropdown]'
      ) as HTMLElement;
      if (filterElement && !filterElement.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  // Ophalen en realtime luisteren
  let subscription: RealtimeChannel | null = null;
  useEffect(() => {
    const fetchClients = async () => {
      console.log(
        '🔍 [Clienten] Fetching clients from clients_mockdata table...'
      );
      setIsLoading(true);
      const { data, error } = await supabase
        .from('clients_mockdata')
        .select('*')
        .order('created_at', { ascending: false });
      console.log('📊 [Clienten] Supabase response:', {
        data: data?.length || 0,
        error,
      });
      if (!error && Array.isArray(data)) {
        const transformedClients = data.map(transformDbClientToClient);
        console.log(
          '✅ [Clienten] Transformed clients:',
          transformedClients.length
        );
        setClients(transformedClients);
      } else {
        console.error('❌ [Clienten] Error or invalid data:', {
          error,
          dataType: typeof data,
        });
      }
      setIsLoading(false);
    };
    fetchClients();

    // Realtime updates
    const sub = supabase
      .channel('public:clients')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        payload => {
          fetchClients();
        }
      )
      .subscribe();

    subscription = sub;
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  // Ophalen verwijderde cliënten
  useEffect(() => {
    const fetchDeletedClients = async () => {
      const { data, error } = await supabase
        .from('clients_mockdata')
        .select('*')
        .or('verwijderd.eq.true,deleted_at.not.is.null');
      if (!error && Array.isArray(data)) {
        setDeletedClients(data.map(transformDbClientToClient));
      }
    };
    fetchDeletedClients();
  }, []);

  // Enhanced filtering with search and filters
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // Search filter
      if (searchTerm) {
        const naam = client.fullName?.toLowerCase() || '';
        const adres = client.address.city?.toLowerCase() || '';
        const bsn = client.bsn || '';
        const searchMatch =
          naam.includes(searchTerm.toLowerCase()) ||
          bsn.includes(searchTerm) ||
          adres.includes(searchTerm.toLowerCase());
        if (!searchMatch) {
          return false;
        }
      }

      // Status filter
      if (
        filters.status.length > 0 &&
        !filters.status.includes(client.care.status)
      ) {
        return false;
      }

      // Care level filter
      if (
        filters.careLevel.length > 0 &&
        !filters.careLevel.includes(client.care.careLevel)
      ) {
        return false;
      }

      // Assigned coordinator filter
      if (
        filters.assignedTo.length > 0 &&
        !filters.assignedTo.includes(client.assignedCareCoordinator)
      ) {
        return false;
      }

      // Client filter
      if (
        filters.client.length > 0 &&
        !filters.client.includes(client.fullName)
      ) {
        return false;
      }

      // Active tasks filter
      if (filters.hasActiveTasks !== null) {
        const hasActiveTasks = client.workflow.activeServices.length > 0;
        if (filters.hasActiveTasks !== hasActiveTasks) {
          return false;
        }
      }

      return true;
    });
  }, [clients, searchTerm, filters]);

  // Get unique client names for filter
  const availableClients = useMemo(() => {
    const uniqueNames = Array.from(
      new Set(clients.map(client => client.fullName))
    );
    return uniqueNames.sort();
  }, [clients]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    return (
      filters.status.length +
      filters.careLevel.length +
      filters.assignedTo.length +
      filters.client.length +
      (filters.hasActiveTasks !== null ? 1 : 0)
    );
  }, [filters]);

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      status: [],
      careLevel: [],
      assignedTo: [],
      client: [],
      hasActiveTasks: null,
    });
  };

  // Event handlers
  const handleEditClient = (client: Client) => {
    setSelectedClientForEdit(client);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedClientForEdit(null);
  };

  const handleSaveClient = async (updatedClient: Client) => {
    try {
      // Update the fullName based on firstName and lastName
      const fullName =
        `${updatedClient.firstName} ${updatedClient.lastName}`.trim();

      // Prepare the data for Supabase update
      const updateData = {
        naam: fullName,
        bsn: updatedClient.bsn,
        geboortedatum: updatedClient.dateOfBirth.toISOString().split('T')[0],
        telefoon: updatedClient.contact.phone,
        email: updatedClient.contact.email,
        adres: `${updatedClient.address.street} ${updatedClient.address.houseNumber}, ${updatedClient.address.city}`,
        postcode: updatedClient.address.postalCode,
        woonplaats: updatedClient.address.city,
        verzekeraar: updatedClient.care.insuranceCompany,
        polisnummer: updatedClient.care.insuranceNumber,
        machtigingsnummer: updatedClient.care.indicationNumber,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('clients_mockdata')
        .update(updateData)
        .eq('id', updatedClient.id);

      if (error) {
        throw error;
      }

      // Update local state
      setClients(prev =>
        prev.map(client =>
          client.id === updatedClient.id
            ? { ...updatedClient, fullName, updatedAt: new Date() }
            : client
        )
      );

      // Also update the details modal if it's showing the same client
      if (selectedClientForDetails?.id === updatedClient.id) {
        setSelectedClientForDetails({
          ...updatedClient,
          fullName,
          updatedAt: new Date(),
        });
      }

      console.log('Client updated successfully:', fullName);
    } catch (error) {
      console.error('Error updating client:', error);
      // You might want to show a toast notification here
    }
  };

  const handleViewDetails = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSelectedClientForDetails(client);
      setIsDetailsModalOpen(true);
    }
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedClientForDetails(null);
  };

  const handleQuickAction = (action: string, clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) {
      return;
    }

    switch (action) {
      case 'call':
        if (client.contact.phone) {
          window.open(`tel:${client.contact.phone}`);
        }
        break;
      case 'email':
        if (client.contact.email) {
          window.open(`mailto:${client.contact.email}`);
        }
        break;
      default:
        console.log(`Quick action: ${action} for client:`, clientId);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('clients_mockdata')
        .delete()
        .eq('id', clientId);

      if (error) {
        throw error;
      }

      // Remove from local state
      setClients(prev => prev.filter(c => c.id !== clientId));
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  // Herstel functie
  const handleRestoreClient = async (clientId: string) => {
    await supabase
      .from('clients_mockdata')
      .update({ verwijderd: false, deleted_at: null })
      .eq('id', clientId);
    setDeletedClients(prev => prev.filter(c => c.id !== clientId));
  };

  // Definitief verwijderen functie
  const handlePermanentDelete = async (clientId: string) => {
    await supabase.from('clients_mockdata').delete().eq('id', clientId);
    setDeletedClients(prev => prev.filter(c => c.id !== clientId));
    setShowConfirmDelete(null);
  };

  return (
    <div className='max-w-7xl mx-auto px-4 py-8'>
      {/* Header */}
      <div className='mb-8'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div className='flex items-center gap-4'>
            <Link
              to='/'
              className='flex items-center px-3 py-1.5 rounded-full border border-gray-300 hover:bg-gray-50 transition shadow-sm'
            >
              <HomeIcon className='w-4 h-4 mr-1.5 text-gray-500' />
              <span className='text-sm text-gray-500 font-medium'>Home</span>
            </Link>
            <div>
              <h1 className='text-2xl md:text-3xl font-bold text-gray-500'>
                Cliënten
              </h1>
              <p className='text-gray-500 mt-1'>
                Beheer en bekijk al uw cliënten ({filteredClients.length}{' '}
                {filteredClients.length === 1 ? 'cliënt' : 'cliënten'})
              </p>
            </div>
          </div>
          <div className='flex gap-2'>
            <div className='relative' data-filter-dropdown>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`${activeFiltersCount > 0 ? 'bg-purple-100 border-purple-300 text-purple-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
              >
                <Filter className='w-4 h-4 mr-2' />
                Filter
                {activeFiltersCount > 0 && (
                  <Badge
                    variant='secondary'
                    className='ml-2 text-xs bg-purple-200 text-purple-700'
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>

              {isFilterOpen && (
                <ClientFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  onClose={() => setIsFilterOpen(false)}
                  coordinators={mockCoordinators}
                  clients={availableClients}
                  activeFiltersCount={activeFiltersCount}
                  onClearAll={clearAllFilters}
                />
              )}
            </div>
            <Button
              size='sm'
              className='bg-purple-100 text-purple-600 border border-purple-500 hover:bg-purple-200'
            >
              <Plus className='w-4 h-4 mr-2' />
              Nieuwe Cliënt
            </Button>
          </div>
        </div>
      </div>

      {/* Search & Controls */}
      <div className='mb-8'>
        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='flex-1 relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <Input
              type='text'
              placeholder='Zoek op naam, BSN of adres...'
              className='pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {selectedClients.length > 0 && (
            <div className='flex items-center gap-2'>
              <span className='text-sm text-gray-500'>
                {selectedClients.length} geselecteerd
              </span>
              <Button
                variant='outline'
                size='sm'
                className='bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
              >
                Acties
              </Button>
            </div>
          )}
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className='flex flex-wrap items-center gap-2 mt-4'>
            <span className='text-sm text-gray-500'>Actieve filters:</span>

            {/* Status filters */}
            {filters.status.map(status => (
              <Badge
                key={status}
                variant='secondary'
                className='flex items-center gap-1 bg-purple-100 text-purple-700 border border-purple-300'
              >
                Status: {status.replace('_', ' ')}
                <X
                  className='w-3 h-3 cursor-pointer hover:text-red-600'
                  onClick={() => {
                    setFilters(prev => ({
                      ...prev,
                      status: prev.status.filter(s => s !== status),
                    }));
                  }}
                />
              </Badge>
            ))}

            {/* Care level filters */}
            {filters.careLevel.map(careLevel => (
              <Badge
                key={careLevel}
                variant='secondary'
                className='flex items-center gap-1 bg-purple-100 text-purple-700 border border-purple-300'
              >
                Zorgniveau: {careLevel.toUpperCase()}
                <X
                  className='w-3 h-3 cursor-pointer hover:text-red-600'
                  onClick={() => {
                    setFilters(prev => ({
                      ...prev,
                      careLevel: prev.careLevel.filter(cl => cl !== careLevel),
                    }));
                  }}
                />
              </Badge>
            ))}

            {/* Coordinator filters */}
            {filters.assignedTo.map(coordinator => (
              <Badge
                key={coordinator}
                variant='secondary'
                className='flex items-center gap-1 bg-purple-100 text-purple-700 border border-purple-300'
              >
                Coördinator: {coordinator}
                <X
                  className='w-3 h-3 cursor-pointer hover:text-red-600'
                  onClick={() => {
                    setFilters(prev => ({
                      ...prev,
                      assignedTo: prev.assignedTo.filter(
                        c => c !== coordinator
                      ),
                    }));
                  }}
                />
              </Badge>
            ))}

            {/* Client filters */}
            {filters.client.map(client => (
              <Badge
                key={client}
                variant='secondary'
                className='flex items-center gap-1 bg-purple-100 text-purple-700 border border-purple-300'
              >
                Opdrachtgever: {client}
                <X
                  className='w-3 h-3 cursor-pointer hover:text-red-600'
                  onClick={() => {
                    setFilters(prev => ({
                      ...prev,
                      client: prev.client.filter(c => c !== client),
                    }));
                  }}
                />
              </Badge>
            ))}

            {/* Active tasks filter */}
            {filters.hasActiveTasks !== null && (
              <Badge
                variant='secondary'
                className='flex items-center gap-1 bg-purple-100 text-purple-700 border border-purple-300'
              >
                {filters.hasActiveTasks
                  ? 'Heeft actieve taken'
                  : 'Geen actieve taken'}
                <X
                  className='w-3 h-3 cursor-pointer hover:text-red-600'
                  onClick={() => {
                    setFilters(prev => ({
                      ...prev,
                      hasActiveTasks: null,
                    }));
                  }}
                />
              </Badge>
            )}

            {/* Clear all button */}
            <Button
              variant='ghost'
              size='sm'
              onClick={clearAllFilters}
              className='text-xs text-gray-500 hover:text-gray-700'
            >
              <X className='w-3 h-3 mr-1' />
              Wis alle filters
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className='flex items-center justify-center py-12'>
          <div className='text-center'>
            <div className='animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4'></div>
            <p className='text-gray-500'>Cliënten laden...</p>
          </div>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className='text-center py-12'>
          <div className='max-w-md mx-auto'>
            <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Search className='w-8 h-8 text-gray-400' />
            </div>
            <h3 className='text-lg font-semibold text-gray-500 mb-2'>
              {searchTerm
                ? 'Geen resultaten gevonden'
                : 'Geen cliënten gevonden'}
            </h3>
            <p className='text-gray-500 mb-4'>
              {searchTerm
                ? `Geen cliënten gevonden voor "${searchTerm}". Probeer een andere zoekopdracht.`
                : 'Er zijn nog geen cliënten toegevoegd aan het systeem.'}
            </p>
            {!searchTerm && (
              <Button className='bg-purple-100 text-purple-600 border border-purple-500 hover:bg-purple-200'>
                <Plus className='w-4 h-4 mr-2' />
                Eerste Cliënt Toevoegen
              </Button>
            )}
          </div>
        </div>
      ) : (
        <ClientGrid
          clients={filteredClients}
          onEdit={handleEditClient}
          onViewDetails={handleViewDetails}
          onQuickAction={handleQuickAction}
          onDelete={handleDeleteClient}
          selectedClients={selectedClients}
          onSelectClient={handleSelectClient}
        />
      )}

      {/* Client Details Modal */}
      <ClientDetailsModal
        client={selectedClientForDetails}
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        onEdit={handleEditClient}
        onQuickAction={handleQuickAction}
      />

      {/* Client Edit Modal */}
      <ClientEditModal
        client={selectedClientForEdit}
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSave={handleSaveClient}
      />

      {/* Overzicht verwijderde cliënten */}
      {deletedClients.length > 0 && (
        <div className='mt-12'>
          <h2 className='text-xl font-bold mb-4 text-gray-500'>
            Verwijderde cliënten
          </h2>
          <div className='bg-white rounded-lg shadow p-6'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-gray-200'>
                  <th className='text-left py-2 text-gray-500'>Naam</th>
                  <th className='text-left py-2 text-gray-500'>Email</th>
                  <th className='text-left py-2 text-gray-500'>Acties</th>
                </tr>
              </thead>
              <tbody>
                {deletedClients.map(client => (
                  <tr
                    key={client.id}
                    className='border-b border-gray-100 last:border-0'
                  >
                    <td className='py-2 text-gray-500'>{client.fullName}</td>
                    <td className='py-2 text-gray-500'>
                      {client.contact.email}
                    </td>
                    <td className='py-2 flex gap-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        className='bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        onClick={() => handleRestoreClient(client.id)}
                      >
                        Herstellen
                      </Button>
                      <Button
                        size='sm'
                        variant='destructive'
                        className='bg-red-100 text-red-600 border border-red-500 hover:bg-red-200'
                        onClick={() => setShowConfirmDelete(client.id)}
                      >
                        Definitief verwijderen
                      </Button>
                      {/* 2-staps bevestiging */}
                      {showConfirmDelete === client.id && (
                        <Dialog
                          open={true}
                          onOpenChange={() => setShowConfirmDelete(null)}
                        >
                          <div className='fixed inset-0 bg-black/30 z-40 flex items-center justify-center'>
                            <div className='bg-white rounded-lg shadow-lg p-6 max-w-sm w-full z-50'>
                              <h3 className='text-lg font-bold mb-2 text-gray-500'>
                                Weet je het zeker?
                              </h3>
                              <p className='mb-4 text-gray-500'>
                                Deze cliënt wordt <b>permanent</b> verwijderd en
                                kan niet meer worden hersteld.
                              </p>
                              <div className='flex gap-2 justify-end'>
                                <Button
                                  variant='outline'
                                  className='bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                  onClick={() => setShowConfirmDelete(null)}
                                >
                                  Annuleren
                                </Button>
                                <Button
                                  variant='destructive'
                                  className='bg-red-100 text-red-600 border border-red-500 hover:bg-red-200'
                                  onClick={() =>
                                    handlePermanentDelete(client.id)
                                  }
                                >
                                  Ja, verwijder definitief
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Dialog>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clienten;
