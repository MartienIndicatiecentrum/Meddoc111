import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { mockUser } from '@/mock/dashboardData';
import RecentDocuments from '@/components/dashboard/RecentDocuments';
import UpcomingAppointments from '@/components/dashboard/UpcomingAppointments';
import TodoList from '@/components/tasks/TodoList';
import { FileText, Calendar, ClipboardList, Plus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Type definitions
interface Appointment {
  id: number;
  date: string;
  client: string;
}

interface Task {
  id: string;
  taakbeschrijving: string;
  client_id: string;
  taaktype?: string;
  status: string;
  urgentie_status: string;
  deadline?: string;
  taak_datum?: string;
  taak_tijd?: string;
  opdrachtgever?: string;
  updated_at?: string;
  notities?: string;
  extra_notitie?: string;
  verzekeraar?: string;
  indicatie_type?: string;
  upload_documenten?: string[] | null;
}

interface Client {
  id: string;
  naam: string;
}

interface QuickStatsProps {
  documentCount: number;
  appointmentCount: number;
  taskCount: number;
}

// Components
const WelcomeCard: React.FC = () => (
  <div className="p-6 bg-white rounded shadow heading-md mb-4">
    Welkom terug, {mockUser.name}!
    <span className="text-gray-500 ml-2">Vrijdag 18 juli 2025</span>
  </div>
);

const QuickStats: React.FC<QuickStatsProps> = ({
  documentCount,
  appointmentCount,
  taskCount
}) => (
  <div className="grid grid-cols-3 gap-4 mb-4">
    <div className="bg-primary-50 rounded p-4 text-center">
      <div className="text-2xl font-bold">{documentCount}</div>
      <div className="text-gray-600">Documenten</div>
    </div>
    <div className="bg-healthcare-green/10 rounded p-4 text-center">
      <div className="text-2xl font-bold">{appointmentCount}</div>
      <div className="text-gray-600">Afspraken</div>
    </div>
    <div className="bg-warning-amber/10 rounded p-4 text-center">
      <div className="text-2xl font-bold">{taskCount}</div>
      <div className="text-gray-600">Open Taken</div>
    </div>
  </div>
);



const LoadingCard: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-white rounded shadow p-4 mb-4">
    <div className="flex items-center justify-center">
      <div className="animate-pulse text-gray-500">{message}</div>
    </div>
  </div>
);

// Main Dashboard Component
const Home: React.FC = () => {
  // State management
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [documentCount, setDocumentCount] = useState(0);
  const [showRecentDocuments, setShowRecentDocuments] = useState(false);
  const [showTodoList, setShowTodoList] = useState(false);

  // Loading states
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);

  // Fetch functions
  const fetchDocumentCount = async (): Promise<void> => {
    try {
      const { count, error } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .not('type', 'eq', 'folder');

      if (error) {
        console.error('Error fetching document count:', error);
        return;
      }

      setDocumentCount(count || 0);
    } catch (error) {
      console.error('Unexpected error fetching document count:', error);
    }
  };

  const fetchClients = async (): Promise<void> => {
    try {
      setLoadingClients(true);
      const { data, error } = await supabase
        .from('clients')
        .select('id, naam');

      if (error) {
        console.error('Error fetching clients:', error);
        return;
      }

      setClients(data || []);
    } catch (error) {
      console.error('Unexpected error fetching clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchTasks = async (): Promise<void> => {
    try {
      setLoadingTasks(true);
      const { data, error } = await supabase
        .from('taken')
        .select(`
          id,
          beschrijving,
          client_id,
          clientennaam,
          deadline,
          status,
          prioriteit,
          taak_type,
          taak_datum,
          taak_tijd,
          notities,
          extra_notitie,
          verzekeraar,
          indicatie_type,
          upload_documenten,
          created_at,
          updated_at
        `)
        .order('deadline', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      if (data) {
        const formattedTasks: Task[] = data.map((task) => ({
          id: task.id,
          taakbeschrijving: task.beschrijving || 'Geen beschrijving',
          client_id: task.client_id,
          taaktype: task.taak_type,
          status: task.status || 'nieuw',
          urgentie_status: task.prioriteit || 'normaal',
          deadline: task.deadline,
          taak_datum: task.taak_datum,
          taak_tijd: task.taak_tijd,
          opdrachtgever: task.clientennaam,
          updated_at: task.updated_at,
          notities: task.notities,
          extra_notitie: task.extra_notitie,
          verzekeraar: task.verzekeraar,
          indicatie_type: task.indicatie_type,
          upload_documenten: task.upload_documenten
        }));
        setTasks(formattedTasks);
      }
    } catch (error) {
      console.error('Unexpected error fetching tasks:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchAppointments = async (): Promise<void> => {
    try {
      setLoadingAppointments(true);
      const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

      const { data, error } = await supabase
        .from('appointments')
        .select('id, date, name')
        .gte('date', today) // Only get appointments from today onwards
        .order('date', { ascending: true })
        .limit(5);

      if (error) {
        console.error('Error fetching appointments:', error);
        return;
      }

      if (data) {
        const formattedAppointments: Appointment[] = data.map((appointment) => ({
          id: appointment.id,
          date: appointment.date,
          client: appointment.name || 'Onbekende client'
        }));
        setAppointments(formattedAppointments);
      }
    } catch (error) {
      console.error('Unexpected error fetching appointments:', error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchDocumentCount();
  }, []);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, []);



  const isLoading = loadingAppointments || loadingTasks || loadingClients;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Home</h1>
        {/* Statistieken cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Clienten */}
          <div className="flex flex-col items-center">
            <Link to="/clienten" className="group w-full">
              <div className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl hover:bg-purple-50 transition cursor-pointer h-full w-full">
                <Users className="w-10 h-10 text-purple-600 mb-2" />
                <div className="text-3xl font-bold text-gray-500">{clients.length}</div>
                <div className="text-gray-500 mb-2">Cliënten</div>
                <button className="mt-2 px-4 py-1 rounded-full bg-purple-100 text-purple-600 text-sm font-medium flex items-center gap-1 hover:bg-purple-200 transition border border-purple-600">
                  <Users className="w-4 h-4" /> Bekijk alles
                </button>
              </div>
            </Link>
            <Link to="/nieuwe-client" className="w-full mt-4">
              <button className="w-full flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-purple-100 text-purple-600 font-semibold shadow hover:bg-purple-200 transition border border-purple-500">
                <Plus className="w-5 h-5" /> Nieuwe Cliënt
              </button>
            </Link>
          </div>
          {/* Documenten */}
          <div className="flex flex-col items-center">
            <Link to="/documenten" className="group w-full">
              <div className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl hover:bg-blue-50 transition cursor-pointer h-full w-full">
                <FileText className="w-10 h-10 text-blue-600 mb-2" />
                <div className="text-3xl font-bold text-gray-500">{documentCount}</div>
                <div className="text-gray-500 mb-2">Documenten</div>
                <button className="mt-2 px-4 py-1 rounded-full bg-blue-100 text-blue-600 text-sm font-medium flex items-center gap-1 hover:bg-blue-200 transition border border-blue-600">
                  <FileText className="w-4 h-4" /> Bekijk alles
                </button>
              </div>
            </Link>
            <Link to="/documenten" className="w-full mt-4">
              <button className="w-full flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-blue-100 text-blue-600 font-semibold shadow hover:bg-blue-200 transition border border-blue-600">
                <Plus className="w-5 h-5" /> Nieuw document
              </button>
            </Link>
          </div>
          {/* Open Taken */}
          <div className="flex flex-col items-center">
            <Link to="/taken" className="group w-full">
              <div className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl hover:bg-yellow-50 transition cursor-pointer h-full w-full">
                <ClipboardList className="w-10 h-10 text-yellow-600 mb-2" />
                <div className="text-3xl font-bold text-gray-500">{tasks.length}</div>
                <div className="text-gray-500 mb-2">Open Taken</div>
                <button className="mt-2 px-4 py-1 rounded-full bg-yellow-100 text-yellow-600 text-sm font-medium flex items-center gap-1 hover:bg-yellow-200 transition border border-yellow-500">
                  <ClipboardList className="w-4 h-4" /> Bekijk alles
                </button>
              </div>
            </Link>
            <Link to="/taken?nieuw=1" className="w-full mt-4">
              <button className="w-full flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-yellow-100 text-yellow-600 font-semibold shadow hover:bg-yellow-200 transition border border-yellow-500">
                <Plus className="w-5 h-5" /> Nieuwe taak
              </button>
            </Link>
          </div>
          {/* Afspraken */}
          <div className="flex flex-col items-center">
            <Link to="/planning" className="group w-full">
              <div className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl hover:bg-green-50 transition cursor-pointer h-full w-full">
                <Calendar className="w-10 h-10 text-green-600 mb-2" />
                <div className="text-3xl font-bold text-gray-500">{appointments.length}</div>
                <div className="text-gray-500 mb-2">Afspraken</div>
                <button className="mt-2 px-4 py-1 rounded-full bg-green-100 text-green-600 text-sm font-medium flex items-center gap-1 hover:bg-green-200 transition border border-green-600">
                  <Calendar className="w-4 h-4" /> Bekijk alles
                </button>
              </div>
            </Link>
            <Link to="/afspraak-nieuw" className="w-full mt-4">
              <button className="w-full flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-green-100 text-green-600 font-semibold shadow hover:bg-green-200 transition border border-green-600">
                <Plus className="w-5 h-5" /> Nieuwe afspraak
              </button>
            </Link>
          </div>
        </div>
        {/* Overige cards in grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Kolom 1: Komende afspraken */}
          <div className="lg:col-span-1">
            <UpcomingAppointments appointments={appointments} max={5} />
          </div>

          {/* Kolom 2: Toon recente documenten (checkbox) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
                              <div className="flex items-center space-x-2 mb-6">
                  <Checkbox
                    id="showRecentDocuments"
                    checked={showRecentDocuments}
                    onCheckedChange={(checked) => setShowRecentDocuments(checked as boolean)}
                  />
                  <Label htmlFor="showRecentDocuments" className="text-sm font-medium text-gray-700">
                    Toon recente documenten
                  </Label>
                </div>
              {/* Recente documenten wanneer aangevinkt */}
              {showRecentDocuments && (
                <div className="border-t pt-4">
                  <RecentDocuments max={5} />
                </div>
              )}
            </div>
          </div>

          {/* Kolom 3: To do list (checkbox) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
                              <div className="flex items-center space-x-2 mb-6">
                  <Checkbox
                    id="showTodoList"
                    checked={showTodoList}
                    onCheckedChange={(checked) => setShowTodoList(checked as boolean)}
                  />
                  <Label htmlFor="showTodoList" className="text-sm font-medium text-gray-700">
                    To do list
                  </Label>
                </div>
              {/* To do list content wanneer aangevinkt */}
              {showTodoList && (
                <div className="border-t pt-4">
                  <TodoList
                    tasks={tasks}
                    clientMap={clients.reduce((map, client) => {
                      map[client.id] = client.naam;
                      return map;
                    }, {} as Record<string, string>)}
                    onEditTask={(task) => {
                      // Navigate to tasks page with edit mode
                      window.location.href = `/taken?edit=${task.id}`;
                    }}
                    onStatusChange={(taskId, newStatus) => {
                      // Update task status
                      supabase
                        .from('taken')
                        .update({ status: newStatus })
                        .eq('id', taskId)
                        .then(() => {
                          fetchTasks(); // Refresh tasks
                        });
                    }}
                    onUrgencyChange={(taskId, newUrgency) => {
                      // Update task urgency
                      supabase
                        .from('taken')
                        .update({ prioriteit: newUrgency })
                        .eq('id', taskId)
                        .then(() => {
                          fetchTasks(); // Refresh tasks
                        });
                    }}
                    onTaskTypeChange={(taskId, newTaskType) => {
                      // Update task type
                      supabase
                        .from('taken')
                        .update({ taak_type: newTaskType })
                        .eq('id', taskId)
                        .then(() => {
                          fetchTasks(); // Refresh tasks
                        });
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>


      </div>
    </AppLayout>
  );
};

export default Home;