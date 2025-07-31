import React from 'react';
import { Client } from './types';
import { Phone, Mail, ChevronRight } from 'lucide-react';

interface MobileClientCardProps {
  client: Client;
  onViewDetails: (clientId: string) => void;
  onQuickAction: (action: string, clientId: string) => void;
  isSelected?: boolean;
  onSelect?: (clientId: string) => void;
}

const MobileClientCard: React.FC<MobileClientCardProps> = ({
  client,
  onViewDetails,
  onQuickAction,
  isSelected,
  onSelect,
}) => {
  const initials =
    `${client.firstName[0] ?? ''}${client.lastName[0] ?? ''}`.toUpperCase();
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg shadow-sm border bg-white mb-2 relative ${isSelected ? 'ring-2 ring-primary-500' : ''}`}
      tabIndex={0}
      aria-label={`Cliëntkaart mobiel voor ${client.fullName}`}
    >
      {onSelect && (
        <input
          type='checkbox'
          className='absolute left-2 top-2'
          checked={isSelected}
          onChange={() => onSelect(client.id)}
          aria-label='Selecteer cliënt'
        />
      )}
      <div className='flex-1 min-w-0'>
        <div className='inline-flex items-center gap-2 px-2 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-500 font-semibold text-sm'>
          <div className='w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold text-xs flex-shrink-0'>
            {initials}
          </div>
          <span className='truncate'>{client.fullName}</span>
        </div>
        <div className='text-xs text-gray-500 truncate flex gap-1 items-center'>
          <Phone className='w-4 h-4 inline' /> {client.contact.phone}
          {client.contact.email && (
            <>
              <Mail className='w-4 h-4 inline ml-1' /> {client.contact.email}
            </>
          )}
        </div>
        <div className='text-xs text-gray-400 truncate'>
          {client.address.city}
        </div>
      </div>
      <button
        className='ml-auto p-2'
        onClick={() => onViewDetails(client.id)}
        aria-label='Bekijk details'
      >
        <ChevronRight className='w-5 h-5 text-gray-400' />
      </button>
    </div>
  );
};

export default MobileClientCard;
