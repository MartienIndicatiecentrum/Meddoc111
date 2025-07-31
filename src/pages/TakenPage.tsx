import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { supabase } from '@/integrations/supabase/client';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import AppLayout from '@/components/layout/AppLayout';
import FileUploader from '@/components/upload/FileUploader';
import TodoList from '@/components/tasks/TodoList';
import { X, List, Kanban } from 'lucide-react';

// Type definitions
interface Task {
  id: string;
  client_id: string;
  taakbeschrijving: string;
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

interface StatusColumn {
  key: string;
  label: string;
  color: string;
  bgColor: string;
}

interface SupabaseTaskRow {
  id: string;
  client_id: string;
  clientennaam?: string;
  taak_type?: string;
  beschrijving: string;
  status: string;
  prioriteit: string;
  deadline?: string;
  taak_datum?: string;
  taak_tijd?: string;
  geplande_datum?: string;
  notities?: string;
  extra_notitie?: string;
  verzekeraar?: string;
  indicatie_type?: string;
  upload_documenten?: string[] | null;
  created_at: string;
  updated_at: string;
}

// Constants
const STATUS_COLUMNS: StatusColumn[] = [
  {
    key: 'nieuw',
    label: 'Niet gestart',
    color: 'border-gray-300',
    bgColor: 'bg-gray-50',
  },
  {
    key: 'in_behandeling',
    label: 'In behandeling',
    color: 'border-blue-400',
    bgColor: 'bg-blue-50',
  },
  {
    key: 'wachten_op_info',
    label: 'Wachten op info',
    color: 'border-yellow-400',
    bgColor: 'bg-yellow-50',
  },
  {
    key: 'opvolging',
    label: 'Opvolging',
    color: 'border-purple-400',
    bgColor: 'bg-purple-50',
  },
  {
    key: 'afgehandeld',
    label: 'Afgerond',
    color: 'border-green-400',
    bgColor: 'bg-green-50',
  },
  {
    key: 'urgent',
    label: 'Urgent',
    color: 'border-red-500',
    bgColor: 'bg-red-100',
  },
];

// API functions
const fetchTasks = async (): Promise<Task[]> => {
  try {
    console.log('Fetching tasks from database...');

    const { data, error } = await supabase
      .from('taken')
      .select(
        `
        id,
        client_id,
        clientennaam,
        taak_type,
        beschrijving,
        status,
        prioriteit,
        deadline,
        taak_datum,
        taak_tijd,
        geplande_datum,
        notities,
        extra_notitie,
        verzekeraar,
        indicatie_type,
        upload_documenten,
        created_at,
        updated_at
      `
      )
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    console.log('Raw data from database:', data);

    const mappedTasks = (data || []).map(
      (row: SupabaseTaskRow): Task => ({
        id: row.id,
        client_id: row.client_id,
        taakbeschrijving: row.beschrijving || 'Geen beschrijving',
        taaktype: row.taak_type || 'onbekend',
        status: row.status || 'nieuw',
        urgentie_status: row.prioriteit || 'normaal',
        deadline: row.deadline,
        taak_datum: row.taak_datum,
        taak_tijd: row.taak_tijd,
        opdrachtgever: row.clientennaam,
        updated_at: row.updated_at,
        notities: row.notities,
        extra_notitie: row.extra_notitie,
        verzekeraar: row.verzekeraar,
        indicatie_type: row.indicatie_type,
        upload_documenten: row.upload_documenten,
      })
    );

    console.log('Mapped tasks:', mappedTasks);
    return mappedTasks;
  } catch (error) {
    console.error('Unexpected error in fetchTasks:', error);
    throw error;
  }
};

const fetchClients = async (): Promise<Client[]> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('id, naam')
      .order('naam');

    if (error) {
      console.error('Error fetching clients:', error);
      throw new Error(`Failed to fetch clients: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error in fetchClients:', error);
    throw error;
  }
};

// Task Card Component
interface TaskCardProps {
  task: Task;
  clientName: string;
  index: number;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onDuplicate?: (task: Task) => void;
  onUpload?: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  clientName,
  index,
  onEdit,
  onDelete,
  onDuplicate,
  onUpload,
}) => {
  const isOverdue = task.deadline && new Date(task.deadline) < new Date();
  const isUrgent = task.urgentie_status === 'urgent';

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(task);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Weet je zeker dat je deze taak wilt verwijderen?')) {
      onDelete?.(task.id);
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate?.(task);
  };

  const handleUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpload?.(task);
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onDoubleClick={e => {
            e.stopPropagation();
            handleEdit(e);
          }}
          className={`
            bg-white rounded-lg shadow-sm p-4 border-l-4
            ${isUrgent ? 'border-red-500' : 'border-blue-200'}
            flex flex-col gap-2 hover:shadow-md transition-all duration-200
            ${snapshot.isDragging ? 'ring-2 ring-blue-400 shadow-lg rotate-2' : ''}
            cursor-grab active:cursor-grabbing
          `}
          title='Dubbelklik om te bewerken'
        >
          <div className='flex justify-between items-start'>
            <span className='font-semibold text-sm text-gray-900 line-clamp-1'>
              {clientName}
            </span>
          </div>

          <div className='text-sm text-gray-700 line-clamp-2 min-h-[2.5rem]'>
            {task.taakbeschrijving}
          </div>

          <div className='space-y-2 mt-2'>
            <div className='flex justify-between items-center text-xs'>
              <span className='bg-gray-100 px-2 py-1 rounded text-gray-700'>
                {task.taaktype === 'indicatie' ? 'Indicatie' : 'Vraagstelling'}
              </span>
              <span
                className={`px-2 py-1 rounded font-medium ${
                  isOverdue
                    ? 'bg-red-100 text-red-700'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                {task.deadline
                  ? new Date(task.deadline).toLocaleDateString('nl-NL')
                  : 'Geen deadline'}
              </span>
            </div>
            {task.taak_datum && (
              <div className='flex justify-between items-center text-xs'>
                <span className='text-gray-500'>Taakdatum:</span>
                <span className='bg-green-50 text-green-700 px-2 py-1 rounded font-medium'>
                  {new Date(task.taak_datum).toLocaleDateString('nl-NL')}
                  {task.taak_tijd && ` ${task.taak_tijd}`}
                </span>
              </div>
            )}
          </div>

          <div className='flex gap-1 mt-3 pt-2 border-t border-gray-100'>
            <button
              className='p-1.5 hover:bg-gray-100 rounded text-sm transition-colors flex-1 text-center'
              title='Bewerken'
              onClick={handleEdit}
            >
              ✏️
            </button>
            {onUpload && (
              <button
                className='p-1.5 hover:bg-green-100 rounded text-sm transition-colors flex-1 text-center'
                title='Document uploaden'
                onClick={handleUpload}
              >
                📤
              </button>
            )}
            <button
              className='p-1.5 hover:bg-gray-100 rounded text-sm transition-colors flex-1 text-center'
              title='Dupliceren'
              onClick={handleDuplicate}
            >
              📄
            </button>
            <button
              className='p-1.5 hover:bg-red-100 rounded text-sm transition-colors flex-1 text-center'
              title='Verwijderen'
              onClick={handleDelete}
            >
              🗑️
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
};

// Column Component
interface ColumnProps {
  column: StatusColumn;
  tasks: Task[];
  clientMap: Record<string, string>;
  onAddTask?: (status: string) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onDuplicateTask?: (task: Task) => void;
  onUploadTask?: (task: Task) => void;
}

const Column: React.FC<ColumnProps> = ({
  column,
  tasks,
  clientMap,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onDuplicateTask,
  onUploadTask,
}) => {
  const urgentTasks = tasks.filter(
    task => task.urgentie_status === 'urgent'
  ).length;
  const overdueTasks = tasks.filter(
    task => task.deadline && new Date(task.deadline) < new Date()
  ).length;

  return (
    <Droppable droppableId={column.key}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`
            flex-1 min-w-0 max-w-full ${column.bgColor} rounded-lg border-t-4 ${column.color}
            shadow-sm p-4 flex flex-col transition-all duration-200
            ${snapshot.isDraggingOver ? 'bg-blue-100 shadow-md scale-[1.02]' : ''}
          `}
        >
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h3 className='font-semibold text-lg text-gray-800'>
                {column.label}
              </h3>
              {(urgentTasks > 0 || overdueTasks > 0) && (
                <div className='flex gap-2 mt-1'>
                  {urgentTasks > 0 && (
                    <span className='text-xs bg-red-100 text-red-700 px-2 py-1 rounded'>
                      {urgentTasks} urgent
                    </span>
                  )}
                  {overdueTasks > 0 && (
                    <span className='text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded'>
                      {overdueTasks} verlopen
                    </span>
                  )}
                </div>
              )}
            </div>
            <span className='bg-white text-gray-700 text-sm px-3 py-1 rounded-full font-medium shadow-sm'>
              {tasks.length}
            </span>
          </div>

          <div className='flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto'>
            {tasks.length === 0 ? (
              <div className='text-gray-400 text-sm text-center mt-8 italic'>
                Geen taken in deze kolom
              </div>
            ) : (
              tasks.map((task, idx) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  clientName={clientMap[task.client_id] || 'Onbekende cliënt'}
                  index={idx}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onDuplicate={onDuplicateTask}
                  onUpload={onUploadTask}
                />
              ))
            )}
            {provided.placeholder}
          </div>

          <button
            className='mt-4 bg-white hover:bg-gray-50 text-gray-700 text-sm px-3 py-2 rounded-md transition-colors border border-gray-200 shadow-sm'
            onClick={() => onAddTask?.(column.key)}
          >
            + Nieuwe taak toevoegen
          </button>
        </div>
      )}
    </Droppable>
  );
};

// Main Component
const TakenPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState<string>('nieuw');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedTaskForUpload, setSelectedTaskForUpload] =
    useState<Task | null>(null);
  const [newTaskData, setNewTaskData] = useState({
    beschrijving: '',
    taak_type: '',
    indicatie_type: '',
    prioriteit: 'normaal',
    deadline: '',
    taak_datum: '',
    taak_tijd: '',
    client_id: '',
    notities: '',
    extra_notitie: '',
    verzekeraar: '',
    upload_documenten: null as File[] | null,
    huisbezoek_datum: '' as string | null,
  });

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'todo'>('kanban');

  // Query hooks
  const {
    data: tasks = [],
    isLoading: loadingTasks,
    error: tasksError,
  } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    staleTime: 0, // Always refetch when invalidated
    retry: 3,
  });

  const {
    data: clients = [],
    isLoading: loadingClients,
    error: clientsError,
  } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: fetchClients,
    staleTime: 60000,
    retry: 3,
  });

  // Memoized client mapping
  const clientMap = useMemo(() => {
    const map: Record<string, string> = {};
    clients.forEach(client => {
      map[client.id] = client.naam;
    });
    return map;
  }, [clients]);

  // Debug logging
  console.log('Clients loaded:', clients.length);
  console.log('Loading clients:', loadingClients);
  console.log('Clients error:', clientsError);
  console.log('Search term:', searchTerm);
  console.log('Selected client ID:', selectedClientId);

  // Get filter from URL parameters
  const filterParam = searchParams.get('filter');

  // Filtered tasks based on selected client and URL filter
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Filter by client if selected
    if (selectedClientId) {
      filtered = filtered.filter(task => task.client_id === selectedClientId);
    }

    // Filter by URL parameter
    if (filterParam) {
      switch (filterParam) {
        case 'urgent':
          filtered = filtered.filter(task => task.urgentie_status === 'urgent');
          break;
        case 'verlopen':
          filtered = filtered.filter(
            task => task.deadline && new Date(task.deadline) < new Date()
          );
          break;
        case 'afgerond':
          filtered = filtered.filter(task => task.status === 'afgehandeld');
          break;
        default:
          break;
      }
    }

    return filtered;
  }, [tasks, selectedClientId, filterParam]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    STATUS_COLUMNS.forEach(col => {
      grouped[col.key] = [];
    });

    filteredTasks.forEach(task => {
      // Always place tasks in their actual status column, regardless of urgency
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      } else {
        // Handle unknown status
        grouped['nieuw'].push(task);
      }
    });

    return grouped;
  }, [filteredTasks]);

  // Calculate statistics (use all tasks for the stats cards, not filtered tasks)
  const stats = useMemo(() => {
    const allTasks = selectedClientId
      ? tasks.filter(task => task.client_id === selectedClientId)
      : tasks;
    const urgentTasks = allTasks.filter(
      task => task.urgentie_status === 'urgent'
    ).length;
    const overdueTasks = allTasks.filter(
      task => task.deadline && new Date(task.deadline) < new Date()
    ).length;
    const completedTasks = allTasks.filter(
      task => task.status === 'afgehandeld'
    ).length;

    return { urgentTasks, overdueTasks, completedTasks };
  }, [tasks, selectedClientId]);

  // ✅ UPDATED: Update task status mutation - now handles both status and prioriteit
  const updateTaskMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      prioriteit,
    }: {
      id: string;
      status?: string;
      prioriteit?: string;
    }) => {
      const updateData: Record<string, string> = {};

      if (status !== undefined) {
        updateData.status = status;
      }

      if (prioriteit !== undefined) {
        updateData.prioriteit = prioriteit;
      }

      const { error } = await supabase
        .from('taken')
        .update(updateData)
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to update task: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Taak bijgewerkt');
    },
    onError: error => {
      console.error('Error updating task:', error);
      toast.error('Fout bij het bijwerken van de taak');
    },
  });

  // ✅ UPDATED: Drag and drop handler - fixed for urgent column
  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) {
        return;
      }

      const { draggableId, destination, source } = result;
      const destStatus = destination.droppableId;
      const srcStatus = source.droppableId;

      if (destStatus === 'urgent') {
        // Naar urgent kolom: update prioriteit naar urgent, behoud huidige status
        const currentTask = filteredTasks.find(task => task.id === draggableId);
        const currentStatus = currentTask?.status || 'nieuw';

        updateTaskMutation.mutate({
          id: draggableId,
          prioriteit: 'urgent',
          status: currentStatus, // Behoud de huidige status
        });
      } else if (srcStatus === 'urgent') {
        // Van urgent kolom weg: update status naar nieuwe kolom, zet prioriteit terug naar normaal
        updateTaskMutation.mutate({
          id: draggableId,
          status: destStatus,
          prioriteit: 'normaal', // Reset prioriteit naar normaal
        });
      } else {
        // Normale status wijziging tussen andere kolommen
        updateTaskMutation.mutate({
          id: draggableId,
          status: destStatus,
        });
      }
    },
    [updateTaskMutation, filteredTasks]
  );

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: typeof newTaskData & { status: string }) => {
      // Combine all notes into one field for now
      let combinedNotes = taskData.notities || '';
      if (taskData.extra_notitie) {
        combinedNotes +=
          (combinedNotes ? '\n\n' : '') +
          'Extra notitie: ' +
          taskData.extra_notitie;
      }
      if (taskData.verzekeraar) {
        combinedNotes +=
          (combinedNotes ? '\n\n' : '') +
          'Verzekeraar: ' +
          taskData.verzekeraar;
      }
      if (taskData.taak_datum) {
        combinedNotes +=
          (combinedNotes ? '\n\n' : '') + 'Taakdatum: ' + taskData.taak_datum;
      }
      if (taskData.taak_tijd) {
        combinedNotes +=
          (combinedNotes ? '\n\n' : '') + 'Taaktijd: ' + taskData.taak_tijd;
      }
      if (taskData.huisbezoek_datum) {
        combinedNotes +=
          (combinedNotes ? '\n\n' : '') +
          'Huisbezoekdatum: ' +
          taskData.huisbezoek_datum;
      }

      const { error } = await supabase.from('taken').insert({
        client_id: taskData.client_id,
        clientennaam: clientMap[taskData.client_id] || 'Onbekende cliënt',
        taak_type: taskData.taak_type || null,
        beschrijving: taskData.beschrijving,
        status: taskData.status,
        prioriteit: taskData.prioriteit,
        deadline: taskData.deadline || null,
        taak_datum: taskData.taak_datum || null,
        taak_tijd: taskData.taak_tijd || null,
        geplande_datum: taskData.taak_datum || null,
        notities: taskData.notities || null,
        extra_notitie: taskData.extra_notitie || null,
        verzekeraar: taskData.verzekeraar || null,
        indicatie_type: taskData.indicatie_type || null,
        upload_documenten: taskData.upload_documenten
          ? JSON.stringify(taskData.upload_documenten.map(f => f.name))
          : null,
        huisbezoek_datum: taskData.huisbezoek_datum || null,
      });

      if (error) {
        throw new Error(`Failed to create task: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Nieuwe taak aangemaakt');
      setShowTaskModal(false);
      setNewTaskData({
        beschrijving: '',
        taak_type: '',
        indicatie_type: '',
        prioriteit: 'normaal',
        deadline: '',
        taak_datum: '',
        taak_tijd: '',
        client_id: '',
        notities: '',
        extra_notitie: '',
        verzekeraar: '',
        upload_documenten: null,
        huisbezoek_datum: null,
      });
    },
    onError: error => {
      console.error('Error creating task:', error);
      toast.error('Fout bij het aanmaken van de taak');
    },
  });

  // Edit task mutation
  const editTaskMutation = useMutation({
    mutationFn: async (taskData: typeof newTaskData & { id: string }) => {
      const { error } = await supabase
        .from('taken')
        .update({
          clientennaam: clientMap[taskData.client_id] || 'Onbekende cliënt',
          taak_type: taskData.taak_type || null,
          beschrijving: taskData.beschrijving,
          prioriteit: taskData.prioriteit,
          deadline: taskData.deadline || null,
          taak_datum: taskData.taak_datum || null,
          taak_tijd: taskData.taak_tijd || null,
          geplande_datum: taskData.taak_datum || null,
          notities: taskData.notities || null,
          extra_notitie: taskData.extra_notitie || null,
          verzekeraar: taskData.verzekeraar || null,
          indicatie_type: taskData.indicatie_type || null,
          upload_documenten: taskData.upload_documenten
            ? JSON.stringify(taskData.upload_documenten.map(f => f.name))
            : null,
          huisbezoek_datum: taskData.huisbezoek_datum || null,
        })
        .eq('id', taskData.id);

      if (error) {
        throw new Error(`Failed to update task: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Taak bijgewerkt');
      setShowTaskModal(false);
      setIsEditMode(false);
      setEditingTask(null);
      setNewTaskData({
        beschrijving: '',
        taak_type: '',
        indicatie_type: '',
        prioriteit: 'normaal',
        deadline: '',
        taak_datum: '',
        taak_tijd: '',
        client_id: '',
        notities: '',
        extra_notitie: '',
        verzekeraar: '',
        upload_documenten: null,
        huisbezoek_datum: null,
      });
    },
    onError: error => {
      console.error('Error updating task:', error);
      toast.error('Fout bij het bijwerken van de taak');
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('taken').delete().eq('id', taskId);
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Taak verwijderd');
    },
    onError: error => {
      toast.error('Fout bij verwijderen taak: ' + error.message);
    },
  });

  // Handler functions
  const handleAddTask = useCallback(
    (status: string) => {
      setNewTaskStatus(status);
      // Pre-select client if one is already selected
      if (selectedClientId) {
        setNewTaskData(prev => ({ ...prev, client_id: selectedClientId }));
      }
      setShowTaskModal(true);
      if (status === 'urgent') {
        setNewTaskData(prev => ({ ...prev, prioriteit: 'urgent' }));
      } else {
        setNewTaskData(prev => ({ ...prev, prioriteit: 'normaal' }));
      }
    },
    [selectedClientId]
  );

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsEditMode(true);
    setNewTaskStatus(task.status);

    // Pre-populate form with existing task data
    setNewTaskData({
      beschrijving: task.taakbeschrijving || '',
      taak_type: task.taaktype || '',
      indicatie_type: task.indicatie_type || '',
      prioriteit: task.urgentie_status || 'normaal',
      deadline: task.deadline || '',
      taak_datum: task.taak_datum || '',
      taak_tijd: task.taak_tijd || '',
      client_id: task.client_id,
      notities: task.notities || '',
      extra_notitie: task.extra_notitie || '',
      verzekeraar: task.verzekeraar || '',
      upload_documenten: task.upload_documenten || null,
      huisbezoek_datum: task.huisbezoek_datum || null,
    });

    setShowTaskModal(true);
  }, []);

  const handleStatusChange = useCallback(
    async (taskId: string, newStatus: string) => {
      console.log('Updating status for task:', taskId, 'to:', newStatus);

      try {
        // Update task status in Supabase
        const { data, error } = await supabase
          .from('taken')
          .update({ status: newStatus })
          .eq('id', taskId);

        if (error) {
          toast.error('Fout bij het bijwerken van status');
          console.error('Error updating status:', error);
        } else {
          console.log('Status update successful:', data);
          toast.success('Status bijgewerkt');

          // Force immediate refetch with more specific options
          queryClient.invalidateQueries({
            queryKey: ['tasks'],
            exact: true,
          });

          // Also try to refetch immediately
          setTimeout(() => {
            queryClient.refetchQueries({
              queryKey: ['tasks'],
              exact: true,
            });
          }, 100);
        }
      } catch (err) {
        console.error('Unexpected error in status update:', err);
        toast.error('Onverwachte fout bij status update');
      }
    },
    [queryClient]
  );

  const handleUrgencyChange = useCallback(
    (taskId: string, newUrgency: string) => {
      // Update task urgency in Supabase
      supabase
        .from('taken')
        .update({ prioriteit: newUrgency })
        .eq('id', taskId)
        .then(({ error }) => {
          if (error) {
            toast.error('Fout bij het bijwerken van urgentie');
            console.error('Error updating urgency:', error);
          } else {
            toast.success('Urgentie bijgewerkt');
            // Force immediate refetch
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.refetchQueries({ queryKey: ['tasks'] });
          }
        });
    },
    [queryClient]
  );

  const handleTaskTypeChange = useCallback(
    (taskId: string, newTaskType: string) => {
      // Update task type in Supabase
      supabase
        .from('taken')
        .update({ taak_type: newTaskType })
        .eq('id', taskId)
        .then(({ error }) => {
          if (error) {
            toast.error('Fout bij het bijwerken van taaktype');
            console.error('Error updating task type:', error);
          } else {
            toast.success('Taaktype bijgewerkt');
            // Force immediate refetch
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.refetchQueries({ queryKey: ['tasks'] });
          }
        });
    },
    [queryClient]
  );

  const handleDeleteTask = useCallback((taskId: string) => {
    setConfirmDeleteId(taskId);
  }, []);

  const confirmDelete = useCallback(() => {
    if (confirmDeleteId) {
      deleteTaskMutation.mutate(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  }, [confirmDeleteId, deleteTaskMutation]);

  const cancelDelete = useCallback(() => {
    setConfirmDeleteId(null);
  }, []);

  const handleDuplicateTask = useCallback((task: Task) => {
    toast.info(
      `Dupliceer taak: ${task.taakbeschrijving} - functionaliteit komt binnenkort`
    );
  }, []);

  const handleUploadTask = useCallback((task: Task) => {
    setSelectedTaskForUpload(task);
    setUploadModalOpen(true);
  }, []);

  const handleUploadSuccess = useCallback(
    (fileName: string) => {
      console.log(
        `Document ${fileName} uploaded for task:`,
        selectedTaskForUpload?.taakbeschrijving
      );
      toast.success(
        `Document ${fileName} succesvol geüpload voor taak: ${selectedTaskForUpload?.taakbeschrijving}`
      );
      // Here you could add logic to associate the uploaded document with the task
      setUploadModalOpen(false);
      setSelectedTaskForUpload(null);
    },
    [selectedTaskForUpload]
  );

  const closeUploadModal = useCallback(() => {
    setUploadModalOpen(false);
    setSelectedTaskForUpload(null);
  }, []);

  // Clear filter function
  const clearFilter = useCallback(() => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.delete('filter');
      return newParams;
    });
  }, [setSearchParams]);

  // Real-time subscriptions
  useEffect(() => {
    const clientsSubscription = supabase
      .channel('clients-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['clients'] });
        }
      )
      .subscribe();

    const tasksSubscription = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clienttaskstable',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
      )
      .subscribe();

    return () => {
      clientsSubscription.unsubscribe();
      tasksSubscription.unsubscribe();
    };
  }, [queryClient]);

  // Error states
  if (tasksError || clientsError) {
    return (
      <AppLayout>
        <div className='max-w-full mx-auto py-8 px-4'>
          <div className='bg-red-50 border border-red-200 rounded-lg p-6'>
            <h2 className='text-lg font-semibold text-red-800 mb-2'>
              Er is een fout opgetreden
            </h2>
            <p className='text-red-600 mb-4'>
              {tasksError?.message || clientsError?.message || 'Onbekende fout'}
            </p>
            <button
              className='bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors'
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
  if (loadingTasks || loadingClients) {
    return (
      <AppLayout>
        <div className='max-w-full mx-auto py-8 px-4'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
            <p className='text-gray-600'>Taken en cliënten laden...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className='max-w-full mx-auto py-8 px-4 sm:px-6 lg:px-8'>
        <div className='mb-8'>
          <div className='flex justify-between items-start mb-6'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                Takenoverzicht
                {filterParam && (
                  <span className='ml-3 text-lg font-normal text-blue-600'>
                    -{' '}
                    {filterParam === 'urgent'
                      ? 'Urgente taken'
                      : filterParam === 'verlopen'
                        ? 'Verlopen taken'
                        : filterParam === 'afgerond'
                          ? 'Afgeronde taken'
                          : 'Gefilterd'}
                  </span>
                )}
              </h1>
              <p className='text-gray-600'>
                Sleep taken tussen kolommen om de status te wijzigen
                {filterParam && (
                  <button
                    onClick={clearFilter}
                    className='ml-3 text-blue-600 underline hover:text-blue-800'
                  >
                    Filter wissen
                  </button>
                )}
              </p>
            </div>

            {/* Statistics Cards */}
            <div className='flex gap-4'>
              <Link to='/taken' className='group'>
                <div className='bg-white rounded-lg shadow-sm p-4 text-center border cursor-pointer transition hover:shadow-md hover:bg-gray-50'>
                  <div className='text-2xl font-bold text-gray-900'>
                    {selectedClientId
                      ? tasks.filter(
                          task => task.client_id === selectedClientId
                        ).length
                      : tasks.length}
                  </div>
                  <div className='text-sm text-gray-600'>Totaal taken</div>
                </div>
              </Link>
              <Link to='/taken?filter=urgent' className='group'>
                <div className='bg-white rounded-lg shadow-sm p-4 text-center border cursor-pointer transition hover:shadow-md hover:bg-gray-50'>
                  <div className='text-2xl font-bold text-red-600'>
                    {stats.urgentTasks}
                  </div>
                  <div className='text-sm text-gray-600'>Urgent</div>
                </div>
              </Link>
              <Link to='/taken?filter=verlopen' className='group'>
                <div className='bg-white rounded-lg shadow-sm p-4 text-center border cursor-pointer transition hover:shadow-md hover:bg-gray-50'>
                  <div className='text-2xl font-bold text-orange-600'>
                    {stats.overdueTasks}
                  </div>
                  <div className='text-sm text-gray-600'>Verlopen</div>
                </div>
              </Link>
              <Link to='/taken?filter=afgerond' className='group'>
                <div className='bg-white rounded-lg shadow-sm p-4 text-center border cursor-pointer transition hover:shadow-md hover:bg-gray-50'>
                  <div className='text-2xl font-bold text-green-600'>
                    {stats.completedTasks}
                  </div>
                  <div className='text-sm text-gray-600'>Afgerond</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Navigation and Filters */}
          <div className='flex flex-wrap gap-4 items-center mb-6'>
            {/* Gecombineerde zoek en filter voor cliënten */}
            <Autocomplete
              options={clients}
              getOptionLabel={option => option.naam}
              value={clients.find(c => c.id === selectedClientId) || null}
              onChange={(_, newValue) => {
                setSelectedClientId(newValue ? newValue.id : null);
                setSearchTerm(newValue ? newValue.naam : '');
              }}
              inputValue={searchTerm}
              onInputChange={(_, newInputValue) => {
                setSearchTerm(newInputValue);
                if (!newInputValue) {
                  setSelectedClientId(null);
                }
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label='Zoek en selecteer cliënt'
                  variant='outlined'
                  size='small'
                  placeholder='Typ om te zoeken of selecteer...'
                />
              )}
              filterOptions={(options, { inputValue }) => {
                return options.filter(option =>
                  option.naam.toLowerCase().includes(inputValue.toLowerCase())
                );
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              sx={{ minWidth: 300 }}
              loading={loadingClients}
              noOptionsText={
                loadingClients ? 'Laden...' : 'Geen cliënten gevonden'
              }
              clearOnBlur={false}
              selectOnFocus
            />

            {selectedClientId && (
              <button
                onClick={() => setSelectedClientId(null)}
                className='text-sm text-gray-500 hover:text-gray-700 underline'
              >
                Filter wissen
              </button>
            )}
          </div>
        </div>

        {/* View Toggle */}
        <div className='mb-6 flex justify-center'>
          <div className='bg-white rounded-lg shadow-sm border p-1'>
            <div className='flex'>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#e6f0fa] text-[#2563eb] hover:bg-blue-100'
                }`}
              >
                <div className='flex items-center gap-2'>
                  <Kanban className='w-4 h-4' />
                  Kanban
                </div>
              </button>
              <button
                onClick={() => setViewMode('todo')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'todo'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#e6f0fa] text-[#2563eb] hover:bg-blue-100'
                }`}
              >
                <div className='flex items-center gap-2'>
                  <List className='w-4 h-4' />
                  Todo List
                </div>
              </button>
              <a
                href='/pgb-proces-flow'
                target='_blank'
                rel='noopener noreferrer'
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 border border-transparent ml-2 ${
                  viewMode !== 'kanban' && viewMode !== 'todo'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#e6f0fa] text-[#2563eb] hover:bg-blue-100'
                }`}
                style={{ textDecoration: 'none' }}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='w-4 h-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 17v-2a4 4 0 014-4h4m0 0V7m0 4l-4-4m4 4l4-4'
                  />
                </svg>
                Work-flow
              </a>
              <a
                href='/factuur-generator'
                className='px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 border border-transparent ml-2 bg-[#e6f0fa] text-[#2563eb] hover:bg-blue-100'
                style={{ textDecoration: 'none' }}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='w-4 h-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
                Factuur Generator
              </a>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        {viewMode === 'kanban' && (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className='flex w-full gap-4 pb-6'>
              {STATUS_COLUMNS.map(column => (
                <Column
                  key={column.key}
                  column={column}
                  tasks={
                    column.key === 'urgent'
                      ? filteredTasks.filter(
                          task => task.urgentie_status === 'urgent'
                        )
                      : tasksByStatus[column.key]
                  }
                  clientMap={clientMap}
                  onAddTask={handleAddTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onDuplicateTask={handleDuplicateTask}
                  onUploadTask={handleUploadTask}
                />
              ))}
            </div>
          </DragDropContext>
        )}

        {/* Todo List View */}
        {viewMode === 'todo' && (
          <div className='w-full'>
            <TodoList
              tasks={filteredTasks}
              clientMap={clientMap}
              onEditTask={handleEditTask}
              onStatusChange={handleStatusChange}
              onUrgencyChange={handleUrgencyChange}
              onTaskTypeChange={handleTaskTypeChange}
            />
          </div>
        )}

        {/* Summary */}
        <div className='mt-8 bg-white rounded-lg shadow-sm p-6 border'>
          <h3 className='font-semibold text-gray-800 mb-4'>Overzicht</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='text-lg font-semibold text-gray-900'>
                {filteredTasks.length}
              </div>
              <div className='text-sm text-gray-600'>
                Taken weergegeven
                {selectedClientId && ` voor ${clientMap[selectedClientId]}`}
              </div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-semibold text-blue-600'>
                {tasksByStatus['in_behandeling']?.length || 0}
              </div>
              <div className='text-sm text-gray-600'>In behandeling</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-semibold text-yellow-600'>
                {tasksByStatus['wachten_op_info']?.length || 0}
              </div>
              <div className='text-sm text-gray-600'>Wachten op info</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-semibold text-green-600'>
                {tasksByStatus['afgehandeld']?.length || 0}
              </div>
              <div className='text-sm text-gray-600'>Afgerond</div>
            </div>
          </div>

          {filteredTasks.length === 0 && (
            <div className='text-center mt-6 py-8'>
              <div className='text-gray-400 text-lg mb-2'>🔍</div>
              <p className='text-gray-500'>
                {selectedClientId
                  ? `Geen taken gevonden voor ${clientMap[selectedClientId]}`
                  : 'Geen taken gevonden'}
              </p>
              <button
                onClick={() => handleAddTask('nieuw')}
                className='mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
              >
                Eerste taak toevoegen
              </button>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className='mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <h4 className='font-medium text-blue-900 mb-2'>
            💡 Tips voor gebruik:
          </h4>
          <ul className='text-sm text-blue-800 space-y-1'>
            <li>• Sleep taken tussen kolommen om de status te wijzigen</li>
            <li>
              • Gebruik de filter om taken van een specifieke cliënt te bekijken
            </li>
            <li>• Urgente taken zijn gemarkeerd met een rode rand</li>
            <li>• Verlopen deadlines worden rood weergegeven</li>
            <li>• Klik op de knoppen onder elke taak voor meer acties</li>
          </ul>
        </div>

        {/* Task Creation Modal */}
        {showTaskModal && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  {isEditMode
                    ? 'Taak bewerken'
                    : `Nieuwe taak toevoegen - ${STATUS_COLUMNS.find(col => col.key === newTaskStatus)?.label}`}
                </h3>
                <button
                  onClick={() => {
                    setShowTaskModal(false);
                    setIsEditMode(false);
                    setEditingTask(null);
                    setNewTaskData({
                      beschrijving: '',
                      taak_type: '',
                      indicatie_type: '',
                      prioriteit: 'normaal',
                      deadline: '',
                      taak_datum: '',
                      taak_tijd: '',
                      client_id: '',
                      notities: '',
                      extra_notitie: '',
                      verzekeraar: '',
                      upload_documenten: null,
                      huisbezoek_datum: null,
                    });
                  }}
                  className='text-gray-400 hover:text-gray-600 transition-colors'
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (!newTaskData.client_id) {
                    toast.error('Selecteer een cliënt');
                    return;
                  }

                  if (isEditMode && editingTask) {
                    editTaskMutation.mutate({
                      ...newTaskData,
                      id: editingTask.id,
                      status: newTaskStatus,
                    });
                  } else {
                    const geldigeStatussen = [
                      'nieuw',
                      'in_behandeling',
                      'wachten_op_info',
                      'opvolging',
                      'afgehandeld',
                      'geannuleerd',
                    ];
                    const statusVoorInsert = geldigeStatussen.includes(
                      newTaskStatus
                    )
                      ? newTaskStatus
                      : 'nieuw';
                    createTaskMutation.mutate({
                      ...newTaskData,
                      status: statusVoorInsert,
                    });
                  }
                }}
                className='space-y-4'
              >
                {/* Client Selection */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Cliënt *
                  </label>
                  <select
                    value={newTaskData.client_id}
                    onChange={e =>
                      setNewTaskData(prev => ({
                        ...prev,
                        client_id: e.target.value,
                      }))
                    }
                    className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    required
                  >
                    <option value=''>Selecteer een cliënt</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.naam}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Task Description */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Taakbeschrijving
                  </label>
                  <textarea
                    value={newTaskData.beschrijving}
                    onChange={e =>
                      setNewTaskData(prev => ({
                        ...prev,
                        beschrijving: e.target.value,
                      }))
                    }
                    className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    rows={3}
                    placeholder='Beschrijf de taak...'
                  />
                </div>

                {/* Task Type */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Taaktype
                  </label>
                  <select
                    value={newTaskData.taak_type}
                    onChange={e =>
                      setNewTaskData(prev => ({
                        ...prev,
                        taak_type: e.target.value,
                      }))
                    }
                    className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value=''>Selecteer type</option>
                    <option value='indicatie'>Indicatie</option>
                    <option value='vraagstelling'>Vraagstelling</option>
                    <option value='administratief'>Administratief</option>
                    <option value='opvolging'>Opvolging</option>
                    <option value='intakegesprek_nieuwe_indicatie'>
                      Intakegesprek nieuwe indicatie
                    </option>
                    <option value='intakegesprek_herindicatie'>
                      Intakegesprek herindicatie
                    </option>
                    <option value='intake_verwerken_documenten_volgen'>
                      Intake verwerken; documenten volgen
                    </option>
                    <option value='intake_verwerken_documenten_in_map'>
                      Intake verwerken; documenten in map
                    </option>
                    <option value='intake_verwerken_fillin_form_volgt'>
                      Intake verwerken; fillin form volgt
                    </option>
                    <option value='deel2_moet_nog'>Deel2 moet nog</option>
                    <option value='omaha_moet_nog'>Omaha moet nog</option>
                    <option value='zorgplan_moet_nog'>Zorgplan moet nog</option>
                    <option value='kwantificatie_of_care_moet_nog'>
                      Kwantificatie of care moet nog
                    </option>
                    <option value='wijzigingen_nodig'>Wijzigingen nodig</option>
                    <option value='documenten_geupload'>
                      Documenten geupload
                    </option>
                    <option value='vragen_verzekeraar'>
                      Vragen verzekeraar
                    </option>
                    <option value='vragen_client'>Vragen client</option>
                    <option value='afgerond'>Afgerond</option>
                  </select>
                </div>

                {/* Conditional Indicatie Type Dropdown */}
                {(newTaskData.taak_type === 'indicatie' ||
                  newTaskData.taak_type === 'intakegesprek_nieuwe_indicatie' ||
                  newTaskData.taak_type === 'intakegesprek_herindicatie') && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Indicatie Type
                    </label>
                    <select
                      value={newTaskData.indicatie_type}
                      onChange={e =>
                        setNewTaskData(prev => ({
                          ...prev,
                          indicatie_type: e.target.value,
                        }))
                      }
                      className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                      <option value=''>Selecteer indicatie type</option>
                      <option value='nieuwe_indicatie'>Nieuwe indicatie</option>
                      <option value='verlengen_geen_wijzigingen'>
                        Verlengen indicatie; geen wijzigingen
                      </option>
                      <option value='verlengen_met_wijzigingen'>
                        Verlengen indicatie; met wijzigingen
                      </option>
                      <option value='wijzigen_bestaande_indicatie'>
                        Wijzigen, bestaande indicatie
                      </option>
                    </select>
                  </div>
                )}

                {/* Priority */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Prioriteit
                  </label>
                  <select
                    value={newTaskData.prioriteit}
                    onChange={e =>
                      setNewTaskData(prev => ({
                        ...prev,
                        prioriteit: e.target.value,
                      }))
                    }
                    className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value='laag'>Laag</option>
                    <option value='normaal'>Normaal</option>
                    <option value='hoog'>Hoog</option>
                    <option value='urgent'>Urgent</option>
                  </select>
                </div>

                {/* Deadline */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Deadline
                  </label>
                  <input
                    type='date'
                    value={newTaskData.deadline}
                    onChange={e =>
                      setNewTaskData(prev => ({
                        ...prev,
                        deadline: e.target.value,
                      }))
                    }
                    className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>

                {/* Task Date */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Taakdatum
                  </label>
                  <input
                    type='date'
                    value={newTaskData.taak_datum}
                    onChange={e =>
                      setNewTaskData(prev => ({
                        ...prev,
                        taak_datum: e.target.value,
                      }))
                    }
                    className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Wanneer moet de taak uitgevoerd worden?'
                  />
                </div>

                {/* Task Time */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Taaktijd
                  </label>
                  <input
                    type='time'
                    value={newTaskData.taak_tijd}
                    onChange={e =>
                      setNewTaskData(prev => ({
                        ...prev,
                        taak_tijd: e.target.value,
                      }))
                    }
                    className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Hoe laat moet de taak uitgevoerd worden?'
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Notities
                  </label>
                  <textarea
                    value={newTaskData.notities}
                    onChange={e =>
                      setNewTaskData(prev => ({
                        ...prev,
                        notities: e.target.value,
                      }))
                    }
                    className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    rows={2}
                    placeholder='Optionele notities...'
                  />
                </div>

                {/* Conditional Extra Notes Field */}
                {newTaskData.taak_type === 'wijzigingen_nodig' && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Omschrijving wijzigingen *
                    </label>
                    <textarea
                      value={newTaskData.extra_notitie}
                      onChange={e =>
                        setNewTaskData(prev => ({
                          ...prev,
                          extra_notitie: e.target.value,
                        }))
                      }
                      className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      rows={3}
                      placeholder='Beschrijf welke wijzigingen nodig zijn...'
                      required
                    />
                  </div>
                )}

                {/* Conditional Insurer Selection and Document Upload */}
                {newTaskData.taak_type === 'vragen_verzekeraar' && (
                  <>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Verzekeraar *
                      </label>
                      <select
                        value={newTaskData.verzekeraar}
                        onChange={e =>
                          setNewTaskData(prev => ({
                            ...prev,
                            verzekeraar: e.target.value,
                          }))
                        }
                        className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        required
                      >
                        <option value=''>Selecteer verzekeraar</option>
                        <option value='CZ'>CZ</option>
                        <option value='VGZ'>VGZ</option>
                        <option value='OHRA'>OHRA</option>
                        <option value='Zilveren_kruis'>Zilveren kruis</option>
                      </select>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Documenten uploaden
                      </label>
                      <input
                        type='file'
                        multiple
                        onChange={e => {
                          const files = e.target.files
                            ? Array.from(e.target.files)
                            : null;
                          setNewTaskData(prev => ({
                            ...prev,
                            upload_documenten: files,
                          }));
                        }}
                        className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        accept='.pdf,.doc,.docx,.jpg,.jpeg,.png'
                      />
                      <p className='text-xs text-gray-500 mt-1'>
                        Toegestane bestandstypen: PDF, DOC, DOCX, JPG, PNG
                      </p>
                    </div>
                  </>
                )}

                {/* Datum huisbezoek */}
                {newTaskData.taak_type === 'opvolging' && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Datum huisbezoek
                    </label>
                    <input
                      type='date'
                      value={newTaskData.huisbezoek_datum || ''}
                      onChange={e =>
                        setNewTaskData(prev => ({
                          ...prev,
                          huisbezoek_datum: e.target.value,
                        }))
                      }
                      className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      placeholder='Kies een datum voor het huisbezoek'
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className='flex gap-3 pt-4'>
                  <button
                    type='button'
                    onClick={() => {
                      setShowTaskModal(false);
                      setIsEditMode(false);
                      setEditingTask(null);
                      setNewTaskData({
                        beschrijving: '',
                        taak_type: '',
                        indicatie_type: '',
                        prioriteit: 'normaal',
                        deadline: '',
                        taak_datum: '',
                        taak_tijd: '',
                        client_id: '',
                        notities: '',
                        extra_notitie: '',
                        verzekeraar: '',
                        upload_documenten: null,
                        huisbezoek_datum: null,
                      });
                    }}
                    className='flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors'
                  >
                    Annuleren
                  </button>
                  <button
                    type='submit'
                    disabled={
                      createTaskMutation.isPending || editTaskMutation.isPending
                    }
                    className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
                  >
                    {createTaskMutation.isPending || editTaskMutation.isPending
                      ? 'Bezig...'
                      : isEditMode
                        ? 'Taak Bijwerken'
                        : 'Taak Aanmaken'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {uploadModalOpen && selectedTaskForUpload && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-semibold'>
                  Document uploaden voor:{' '}
                  {selectedTaskForUpload.taakbeschrijving}
                </h3>
                <button
                  onClick={closeUploadModal}
                  className='text-gray-400 hover:text-gray-600'
                >
                  <X className='w-6 h-6' />
                </button>
              </div>

              <div className='mb-4 p-3 bg-blue-50 rounded-lg'>
                <p className='text-sm text-blue-800'>
                  <strong>Taak:</strong>{' '}
                  {selectedTaskForUpload.taakbeschrijving}
                  <br />
                  <strong>Cliënt:</strong>{' '}
                  {clientMap[selectedTaskForUpload.client_id] ||
                    'Onbekende cliënt'}
                  <br />
                  <strong>Type:</strong>{' '}
                  {selectedTaskForUpload.taaktype || 'Onbekend'}
                  <br />
                  <strong>Deadline:</strong>{' '}
                  {selectedTaskForUpload.deadline
                    ? new Date(
                        selectedTaskForUpload.deadline
                      ).toLocaleDateString('nl-NL')
                    : 'Geen deadline'}
                </p>
              </div>

              <FileUploader
                onUploadSuccess={handleUploadSuccess}
                clientId={selectedTaskForUpload.client_id}
                taskId={selectedTaskForUpload.id}
              />
            </div>
          </div>
        )}

        {confirmDeleteId && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto'>
              <div className='flex flex-col items-center text-center'>
                <div className='mb-4 text-lg text-gray-800'>
                  Weet je zeker dat je deze taak wilt verwijderen?
                </div>
                <div className='flex gap-3'>
                  <button
                    onClick={cancelDelete}
                    className='px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition-colors'
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={confirmDelete}
                    className='px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors'
                  >
                    Verwijderen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default TakenPage;
