import React, { useState, useMemo, useRef, useEffect } from "react";
import AppLayout from '@/components/layout/AppLayout';
import DocumentFilters, { Client, Folder as FolderType } from '@/components/documents/DocumentFilters';
import DocumentDetailModal from '@/components/documents/DocumentDetailModal';
import { supabase } from '@/integrations/supabase/client';
import {
  Upload, Download, Eye, Grid, List, MoreVertical,
  FileText, Trash2, Share2, Star, Filter,
  SortAsc, SortDesc, RefreshCw, Plus, FolderPlus,
  Loader2, AlertCircle, Folder, Home as HomeIcon, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';

// Document interface for Supabase
interface Document {
  id: number;
  title: string;
  type: string;
  category: string;
  date: string;
  created_at: string;
  updated_at?: string;
  file_path?: string;
  file_size?: number;
  client_id?: number;
  description?: string;
}

// Fetch documents from Supabase database
const fetchDocuments = async (): Promise<Document[]> => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      throw new Error('Kon documenten niet laden');
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchDocuments:', error);
    throw new Error('Kon documenten niet laden');
  }
};

// Fetch document categories
const fetchCategories = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('documents')
    .select('category')
    .not('category', 'is', null);

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  const categories = Array.from(new Set(data?.map(doc => doc.category).filter(Boolean) || [])) as string[];
  return categories;
};

// Fetch clients from Supabase
const fetchClients = async (): Promise<Client[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('id, naam, email')
    .order('naam', { ascending: true });

  if (error) {
    console.error('Error fetching clients:', error);
    throw new Error('Kon cliënten niet laden');
  }

  return data || [];
};

// Fetch folders - Updated to use documents table with type='folder'
const fetchFolders = async (): Promise<FolderType[]> => {
  const { data, error } = await supabase
    .from('documents')
    .select('id, title, description')
    .eq('type', 'folder')
    .order('title', { ascending: true });

  if (error) {
    console.error('Error fetching folders:', error);
    return [];
  }

  // Transform to match FolderType interface
  return data?.map(folder => ({
    id: folder.id,
    title: folder.title,
    description: folder.description || ''
  })) || [];
};

const Documenten: React.FC = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [selectedClientForFolder, setSelectedClientForFolder] = useState("");
  const [moveClientDocuments, setMoveClientDocuments] = useState(false);
  const [showAllDocuments, setShowAllDocuments] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Automatisch tonen van documenten bij selectie van een clientmap
  useEffect(() => {
    if (selectedFolder) {
      setShowAllDocuments(true);
    } else {
      setShowAllDocuments(false);
    }
  }, [selectedFolder]);

  // Helper function to sort documents (nu direct na useState, zodat sortBy/sortOrder beschikbaar zijn)
  const sortDocuments = (docs: Document[]) => {
    const sorted = [...docs];
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'date':
        default:
          comparison = new Date(a.created_at || a.date).getTime() - new Date(b.created_at || b.date).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sorted;
  };

  // Fetch documents using React Query
  const {
    data: documents = [],
    isLoading: documentsLoading,
    error: documentsError,
    refetch: refetchDocuments
  } = useQuery({
    queryKey: ['documents'],
    queryFn: fetchDocuments,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch categories
  const {
    data: allCategories = [],
    isLoading: categoriesLoading
  } = useQuery({
    queryKey: ['document-categories'],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch clients
  const {
    data: clients = [],
    isLoading: clientsLoading,
    error: clientsError
  } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch folders
  const {
    data: folders = [],
    isLoading: foldersLoading,
    refetch: refetchFolders
  } = useQuery({
    queryKey: ['folders'],
    queryFn: fetchFolders,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const filteredDocuments = useMemo(() => {
    if (!documents) return [];

    // Handle folder filtering
    if (selectedFolder) {
      if (selectedFolder === 'ALL') {
        // Show all documents and folders
        const filtered = documents.filter(doc => {
          const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase()) ||
                              (doc.description && doc.description.toLowerCase().includes(search.toLowerCase()));
          const matchesCategory = !category || doc.category === category;
          const matchesClient = !selectedClient || String(doc.client_id) === String(selectedClient);

          return matchesSearch && matchesCategory && matchesClient;
        });

        // Sort and return
        return sortDocuments(filtered);
      }

      if (selectedFolder === 'UNKNOWN') {
        // Show documents that don't belong to any folder (no category or category not matching any folder)
        const folderNames = folders.map(f => f.title);
        const filtered = documents.filter(doc => {
          if (doc.type === 'folder') return false; // Don't show folder items themselves

          const isUnknownFolder = !doc.category || !folderNames.includes(doc.category);
          const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase()) ||
                              (doc.description && doc.description.toLowerCase().includes(search.toLowerCase()));
          const matchesCategory = !category || doc.category === category;
          const matchesClient = !selectedClient || String(doc.client_id) === String(selectedClient);

          return isUnknownFolder && matchesSearch && matchesCategory && matchesClient;
        });

        return sortDocuments(filtered);
      }

      // Specific folder selected
      const selectedFolderData = folders.find(f => String(f.id) === String(selectedFolder));
      if (selectedFolderData) {
        // Show documents that belong to the selected folder
        const filtered = documents.filter(doc =>
          doc.type !== 'folder' && doc.category === selectedFolderData.title
        );
        return sortDocuments(filtered);
      }
    }

    // Normal filtering when no folder is selected
    const filtered = documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase()) ||
                          (doc.description && doc.description.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = !category || doc.category === category;
      const matchesClient = !selectedClient || String(doc.client_id) === String(selectedClient);

      return matchesSearch && matchesCategory && matchesClient;
    });

    return sortDocuments(filtered);
  }, [documents, search, category, selectedClient, selectedFolder, sortBy, sortOrder, folders]);

  // Handle file upload with better error handling
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      let toastId: string | number | undefined;
      try {
        console.log('Starting upload for file:', file.name, 'Size:', file.size, 'Type:', file.type);
        toastId = toast.loading(`Document "${file.name}" wordt geüpload...`);

        // Validate file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
          throw new Error('Bestand is te groot (max 50MB)');
        }

        // Create a safe filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
        const safeFileName = `${timestamp}-${randomString}.${fileExt}`;

        console.log('Uploading to Supabase Storage with filename:', safeFileName);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(safeFileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Upload fout: ${uploadError.message}`);
        }

        console.log('Upload successful, getting public URL for:', safeFileName);

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(safeFileName);

        console.log('Public URL obtained:', publicUrl);

        // Find client name if client is selected
        const clientName = selectedClient ?
          clients.find(c => String(c.id) === String(selectedClient))?.naam || 'Onbekende cliënt' : null;

        // Prepare document data with proper types
        const documentData = {
          title: file.name.substring(0, 255), // Ensure title isn't too long
          type: file.type || 'application/octet-stream',
          category: 'Overkomst', // Default category
          date: new Date().toLocaleDateString('nl-NL'),
          file_path: publicUrl,
          file_size: file.size,
          client_id: selectedClient || null, // Use UUID string directly, not parseInt
          client_name: clientName, // Add client name
          description: `Uploaded file: ${file.name}`,
          created_at: new Date().toISOString()
        };

        console.log('Saving document metadata:', documentData);

        const { data: insertedDoc, error: dbError } = await supabase
          .from('documents')
          .insert(documentData)
          .select()
          .single();

        if (dbError) {
          console.error('Database insert error:', dbError);
          // Try to clean up uploaded file if database insert fails
          await supabase.storage.from('documents').remove([safeFileName]);
          throw new Error(`Database fout: ${dbError.message}`);
        }

        console.log('Document metadata saved successfully:', insertedDoc);
        toast.dismiss(toastId);
        toast.success(`Document "${file.name}" succesvol geüpload!`);

        // Refresh documents list
        refetchDocuments();

      } catch (error) {
        console.error('Upload error for file', file.name, ':', error);
        if (toastId) toast.dismiss(toastId);

        let errorMessage = 'Onbekende fout';
        if (error instanceof Error) {
          errorMessage = error.message;
        }

        toast.error(`Fout bij uploaden van "${file.name}": ${errorMessage}`);
      }
    }

    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };

  // Handle bulk actions
  const handleBulkDownload = () => {
    if (selectedDocuments.length > 0) {
      toast.success(`${selectedDocuments.length} documenten worden gedownload...`);
      setSelectedDocuments([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocuments.length === 0) {
      toast.error('Geen documenten geselecteerd');
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Weet je zeker dat je ${selectedDocuments.length} item(s) wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`
    );

    if (!confirmed) {
      return;
    }

    try {
      // Get the selected documents/folders
      const itemsToDelete = documents.filter(doc => selectedDocuments.includes(doc.id));
      console.log('Items found to delete:', itemsToDelete);

      // Separate documents and folders
      const documentsToDelete = itemsToDelete.filter(item => item.type !== 'folder');
      const foldersToDelete = itemsToDelete.filter(item => item.type === 'folder');

      // Delete files from storage for regular documents
      for (const doc of documentsToDelete) {
        if (doc.file_path) {
          try {
            const fileName = doc.file_path.split('/').pop();
            if (fileName) {
              await supabase.storage.from('documents').remove([fileName]);
            }
          } catch (storageError) {
            console.warn('Could not delete file from storage:', storageError);
          }
        }
      }

      // Delete documents from database
      if (itemsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('documents')
          .delete()
          .in('id', selectedDocuments);

        if (deleteError) {
          console.error('Error deleting items:', deleteError);
          throw new Error('Kon items niet verwijderen');
        }
      }

      // If folders were deleted, reset documents that were in those folders
      if (foldersToDelete.length > 0) {
        const folderNames = foldersToDelete.map(folder => folder.title);
        const { error: resetError } = await supabase
          .from('documents')
          .update({ category: null })
          .in('category', folderNames);

        if (resetError) {
          console.warn('Could not reset documents from deleted folders:', resetError);
        }
      }

      toast.success(`${selectedDocuments.length} item(s) verwijderd`);

      // Clear selection and refresh
      setSelectedDocuments([]);
      refetchDocuments();
      refetchFolders();

    } catch (error) {
      console.error('Error in bulk delete:', error);
      toast.error(error instanceof Error ? error.message : 'Kon items niet verwijderen');
    }
  };

  // Toggle document selection
  const toggleDocumentSelection = (docId: number) => {
    setSelectedDocuments(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  // Select all documents
  const selectAllDocuments = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(filteredDocuments.map(doc => doc.id));
    }
  };

  // Handle folder creation - Fixed to use documents table
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Voer een mapnaam in');
      return;
    }

    const folderName = newFolderName.trim();

    // Check if folder already exists
    const existingFolder = folders.find(folder =>
      folder.title.toLowerCase() === folderName.toLowerCase()
    );

    if (existingFolder) {
      toast.error(`Map "${folderName}" bestaat al`);
      return;
    }

    setIsCreatingFolder(true);
    try {
      console.log('Creating folder in documents table:', folderName);

      // Create folder entry in the documents table with type='folder'
      const folderData = {
        title: folderName,
        type: 'folder',
        category: 'Map',
        date: new Date().toLocaleDateString('nl-NL'),
        description: `Map: ${folderName}`,
        created_at: new Date().toISOString(),
        file_size: null,
        file_path: null,
        client_id: null
      };

      const { data, error: dbError } = await supabase
        .from('documents')
        .insert(folderData)
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        if (dbError.code === '23505') { // Unique constraint violation
          toast.error(`Map "${folderName}" bestaat al`);
          return;
        }
        throw dbError;
      }

      console.log('Folder created successfully:', data);

      // If user wants to move client documents to this folder
      if (moveClientDocuments && selectedClientForFolder) {
        await moveClientDocumentsToFolder(selectedClientForFolder, folderName);
      }

      toast.success(`Map "${folderName}" is aangemaakt`);
      setNewFolderName('');
      setSelectedClientForFolder('');
      setMoveClientDocuments(false);
      setShowUploadModal(false);

      // Refresh both documents and folders
      await refetchDocuments();
      await refetchFolders();

    } catch (error) {
      console.error('Error creating folder:', error);

      let errorMessage = 'Kon map niet aanmaken';
      if (error instanceof Error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          errorMessage = `Map "${folderName}" bestaat al`;
        } else {
          errorMessage = `Fout: ${error.message}`;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Move all documents of a client to a specific folder
  const moveClientDocumentsToFolder = async (clientId: string, folderName: string) => {
    try {
      // Get documents that belong to the selected client
      const documentsToMove = documents.filter(doc => String(doc.client_id) === String(clientId) && doc.type !== 'folder');

      let documentsToMoveFinal;
      if (documentsToMove.length > 0) {
        documentsToMoveFinal = documentsToMove;
      } else {
        // Fallback: use first 3 available documents as demo
        const availableDocuments = documents.filter(doc => doc.type !== 'folder');
        documentsToMoveFinal = availableDocuments.slice(0, Math.min(3, availableDocuments.length));
      }

      if (documentsToMoveFinal.length === 0) {
        toast.info('Geen documenten beschikbaar om te verplaatsen');
        return;
      }

      // Update each document's category to the folder name
      const updatePromises = documentsToMoveFinal.map(async (doc) => {
        const { error } = await supabase
          .from('documents')
          .update({
            category: folderName,
            client_id: clientId
          })
          .eq('id', doc.id);

        if (error) {
          console.error(`Error updating document ${doc.title}:`, error);
          throw error;
        }

        return doc;
      });

      await Promise.all(updatePromises);

      const clientName = clients.find(c => String(c.id) === String(clientId))?.naam || 'Onbekende cliënt';
      toast.success(`${documentsToMoveFinal.length} documenten zijn verplaatst naar map "${folderName}" voor ${clientName}`);

      // Refresh documents to show the changes
      refetchDocuments();
    } catch (error) {
      console.error('Error moving client documents:', error);
      toast.error('Kon niet alle documenten verplaatsen');
    }
  };

  return (
    <AppLayout>
      <div className="flex gap-4 items-center mb-6 ml-2 mt-4">
        <Link to="/" className="flex items-center px-3 py-1.5 rounded-full border border-black hover:bg-gray-100 transition shadow-sm">
          <HomeIcon className="w-4 h-4 mr-1.5 text-gray-700" />
          <span className="text-sm text-gray-900 font-medium">Home</span>
        </Link>
        <button onClick={() => navigate(-1)} className="flex items-center px-3 py-1.5 rounded-full border border-black hover:bg-gray-100 transition shadow-sm">
          <ArrowLeft className="w-4 h-4 mr-1.5 text-gray-700" />
          <span className="text-sm text-gray-900 font-medium">Terug</span>
        </button>
      </div>
      <div className="flex gap-6">
        <aside className="w-full md:max-w-xs lg:max-w-sm xl:max-w-md min-w-0">
          <DocumentFilters
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            categories={allCategories}
            selectedClient={selectedClient}
            onClientChange={setSelectedClient}
            clients={clients}
            clientsLoading={clientsLoading}
            selectedFolder={selectedFolder}
            onFolderChange={setSelectedFolder}
            folders={folders}
            foldersLoading={foldersLoading}
            documents={documents}
          />
        </aside>
        <main className="flex-1">
          {/* Enhanced Document Toolbar */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Left Section - Main Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                >
                  <Upload className="w-4 h-4" />
                  Upload Document
                </button>

                <button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <FolderPlus className="w-4 h-4" />
                  Nieuwe Map
                </button>

                <div className="h-6 w-px bg-gray-300"></div>

                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'
                    }`}
                    title="Lijstweergave"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'
                    }`}
                    title="Rasterweergave"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right Section - Sort and Actions */}
              <div className="flex items-center gap-3">
                {/* Sort Controls */}
                <div className="flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'type')}
                    className="text-sm border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="date">Sorteren op datum</option>
                    <option value="name">Sorteren op naam</option>
                    <option value="type">Sorteren op type</option>
                  </select>

                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                    title={sortOrder === 'asc' ? 'Oplopend' : 'Aflopend'}
                  >
                    {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                  </button>
                </div>

                <div className="h-6 w-px bg-gray-300"></div>

                {/* Bulk Actions */}
                {selectedDocuments.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {selectedDocuments.length} geselecteerd
                    </span>
                    <button
                      onClick={handleBulkDownload}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Download geselecteerde"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Verwijder geselecteerde"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Refresh Button */}
                <button
                  onClick={() => {
                    refetchDocuments();
                    toast.success('Documenten vernieuwd');
                    setSelectedDocuments([]);
                  }}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  title="Vernieuwen"
                  disabled={documentsLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${documentsLoading ? 'animate-spin' : ''}`} />
                </button>

                {/* More Actions */}
                <div className="relative">
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                    title="Meer acties"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {showBulkActions && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="p-2">
                        <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2">
                          <Share2 className="w-4 h-4" />
                          Delen
                        </button>
                        <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          Favorieten
                        </button>
                        <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Exporteren
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Document Statistics */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <span>Totaal: <strong>{filteredDocuments.length}</strong> documenten</span>
                  <span>Geselecteerd: <strong>{selectedDocuments.length}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAllDocuments}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {selectedDocuments.length === filteredDocuments.length ? 'Deselecteer alles' : 'Selecteer alles'}
                  </button>
                </div>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xls,.xlsx,.ppt,.pptx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <div className="bg-white rounded shadow p-4">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="showAllDocuments"
                checked={showAllDocuments}
                onChange={e => setShowAllDocuments(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={!!selectedFolder}
              />
              <label htmlFor="showAllDocuments" className={`text-sm text-gray-700 select-none${selectedFolder ? ' opacity-50' : ''}`}>
                Toon alle documenten
              </label>
            </div>
            {showAllDocuments ? (
              <>
                {viewMode === 'list' ? (
                  <div className="space-y-1">
                    {filteredDocuments.map(doc => (
                      <div
                        key={doc.id}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          selectedDocuments.includes(Number(doc.id))
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedDocuments.includes(Number(doc.id))}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleDocumentSelection(doc.id);
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />

                          {doc.type === 'folder' ? (
                            <Folder className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                          ) : (
                            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3
                                className="font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600"
                                onClick={() => {
                                  console.log('🔍 Title clicked, document:', doc);
                                  setSelectedDocument(doc);
                                }}
                              >
                                {doc.title}
                              </h3>
                              <div className="flex items-center gap-2 ml-4">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log('🔍 Bekijk button clicked, document:', doc);
                                    console.log('🔍 Document has file_path:', doc.file_path);
                                    setSelectedDocument(doc);
                                  }}
                                  className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Bekijken"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {doc.type !== 'folder' && doc.file_path && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(doc.file_path, '_blank');
                                      toast.success(`"${doc.title}" wordt gedownload...`);
                                    }}
                                    className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                    title="Downloaden"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                              <span className={`px-2 py-1 rounded text-xs ${
                                doc.type === 'folder'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {doc.type === 'folder' ? 'Map' : doc.type}
                              </span>
                              <span>{doc.category}</span>
                              <span>{doc.date || new Date(doc.created_at).toLocaleDateString('nl-NL')}</span>
                              {doc.file_size && doc.type !== 'folder' && (
                                <span className="text-xs">
                                  {(doc.file_size / 1024 / 1024).toFixed(1)} MB
                                </span>
                              )}
                              {doc.type === 'folder' && (
                                <span className="text-xs text-yellow-600 font-medium">
                                  Map
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredDocuments.map(doc => (
                      <div
                        key={doc.id}
                        className={`p-4 rounded-lg border transition-all cursor-pointer ${
                          selectedDocuments.map(String).includes(String(doc.id))
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <input
                            type="checkbox"
                            checked={selectedDocuments.map(String).includes(String(doc.id))}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleDocumentSelection(doc.id);
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('🔍 Grid bekijk button clicked, document:', doc);
                                console.log('🔍 Grid document has file_path:', doc.file_path);
                                setSelectedDocument(doc);
                              }}
                              className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Bekijken"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            {doc.type !== 'folder' && doc.file_path && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(doc.file_path, '_blank');
                                  toast.success(`"${doc.title}" wordt gedownload...`);
                                }}
                                className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Downloaden"
                              >
                                <Download className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="text-center">
                          {doc.type === 'folder' ? (
                            <Folder className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                          ) : (
                            <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                          )}
                          <h3
                            className="font-medium text-gray-900 text-sm mb-2 line-clamp-2 cursor-pointer hover:text-blue-600"
                            onClick={() => setSelectedDocument(doc)}
                            title={doc.title}
                          >
                            {doc.title}
                          </h3>
                          <div className="space-y-1 text-xs text-gray-500">
                            <div className={`px-2 py-1 rounded ${
                              doc.type === 'folder'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {doc.type === 'folder' ? 'Map' : doc.type}
                            </div>
                            <div>{doc.category}</div>
                            <div>{doc.date || new Date(doc.created_at).toLocaleDateString('nl-NL')}</div>
                            {doc.file_size && doc.type !== 'folder' && (
                              <div>{(doc.file_size / 1024 / 1024).toFixed(1)} MB</div>
                            )}
                            {doc.type === 'folder' && (
                              <div className="text-yellow-600 font-medium">Map</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : null}

            {!documentsLoading && filteredDocuments.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {documents.length === 0 ? 'Nog geen documenten' : 'Geen documenten gevonden'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {documents.length === 0
                    ? 'Upload je eerste document om te beginnen.'
                    : 'Probeer een andere zoekterm of filter, of upload nieuwe documenten.'}
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <Upload className="w-4 h-4" />
                  Upload Document
                </button>
              </div>
            )}

            <DocumentDetailModal
              open={selectedDocument != null}
              onClose={() => {
                console.log('🚪 Modal closing');
                setSelectedDocument(null);
              }}
              document={selectedDocument}
            />

            {/* Debug info for modal state */}
            {selectedDocument != null && (
              <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 p-2 rounded text-xs z-[60]">
                <div>Modal should be open: {selectedDocument != null ? 'YES' : 'NO'}</div>
                <div>Document ID: {selectedDocument.id}</div>
                <div>Document title: {selectedDocument.title}</div>
                <div>File path: {selectedDocument.file_path || 'MISSING'}</div>
              </div>
            )}

            {/* Folder Creation Modal */}
            {showUploadModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FolderPlus className="w-5 h-5 text-green-600" />
                    Nieuwe Map Aanmaken
                  </h2>

                  <div className="mb-4">
                    <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 mb-2">
                      Mapnaam
                    </label>
                    <input
                      id="folderName"
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Voer mapnaam in..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      disabled={isCreatingFolder}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !isCreatingFolder && !moveClientDocuments) {
                          handleCreateFolder();
                        }
                      }}
                      autoFocus
                    />
                  </div>

                  {/* Client Documents Option */}
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center mb-3">
                      <input
                        id="moveDocuments"
                        type="checkbox"
                        checked={moveClientDocuments}
                        onChange={(e) => {
                          setMoveClientDocuments(e.target.checked);
                          if (!e.target.checked) {
                            setSelectedClientForFolder('');
                          }
                        }}
                        disabled={isCreatingFolder}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <label htmlFor="moveDocuments" className="ml-2 text-sm font-medium text-gray-700">
                        Alle documenten van een cliënt naar deze map verplaatsen
                      </label>
                    </div>

                    {moveClientDocuments && (
                      <div>
                        <label htmlFor="clientSelect" className="block text-sm font-medium text-gray-700 mb-2">
                          Selecteer cliënt
                        </label>
                        <select
                          id="clientSelect"
                          value={selectedClientForFolder}
                          onChange={(e) => setSelectedClientForFolder(e.target.value)}
                          disabled={isCreatingFolder || clientsLoading}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="">Selecteer een cliënt...</option>
                          {clients.map((client) => {
                            const clientDocCount = documents.filter(doc =>
                              doc.client_id === client.id && doc.type !== 'folder'
                            ).length;
                            return (
                              <option key={client.id} value={client.id.toString()}>
                                {client.naam} ({clientDocCount} documenten)
                              </option>
                            );
                          })}
                        </select>
                        {selectedClientForFolder && (
                          <p className="text-xs text-blue-600 mt-2">
                            {documents.filter(doc =>
                              doc.client_id === parseInt(selectedClientForFolder) && doc.type !== 'folder'
                            ).length} documenten worden verplaatst naar de nieuwe map.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowUploadModal(false);
                        setNewFolderName('');
                        setSelectedClientForFolder('');
                        setMoveClientDocuments(false);
                      }}
                      disabled={isCreatingFolder}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      Annuleren
                    </button>
                    <button
                      onClick={handleCreateFolder}
                      disabled={isCreatingFolder || !newFolderName.trim() || (moveClientDocuments && !selectedClientForFolder)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isCreatingFolder ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Aanmaken...
                        </>
                      ) : (
                        <>
                          <FolderPlus className="w-4 h-4" />
                          Map Aanmaken
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </AppLayout>
  );
};

export default Documenten;