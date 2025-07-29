import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar, Clock, User, MapPin, FileText, X, Bell, Mail } from 'lucide-react';
import SearchableClientDropdown from './SearchableClientDropdown';
import SearchableCaregiverDropdown from './SearchableCaregiverDropdown';

interface Client {
  id: string;
  naam: string;
  geboortedatum?: string;
  email?: string;
  adres?: string;
  telefoon?: string;
  bsn?: string;
  verzekeraar?: string;
  polisnummer?: string;
  algemene_informatie?: string;
  clientnummer?: string;
  machtigingsnummer?: string;
  postcode?: string;
  woonplaats?: string;
  relatienummer?: string;
  huisarts?: string;
  notities?: string;
}

interface Caregiver {
  id: string;
  naam: string;
  email?: string;
  telefoon?: string;
  specialisatie?: string;
  actief: boolean;
}

interface Appointment {
  id: string;
  client_id: string;
  caregiver_id?: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  location?: string;
  reminder_enabled?: boolean;
  reminder_value?: number;
  reminder_unit?: 'minutes' | 'hours' | 'days';
  reminder_email?: string;
  created_at: string;
  updated_at: string;
}

interface AppointmentFormProps {
  clients: Client[];
  onClose: () => void;
  onSuccess?: () => void;
  editAppointment?: Appointment | null;
}

interface AppointmentFormData {
  client_id: string;
  caregiver_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  location: string;
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  reminder_enabled: boolean;
  reminder_value: number;
  reminder_unit: 'minutes' | 'hours' | 'days';
  reminder_email: string;
  client_phone?: string;
  client_number?: string;
}

// MCP Query helper function
const executeMCPQuery = async (query: string) => {
  try {
    // Dit zou de echte MCP server aanroep zijn
    // Voor nu gebruiken we een fallback naar directe Supabase
    console.log('Executing MCP Query:', query);

    // In een echte MCP implementatie zou dit een fetch naar de MCP server zijn
    // fetch('/api/mcp/query', { method: 'POST', body: JSON.stringify({ query }) })

    return null; // Placeholder - MCP server integratie komt later
  } catch (error) {
    console.error('MCP Query execution failed:', error);
    throw error;
  }
};

const AppointmentForm: React.FC<AppointmentFormProps> = ({ clients, onClose, onSuccess, editAppointment }) => {
  const queryClient = useQueryClient();


  // Fetch caregivers
  const { data: caregivers = [], isLoading: loadingCaregivers } = useQuery<Caregiver[]>({
    queryKey: ['caregivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('caregivers')
        .select('*')
        .eq('actief', true)
        .order('naam');

      if (error) {
        throw new Error(`Fout bij ophalen medewerkers: ${error.message}`);
      }

      return data || [];
    },
    staleTime: 60000,
    retry: 3,
  });

  const [formData, setFormData] = useState<AppointmentFormData>({
    client_id: editAppointment?.client_id || '',
    caregiver_id: editAppointment?.caregiver_id || '',
    date: editAppointment?.date ? new Date(editAppointment.date).toISOString().split('T')[0] : '',
    start_time: editAppointment?.start_time || '',
    end_time: editAppointment?.end_time || '',
    type: editAppointment?.type || 'consultatie',
    location: editAppointment?.location || '',
    notes: editAppointment?.notes || '',
    status: editAppointment?.status || 'scheduled',
    reminder_enabled: editAppointment?.reminder_enabled || false,
    reminder_value: editAppointment?.reminder_value || 1,
    reminder_unit: editAppointment?.reminder_unit || 'hours',
    reminder_email: editAppointment?.reminder_email || '',
    client_phone: '',
    client_number: '',
  });

  // Track if location was auto-populated
  const [isLocationAutoPopulated, setIsLocationAutoPopulated] = useState(false);
  const [isEmailAutoPopulated, setIsEmailAutoPopulated] = useState(false);
  // Voeg state toe voor uitgebreide clientdetails
  const [selectedClientDetails, setSelectedClientDetails] = useState<Client | null>(null);


  // Removed useEffect - auto-population now happens directly in onChange handler

  // Auto-populate reminder email when reminder is toggled on
  useEffect(() => {
    if (formData.reminder_enabled && !formData.reminder_email && formData.client_id) {
      const selectedClient = clients.find(c => c.id === formData.client_id);
      if (selectedClient?.email) {
        setFormData(prev => ({
          ...prev,
          reminder_email: selectedClient.email
        }));
        setIsEmailAutoPopulated(true);
      }
    }
  }, [formData.reminder_enabled]);

  const [errors, setErrors] = useState<Partial<AppointmentFormData>>({});

  const saveAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      // Find the selected client to get their name
      const selectedClient = clients.find(client => client.id === data.client_id);
      const clientName = selectedClient?.naam || 'Onbekende cliënt';

      // Alleen de velden die in appointments-tabel staan
      const appointmentPayload = {
        client_id: data.client_id,
        caregiver_id: data.caregiver_id,
        date: data.date,
        start_time: data.start_time,
        end_time: data.end_time,
        type: data.type,
        location: data.location,
        notes: data.notes,
        status: data.status,
        reminder_enabled: data.reminder_enabled,
        reminder_value: data.reminder_value,
        reminder_unit: data.reminder_unit,
        reminder_email: data.reminder_email,
        name: clientName,
        updated_at: new Date().toISOString(),
      };
      if (!editAppointment) {
        appointmentPayload['created_at'] = new Date().toISOString();
      }

      if (editAppointment) {
        // Update existing appointment
        const { data: result, error } = await supabase
          .from('appointments')
          .update(appointmentPayload)
          .eq('id', editAppointment.id)
          .select()
          .single();

        if (error) {
          throw new Error(`Fout bij bijwerken afspraak: ${error.message}`);
        }

        return result;
      } else {
        // Create new appointment
        const { data: result, error } = await supabase
          .from('appointments')
          .insert([appointmentPayload])
          .select()
          .single();

        if (error) {
          throw new Error(`Fout bij aanmaken afspraak: ${error.message}`);
        }

        return result;
      }
    },
    onSuccess: () => {
      toast.success(editAppointment ? 'Afspraak succesvol bijgewerkt!' : 'Afspraak succesvol aangemaakt!');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onSuccess?.();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.client_id) {
      newErrors.client_id = 'Selecteer een cliënt';
    }

    if (!formData.date) {
      newErrors.date = 'Datum is verplicht';
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Starttijd is verplicht';
    }

    if (!formData.end_time) {
      newErrors.end_time = 'Eindtijd is verplicht';
    }

    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      newErrors.end_time = 'Eindtijd moet na starttijd zijn';
    }

    if (!formData.type) {
      newErrors.type = 'Selecteer een type afspraak';
    }

    // Validate reminder settings if enabled
    if (formData.reminder_enabled) {
      if (formData.reminder_email && !/\S+@\S+\.\S+/.test(formData.reminder_email)) {
        newErrors.reminder_email = 'Ongeldig email adres';
      }

      if (!formData.reminder_value || formData.reminder_value < 1) {
        newErrors.reminder_value = 'Voer een geldige waarde in';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      saveAppointmentMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: keyof AppointmentFormData, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'reminder_enabled' ? value === 'true' || value === true :
               field === 'reminder_value' ? Number(value) : value
    }));

    // Clear auto-populated flags when user manually changes values
    if (field === 'location') {
      setIsLocationAutoPopulated(false);
    } else if (field === 'reminder_email') {
      setIsEmailAutoPopulated(false);
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const appointmentTypes = [
    'consultatie',
    'intake',
    'behandeling',
    'controle',
    'huisbezoek',
    'telefonisch',
    'online',
    'groepssessie'
  ];

  const selectedClient = formData.client_id ? clients.find(c => c.id === formData.client_id) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {editAppointment ? 'Afspraak Bewerken' : 'Nieuwe Afspraak'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Client Selection */}
          <div>
            <SearchableClientDropdown
              clients={clients}
              value={formData.client_id}
              onChange={async (clientId) => {
                handleInputChange('client_id', clientId);
                // Auto-fill functie met MCP Supabase server
                if (clientId) {
                  console.log('Fetching client data via MCP for ID:', clientId);
                  try {
                    // MCP query structuur voor comprehensive client data
                    const mcpQuery = `
                      SELECT
                        id, naam, adres, telefoon, email, verzekeraar, polisnummer, clientnummer
                      FROM clients
                      WHERE id = '${clientId}'
                      LIMIT 1;
                    `;
                    console.log('MCP Query voor client data:', mcpQuery);
                    // Voor nu gebruiken we nog de directe Supabase call als implementatie
                    // maar met MCP-gestructureerde query en logging
                    const { data: client, error } = await supabase
                      .from('clients')
                      .select(`
                        id, naam, geboortedatum, email, adres, telefoon, bsn, verzekeraar, polisnummer, algemene_informatie, clientnummer, machtigingsnummer, postcode, woonplaats, relatienummer, huisarts, notities
                      `)
                      .eq('id', clientId)
                      .single();
                    console.log('MCP Client response:', { client, error });
                    if (error) {
                      console.error('MCP Query error:', error);
                      toast.error('Fout bij ophalen clientgegevens via MCP');
                      return;
                    }
                    if (client) {
                      console.log('Client data via MCP query:', client);
                      // Debug: log alle property-namen en waarden van client
                      Object.entries(client).forEach(([key, value]) => {
                        console.log(`Client property: ${key} =`, value);
                      });
                      // Gebruik alleen client.adres voor het automatisch invullen van locatie
                      const clientAddress = client.adres || null;
                      console.log('Resolved address from MCP:', clientAddress);
                      setSelectedClientDetails(client); // Sla uitgebreide clientdata op
                      setFormData(prev => {
                        console.log('MCP Auto-fill - prev.location:', prev.location);
                        console.log('MCP Auto-fill - resolved address:', clientAddress);
                        console.log('MCP Auto-fill - client email:', client.email);
                        console.log('Should populate location?', !prev.location && clientAddress);
                        const newData = {
                          ...prev,
                          client_id: clientId,
                          location: !prev.location && clientAddress ? clientAddress : prev.location,
                          reminder_email: prev.reminder_enabled && !prev.reminder_email && client.email
                            ? client.email
                            : prev.reminder_email,
                          client_phone: client.telefoon || '',
                          client_number: client.clientnummer || '',
                        };
                        // Update auto-populated flags
                        if (!prev.location && clientAddress) {
                          setIsLocationAutoPopulated(true);
                          console.log('MCP: Location auto-populated with:', clientAddress);
                        } else {
                          setIsLocationAutoPopulated(false);
                          console.log('MCP: Location not populated -', {
                            hasLocation: !!prev.location,
                            hasAddress: !!clientAddress
                          });
                        }
                        if (prev.reminder_enabled && !prev.reminder_email && client.email) {
                          setIsEmailAutoPopulated(true);
                          console.log('MCP: Email auto-populated with:', client.email);
                        } else {
                          setIsEmailAutoPopulated(false);
                        }
                        console.log('MCP: New form data after auto-fill:', newData);
                        return newData;
                      });
                    }
                  } catch (error) {
                    console.error('MCP query execution error:', error);
                    toast.error('Fout bij MCP server communicatie');
                  }
                } else {
                  // Clear auto-populated flags when no client is selected
                  setIsLocationAutoPopulated(false);
                  setIsEmailAutoPopulated(false);
                  setSelectedClientDetails(null); // Reset clientdetails
                }
              }}
              error={errors.client_id}
              placeholder="Zoek en selecteer een cliënt..."
            />
            {/* Info-blok: gebruik selectedClientDetails als die er is, anders fallback naar selectedClient */}
            {(selectedClientDetails || selectedClient) && (
              <div className="bg-gray-50 border rounded-lg p-4 mt-2 mb-4 shadow-sm">
                <div className="font-semibold text-lg mb-1">{(selectedClientDetails || selectedClient)?.naam}</div>
                <div><b>Geboortedatum:</b> {(selectedClientDetails || selectedClient)?.geboortedatum || 'Niet beschikbaar'}</div>
                <div><b>Adres:</b> {(selectedClientDetails || selectedClient)?.adres || 'Niet beschikbaar'}</div>
                <div><b>Postcode:</b> {(selectedClientDetails || selectedClient)?.postcode || 'Niet beschikbaar'}</div>
                <div><b>Woonplaats:</b> {(selectedClientDetails || selectedClient)?.woonplaats || 'Niet beschikbaar'}</div>
                <div><b>Email:</b> {(selectedClientDetails || selectedClient)?.email || 'Niet beschikbaar'}</div>
                <div><b>Telefoon:</b> {(selectedClientDetails || selectedClient)?.telefoon || 'Niet beschikbaar'}</div>
                <div><b>BSN:</b> {(selectedClientDetails || selectedClient)?.bsn || 'Niet beschikbaar'}</div>
                <div><b>Zorgverzekeraar:</b> {(selectedClientDetails || selectedClient)?.verzekeraar || 'Niet beschikbaar'}</div>
                <div><b>Polisnummer:</b> {(selectedClientDetails || selectedClient)?.polisnummer || 'Niet beschikbaar'}</div>
                <div><b>Cliëntnummer:</b> {(selectedClientDetails || selectedClient)?.clientnummer || 'Niet beschikbaar'}</div>
                <div><b>Machtigingsnummer:</b> {(selectedClientDetails || selectedClient)?.machtigingsnummer || 'Niet beschikbaar'}</div>
                <div><b>Relatienummer:</b> {(selectedClientDetails || selectedClient)?.relatienummer || 'Niet beschikbaar'}</div>
                <div><b>Huisarts:</b> {(selectedClientDetails || selectedClient)?.huisarts || 'Niet beschikbaar'}</div>
                <div><b>Notities:</b> {(selectedClientDetails || selectedClient)?.notities || 'Niet beschikbaar'}</div>
              </div>
            )}
          </div>

          {/* Caregiver Selection */}
          <div>
            {loadingCaregivers ? (
              <div className="animate-pulse">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  Medewerker
                </label>
                <div className="h-10 bg-gray-200 rounded-lg"></div>
              </div>
            ) : (
              <SearchableCaregiverDropdown
                caregivers={caregivers}
                value={formData.caregiver_id}
                onChange={(caregiverId) => handleInputChange('caregiver_id', caregiverId)}
                error={errors.caregiver_id}
                placeholder="Zoek en selecteer een medewerker..."
                onCaregiverAdded={() => {
                  // Refresh caregivers list when a new one is added
                  queryClient.invalidateQueries({ queryKey: ['caregivers'] });
                }}
              />
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                Datum *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date}</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4" />
                Starttijd *
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => handleInputChange('start_time', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.start_time ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.start_time && (
                <p className="text-red-500 text-sm mt-1">{errors.start_time}</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4" />
                Eindtijd *
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => handleInputChange('end_time', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.end_time ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.end_time && (
                <p className="text-red-500 text-sm mt-1">{errors.end_time}</p>
              )}
            </div>
          </div>

          {/* Appointment Type */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4" />
              Type Afspraak *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.type ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {appointmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="text-red-500 text-sm mt-1">{errors.type}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4" />
              Locatie
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Bijv. Praktijk, Thuis, Online"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {formData.client_id && (
              <>
                {isLocationAutoPopulated && formData.location && formData.location !== '' && (
                  <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                    ✓ Automatisch ingevuld vanuit cliënt adres
                  </p>
                )}
                {!isLocationAutoPopulated && !formData.location && (
                  <div className="text-amber-600 text-xs mt-1">
                    <p className="flex items-center gap-1 mb-1">
                      ⚠ Cliënt heeft geen adres in het systeem
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        if (formData.client_id) {
                          const { error } = await supabase
                            .from('clients')
                            .update({ adres: 'Teststraat 123, 1234 AB Teststad' })
                            .eq('id', formData.client_id);
                          if (!error) {
                            toast.success('Test adres toegevoegd aan cliënt');
                            window.location.reload();
                          } else {
                            toast.error('Fout bij toevoegen adres');
                          }
                        }
                      }}
                      className="text-xs bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded text-amber-800"
                    >
                      + Voeg test adres toe
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          {/* Client Phone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <span role="img" aria-label="Telefoon">📞</span>
              Telefoonnummer cliënt
            </label>
            <input
              type="text"
              value={formData.client_phone || ''}
              onChange={(e) => handleInputChange('client_phone', e.target.value)}
              placeholder="Telefoonnummer van de cliënt"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {/* Client Number */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <span role="img" aria-label="Cliëntnummer">#</span>
              Cliëntnummer
            </label>
            <input
              type="text"
              value={formData.client_number || ''}
              onChange={(e) => handleInputChange('client_number', e.target.value)}
              placeholder="Uniek cliëntnummer"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4" />
              Opmerkingen
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Eventuele opmerkingen of bijzonderheden..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value as AppointmentFormData["status"])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="scheduled">Gepland</option>
              <option value="completed">Voltooid</option>
              <option value="cancelled">Geannuleerd</option>
              <option value="no_show">Niet verschenen</option>
            </select>
          </div>

          {/* Email Reminder Settings */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">Email Herinnering</h3>
            </div>

            {/* Enable Reminder Checkbox */}
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="reminder_enabled"
                checked={formData.reminder_enabled}
                onChange={(e) => handleInputChange('reminder_enabled', e.target.checked.toString())}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="reminder_enabled" className="ml-2 text-sm font-medium text-gray-700">
                Email herinnering versturen
              </label>
            </div>

            {/* Reminder Settings - Only show if enabled */}
            {formData.reminder_enabled && (
              <div className="space-y-4">
                {/* Timing Settings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verstuur herinnering
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={formData.reminder_value}
                      onChange={(e) => handleInputChange('reminder_value', e.target.value)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <select
                      value={formData.reminder_unit}
                      onChange={(e) => handleInputChange('reminder_unit', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="minutes">minuten voor de afspraak</option>
                      <option value="hours">uren voor de afspraak</option>
                      <option value="days">dagen voor de afspraak</option>
                    </select>
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4" />
                    Email adres voor herinnering
                  </label>
                  <input
                    type="email"
                    value={formData.reminder_email}
                    onChange={(e) => handleInputChange('reminder_email', e.target.value)}
                    placeholder="Voer email adres in voor herinnering"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.reminder_email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.reminder_email && (
                    <p className="text-red-500 text-sm mt-1">{errors.reminder_email}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    {isEmailAutoPopulated && formData.reminder_email
                      ? '✓ Email automatisch ingevuld vanuit cliënt gegevens'
                      : formData.client_id && !clients.find(c => c.id === formData.client_id)?.email
                        ? '⚠ Cliënt heeft geen email adres in het systeem'
                        : 'Als geen email wordt opgegeven, wordt de email van de cliënt gebruikt'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={saveAppointmentMutation.isPending}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {saveAppointmentMutation.isPending ? 'Bezig...' : (editAppointment ? 'Afspraak Bijwerken' : 'Afspraak Aanmaken')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm;
