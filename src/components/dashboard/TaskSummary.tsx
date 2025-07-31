import React from 'react';
import { Link } from 'react-router-dom';

export interface Task {
  id: number;
  task: string;
  client: string;
  deadline: string;
}

interface TaskSummaryProps {
  tasks: Task[];
  max?: number;
}

const TaskSummary: React.FC<TaskSummaryProps> = ({ tasks, max = 3 }) => {
  const formatDeadline = (deadline: string) => {
    if (!deadline) {
      return 'Geen deadline';
    }
    const date = new Date(deadline);
    return date.toLocaleDateString('nl-NL');
  };

  const getPriorityColor = (deadline: string) => {
    if (!deadline) {
      return 'text-gray-400';
    }
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffDays = Math.ceil(
      (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      return 'text-red-600 font-semibold';
    } // Overdue
    if (diffDays <= 3) {
      return 'text-orange-600 font-medium';
    } // Due soon
    return 'text-gray-400'; // Normal
  };

  return (
    <div className='bg-white rounded shadow p-4 mb-4'>
      <div className='heading-sm mb-2'>Takenoverzicht</div>
      {tasks.length === 0 ? (
        <p className='text-sm text-gray-500 italic'>Geen taken gevonden</p>
      ) : (
        <ul className='text-sm text-gray-700 list-disc ml-6'>
          {tasks.slice(0, max).map(task => (
            <li key={task.id} className='mb-1'>
              <span className='font-medium'>{task.task}</span>
              <span className='text-gray-600'> - {task.client}</span>
              <span className={`text-xs ${getPriorityColor(task.deadline)}`}>
                (t/m {formatDeadline(task.deadline)})
              </span>
            </li>
          ))}
        </ul>
      )}
      {tasks.length > max && (
        <div className='mt-2'>
          <Link
            to='/taken'
            className='text-xs text-blue-600 hover:text-blue-800 hover:underline'
          >
            Bekijk alle {tasks.length} taken →
          </Link>
        </div>
      )}
    </div>
  );
};

export default TaskSummary;
