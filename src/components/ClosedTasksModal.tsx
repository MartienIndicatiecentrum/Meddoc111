import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface Task {
  id: string;
  title: string;
  status: string;
  deadline: string;
}

interface ClosedTasksModalProps {
  clientId: string;
  open: boolean;
  onClose: () => void;
}

const ClosedTasksModal: React.FC<ClosedTasksModalProps> = ({
  clientId,
  open,
  onClose,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status, deadline')
        .eq('client_id', clientId)
        .eq('status', 'afgerond')
        .order('deadline');
      if (!error && data) {
        setTasks(data);
      }
      setLoading(false);
    };
    if (open && clientId) {
      fetchTasks();
    }
  }, [open, clientId]);

  if (!open) {
    return null;
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-lg p-6 w-full max-w-lg'>
        <h2 className='text-lg font-bold mb-4'>Afgeronde Taken</h2>
        {loading ? (
          <div>Bezig met laden...</div>
        ) : tasks.length === 0 ? (
          <div>Geen afgeronde taken gevonden.</div>
        ) : (
          <ul className='divide-y divide-gray-200 mb-4'>
            {tasks.map(task => (
              <li
                key={task.id}
                className='py-2 flex justify-between items-center'
              >
                <span>{task.title}</span>
                <span className='text-xs text-gray-500'>
                  Deadline:{' '}
                  {task.deadline
                    ? new Date(task.deadline).toLocaleDateString('nl-NL')
                    : '-'}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Button variant='outline' onClick={onClose}>
          Sluiten
        </Button>
      </div>
    </div>
  );
};

export default ClosedTasksModal;
