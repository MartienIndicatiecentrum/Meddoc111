import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Client, ClientStatus, CareLevel } from '../components/clients/types';
import { clientService } from '../services/clientService';

export type ViewMode = 'grid' | 'list' | 'table';

export interface ClientFilters {
  searchTerm: string;
  status: ClientStatus[];
  careLevel: CareLevel[];
  ageRange: { min: number; max: number };
  municipality: string[];
  careCoordinator: string[];
  insuranceCompany: string[];
  tags: string[];
  lastActivityDate: { from: Date; to: Date };
  hasUpcomingTasks: boolean;
  hasOverdueTasks: boolean;
}

interface ClientStore {
  clients: Client[];
  selectedClients: string[];
  searchFilters: Partial<ClientFilters>;
  viewMode: ViewMode;
  modals: {
    clientDetail: { open: boolean; clientId?: string };
    newClient: { open: boolean };
    bulkEdit: { open: boolean };
  };
  // Actions
  loadClients: (filters?: Partial<ClientFilters>) => Promise<void>;
  createClient: (client: Partial<Client>) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  bulkUpdateClients: (ids: string[], updates: Partial<Client>) => Promise<void>;
  setSearchFilters: (filters: Partial<ClientFilters>) => void;
  searchClients: (term: string) => void;
  selectClient: (id: string) => void;
  selectAllClients: () => void;
  clearSelection: () => void;
  setViewMode: (mode: ViewMode) => void;
  openModal: (modal: keyof ClientStore['modals'], clientId?: string) => void;
  closeModal: (modal: keyof ClientStore['modals']) => void;
}

export const useClientStore = create<ClientStore>()(
  persist(
    (set, get) => ({
      clients: [],
      selectedClients: [],
      searchFilters: {},
      viewMode: 'grid',
      modals: {
        clientDetail: { open: false },
        newClient: { open: false },
        bulkEdit: { open: false },
      },
      async loadClients(filters) {
        try {
          const clients = await clientService.getAllClients();
          set({ clients });
        } catch (error) {
          console.error('Error loading clients:', error);
          set({ clients: [] });
        }
      },
      async createClient(client) {
        try {
          const newClient = await clientService.createClient(client);
          set(state => ({ clients: [...state.clients, newClient] }));
        } catch (error) {
          console.error('Error creating client:', error);
          throw error;
        }
      },
      async updateClient(id, updates) {
        try {
          const updatedClient = await clientService.updateClient(id, updates);
          set(state => ({
            clients: state.clients.map(c => c.id === id ? updatedClient : c)
          }));
        } catch (error) {
          console.error('Error updating client:', error);
          throw error;
        }
      },
      async deleteClient(id) {
        try {
          await clientService.deleteClient(id);

          // After successful deletion from Supabase, update local state
          set(state => ({
            clients: state.clients.filter(client => client.id !== id),
            selectedClients: state.selectedClients.filter(clientId => clientId !== id)
          }));
        } catch (error) {
          console.error('Error deleting client:', error);
          throw error;
        }
      },
      async bulkUpdateClients(ids, updates) {
        // TODO: Supabase bulk update
      },
      setSearchFilters(filters) {
        set(state => ({ searchFilters: { ...state.searchFilters, ...filters } }));
      },
      searchClients(term) {
        set(state => ({ searchFilters: { ...state.searchFilters, searchTerm: term } }));
      },
      selectClient(id) {
        set(state => ({
          selectedClients: state.selectedClients.includes(id)
            ? state.selectedClients.filter(cid => cid !== id)
            : [...state.selectedClients, id],
        }));
      },
      selectAllClients() {
        set(state => ({ selectedClients: state.clients.map(c => c.id) }));
      },
      clearSelection() {
        set({ selectedClients: [] });
      },
      setViewMode(mode) {
        set({ viewMode: mode });
      },
      openModal(modal, clientId) {
        set(state => ({
          modals: {
            ...state.modals,
            [modal]: { open: true, ...(clientId ? { clientId } : {}) },
          },
        }));
      },
      closeModal(modal) {
        set(state => ({
          modals: {
            ...state.modals,
            [modal]: { open: false },
          },
        }));
      },
    }),
    { name: 'client-store', version: 1 }
  )
);
