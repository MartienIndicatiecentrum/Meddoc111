import React, { useState, useMemo, useRef, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import DocumentFilters, {
  Client,
  Folder as FolderType,
} from '@/components/documents/DocumentFilters';
import DocumentDetailModal from '@/components/documents/DocumentDetailModal';
import { supabase } from '@/integrations/supabase/client';
import {
  Upload,
  Download,
  Eye,
  Grid,
  List,
  MoreVertical,
  FileText,
  Trash2,
  Share2,
  Star,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
  Plus,
  FolderPlus,
  Loader2,
  AlertCircle,
  Folder,
  Home as HomeIcon,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';

const Documenten: React.FC = () => {
  const [showAllDocuments, setShowAllDocuments] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    if (selectedFolder) {
      setShowAllDocuments(true);
    } else {
      setShowAllDocuments(false);
    }
  }, [selectedFolder]);

  const toggleDocumentSelection = (docId: number) => {
    setSelectedDocuments(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const dummyDocuments = [
    {
      id: 1,
      title: 'Document A',
      type: 'pdf',
      category: 'Test',
      date: '2025-08-01',
      created_at: '2025-08-01T00:00:00Z',
      file_size: 1048576,
    },
    {
      id: 2,
      title: 'Document B',
      type: 'folder',
      category: 'Test',
      date: '2025-07-01',
      created_at: '2025-07-01T00:00:00Z',
    },
  ];

  return (
    <AppLayout>
      <div className='flex items-center gap-4 mb-4'>
        <Link
          to='/'
          className='flex items-center px-3 py-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 transition'
        >
          <HomeIcon className='w-5 h-5 mr-1 text-gray-600' />
          <span className='text-sm font-medium text-gray-700'>Home</span>
        </Link>
        <div className='flex-1'>
          <DocumentFilters />
        </div>
        <div className='flex items-center gap-2'>
          <input
            type='checkbox'
            id='showAllDocuments'
            checked={showAllDocuments}
            onChange={e => setShowAllDocuments(e.target.checked)}
            className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
            disabled={!!selectedFolder}
          />
          <label
            htmlFor='showAllDocuments'
            className={`text-sm text-gray-700 select-none${selectedFolder ? ' opacity-50' : ''}`}
          >
            Toon alle documenten
          </label>
        </div>
      </div>

      {showAllDocuments && (
        <div
          className={
            viewMode === 'list'
              ? 'space-y-1'
              : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          }
        >
          {dummyDocuments.map(doc => (
            <div
              key={doc.id}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                selectedDocuments.includes(doc.id)
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className='flex items-center gap-3'>
                <input
                  type='checkbox'
                  checked={selectedDocuments.includes(doc.id)}
                  onChange={e => {
                    e.stopPropagation();
                    toggleDocumentSelection(doc.id);
                  }}
                  className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                />
                {doc.type === 'folder' ? (
                  <Folder className='w-5 h-5 text-yellow-600 flex-shrink-0' />
                ) : (
                  <FileText className='w-5 h-5 text-blue-600 flex-shrink-0' />
                )}
                <div className='flex-1 min-w-0'>
                  <h3 className='font-medium text-gray-900 truncate'>
                    {doc.title}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Documenten;
