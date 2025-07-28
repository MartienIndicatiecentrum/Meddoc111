import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { toast } from 'sonner';
import { Calendar, Clock, User, MapPin, Phone, AlertCircle, CheckCircle, Plus, Edit, Eye, Trash2 } from 'lucide-react';

// Type definitions for appointments
interface Appointment {
  id: string;
  client_id: string;
  caregiver_id?: string;
  date: string;
  start_time: string;
  end_time: string;
  duration?: number;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

interface Client {
  id: string;
  naam: string;
  telefoon?: string;
  adres?: string;
  gebruikersnaam_email?: string;
}

interface Caregiver {
  id: string;
  name: string;
  specialization?: string;
  phone?: string;
  email?: string;
  status: 'available' | 'busy' | 'offline';
}

interface AppointmentFormData {
  client_id: string;
  caregiver_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes: string;
  location: string;
}

// Mock caregiver data (you can replace this with real Supabase data later)
const mockCaregivers: Caregiver[] = [
  {
    id: '1',
    name: 'Anna de Vries',
    specialization: 'Wijkverpleging',
    phone: '06-11111111',
    email: 'a.devries@thuiszorg.nl',
    status: 'available'
  },
  {
    id: '2', 
    name: 'Tom van Dijk',
    specialization: 'WMO begeleiding',
    phone: '06-22222222',
    email: 't.vandijk@thuiszorg.nl',
    status: 'busy'
  },
  {
    id: '3',
    name: 'Lisa Verhoog',
    specialization: 'Jeugdzorg',
    phone: '06-33333333',
    email: 'l.verhoog@thuiszorg.nl',
    status: 'available'
  }
];

// API functions
const fetchAppointments = async (): Promise<Appointment[]> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch appointments: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }
};

const fetchClients = async (): Promise<Client[]> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('id, naam, telefoon, adres, gebruikersnaam_email')
      .order('naam');

    if (error) {
      throw new Error(`Failed to fetch clients: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

const createAppointment = async (appointmentData: AppointmentFormData): Promise<Appointment> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert([appointmentData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create appointment: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
};

const updateAppointment = async (id: string, updates: Partial<AppointmentFormData>): Promise<Appointment> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update appointment: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
};

const deleteAppointment = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete appointment: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting appointment:', error);
    throw error;
  }
};

// Appointment Form Component
interface AppointmentFormProps {
  appointment?: Appointment;
  clients: Client[];
  caregivers: Caregiver[];
  onSubmit: (data: AppointmentFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  appointment,
  clients,
  caregivers,
  onSubmit,
  onCancel,
  isLoading
}) => {
  const [formData, setFormData] = useState<AppointmentFormData>({
    client_id: appointment?.client_id || '',
    caregiver_id: appointment?.caregiver_id || '',
    date: appointment?.date || new Date().toISOString().split('T')[0],
    start_time: appointment?.start_time || '09:00',
    end_time: appointment?.end_time || '10:00',
    type: appointment?.type || 'consultatie',
    status: appointment?.status || 'scheduled',
    notes: appointment?.notes || '',
    location: appointment?.location || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {appointment ? 'Afspraak bewerken' : 'Nieuwe afspraak'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliënt *
              </label>
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecteer cliënt</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.naam}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zorgverlener *
              </label>
              <select
                name="caregiver_id"
                value={formData.caregiver_id}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecteer zorgverlener</option>
                {caregivers.map(caregiver => (
                  <option key={caregiver.id} value={caregiver.id}>
                    {caregiver.name} - {caregiver.specialization}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Datum *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Starttijd *
              </label>
              <input
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Eindtijd *
              </label>
              <input
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type afspraak *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="consultatie">Consultatie</option>
                <option value="medicatie_controle">Medicatie controle</option>
                <option value="persoonlijke_verzorging">Persoonlijke verzorging</option>
                <option value="begeleiding">Begeleiding</option>
                <option value="huishoudelijke_hulp">Huishoudelijke hulp</option>
                <option value="controle">Controle</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="scheduled">Gepland</option>
                <option value="completed">Voltooid</option>
                <option value="cancelled">Geannuleerd</option>
                <option value="no_show">Niet verschenen</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Locatie
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Bijv. Thuis, Kantoor, Ziekenhuis..."
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notities
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Aanvullende informatie over de afspraak..."
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Bezig...' : (appointment ? 'Bijwerken' : 'Aanmaken')}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Annuleren
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Appointment Card Component
interface AppointmentCardProps {
  appointment: Appointment;
  client?: Client;
  caregiver?: Caregiver;
  onEdit: (appointment: Appointment) => void;
  onDelete: (appointment: Appointment) => void;
  onStatusChange: (appointment: Appointment, status: Appointment['status']) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  client,
  caregiver,
  onEdit,
  onDelete,
  onStatusChange
}) => {
  const getStatusIcon = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'no_show': return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled': return 'Gepland';
      case 'completed': return 'Voltooid';
      case 'cancelled': return 'Geannuleerd';
      case 'no_show': return 'Niet verschenen';
      default: return 'Onbekend';
    }
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-50 border-blue-200';
      case 'completed': return 'bg-green-50 border-green-200';
      case 'cancelled': return 'bg-red-50 border-red-200';
      case 'no_show': return 'bg-orange-50 border-orange-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Remove seconds if present
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border-2 p-4 hover:shadow-md transition-shadow ${getStatusColor(appointment.status)}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon(appointment.status)}
          <span className="font-semibold text-gray-900">{client?.naam || 'Onbekende cliënt'}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(appointment)}
            className="text-blue-600 hover:text-blue-800 text-sm"
            title="Bewerken"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(appointment)}
            className="text-red-600 hover:text-red-800 text-sm"
            title="Verwijderen"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(appointment.date)}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
        </div>

        {caregiver && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>{caregiver.name}</span>
          </div>
        )}

        {appointment.location && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{appointment.location}</span>
          </div>
        )}

        {client?.telefoon && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>{client.telefoon}</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">{appointment.type}</span>
          <span className="text-xs px-2 py-1 rounded-full bg-white border">
            {getStatusText(appointment.status)}
          </span>
        </div>

        {appointment.notes && (
          <p className="text-sm text-gray-600 mt-2 italic">
            "{appointment.notes}"
          </p>
        )}
      </div>

      {appointment.status === 'scheduled' && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex gap-2">
            <button
              onClick={() => onStatusChange(appointment, 'completed')}
              className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100"
            >
              ✓ Voltooid
            </button>
            <button
              onClick={() => onStatusChange(appointment, 'cancelled')}
              className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100"
            >
              ✗ Annuleren
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Planning Component
const Planning: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'month'>('today');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch data
  const {
    data: appointments = [],
    isLoading: loadingAppointments,
    error: appointmentsError
  } = useQuery<Appointment[]>({
    queryKey: ['appointments'],
    queryFn: fetchAppointments,
    staleTime: 30000,
    retry: 3,
  });

  const {
    data: clients = [],
    isLoading: loadingClients,
    error: clientsError
  } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: fetchClients,
    staleTime: 60000,
    retry: 3,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setShowForm(false);
      setSelectedAppointment(null);
      toast.success('Afspraak succesvol aangemaakt');
    },
    onError: (error) => {
      toast.error(`Fout bij aanmaken: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AppointmentFormData> }) =>
      updateAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setShowForm(false);
      setSelectedAppointment(null);
      toast.success('Afspraak succesvol bijgewerkt');
    },
    onError: (error) => {
      toast.error(`Fout bij bijwerken: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Afspraak succesvol verwijderd');
    },
    onError: (error) => {
      toast.error(`Fout bij verwijderen: ${error.message}`);
    },
  });

  // Filter appointments based on view mode and selected date
  const filteredAppointments = useMemo(() => {
    const today = new Date();
    const selected = new Date(selectedDate);
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      
      switch (viewMode) {
        case 'today':
          return appointmentDate.toDateString() === today.toDateString();
        case 'week':
          const weekStart = new Date(selected);
          weekStart.setDate(selected.getDate() - selected.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return appointmentDate >= weekStart && appointmentDate <= weekEnd;
        case 'month':
          return appointmentDate.getMonth() === selected.getMonth() && 
                 appointmentDate.getFullYear() === selected.getFullYear();
        default:
          return true;
      }
    });
  }, [appointments, viewMode, selectedDate]);

  // Create client and caregiver maps for quick lookup
  const clientMap = useMemo(() => {
    const map: Record<string, Client> = {};
    clients.forEach(client => {
      map[client.id] = client;
    });
    return map;
  }, [clients]);

  const caregiverMap = useMemo(() => {
    const map: Record<string, Caregiver> = {};
    mockCaregivers.forEach(caregiver => {
      map[caregiver.id] = caregiver;
    });
    return map;
  }, []);

  // Statistics
  const stats = useMemo(() => {
    const today = filteredAppointments.filter(apt => 
      new Date(apt.date).toDateString() === new Date().toDateString()
    );
    
    return {
      total: filteredAppointments.length,
      today: today.length,
      scheduled: filteredAppointments.filter(apt => apt.status === 'scheduled').length,
      completed: filteredAppointments.filter(apt => apt.status === 'completed').length,
      cancelled: filteredAppointments.filter(apt => apt.status === 'cancelled').length,
    };
  }, [filteredAppointments]);

  // Event handlers
  const handleAddAppointment = () => {
    setSelectedAppointment(null);
    setShowForm(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowForm(true);
  };

  const handleDeleteAppointment = (appointment: Appointment) => {
    if (window.confirm(`Weet je zeker dat je de afspraak met ${clientMap[appointment.client_id]?.naam} wilt verwijderen?`)) {
      deleteMutation.mutate(appointment.id);
    }
  };

  const handleStatusChange = (appointment: Appointment, status: Appointment['status']) => {
    updateMutation.mutate({
      id: appointment.id,
      data: { status }
    });
  };

  const handleFormSubmit = (data: AppointmentFormData) => {
    if (selectedAppointment) {
      updateMutation.mutate({ id: selectedAppointment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedAppointment(null);
  };

  // Real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('appointments-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Error state
  if (appointmentsError || clientsError) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Er is een fout opgetreden
            </h2>
            <p className="text-red-600 mb-4">
              {appointmentsError?.message || clientsError?.message || 'Onbekende fout'}
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
  if (loadingAppointments || loadingClients) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Planning laden...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Planning</h1>
            <p className="text-gray-600">Beheer afspraken en planning</p>
          </div>
          <button
            onClick={handleAddAppointment}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nieuwe afspraak
          </button>
        </div>

        {/* View Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('today')}
              className={`px-3 py-2 rounded text-sm ${
                viewMode === 'today' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Vandaag
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-2 rounded text-sm ${
                viewMode === 'week' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Deze week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-2 rounded text-sm ${
                viewMode === 'month' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >