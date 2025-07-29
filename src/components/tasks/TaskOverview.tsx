import React, { useState } from 'react';
import TaskList from './TaskList';
import { Task } from './types';
import FileUploader from '../upload/FileUploader';
import { X } from 'lucide-react';

interface TaskOverviewProps {
  tasks: Task[];
}

const TaskOverview: React.FC<TaskOverviewProps> = ({ tasks }) => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleUpload = (task: Task) => {
    setSelectedTask(task);
    setUploadModalOpen(true);
  };

  const handleUploadSuccess = (fileName: string) => {
    console.log(`Document ${fileName} uploaded for task:`, selectedTask?.title);
    // Here you could add logic to associate the uploaded document with the task
    setUploadModalOpen(false);
    setSelectedTask(null);
  };

  const closeModal = () => {
    setUploadModalOpen(false);
    setSelectedTask(null);
  };

  return (
    <div className="task-overview p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Takenoverzicht</h2>
      <TaskList tasks={tasks} onUpload={handleUpload} />

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Document uploaden voor: {selectedTask?.title}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Taak:</strong> {selectedTask?.title}<br/>
                <strong className="text-gray-500">Cliënt:</strong> <span className="inline-block px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 border border-purple-500 font-medium text-xs ml-1">{selectedTask?.clientName}</span><br/>
                <strong>Deadline:</strong> {selectedTask?.deadline ? new Date(selectedTask.deadline).toLocaleDateString('nl-NL') : 'Geen deadline'}
              </p>
            </div>

            <FileUploader onUploadSuccess={handleUploadSuccess} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskOverview;
