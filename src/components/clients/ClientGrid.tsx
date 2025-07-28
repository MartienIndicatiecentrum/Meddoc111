import React from 'react';
import { Client } from './types';
import ClientCard from './ClientCard';

interface ClientGridProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onViewDetails: (clientId: string) => void;
  onQuickAction: (action: string, clientId: string) => void;
  onDelete?: (clientId: string) => void;
  selectedClients?: string[];
  onSelectClient?: (clientId: string) => void;
}

const ClientGrid: React.FC<ClientGridProps> = ({ clients, onEdit, onViewDetails, onQuickAction, onDelete, selectedClients = [], onSelectClient }) => {
  if (!clients.length) {
    return <div className="text-gray-400 italic p-8 text-center">Geen cliënten gevonden.</div>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {clients.map(client => (
        <ClientCard
          key={client.id}
          client={client}
          onEdit={onEdit}
          onViewDetails={onViewDetails}
          onQuickAction={onQuickAction}
          onDelete={onDelete}
          isSelected={selectedClients.includes(client.id)}
          onSelect={onSelectClient}
        />
      ))}
    </div>
  );
};

export default ClientGrid;
