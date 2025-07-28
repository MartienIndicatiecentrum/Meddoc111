import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import FileUploader from '@/components/upload/FileUploader';

const FileUpload: React.FC = () => {
  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Document Upload & RAG Processing
          </h1>
          <p className="text-gray-600">
            Upload documenten naar Supabase en verwerk ze automatisch met LangChain RAG voor AI-gestuurde zoekopdrachten.
          </p>
        </div>
        
        <FileUploader />
      </div>
    </AppLayout>
  );
};

export default FileUpload;
