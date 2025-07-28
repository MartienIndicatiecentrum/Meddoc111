import React from 'react';
import { Client } from './types';
import { User, Phone, Mail, MapPin } from 'lucide-react';

interface ClientListProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onViewDetails: (clientId: string) => void;
  onQuickAction: (action: string, clientId: string) => void;
  selectedClients?: string[];
  onSelectClient?: (clientId: string) => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, onEdit, onViewDetails, onQuickAction, selectedClients = [], onSelectClient }) => {
  if (!clients.length) {
    return <div className="text-gray-400 italic p-8 text-center">Geen cliënten gevonden.</div>;
  }
  return (
    <ul className="divide-y divide-gray-100 bg-white rounded shadow">
      {clients.map(client => (
        <li key={client.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition">
          {onSelectClient && (
            <input type="checkbox" checked={selectedClients.includes(client.id)} onChange={() => onSelectClient(client.id)} aria-label="Selecteer cliënt" />
          )}
          <div className="flex-1 min-w-0">
                          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-500 font-medium text-sm">
              <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold text-xs flex-shrink-0">
                {(client.firstName[0] || '') + (client.lastName[0] || '')}
              </div>
              <span className="truncate">{client.fullName}</span>
            </div>
            <div className="text-xs text-gray-500 truncate flex gap-2 items-center">
              <Phone className="w-4 h-4 inline" /> {client.contact.phone}
              {client.contact.email && <><Mail className="w-4 h-4 inline ml-2" /> {client.contact.email}</>}
            </div>
            <div className="text-xs text-gray-400 truncate flex gap-2 items-center">
              <MapPin className="w-4 h-4 inline" /> {client.address.city}
            </div>
          </div>
          <div className="flex gap-2 ml-auto">
            <button className="btn btn-xs btn-outline" onClick={() => onViewDetails(client.id)} aria-label="Bekijk details">Details</button>
            <button className="btn btn-xs btn-outline" onClick={() => onEdit(client)} aria-label="Bewerk cliënt">Bewerken</button>
            <button className="btn btn-xs btn-outline" onClick={() => onQuickAction('call', client.id)} aria-label="Bel cliënt"><Phone className="w-4 h-4 inline" /></button>
            <button className="btn btn-xs btn-outline" onClick={() => onQuickAction('email', client.id)} aria-label="Mail cliënt"><Mail className="w-4 h-4 inline" /></button>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default ClientList;
