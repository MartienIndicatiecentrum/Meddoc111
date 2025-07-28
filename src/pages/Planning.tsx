import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { toast } from 'sonner';
import { Calendar, Clock, User, MapPin, Phone, Plus, Edit, Trash2, X, FileText, Bell, Search } from 'lucide-react';
import AppointmentForm from '@/components/forms/AppointmentForm';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { nl } from 'date-fns/locale';

// Type definitions
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
  created_at: string;
  updated_at: string;
  // Email reminder properties
  reminder_enabled?: boolean;
  reminder_value?: number;
  reminder_unit?: 'minutes' | 'hours' | 'days';
  reminder_email?: string;
  reminder_sent?: string;
}

interface Client {
  id: string;
  naam: string;
  telefoon?: string;
  adres?: string;
  email?: string;
}

interface Caregiver {
  id: string;
  naam: string;
  specialisatie?: string;
  anders?: string;
  telefoon?: string;
  email?: string;
}

// API functions
const fetchAppointments = async (): Promise<Appointment[]> => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true });

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
    // First, let's fetch all fields to see what's available
    const { data: allFieldsData, error: allFieldsError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);
    
    if (allFieldsData && allFieldsData.length > 0) {
      console.log('Sample client with all fields:', allFieldsData[0]);
      console.log('Available fields:', Object.keys(allFieldsData[0]));
    }
    
    const { data, error } = await supabase
      .from('clients')
      .select('id, naam, telefoon, adres, email')
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

const fetchCaregivers = async (): Promise<Caregiver[]> => {
  try {
    const { data, error } = await supabase
      .from('caregivers')
      .select('id, naam, specialisatie, anders, telefoon, email')
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

// Main Planning Component
const Planning: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editAppointment, setEditAppointment] = useState<Appointment | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; appointment: Appointment | null }>({ show: false, appointment: null });
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [showClientsModal, setShowClientsModal] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState<'all' | 'with-email' | 'with-phone' | 'with-appointments' | 'without-appointments'>('all');
  const queryClient = useQueryClient();

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

  const {
    data: caregivers = [],
    isLoading: loadingCaregivers,
    error: caregiversError
  } = useQuery<Caregiver[]>({
    queryKey: ['caregivers'],
    queryFn: fetchCaregivers,
    staleTime: 60000,
    retry: 3,
  });

  // Create client map for quick lookup
  const clientMap = useMemo(() => {
    const map: Record<string, Client> = {};
    clients.forEach(client => {
      map[client.id] = client;
    });
    return map;
  }, [clients]);

  // Create caregiver map for quick lookup
  const caregiverMap = useMemo(() => {
    const map: Record<string, Caregiver> = {};
    caregivers.forEach(caregiver => {
      map[caregiver.id] = caregiver;
    });
    return map;
  }, [caregivers]);

  // Kalender localizer instellen
  const locales = { 'nl': nl };
  const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    getDay,
    locales,
  });

  // Afspraken omzetten naar calendar events
  const calendarEvents = appointments.map(appt => ({
    id: appt.id,
    title: clientMap[appt.client_id]?.naam || 'Afspraak',
    start: new Date(`${appt.date}T${appt.start_time}`),
    end: new Date(`${appt.date}T${appt.end_time}`),
    resource: appt,
  }));

  // Handle add appointment
  const handleAddAppointment = () => {
    setEditAppointment(null);
    setShowForm(true);
  };

  // Handle edit appointment
  const handleEditAppointment = (appointment: Appointment) => {
    setEditAppointment(appointment);
    setShowForm(true);
  };

  // Delete appointment mutation
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) {
        throw new Error(`Fout bij verwijderen afspraak: ${error.message}`);
      }
    },
    onSuccess: () => {
      toast.success('Afspraak succesvol verwijderd!');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setDeleteConfirm({ show: false, appointment: null });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Handle delete appointment
  const handleDeleteAppointment = (appointment: Appointment) => {
    setDeleteConfirm({ show: true, appointment });
  };

  // Confirm delete
  const confirmDelete = () => {
    if (deleteConfirm.appointment) {
      deleteAppointmentMutation.mutate(deleteConfirm.appointment.id);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteConfirm({ show: false, appointment: null });
  };

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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">Kalenderoverzicht</h2>
        <div className="bg-white rounded-lg shadow p-4 mb-8">
          <BigCalendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            popup
            views={['month', 'week', 'day']}
            messages={{
              month: 'Maand',
              week: 'Week',
              day: 'Dag',
              today: 'Vandaag',
              previous: 'Vorige',
              next: 'Volgende',
              agenda: 'Agenda',
              showMore: total => `+${total} meer`,
            }}
            culture="nl"
          />
        </div>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button 
            onClick={() => appointments.length > 0 && setShowAppointmentsModal(true)}
            className={`bg-white rounded-lg shadow-sm border p-4 text-left transition-all duration-200 ${
              appointments.length > 0 
                ? 'hover:shadow-md hover:border-blue-300 cursor-pointer transform hover:scale-105' 
                : 'cursor-default'
            }`}
            disabled={appointments.length === 0}
          >
            <div className="text-2xl font-bold text-blue-600">{appointments.length}</div>
            <div className="text-sm text-gray-600">Totaal afspraken</div>
            {appointments.length > 0 && (
              <div className="text-xs text-blue-500 mt-1">Klik om te bekijken</div>
            )}
          </button>
          <button 
            onClick={() => clients.length > 0 && setShowClientsModal(true)}
            className={`bg-white rounded-lg shadow-sm border p-4 text-left transition-all duration-200 ${
              clients.length > 0 
                ? 'hover:shadow-md hover:border-green-300 cursor-pointer transform hover:scale-105' 
                : 'cursor-default'
            }`}
            disabled={clients.length === 0}
          >
            <div className="text-2xl font-bold text-green-600">{clients.length}</div>
                            <div className="text-sm text-gray-500">Totaal cliënten</div>
            {clients.length > 0 && (
              <div className="text-xs text-green-500 mt-1">Klik om te bekijken</div>
            )}
          </button>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-2xl font-bold text-orange-600">
              {appointments.filter(apt => apt.status === 'scheduled').length}
            </div>
            <div className="text-sm text-gray-600">Gepland</div>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nog geen afspraken
            </h3>
            <p className="text-gray-600 mb-6">
              Voeg uw eerste afspraak toe om te beginnen
            </p>
            <button
              onClick={handleAddAppointment}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Eerste afspraak toevoegen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="font-semibold text-gray-900">
                    {clientMap[appointment.client_id]?.naam || 'Onbekende cliënt'}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditAppointment(appointment)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      title="Bewerk afspraak"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteAppointment(appointment)}
                      className="text-red-600 hover:text-red-800 text-sm"
                      title="Verwijder afspraak"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(appointment.date).toLocaleDateString('nl-NL')}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{appointment.start_time} - {appointment.end_time}</span>
                  </div>

                  {appointment.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{appointment.location}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{appointment.type}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                      {appointment.status}
                    </span>
                  </div>

                  {appointment.notes && (
                    <p className="text-sm text-gray-600 mt-2 italic">
                      {appointment.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <AppointmentForm
            clients={clients}
            editAppointment={editAppointment}
            onClose={() => {
              setShowForm(false);
              setEditAppointment(null);
            }}
            onSuccess={() => {
              setShowForm(false);
              setEditAppointment(null);
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirm.show && deleteConfirm.appointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Afspraak verwijderen
              </h3>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Weet je zeker dat je deze afspraak wilt verwijderen?
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="font-medium text-gray-900">
                    {clientMap[deleteConfirm.appointment.client_id]?.naam || 'Onbekende cliënt'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {new Date(deleteConfirm.appointment.date).toLocaleDateString('nl-NL')} om {deleteConfirm.appointment.start_time}
                  </div>
                  <div className="text-sm text-gray-600">
                    {deleteConfirm.appointment.type}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={deleteAppointmentMutation.isPending}
                >
                  Annuleren
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteAppointmentMutation.isPending}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleteAppointmentMutation.isPending ? 'Bezig...' : 'Verwijderen'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Appointments Overview Modal */}
        {showAppointmentsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Alle Afspraken</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Totaal {appointments.length} afspra{appointments.length === 1 ? 'ak' : 'ken'}
                  </p>
                </div>
                <button
                  onClick={() => setShowAppointmentsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {appointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Geen afspraken</h3>
                    <p className="text-gray-600">Er zijn nog geen afspraken ingepland.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-lg font-bold text-blue-600">{appointments.length}</div>
                        <div className="text-sm text-blue-700">Totaal</div>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-lg font-bold text-green-600">
                          {appointments.filter(apt => apt.status === 'scheduled').length}
                        </div>
                        <div className="text-sm text-green-700">Gepland</div>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="text-lg font-bold text-yellow-600">
                          {appointments.filter(apt => apt.status === 'completed').length}
                        </div>
                        <div className="text-sm text-yellow-700">Voltooid</div>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="text-lg font-bold text-red-600">
                          {appointments.filter(apt => apt.status === 'cancelled').length}
                        </div>
                        <div className="text-sm text-red-700">Geannuleerd</div>
                      </div>
                    </div>

                    {/* Appointments List */}
                    <div className="space-y-3">
                      {appointments
                        .sort((a, b) => {
                          const dateA = new Date(`${a.date}T${a.start_time}`);
                          const dateB = new Date(`${b.date}T${b.start_time}`);
                          return dateB.getTime() - dateA.getTime(); // Most recent first
                        })
                        .map((appointment) => {
                          const client = clientMap[appointment.client_id];
                          const caregiver = caregiverMap[appointment.caregiver_id || ''];
                          const appointmentDate = new Date(`${appointment.date}T${appointment.start_time}`);
                          const isUpcoming = appointmentDate > new Date();
                          
                          return (
                            <div 
                              key={appointment.id} 
                              className={`border rounded-lg p-4 transition-colors ${
                                isUpcoming ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {client?.naam || 'Onbekende cliënt'}
                                  </h4>
                                  {caregiver && (
                                    <p className="text-sm text-gray-600">
                                      👨‍⚕️ {caregiver.naam}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    appointment.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                                    appointment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                    appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {appointment.status === 'scheduled' ? 'Gepland' :
                                     appointment.status === 'completed' ? 'Voltooid' :
                                     appointment.status === 'cancelled' ? 'Geannuleerd' :
                                     appointment.status}
                                  </span>
                                  {isUpcoming && (
                                    <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                                      Aankomend
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Calendar className="w-4 h-4" />
                                  <span>{appointmentDate.toLocaleDateString('nl-NL', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}</span>
                                </div>
                                
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Clock className="w-4 h-4" />
                                  <span>{appointment.start_time} - {appointment.end_time}</span>
                                </div>

                                <div className="flex items-center gap-2 text-gray-600">
                                  <FileText className="w-4 h-4" />
                                  <span>{appointment.type}</span>
                                </div>
                              </div>

                              {appointment.location && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                                  <MapPin className="w-4 h-4" />
                                  <span>{appointment.location}</span>
                                </div>
                              )}

                              {appointment.notes && (
                                <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                                  <strong>Opmerkingen:</strong> {appointment.notes}
                                </div>
                              )}

                              {/* Email Reminder Info */}
                              {appointment.reminder_enabled && (
                                <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
                                  <Bell className="w-4 h-4" />
                                  <span>
                                    Email herinnering: {appointment.reminder_value} {appointment.reminder_unit} van tevoren
                                    {appointment.reminder_sent && (
                                      <span className="text-green-600 ml-2">✓ Verzonden</span>
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAppointmentsModal(false)}
                  className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Sluiten
                </button>
                <button
                  onClick={() => {
                    setShowAppointmentsModal(false);
                    setShowForm(true);
                  }}
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nieuwe Afspraak
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clients Overview Modal */}
        {showClientsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Alle Cliënten</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Totaal {clients.length} cliënt{clients.length === 1 ? '' : 'en'}
                  </p>
                </div>
                <button
                  onClick={() => setShowClientsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Search and Filter Controls */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search Input */}
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Zoek cliënten op naam, email of telefoon..."
                      value={clientSearchTerm}
                      onChange={(e) => setClientSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>
                  
                  {/* Filter Dropdown */}
                  <div className="sm:w-64">
                    <select
                      value={clientFilter}
                      onChange={(e) => setClientFilter(e.target.value as typeof clientFilter)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white"
                    >
                      <option value="all">Alle cliënten</option>
                      <option value="with-email">Met email adres</option>
                      <option value="with-phone">Met telefoonnummer</option>
                      <option value="with-appointments">Met afspraken</option>
                      <option value="without-appointments">Zonder afspraken</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                {clients.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Geen cliënten</h3>
                    <p className="text-gray-600">Er zijn nog geen cliënten geregistreerd.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-lg font-bold text-green-600">{clients.length}</div>
                        <div className="text-sm text-green-700">Totaal Cliënten</div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-lg font-bold text-blue-600">
                          {clients.filter(client => client.email).length}
                        </div>
                        <div className="text-sm text-blue-700">Met Email</div>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="text-lg font-bold text-purple-600">
                          {clients.filter(client => client.telefoon).length}
                        </div>
                        <div className="text-sm text-purple-700">Met Telefoon</div>
                      </div>
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="text-lg font-bold text-orange-600">
                          {clients.filter(client => {
                            const clientAppointments = appointments.filter(apt => apt.client_id === client.id);
                            return clientAppointments.some(apt => apt.status === 'scheduled');
                          }).length}
                        </div>
                        <div className="text-sm text-orange-700">Met Afspraken</div>
                      </div>
                    </div>

                    {/* Clients List */}
                    <div className="space-y-4">
                      {(() => {
                        // Filter clients based on search term and filter
                        let filteredClients = clients.filter(client => {
                          // Search filter
                          const searchLower = clientSearchTerm.toLowerCase();
                          const matchesSearch = !clientSearchTerm || 
                            client.naam.toLowerCase().includes(searchLower) ||
                            (client.email && client.email.toLowerCase().includes(searchLower)) ||
                            (client.telefoon && client.telefoon.toLowerCase().includes(searchLower));
                          
                          if (!matchesSearch) return false;
                          
                          // Category filter
                          switch (clientFilter) {
                            case 'with-email':
                              return !!client.email;
                            case 'with-phone':
                              return !!client.telefoon;
                            case 'with-appointments': {
                              const clientAppointments = appointments.filter(apt => apt.client_id === client.id);
                              return clientAppointments.length > 0;
                            }
                            case 'without-appointments': {
                              const clientAppointments = appointments.filter(apt => apt.client_id === client.id);
                              return clientAppointments.length === 0;
                            }
                            case 'all':
                            default:
                              return true;
                          }
                        });
                        
                        // Sort filtered clients
                        filteredClients = filteredClients.sort((a, b) => a.naam.localeCompare(b.naam));
                        
                        // Show results count if filtered
                        const showingFiltered = clientSearchTerm || clientFilter !== 'all';
                        
                        return (
                          <>
                            {showingFiltered && (
                              <div className="text-sm text-gray-600 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <span className="font-medium">{filteredClients.length}</span> van de <span className="font-medium">{clients.length}</span> cliënten gevonden
                                {clientSearchTerm && (
                                  <span className="ml-2">• Zoekterm: "{clientSearchTerm}"</span>
                                )}
                                {clientFilter !== 'all' && (
                                  <span className="ml-2">• Filter: {{
                                    'with-email': 'Met email',
                                    'with-phone': 'Met telefoon', 
                                    'with-appointments': 'Met afspraken',
                                    'without-appointments': 'Zonder afspraken'
                                  }[clientFilter]}</span>
                                )}
                              </div>
                            )}
                            
                            {filteredClients.length === 0 && showingFiltered ? (
                              <div className="text-center py-8">
                                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Geen resultaten gevonden</h3>
                                <p className="text-gray-600 mb-4">Probeer een andere zoekterm of filter.</p>
                                <button
                                  onClick={() => {
                                    setClientSearchTerm('');
                                    setClientFilter('all');
                                  }}
                                  className="text-green-600 hover:text-green-700 font-medium"
                                >
                                  Wis filters
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {filteredClients.map((client) => {
                                  const clientAppointments = appointments.filter(apt => apt.client_id === client.id);
                                  const upcomingAppointments = clientAppointments.filter(apt => {
                                    const appointmentDate = new Date(`${apt.date}T${apt.start_time}`);
                                    return appointmentDate > new Date() && apt.status === 'scheduled';
                                  });
                                  const completedAppointments = clientAppointments.filter(apt => apt.status === 'completed');
                                  
                                  return (
                                    <div 
                                      key={client.id} 
                                      className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
                                    >
                                      <div className="flex justify-between items-start mb-3">
                                        <div>
                                          <h4 className="font-medium text-gray-900 text-lg">
                                            {client.naam}
                                          </h4>
                                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                            {client.email && (
                                              <div className="flex items-center gap-1">
                                                <span className="text-blue-500">📧</span>
                                                <span>{client.email}</span>
                                              </div>
                                            )}
                                            {client.telefoon && (
                                              <div className="flex items-center gap-1">
                                                <Phone className="w-4 h-4 text-green-500" />
                                                <span>{client.telefoon}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {upcomingAppointments.length > 0 && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                                              {upcomingAppointments.length} aankomend{upcomingAppointments.length > 1 ? 'e' : ''}
                                            </span>
                                          )}
                                          {completedAppointments.length > 0 && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                              {completedAppointments.length} voltooid
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {client.adres && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                          <MapPin className="w-4 h-4" />
                                          <span>{client.adres}</span>
                                        </div>
                                      )}

                                      {/* Client Statistics */}
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div className="flex items-center gap-2 text-gray-600">
                                          <Calendar className="w-4 h-4" />
                                          <span>{clientAppointments.length} totaal afspra{clientAppointments.length === 1 ? 'ak' : 'ken'}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 text-gray-600">
                                          <Clock className="w-4 h-4" />
                                          <span>{upcomingAppointments.length} aankomend{upcomingAppointments.length === 1 ? 'e' : ''}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-gray-600">
                                          <FileText className="w-4 h-4" />
                                          <span>{completedAppointments.length} voltooid</span>
                                        </div>
                                      </div>

                                      {/* Recent Appointments */}
                                      {clientAppointments.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-gray-100">
                                          <h5 className="text-sm font-medium text-gray-700 mb-2">Recente Afspraken</h5>
                                          <div className="space-y-2">
                                            {clientAppointments
                                              .sort((a, b) => {
                                                const dateA = new Date(`${a.date}T${a.start_time}`);
                                                const dateB = new Date(`${b.date}T${b.start_time}`);
                                                return dateB.getTime() - dateA.getTime();
                                              })
                                              .slice(0, 3)
                                              .map((appointment) => {
                                                const appointmentDate = new Date(`${appointment.date}T${appointment.start_time}`);
                                                const isUpcoming = appointmentDate > new Date();
                                                const caregiver = caregiverMap[appointment.caregiver_id || ''];
                                                
                                                return (
                                                  <div key={appointment.id} className="flex justify-between items-center text-xs">
                                                    <div className="flex items-center gap-2">
                                                      <span className={`w-2 h-2 rounded-full ${
                                                        appointment.status === 'scheduled' ? 'bg-green-400' :
                                                        appointment.status === 'completed' ? 'bg-blue-400' :
                                                        appointment.status === 'cancelled' ? 'bg-red-400' :
                                                        'bg-gray-400'
                                                      }`}></span>
                                                      <span className="text-gray-600">
                                                        {appointmentDate.toLocaleDateString('nl-NL', {
                                                          day: 'numeric',
                                                          month: 'short'
                                                        })} - {appointment.start_time}
                                                      </span>
                                                      <span className="text-gray-500">{appointment.type}</span>
                                                      {caregiver && (
                                                        <span className="text-gray-500">• {caregiver.naam}</span>
                                                      )}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                      {isUpcoming && appointment.status === 'scheduled' && (
                                                        <span className="text-green-600">Aankomend</span>
                                                      )}
                                                      {appointment.status === 'completed' && (
                                                        <span className="text-blue-600">Voltooid</span>
                                                      )}
                                                      {appointment.status === 'cancelled' && (
                                                        <span className="text-red-600">Geannuleerd</span>
                                                      )}
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                          </div>
                                          {clientAppointments.length > 3 && (
                                            <div className="text-xs text-gray-500 mt-2">
                                              +{clientAppointments.length - 3} meer...
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowClientsModal(false)}
                  className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Sluiten
                </button>
                <button
                  onClick={() => {
                    setShowClientsModal(false);
                    // Navigate to clients page - you might want to implement this
                    window.location.href = '/clienten';
                  }}
                  className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Beheer Cliënten
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Planning;