import React, { useEffect, useState, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Calendar as CalendarIcon } from 'lucide-react';
import { clientService } from '@/services/clientService';
import { Client } from '@/components/clients/types';
import { ClientDetailsModal } from '@/components/clients/ClientDetailsModal';
import { supabase } from '@/integrations/supabase/client';
import { Calendar as BigCalendar, dateFnsLocalizer, Event as RBCEvent } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Appointment {
  id: string;
  client_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  status?: string;
}

// Eigen event type voor react-big-calendar
interface CalendarEvent extends RBCEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
}

const fetchAllAppointments = async (): Promise<Appointment[]> => {
  const { data, error } = await supabase
    .from('appointments')
    .select('id, client_id, date, start_time, end_time, type, status');
  if (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }
  return data || [];
};

const Kalender: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    clientService.getAllClients().then(setClients);
    fetchAllAppointments().then(setAppointments);
  }, []);

  // Client map for quick lookup
  const clientMap = useMemo(() => {
    const map: Record<string, Client> = {};
    clients.forEach(client => {
      map[client.id] = client;
    });
    return map;
  }, [clients]);

  // Kalender localizer instellen
  const locales = { 'nl': nl };
  const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    getDay,
    locales,
  });

  // Zet afspraken om naar calendar events
  const calendarEvents: CalendarEvent[] = appointments.map(appt => ({
    id: appt.id,
    title: clientMap[appt.client_id]?.fullName || 'Afspraak',
    start: new Date(`${appt.date}T${appt.start_time}`),
    end: new Date(`${appt.date}T${appt.end_time}`),
    resource: appt,
  }));

  // Klik op event: open client modal
  const handleSelectEvent = (event: CalendarEvent) => {
    const appt: Appointment = event.resource;
    const client = clientMap[appt.client_id] || null;
    setSelectedClient(client);
    setModalOpen(true);
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto py-12 px-4">
        <div className="flex items-center gap-3 mb-6">
          <CalendarIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Kalender</h1>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-gray-700 mb-8">
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
            onSelectEvent={handleSelectEvent}
          />
        </div>
        <ClientDetailsModal
          client={selectedClient}
          isOpen={modalOpen && !!selectedClient}
          onClose={() => setModalOpen(false)}
          onEdit={() => {}}
          onQuickAction={() => {}}
        />
      </div>
    </AppLayout>
  );
};

export default Kalender; 