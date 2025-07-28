import React from 'react';
import { Task, TaskStatus } from './types';
import TaskCard from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onUpload?: (task: Task) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onStatusChange, onEdit, onDelete, onUpload }) => {
  if (!tasks.length) {
    return <div className="text-gray-400 italic p-4">Geen taken gevonden.</div>;
  }
  return (
    <div className="flex flex-col gap-2">
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpload={onUpload}
        />
      ))}
    </div>
  );
};

export default TaskList;
