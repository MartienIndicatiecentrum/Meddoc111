import React from 'react';
import { Task, TaskStatus } from './types';
import { User, Clock, AlertTriangle, CheckCircle, FileText, Upload } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onUpload?: (task: Task) => void;
}

const statusColor: Record<TaskStatus, string> = {
  todo: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  sent: 'bg-purple-100 text-purple-800',
  pending: 'bg-orange-100 text-orange-800',
  overdue: 'bg-red-100 text-red-800',
};

const priorityColor = {
  low: 'border-green-300 bg-green-50',
  medium: 'border-yellow-300 bg-yellow-50',
  high: 'border-orange-300 bg-orange-50',
  urgent: 'border-red-400 bg-red-50 animate-pulse',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange, onEdit, onDelete, onUpload }) => {
  return (
    <div className={`flex flex-col md:flex-row items-start md:items-center gap-2 border-l-4 p-4 shadow-sm rounded-md mb-2 ${priorityColor[task.priority]}`}> 
      {/* Status indicator */}
      <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor[task.status]}`}>{task.status}</span>
      {/* Title & type */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-lg">{task.title}</span>
          {task.type && <span className="text-xs text-gray-500">({task.type})</span>}
        </div>
        <div className="text-xs text-gray-500 mt-1">{task.description}</div>
      </div>
      {/* Client info */}
              <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-blue-400" />
          <span className="inline-block px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 border border-purple-500 font-medium text-xs">
            {task.clientName}
          </span>
        </div>
      {/* Deadline countdown */}
      {task.deadline && (
        <div className="flex items-center gap-1 text-xs text-red-500">
          <Clock className="w-4 h-4" />
          <span>
            {formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}
          </span>
        </div>
      )}
      {/* Priority badge */}
      <span className={`ml-2 px-2 py-1 rounded text-xs font-bold uppercase ${priorityColor[task.priority]}`}>{task.priority}</span>
      {/* Quick actions */}
      <div className="flex gap-2 ml-2">
        {onStatusChange && task.status !== 'completed' && (
          <button className="text-green-600 hover:underline" onClick={() => onStatusChange(task.id, 'completed')}>
            <CheckCircle className="inline w-4 h-4 mr-1" /> Afgerond
          </button>
        )}
        {onEdit && (
          <button className="text-blue-600 hover:underline" onClick={() => onEdit(task)}>
            Bewerken
          </button>
        )}
        {onUpload && (
          <button className="text-green-600 hover:underline" onClick={() => onUpload(task)}>
            <Upload className="inline w-4 h-4 mr-1" /> Upload
          </button>
        )}
        {onDelete && (
          <button className="text-red-600 hover:underline" onClick={() => onDelete(task.id)}>
            <AlertTriangle className="inline w-4 h-4 mr-1" /> Verwijder
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
