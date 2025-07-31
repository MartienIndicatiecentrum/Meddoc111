import React from 'react';
import { Client } from './types';

interface BulkEditModalProps {
  open: boolean;
  onClose: () => void;
  clientIds: string[];
  onBulkUpdate: (updates: Partial<Client>) => void;
}

const BulkEditModal: React.FC<BulkEditModalProps> = ({
  open,
  onClose,
  clientIds,
  onBulkUpdate,
}) => {
  const [updates, setUpdates] = React.useState<Partial<Client>>({});
  if (!open) {
    return null;
  }
  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30'
      role='dialog'
      aria-modal='true'
      aria-labelledby='bulk-edit-title'
    >
      <div className='bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative'>
        <button
          className='absolute top-3 right-3 text-gray-400 hover:text-primary-600'
          onClick={onClose}
          aria-label='Sluit'
        >
          &times;
        </button>
        <h2 className='text-xl font-bold mb-4' id='bulk-edit-title'>
          Bulk Bewerken
        </h2>
        <div className='mb-4 text-sm text-gray-700'>
          Pas velden toe op <b>{clientIds.length}</b> geselecteerde cliënten.
        </div>
        {/* Voorbeeld: status, tags, careLevel, assignedCareCoordinator */}
        <form
          onSubmit={e => {
            e.preventDefault();
            onBulkUpdate(updates);
          }}
        >
          <div className='mb-3'>
            <label className='block text-xs mb-1'>Zorgstatus</label>
            <select
              className='input input-sm w-full'
              value={updates.care?.status || ''}
              onChange={e =>
                setUpdates(upd => ({
                  ...upd,
                  care: { ...upd.care, status: e.target.value },
                }))
              }
            >
              <option value=''>- Geen wijziging -</option>
              <option value='intake_pending'>Intake</option>
              <option value='assessment_phase'>Assessment</option>
              <option value='care_planning'>Zorgplan</option>
              <option value='active_care'>Actief</option>
              <option value='care_suspended'>Opgeschort</option>
              <option value='care_ended'>Beëindigd</option>
              <option value='transferred'>Overgedragen</option>
            </select>
          </div>
          <div className='mb-3'>
            <label className='block text-xs mb-1'>Tags toevoegen</label>
            <input
              type='text'
              className='input input-sm w-full'
              placeholder='tags, komma gescheiden'
              value={updates.tags?.join(',') || ''}
              onChange={e =>
                setUpdates(upd => ({
                  ...upd,
                  tags: e.target.value
                    .split(',')
                    .map(t => t.trim())
                    .filter(Boolean),
                }))
              }
            />
          </div>
          <div className='mb-3'>
            <label className='block text-xs mb-1'>Zorgcoördinator</label>
            <input
              type='text'
              className='input input-sm w-full'
              value={updates.assignedCareCoordinator || ''}
              onChange={e =>
                setUpdates(upd => ({
                  ...upd,
                  assignedCareCoordinator: e.target.value,
                }))
              }
            />
          </div>
          <div className='flex justify-end mt-6 gap-2'>
            <button
              type='button'
              className='btn btn-xs btn-outline'
              onClick={onClose}
            >
              Annuleren
            </button>
            <button type='submit' className='btn btn-xs btn-primary'>
              Opslaan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkEditModal;
