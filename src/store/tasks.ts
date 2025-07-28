import create from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, TaskTemplate, Client } from '@/components/tasks/types';
import { supabase } from '@/integrations/supabase/client';

interface TaskStore {
  tasks: Task[];
  clients: Client[];
  templates: TaskTemplate[];
  selectedTasks: string[];
  viewMode: 'list' | 'kanban' | 'calendar' | 'timeline';
  filters: Record<string, any>;
  modals: Record<string, boolean>;
  // Actions
  createTask: (task: Partial<Task>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  bulkUpdateTasks: (ids: string[], updates: Partial<Task>) => void;
  // Async actions
  loadTasks: () => Promise<void>;
  syncWithSupabase: () => Promise<void>;
  sendReminders: () => Promise<void>;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      clients: [],
      templates: [],
      selectedTasks: [],
      viewMode: 'list',
      filters: {},
      modals: {},
      createTask: (task) => set(state => ({ tasks: [...state.tasks, { ...task, id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date() } as Task] })),
      updateTask: (id, updates) => set(state => ({ tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t) })),
      deleteTask: (id) => set(state => ({ tasks: state.tasks.filter(t => t.id !== id) })),
      bulkUpdateTasks: (ids, updates) => set(state => ({ tasks: state.tasks.map(t => ids.includes(t.id) ? { ...t, ...updates, updatedAt: new Date() } : t) })),
      loadTasks: async () => {
        const { data, error } = await supabase.from('tasks').select('*');
        if (!error && data) set({ tasks: data });
      },
      syncWithSupabase: async () => {
        // Voorbeeld: push lokale taken naar Supabase en haal nieuwe op
        // Hier kun je conflict handling toevoegen
        await get().loadTasks();
      },
      sendReminders: async () => {
        // Uitbreiden: reminders versturen via Supabase/notifications
      },
    }),
    { name: 'task-store', version: 1 }
  )
);
