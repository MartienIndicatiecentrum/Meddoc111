import { supabase } from '@/integrations/supabase/client';

export interface Client {
  id: string;
  name: string;
  naam?: string; // Dutch column name
  email?: string;
  phone?: string;
  telefoon?: string; // Dutch column name
  address?: string;
  city?: string;
  postal_code?: string;
  date_of_birth?: string;
  bsn_number?: string;
  insurance_number?: string;
  insurance_company?: string;
  contact_person_name?: string;
  contact_person_phone?: string;
  contact_person_email?: string;
  contact_person_relation?: string;
  status: 'active' | 'inactive' | 'archived';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  client_id: string;
  title: string;
  description?: string;
  type: 'Hulpmiddel Aanvraag' | 'PGB Aanvraag' | 'WMO Herindicatie' | 'Indicatie' | 'Vraagstelling' | 'Update' | 'Notitie';
  status: 'Niet gestart' | 'In behandeling' | 'Wachten op info' | 'Opvolging' | 'Afgerond';
  priority: 'Laag' | 'Medium' | 'Hoog' | 'Urgent';
  progress: number;
  deadline?: string;
  created_at: string;
  updated_at: string;
  insurer?: string;
  external_party?: string;
  is_urgent: boolean;
  is_expired: boolean;
  needs_response: boolean;
}

export interface LogEntry {
  id: string;
  client_id: string;
  date: string;
  from_name: string;
  from_type: 'client' | 'employee' | 'insurer' | 'family' | 'verzekeraar';
  from_color: string;
  type: 'Notitie' | 'Vraag Verzekeraar' | 'Vraag Client' | 'Indicatie' | 'Taak' | 'Documenten afronden en opsturen' | 'Reactie client' | 'Reactie verzekeraar' | 'Reactie Opdrachtgever' | 'Mijn reactie' | 'Vervolgreactie client' | 'Vervolgreactie verzekeraar' | 'Vervolgreactie Opdrachtgever' | 'Algemene response' | 'Anders' | string; // Allow custom types
  action: string;
  description: string;
  status: 'Geen urgentie' | 'Licht urgent' | 'Urgent' | 'Reactie nodig' | 'Afgehandeld' | 'In behandeling';
  is_urgent: boolean;
  needs_response: boolean;
  created_at: string;
  updated_at: string;
}

export const clientService = {
  // Get all clients
  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('naam');
    
    if (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
    
    // Transform the data to match the Client interface
    const transformedData = (data || []).map(client => ({
      ...client,
      name: client.naam || client.name || 'Onbekende cliënt', // Use naam if available, fallback to name
      phone: client.telefoon || client.phone || '', // Use telefoon if available, fallback to phone
    }));
    
    return transformedData;
  },

  // Get a single client by ID
  async getClient(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching client:', error);
      return null;
    }
    
    if (!data) return null;
    
    // Transform the data to match the Client interface
    return {
      ...data,
      name: data.naam || data.name || 'Onbekende cliënt',
      phone: data.telefoon || data.phone || '',
    };
  },

  // Get tasks for a specific client
  async getClientTasks(clientId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('taken')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching client tasks:', error);
      return [];
    }
    
    return data || [];
  },

  // Get all tasks
  async getAllTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('taken')
      .select(`
        *,
        clients (
          id,
          name,
          insurance_company
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
    
    return data || [];
  },

  // Get log entries for a specific client
  async getClientLogEntries(clientId: string): Promise<LogEntry[]> {
    const { data, error } = await supabase
      .from('logboek')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching client log entries:', error);
      return [];
    }
    
    return data || [];
  },

  // Get all log entries
  async getAllLogEntries(): Promise<LogEntry[]> {
    const { data, error } = await supabase
      .from('logboek')
      .select(`
        *,
        clients (
          id,
          name
        )
      `)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching log entries:', error);
      return [];
    }
    
    return data || [];
  },

  // Get recent log entries
  async getRecentLogEntries(limit: number = 5): Promise<LogEntry[]> {
    console.log('getRecentLogEntries called with limit:', limit);
    const { data, error } = await supabase
      .from('logboek')
      .select(`
        *,
        clients (
          id,
          name
        )
      `)
      .order('date', { ascending: false })
      .limit(limit);
    
    console.log('Supabase response - data:', data);
    console.log('Supabase response - error:', error);
    
    if (error) {
      console.error('Error fetching recent log entries:', error);
      return [];
    }
    
    return data || [];
  },

  // Create a new task
  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task | null> {
    const { data, error } = await supabase
      .from('taken')
      .insert(task)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating task:', error);
      return null;
    }
    
    return data;
  },

  // Create a new log entry
  async createLogEntry(entry: Omit<LogEntry, 'id' | 'created_at' | 'updated_at'>): Promise<LogEntry | null> {
    console.log('createLogEntry called with:', entry);
    
    const { data, error } = await supabase
      .from('logboek')
      .insert(entry)
      .select()
      .single();
    
    console.log('Supabase response - data:', data);
    console.log('Supabase response - error:', error);
    
    if (error) {
      console.error('Error creating log entry:', error);
      return null;
    }
    
    console.log('Log entry created successfully:', data);
    return data;
  },

  // Update a task
  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const { data, error } = await supabase
      .from('taken')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating task:', error);
      return null;
    }
    
    return data;
  },

  // Update a log entry
  async updateLogEntry(id: string, updates: Partial<LogEntry>): Promise<LogEntry | null> {
    const { data, error } = await supabase
      .from('logboek')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating log entry:', error);
      return null;
    }
    
    return data;
  },

  // Delete a task
  async deleteTask(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('taken')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting task:', error);
      return false;
    }
    
    return true;
  },

  // Delete a log entry
  async deleteLogEntry(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('logboek')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting log entry:', error);
      return false;
    }
    
    return true;
  }
};