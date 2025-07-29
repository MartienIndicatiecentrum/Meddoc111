import React, { useMemo } from 'react';
import { useClientStore } from '../store/clientStore';
import ClientSearchAndFilters from '../components/clients/ClientSearchAndFilters';
import ClientGrid from '../components/clients/ClientGrid';
import ClientList from '../components/clients/ClientList';
import ClientTable from '../components/clients/ClientTable';
import { Client } from '../components/clients/types';

// TODO: Import ClientStatsWidget, BulkActionsToolbar, ExportImportPanel, ClientDetailModal, etc.

const mockClients: Client[] = [];
// TODO: fetch from Supabase or Zustand store

const ClientOverview: React.FC = () => {
  const { viewMode, setViewMode, searchFilters, clients, deleteClient } = useClientStore();

  const handleDeleteClient = async (clientId: string) => {
    try {
      await deleteClient(clientId);
      // TODO: Show success notification
    } catch (error) {
      console.error('Error deleting client:', error);
      // TODO: Show error notification
    }
  };

  return (
    <div className="client-overview p-4 max-w-7xl mx-auto">
      {/* Header, stats, controls, etc. */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <h1 className="text-2xl font-bold">Cliënt Overzicht</h1>
        <div className="flex gap-2">
          <button onClick={() => setViewMode('grid')} className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline'}`}>Grid</button>
          <button onClick={() => setViewMode('list')} className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`}>Lijst</button>
          <button onClick={() => setViewMode('table')} className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline'}`}>Tabel</button>
        </div>
      </div>

      {/* Search & filters */}
      <ClientSearchAndFilters allClients={clients} />

      {/* Main content area */}
      <div className="mt-4">
        {viewMode === 'grid' && <ClientGrid clients={clients} onEdit={() => {}} onViewDetails={() => {}} onQuickAction={() => {}} onDelete={handleDeleteClient} />}
        {viewMode === 'list' && <ClientList clients={clients} onEdit={() => {}} onViewDetails={() => {}} onQuickAction={() => {}} />}
        {viewMode === 'table' && <ClientTable clients={clients} columns={[]} onEdit={() => {}} onViewDetails={() => {}} onQuickAction={() => {}} />}
      </div>

      {/* TODO: BulkActionsToolbar, ExportImportPanel, Modals, etc. */}
    </div>
  );
};

export default ClientOverview;
