// Kopie van TakenPage, aangepast voor TakenVerzekeraar
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChangeEvent } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { Link } from 'react-router-dom';

const VERZEKERAAR_WORKFLOW = [
  { key: 'ontvangen', label: 'Vraag ontvangen' },
  { key: 'beantwoord', label: 'Vraag beantwoord' },
  { key: 'aanvullend', label: 'Aanvullende vragen' },
  { key: 'afgerond', label: 'Afgerond' },
];

// Types
interface Task {
  id: string;
  client_id: string;
  title: string;
  status: string;
  insurer?: string;
  deadline?: string;
  description?: string;
  client_name?: string;
  upload_documenten?: string[]; // <-- array van bestandsnamen
}
interface Client {
  id: string;
  naam: string;
}
interface SupabaseTaskRow {
  id: string;
  client_id: string;
  beschrijving?: string;
  status: string;
  verzekeraar?: string;
  deadline?: string;
  clientennaam?: string;
  upload_documenten?: string | null; // opgeslagen als JSON-string
}

// Fetch taken uit Supabase
const fetchTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('taken')
    .select(
      'id, client_id, beschrijving, status, verzekeraar, deadline, clientennaam, upload_documenten'
    )
    .order('updated_at', { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return (data || []).map((row: SupabaseTaskRow) => ({
    id: row.id,
    client_id: row.client_id,
    title: row.beschrijving || 'Geen titel',
    status: row.status,
    insurer: row.verzekeraar,
    deadline: row.deadline,
    client_name: row.clientennaam,
    upload_documenten: row.upload_documenten
      ? JSON.parse(row.upload_documenten)
      : [],
  }));
};

const fetchClients = async (): Promise<Client[]> => {
  const { data, error } = await supabase
    .from('clients_mockdata')
    .select('id, naam')
    .order('naam');
  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const NL_VERZEKERAARS = [
  'Zilveren Kruis (Achmea)',
  'CZ',
  'VGZ',
  'Menzis',
  'ONVZ',
  'DSW',
  'a.s.r.',
  'Eucare',
  'Salland Zorgverzekeringen',
  'Zorg en Zekerheid',
  'Interpolis',
  'Just',
  'Nationale-Nederlanden',
  'OHRA',
  'Stad Holland Zorgverzekeraar',
];
const TakenVerzekeraar: React.FC = () => {
  const queryClient = useQueryClient();
  const [filterClient, setFilterClient] = useState('');
  const [filterInsurer, setFilterInsurer] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalStatus, setModalStatus] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    client_id: '',
    verzekeraar: '',
    beschrijving: '',
    deadline: '',
    status: '',
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [removingDoc, setRemovingDoc] = useState<{
    taskId: string;
    fileName: string;
  } | null>(null);
  const [removingDocLoading, setRemovingDocLoading] = useState(false);
  const [renamingDoc, setRenamingDoc] = useState<{
    taskId: string;
    oldName: string;
    newName: string;
  } | null>(null);
  const [renamingDocLoading, setRenamingDocLoading] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<{
    [taskId: string]: Set<string>;
  }>({});
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkRenameOpen, setBulkRenameOpen] = useState(false);
  const [bulkRenameMap, setBulkRenameMap] = useState<{
    [taskId: string]: { [oldName: string]: string };
  }>({});
  const [bulkRenameStatus, setBulkRenameStatus] = useState<{
    [taskId: string]: {
      [oldName: string]: 'pending' | 'success' | 'error' | 'renaming';
    };
  }>({});
  const [selectAllTasks, setSelectAllTasks] = useState(false);
  const [selectAllDocs, setSelectAllDocs] = useState<{
    [taskId: string]: boolean;
  }>({});
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [undoStack, setUndoStack] = useState<
    { id: string; upload_documenten: string[] }[][]
  >([]);
  const [showUndo, setShowUndo] = useState(false);
  const [filterDocStatus, setFilterDocStatus] = useState<
    'all' | 'success' | 'error' | 'renaming'
  >('all');
  const [filterTaskStatus, setFilterTaskStatus] = useState<
    'all' | 'withDocs' | 'withoutDocs' | 'withErrors'
  >('all');
  const [verzekeraars, setVerzekeraars] = useState<string[]>(NL_VERZEKERAARS);

  // Probeer verzekeraars uit Supabase te halen
  useEffect(() => {
    const fetchVerzekeraars = async () => {
      try {
        const { data, error } = await supabase
          .from('verzekeraars_nl')
          .select('naam');
        if (!error && data && Array.isArray(data) && data.length > 0) {
          setVerzekeraars(data.map(v => v.naam).filter(Boolean));
        }
      } catch (e) {
        // fallback op hardcoded lijst
      }
    };
    fetchVerzekeraars();
  }, []);

  // Data ophalen
  const {
    data: tasks = [],
    isLoading: loadingTasks,
    error: tasksError,
  } = useQuery<Task[]>({
    queryKey: ['verzekeraar-tasks'],
    queryFn: fetchTasks,
  });
  const {
    data: clients = [],
    isLoading: loadingClients,
    error: clientsError,
  } = useQuery<Client[]>({
    queryKey: ['verzekeraar-clients'],
    queryFn: fetchClients,
  });

  // Unieke verzekeraars uit taken
  const insurers: string[] = useMemo(
    () =>
      Array.from(
        new Set(
          (tasks as Task[]).map(t => t.insurer).filter(Boolean) as string[]
        )
      ),
    [tasks]
  );

  // Filtering
  const filteredTasks: Task[] = useMemo(() => {
    return (tasks as Task[]).filter(
      t =>
        (!filterClient || t.client_id === filterClient) &&
        (!filterInsurer || t.insurer === filterInsurer) &&
        (!search || t.title.toLowerCase().includes(search.toLowerCase()))
    );
  }, [tasks, filterClient, filterInsurer, search]);

  // Groepeer per workflow-stap
  const tasksByStatus: Record<string, Task[]> = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    VERZEKERAAR_WORKFLOW.forEach(col => {
      grouped[col.key] = [];
    });
    (filteredTasks as Task[]).forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });
    return grouped;
  }, [filteredTasks]);

  // Filter taken op status
  const filteredTasksByStatus = useMemo(() => {
    let filtered = tasks;
    if (filterTaskStatus === 'withDocs') {
      filtered = tasks.filter(
        t => t.upload_documenten && t.upload_documenten.length > 0
      );
    }
    if (filterTaskStatus === 'withoutDocs') {
      filtered = tasks.filter(
        t => !t.upload_documenten || t.upload_documenten.length === 0
      );
    }
    if (filterTaskStatus === 'withErrors') {
      filtered = tasks.filter(
        t =>
          t.upload_documenten &&
          t.upload_documenten.some(f => bulkRenameStatus[t.id]?.[f] === 'error')
      );
    }
    return filtered;
  }, [tasks, filterTaskStatus, bulkRenameStatus]);

  // Nieuwe taak aanmaken
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: typeof newTask & { status: string }) => {
      const client = (clients as Client[]).find(
        c => c.id === taskData.client_id
      );
      const { error } = await supabase.from('taken').insert({
        client_id: taskData.client_id,
        clientennaam: client?.naam || '',
        verzekeraar: taskData.verzekeraar,
        beschrijving: taskData.beschrijving,
        deadline: taskData.deadline || null,
        status: taskData.status,
      });
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verzekeraar-tasks'] });
      toast.success('Nieuwe taak aangemaakt');
      setShowModal(false);
      setNewTask({
        client_id: '',
        verzekeraar: '',
        beschrijving: '',
        deadline: '',
        status: '',
      });
    },
    onError: (error: unknown) => {
      let message = 'Onbekende fout';
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    },
  });

  // Bewerk taak
  const editTaskMutation = useMutation({
    mutationFn: async (
      taskData: typeof newTask & { id: string; status: string }
    ) => {
      const client = (clients as Client[]).find(
        c => c.id === taskData.client_id
      );
      const { error } = await supabase
        .from('taken')
        .update({
          client_id: taskData.client_id,
          clientennaam: client?.naam || '',
          verzekeraar: taskData.verzekeraar,
          beschrijving: taskData.beschrijving,
          deadline: taskData.deadline || null,
          status: taskData.status,
        })
        .eq('id', taskData.id);
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verzekeraar-tasks'] });
      toast.success('Taak bijgewerkt');
      setShowModal(false);
      setIsEditMode(false);
      setEditingTaskId(null);
      setNewTask({
        client_id: '',
        verzekeraar: '',
        beschrijving: '',
        deadline: '',
        status: '',
      });
    },
    onError: (error: unknown) => {
      let message = 'Onbekende fout';
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    },
  });

  // Verwijder taak
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('taken').delete().eq('id', id);
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verzekeraar-tasks'] });
      toast.success('Taak verwijderd');
      setDeleteConfirmId(null);
    },
    onError: (error: unknown) => {
      let message = 'Onbekende fout';
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    },
  });

  // Upload document
  const uploadDocuments = async (taskId: string, files: File[]) => {
    const uploadedNames: string[] = [];
    for (const file of files) {
      const filePath = `tasks/${taskId}/${file.name}`;
      const { error } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { upsert: true });
      if (error) {
        throw new Error(error.message);
      }
      uploadedNames.push(file.name);
    }
    // Haal bestaande documenten op
    const { data, error: fetchError } = await supabase
      .from('taken')
      .select('upload_documenten')
      .eq('id', taskId)
      .single();
    let currentDocs: string[] = [];
    if (!fetchError && data && data.upload_documenten) {
      try {
        currentDocs = JSON.parse(data.upload_documenten);
      } catch (e) {
        /* ignore parse error, fallback to [] */
      }
    }
    const allDocs = Array.from(new Set([...currentDocs, ...uploadedNames]));
    // Update taak met alle bestandsnamen
    const { error: updateError } = await supabase
      .from('taken')
      .update({ upload_documenten: JSON.stringify(allDocs) })
      .eq('id', taskId);
    if (updateError) {
      throw new Error(updateError.message);
    }
  };
  const uploadMutation = useMutation({
    mutationFn: async ({ taskId, files }: { taskId: string; files: File[] }) =>
      uploadDocuments(taskId, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verzekeraar-tasks'] });
      toast.success('Document(en) geüpload');
      setUploadingTaskId(null);
      setUploadFiles([]);
    },
    onError: (error: unknown) => {
      let message = 'Onbekende fout';
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    },
  });

  // Helper om bestand te verwijderen uit storage en taak-array
  const removeDocument = async (taskId: string, fileName: string) => {
    setRemovingDocLoading(true);
    const filePath = `tasks/${taskId}/${fileName}`;
    // 1. Verwijder uit storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([filePath]);
    if (storageError) {
      throw new Error(storageError.message);
    }
    // 2. Haal huidige lijst op
    const { data, error: fetchError } = await supabase
      .from('taken')
      .select('upload_documenten')
      .eq('id', taskId)
      .single();
    let currentDocs: string[] = [];
    if (!fetchError && data && data.upload_documenten) {
      try {
        currentDocs = JSON.parse(data.upload_documenten);
      } catch (e) {
        /* ignore parse error */
      }
    }
    // 3. Verwijder uit array
    const newDocs = currentDocs.filter(f => f !== fileName);
    // 4. Update taak
    const { error: updateError } = await supabase
      .from('taken')
      .update({ upload_documenten: JSON.stringify(newDocs) })
      .eq('id', taskId);
    if (updateError) {
      throw new Error(updateError.message);
    }
    setRemovingDocLoading(false);
  };
  const removeDocMutation = useMutation({
    mutationFn: async ({
      taskId,
      fileName,
    }: {
      taskId: string;
      fileName: string;
    }) => removeDocument(taskId, fileName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verzekeraar-tasks'] });
      toast.success('Document verwijderd');
      setRemovingDoc(null);
    },
    onError: (error: unknown) => {
      let message = 'Onbekende fout';
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
      setRemovingDoc(null);
    },
  });

  // Handler voor hernoemen
  const renameDocument = async (
    taskId: string,
    oldName: string,
    newName: string
  ) => {
    setRenamingDocLoading(true);
    const oldPath = `tasks/${taskId}/${oldName}`;
    const newPath = `tasks/${taskId}/${newName}`;
    // 1. Copy in storage
    const { error: copyError } = await supabase.storage
      .from('documents')
      .copy(oldPath, newPath);
    if (copyError) {
      throw new Error(copyError.message);
    }
    // 2. Remove old
    const { error: removeError } = await supabase.storage
      .from('documents')
      .remove([oldPath]);
    if (removeError) {
      throw new Error(removeError.message);
    }
    // 3. Update upload_documenten-array
    const { data, error: fetchError } = await supabase
      .from('taken')
      .select('upload_documenten')
      .eq('id', taskId)
      .single();
    let currentDocs: string[] = [];
    if (!fetchError && data && data.upload_documenten) {
      try {
        currentDocs = JSON.parse(data.upload_documenten);
      } catch (e) {
        /* ignore parse error */
      }
    }
    const newDocs = currentDocs.map(f => (f === oldName ? newName : f));
    const { error: updateError } = await supabase
      .from('taken')
      .update({ upload_documenten: JSON.stringify(newDocs) })
      .eq('id', taskId);
    if (updateError) {
      throw new Error(updateError.message);
    }
    setRenamingDocLoading(false);
  };
  const renameDocMutation = useMutation({
    mutationFn: async ({
      taskId,
      oldName,
      newName,
    }: {
      taskId: string;
      oldName: string;
      newName: string;
    }) => renameDocument(taskId, oldName, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verzekeraar-tasks'] });
      toast.success('Bestandsnaam hernoemd');
      setRenamingDoc(null);
    },
    onError: (error: unknown) => {
      let message = 'Onbekende fout';
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
      setRenamingDoc(null);
    },
  });

  // Modal submit handler
  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.client_id || !newTask.verzekeraar || !newTask.beschrijving) {
      toast.error('Vul alle verplichte velden in');
      return;
    }
    if (isEditMode && editingTaskId) {
      editTaskMutation.mutate({
        ...newTask,
        id: editingTaskId,
        status: modalStatus || newTask.status || 'ontvangen',
      });
    } else {
      createTaskMutation.mutate({
        ...newTask,
        status: modalStatus || 'ontvangen',
      });
    }
  };

  // Open modal voor nieuwe taak
  const openNewTaskModal = (status: string | null = null) => {
    setShowModal(true);
    setIsEditMode(false);
    setEditingTaskId(null);
    setModalStatus(status);
    setNewTask({
      client_id: '',
      verzekeraar: '',
      beschrijving: '',
      deadline: '',
      status: status || '',
    });
  };
  // Open modal voor bewerken
  const openEditTaskModal = (task: Task) => {
    setShowModal(true);
    setIsEditMode(true);
    setEditingTaskId(task.id);
    setModalStatus(task.status);
    setNewTask({
      client_id: task.client_id,
      verzekeraar: task.insurer || '',
      beschrijving: task.title,
      deadline: task.deadline || '',
      status: task.status,
    });
  };
  // Upload file handler
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && uploadingTaskId) {
      const filesArr = Array.from(e.target.files);
      setUploadFiles(filesArr);
      uploadMutation.mutate({ taskId: uploadingTaskId, files: filesArr });
    }
  };

  // Download URL helper:
  const getDownloadUrl = (taskId: string, fileName: string) => {
    const bucket = 'documents';
    return supabase.storage
      .from(bucket)
      .getPublicUrl(`tasks/${taskId}/${fileName}`).data.publicUrl;
  };

  // Preview helper:
  const isImage = (file: string) =>
    /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file);
  const isPdf = (file: string) => /\.pdf$/i.test(file);

  // Handler voor drag & drop documenten per taak
  const onDocDragEnd = async (result: DropResult, task: Task) => {
    if (!result.destination) {
      return;
    }
    const fromIdx = result.source.index;
    const toIdx = result.destination.index;
    if (fromIdx === toIdx) {
      return;
    }
    const docs = [...(task.upload_documenten || [])];
    const [moved] = docs.splice(fromIdx, 1);
    docs.splice(toIdx, 0, moved);
    // Update in Supabase
    await supabase
      .from('taken')
      .update({ upload_documenten: JSON.stringify(docs) })
      .eq('id', task.id);
    queryClient.invalidateQueries({ queryKey: ['verzekeraar-tasks'] });
  };

  // Handler voor selecteren van taken
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };
  // Handler voor selecteren van documenten
  const toggleDocSelection = (taskId: string, fileName: string) => {
    setSelectedDocs(prev => {
      const set = new Set(prev[taskId] || []);
      if (set.has(fileName)) {
        set.delete(fileName);
      } else {
        set.add(fileName);
      }
      return { ...prev, [taskId]: set };
    });
  };
  // Filter documenten op status in de documentlijst
  const filterDocs = (task: Task) => {
    if (!task.upload_documenten) {
      return [];
    }
    if (filterDocStatus === 'all') {
      return task.upload_documenten;
    }
    return task.upload_documenten.filter(
      f => bulkRenameStatus[task.id]?.[f] === filterDocStatus
    );
  };
  // Bulk upload handler
  const handleBulkUpload = (e: ChangeEvent<HTMLInputElement>) => {
    setBulkError(null);
    if (!e.target.files || selectedTasks.length === 0) {
      setBulkError('Selecteer eerst taken en bestanden.');
      return;
    }
    setUndoStack(stack => [...stack, snapshotState()]);
    setShowUndo(true);
    const filesArr = Array.from(e.target.files);
    // Validatie
    for (const file of filesArr) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setBulkError(`Bestandstype niet toegestaan: ${file.name}`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setBulkError(`Bestand te groot: ${file.name}`);
        return;
      }
    }
    // Upload naar alle geselecteerde taken
    selectedTasks.forEach(taskId => {
      uploadMutation.mutate({ taskId, files: filesArr });
    });
  };
  // Bulk delete handler
  const handleBulkDelete = () => {
    setBulkError(null);
    setUndoStack(stack => [...stack, snapshotState()]);
    setShowUndo(true);
    Object.entries(selectedDocs).forEach(([taskId, filesSet]) => {
      filesSet.forEach(fileName => {
        removeDocMutation.mutate({ taskId, fileName });
      });
    });
    setSelectedDocs({});
  };

  // Select all taken handler
  const handleSelectAllTasks = () => {
    if (selectAllTasks) {
      setSelectedTasks([]);
      setSelectAllTasks(false);
    } else {
      setSelectedTasks(tasks.map(t => t.id));
      setSelectAllTasks(true);
    }
  };
  // Select all docs per taak handler
  const handleSelectAllDocs = (taskId: string, allFiles: string[]) => {
    if (selectAllDocs[taskId]) {
      setSelectedDocs(prev => ({ ...prev, [taskId]: new Set() }));
      setSelectAllDocs(prev => ({ ...prev, [taskId]: false }));
    } else {
      setSelectedDocs(prev => ({ ...prev, [taskId]: new Set(allFiles) }));
      setSelectAllDocs(prev => ({ ...prev, [taskId]: true }));
    }
  };
  // Bulk hernoem modal openen
  const openBulkRename = () => {
    const map: typeof bulkRenameMap = {};
    Object.entries(selectedDocs).forEach(([taskId, filesSet]) => {
      if (!map[taskId]) {
        map[taskId] = {};
      }
      filesSet.forEach(file => {
        map[taskId][file] = file;
      });
    });
    setBulkRenameMap(map);
    setBulkRenameOpen(true);
  };
  // Bulk hernoem uitvoeren
  const handleBulkRename = async () => {
    setBulkActionLoading(true);
    setUndoStack(stack => [...stack, snapshotState()]);
    setShowUndo(true);
    const status: typeof bulkRenameStatus = {};
    for (const [taskId, filesMap] of Object.entries(bulkRenameMap)) {
      if (!status[taskId]) {
        status[taskId] = {};
      }
      for (const [oldName, newName] of Object.entries(filesMap)) {
        status[taskId][oldName] = 'renaming';
        setBulkRenameStatus({ ...status });
        try {
          await renameDocument(taskId, oldName, newName);
          status[taskId][oldName] = 'success';
        } catch {
          status[taskId][oldName] = 'error';
        }
        setBulkRenameStatus({ ...status });
      }
    }
    setBulkActionLoading(false);
    setTimeout(() => {
      setBulkRenameOpen(false);
      setBulkRenameStatus({});
      setBulkRenameMap({});
      setSelectedDocs({});
    }, 1200);
  };

  // Helper om snapshot te maken van huidige taken/documents
  const snapshotState = () => {
    // Sla alleen relevante info op (id, upload_documenten)
    return tasks.map(t => ({
      id: t.id,
      upload_documenten: [...(t.upload_documenten || [])],
    }));
  };
  // Undo handler
  const handleUndo = async () => {
    if (undoStack.length === 0) {
      return;
    }
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(stack => stack.slice(0, -1));
    setShowUndo(false);
    // Herstel upload_documenten per taak
    for (const t of prev) {
      await supabase
        .from('taken')
        .update({ upload_documenten: JSON.stringify(t.upload_documenten) })
        .eq('id', t.id);
    }
    queryClient.invalidateQueries({ queryKey: ['verzekeraar-tasks'] });
  };

  // UI
  return (
    <div className='container mx-auto py-8'>
      <div className='mb-4 flex items-center gap-4'>
        <Link
          to='/'
          className='px-4 py-2 rounded bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition shadow-sm border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400'
        >
          Home
        </Link>
        <h1 className='text-2xl font-bold mb-0'>Takenoverzicht verzekeraar</h1>
      </div>
      {/* Filterbalk */}
      <div className='flex flex-wrap gap-4 mb-6 items-center'>
        <input
          type='checkbox'
          checked={selectAllTasks}
          onChange={handleSelectAllTasks}
        />
        <span className='text-xs text-gray-500'>Selecteer alle taken</span>
        <select
          className='border rounded px-3 py-2 text-sm'
          value={filterClient}
          onChange={e => setFilterClient(e.target.value)}
        >
          <option value=''>Filter op cliënt</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>
              {c.naam}
            </option>
          ))}
        </select>
        <select
          className='border rounded px-3 py-2 text-sm'
          value={filterInsurer}
          onChange={e => setFilterInsurer(e.target.value)}
        >
          <option value=''>Filter op verzekeraar</option>
          {verzekeraars.map(ins => (
            <option key={ins} value={ins}>
              {ins}
            </option>
          ))}
        </select>
        <input
          className='border rounded px-3 py-2 text-sm'
          placeholder='Zoek taak...'
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition'
          onClick={() => openNewTaskModal(null)}
        >
          Nieuwe taak
        </button>
        <input
          type='file'
          multiple
          onChange={handleBulkUpload}
          className='border rounded px-3 py-2 text-sm'
        />
        <button
          className='bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition'
          onClick={handleBulkDelete}
          disabled={Object.values(selectedDocs).every(set => set.size === 0)}
        >
          Bulk verwijder
        </button>
        <button
          className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition'
          onClick={openBulkRename}
          disabled={Object.values(selectedDocs).every(set => set.size === 0)}
        >
          Bulk hernoem
        </button>
        {bulkError && (
          <span className='text-red-600 text-sm ml-2'>{bulkError}</span>
        )}
        {bulkActionLoading && (
          <span className='text-blue-600 text-sm ml-2'>
            Bezig met bulk-actie...
          </span>
        )}
        {showUndo && (
          <button
            className='bg-yellow-400 text-black px-3 py-2 rounded hover:bg-yellow-500 transition'
            onClick={handleUndo}
          >
            Ongedaan maken
          </button>
        )}
      </div>
      {(loadingTasks || loadingClients) && <div>Bezig met laden...</div>}
      {(tasksError || clientsError) && (
        <div className='text-red-600'>
          Fout: {tasksError?.message || clientsError?.message}
        </div>
      )}
      {/* Kanban board */}
      <div className='flex gap-6 w-full overflow-x-auto pb-4'>
        {VERZEKERAAR_WORKFLOW.map(col => (
          <div
            key={col.key}
            className='bg-gray-50 rounded-xl shadow-sm border flex-1 min-w-[260px] max-w-[320px] p-4 flex flex-col'
          >
            <h2 className='font-semibold text-lg mb-2 text-gray-800'>
              {col.label}
            </h2>
            <div className='flex-1 flex flex-col gap-3'>
              {tasksByStatus[col.key].length === 0 && (
                <div className='text-gray-400 italic text-sm'>
                  Geen taken in deze stap
                </div>
              )}
              {tasksByStatus[col.key].map(task => (
                <div
                  key={task.id}
                  className='bg-white rounded-lg border shadow p-3 flex flex-col gap-1'
                >
                  <div className='flex items-center gap-2 mb-1'>
                    <input
                      type='checkbox'
                      checked={selectedTasks.includes(task.id)}
                      onChange={() => toggleTaskSelection(task.id)}
                    />
                    <span className='text-xs text-gray-500'>
                      Selecteer taak voor bulk upload
                    </span>
                  </div>
                  <div className='font-bold text-sm text-blue-900'>
                    {task.title}
                  </div>
                  <div className='text-xs text-gray-500'>
                    Cliënt: {task.client_name || task.client_id} | Verzekeraar:{' '}
                    {task.insurer}
                  </div>
                  {task.deadline && (
                    <div className='text-xs text-red-600'>
                      Deadline: {task.deadline}
                    </div>
                  )}
                  <div className='flex gap-2 mt-1'>
                    <button
                      className='text-xs text-blue-600 hover:underline'
                      onClick={() => {
                        setUploadingTaskId(task.id);
                      }}
                    >
                      Upload document
                    </button>
                    <button
                      className='text-xs text-gray-600 hover:underline'
                      onClick={() => openEditTaskModal(task)}
                    >
                      Bewerk
                    </button>
                    <button
                      className='text-xs text-red-600 hover:underline'
                      onClick={() => setDeleteConfirmId(task.id)}
                    >
                      Verwijder
                    </button>
                  </div>
                  {task.upload_documenten &&
                    task.upload_documenten.length > 0 && (
                      <div className='flex items-center gap-2 mb-1'>
                        <input
                          type='checkbox'
                          checked={!!selectAllDocs[task.id]}
                          onChange={() =>
                            handleSelectAllDocs(task.id, task.upload_documenten)
                          }
                        />
                        <span className='text-xs text-gray-500'>
                          Selecteer alle documenten
                        </span>
                      </div>
                    )}
                  {/* Documenten lijst */}
                  <DragDropContext
                    onDragEnd={result => onDocDragEnd(result, task)}
                  >
                    <Droppable droppableId={`docs-${task.id}`}>
                      {provided => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className='mt-2 flex flex-col gap-1'
                        >
                          {filterDocs(task).map((file, idx) => {
                            const url = getDownloadUrl(task.id, file);
                            return (
                              <Draggable
                                key={file + idx}
                                draggableId={file + idx}
                                index={idx}
                              >
                                {dragProvided => (
                                  <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    className='flex items-center gap-2'
                                  >
                                    <input
                                      type='checkbox'
                                      checked={
                                        !!selectedDocs[task.id]?.has(file)
                                      }
                                      onChange={() =>
                                        toggleDocSelection(task.id, file)
                                      }
                                    />
                                    <a
                                      href={url}
                                      target={
                                        isImage(file) || isPdf(file)
                                          ? undefined
                                          : '_blank'
                                      }
                                      rel='noopener noreferrer'
                                      className='text-xs text-blue-700 underline'
                                      onClick={e => {
                                        if (isImage(file) || isPdf(file)) {
                                          e.preventDefault();
                                          setPreviewDoc({ url, name: file });
                                        }
                                      }}
                                    >
                                      {file}
                                    </a>
                                    <button
                                      className='text-xs text-gray-500 hover:underline'
                                      title='Hernoem document'
                                      onClick={() =>
                                        setRenamingDoc({
                                          taskId: task.id,
                                          oldName: file,
                                          newName: file,
                                        })
                                      }
                                    >
                                      Hernoem
                                    </button>
                                    <button
                                      className='text-xs text-red-500 hover:underline'
                                      title='Verwijder document'
                                      onClick={() =>
                                        setRemovingDoc({
                                          taskId: task.id,
                                          fileName: file,
                                        })
                                      }
                                      disabled={
                                        removingDocLoading &&
                                        removingDoc?.taskId === task.id &&
                                        removingDoc?.fileName === file
                                      }
                                    >
                                      {removingDocLoading &&
                                      removingDoc?.taskId === task.id &&
                                      removingDoc?.fileName === file
                                        ? '...'
                                        : 'Verwijder'}
                                    </button>
                                    {bulkRenameStatus[task.id]?.[file] ===
                                      'renaming' && (
                                      <span className='text-xs text-blue-600 ml-1'>
                                        ...
                                      </span>
                                    )}
                                    {bulkRenameStatus[task.id]?.[file] ===
                                      'success' && (
                                      <span className='text-xs text-green-600 ml-1'>
                                        ✓
                                      </span>
                                    )}
                                    {bulkRenameStatus[task.id]?.[file] ===
                                      'error' && (
                                      <span className='text-xs text-red-600 ml-1'>
                                        ✗
                                      </span>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              ))}
            </div>
            <button
              className='mt-4 bg-blue-100 text-blue-700 rounded px-3 py-1 text-xs font-medium hover:bg-blue-200 transition'
              onClick={() => openNewTaskModal(col.key)}
            >
              Nieuwe taak in deze stap
            </button>
          </div>
        ))}
      </div>
      {/* Modal voor nieuwe/bewerk taak */}
      {showModal && (
        <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg shadow-lg p-6 w-full max-w-md'>
            <h2 className='text-lg font-bold mb-4'>
              {isEditMode ? 'Taak bewerken' : 'Nieuwe taak'}
            </h2>
            <form onSubmit={handleModalSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium mb-1'>
                  Cliënt *
                </label>
                <select
                  className='w-full border rounded px-3 py-2'
                  required
                  value={newTask.client_id}
                  onChange={e =>
                    setNewTask(t => ({ ...t, client_id: e.target.value }))
                  }
                >
                  <option value=''>Selecteer een cliënt</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.naam}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium mb-1'>
                  Verzekeraar *
                </label>
                <input
                  className='w-full border rounded px-3 py-2'
                  required
                  value={newTask.verzekeraar}
                  onChange={e =>
                    setNewTask(t => ({ ...t, verzekeraar: e.target.value }))
                  }
                  list='verzekeraars'
                />
                <datalist id='verzekeraars'>
                  {verzekeraars.map(ins => (
                    <option key={ins} value={ins} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className='block text-sm font-medium mb-1'>
                  Omschrijving *
                </label>
                <input
                  className='w-full border rounded px-3 py-2'
                  required
                  value={newTask.beschrijving}
                  onChange={e =>
                    setNewTask(t => ({ ...t, beschrijving: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className='block text-sm font-medium mb-1'>
                  Deadline
                </label>
                <input
                  type='date'
                  className='w-full border rounded px-3 py-2'
                  value={newTask.deadline}
                  onChange={e =>
                    setNewTask(t => ({ ...t, deadline: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className='block text-sm font-medium mb-1'>
                  Workflow-stap
                </label>
                <select
                  className='w-full border rounded px-3 py-2'
                  value={modalStatus || newTask.status}
                  onChange={e => {
                    setModalStatus(e.target.value);
                    setNewTask(t => ({ ...t, status: e.target.value }));
                  }}
                >
                  {VERZEKERAAR_WORKFLOW.map(col => (
                    <option key={col.key} value={col.key}>
                      {col.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className='flex justify-end gap-2 mt-4'>
                <button
                  type='button'
                  className='px-4 py-2 rounded bg-gray-200'
                  onClick={() => {
                    setShowModal(false);
                    setIsEditMode(false);
                    setEditingTaskId(null);
                  }}
                >
                  Annuleren
                </button>
                <button
                  type='submit'
                  className='px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700'
                >
                  Opslaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Verwijder bevestiging */}
      {deleteConfirmId && (
        <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg shadow-lg p-6 w-full max-w-sm'>
            <h2 className='text-lg font-bold mb-4'>Taak verwijderen?</h2>
            <p>Weet je zeker dat je deze taak wilt verwijderen?</p>
            <div className='flex justify-end gap-2 mt-6'>
              <button
                className='px-4 py-2 rounded bg-gray-200'
                onClick={() => setDeleteConfirmId(null)}
              >
                Annuleren
              </button>
              <button
                className='px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700'
                onClick={() => deleteTaskMutation.mutate(deleteConfirmId)}
              >
                Verwijder
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Upload document modal */}
      {uploadingTaskId && (
        <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg shadow-lg p-6 w-full max-w-sm'>
            <h2 className='text-lg font-bold mb-4'>Upload documenten</h2>
            <input type='file' multiple onChange={handleFileChange} />
            <div className='flex justify-end gap-2 mt-6'>
              <button
                className='px-4 py-2 rounded bg-gray-200'
                onClick={() => {
                  setUploadingTaskId(null);
                  setUploadFiles([]);
                }}
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Preview modal: */}
      {previewDoc && (
        <div className='fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative'>
            <button
              className='absolute top-2 right-2 text-gray-500 hover:text-black'
              onClick={() => setPreviewDoc(null)}
            >
              Sluiten
            </button>
            <h2 className='text-lg font-bold mb-4'>
              Preview: {previewDoc.name}
            </h2>
            {isImage(previewDoc.name) ? (
              <img
                src={previewDoc.url}
                alt={previewDoc.name}
                className='max-h-[60vh] mx-auto'
              />
            ) : isPdf(previewDoc.name) ? (
              <iframe
                src={previewDoc.url}
                title={previewDoc.name}
                className='w-full h-[60vh]'
              />
            ) : (
              <div>Preview niet beschikbaar voor dit bestandstype.</div>
            )}
          </div>
        </div>
      )}
      {/* Verwijder bevestiging voor document: */}
      {removingDoc && (
        <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg shadow-lg p-6 w-full max-w-sm'>
            <h2 className='text-lg font-bold mb-4'>Document verwijderen?</h2>
            <p>
              Weet je zeker dat je <b>{removingDoc.fileName}</b> wilt
              verwijderen?
            </p>
            <div className='flex justify-end gap-2 mt-6'>
              <button
                className='px-4 py-2 rounded bg-gray-200'
                onClick={() => setRemovingDoc(null)}
              >
                Annuleren
              </button>
              <button
                className='px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700'
                onClick={() => removeDocMutation.mutate(removingDoc)}
              >
                Verwijder
              </button>
            </div>
          </div>
        </div>
      )}
      {renamingDoc && (
        <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg shadow-lg p-6 w-full max-w-sm'>
            <h2 className='text-lg font-bold mb-4'>Bestandsnaam hernoemen</h2>
            <input
              className='w-full border rounded px-3 py-2 mb-4'
              value={renamingDoc.newName}
              onChange={e =>
                setRenamingDoc({ ...renamingDoc, newName: e.target.value })
              }
              disabled={renamingDocLoading}
            />
            <div className='flex justify-end gap-2 mt-6'>
              <button
                className='px-4 py-2 rounded bg-gray-200'
                onClick={() => setRenamingDoc(null)}
                disabled={renamingDocLoading}
              >
                Annuleren
              </button>
              <button
                className='px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700'
                onClick={() => renameDocMutation.mutate(renamingDoc)}
                disabled={
                  renamingDocLoading ||
                  !renamingDoc.newName ||
                  renamingDoc.newName === renamingDoc.oldName
                }
              >
                Hernoem
              </button>
            </div>
          </div>
        </div>
      )}
      {bulkRenameOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg shadow-lg p-6 w-full max-w-lg'>
            <h2 className='text-lg font-bold mb-4'>Bulk hernoem documenten</h2>
            {Object.entries(bulkRenameMap).map(([taskId, filesMap]) => (
              <div key={taskId} className='mb-4'>
                <div className='font-semibold text-sm mb-2'>
                  Taak: {tasks.find(t => t.id === taskId)?.title || taskId}
                </div>
                {Object.entries(filesMap).map(([oldName, newName]) => (
                  <div key={oldName} className='flex items-center gap-2 mb-1'>
                    <span className='text-xs text-gray-600 w-40 truncate'>
                      {oldName}
                    </span>
                    <input
                      className='border rounded px-2 py-1 text-xs w-48'
                      value={newName}
                      onChange={e =>
                        setBulkRenameMap(prev => ({
                          ...prev,
                          [taskId]: {
                            ...prev[taskId],
                            [oldName]: e.target.value,
                          },
                        }))
                      }
                      disabled={bulkActionLoading}
                    />
                    {bulkRenameStatus[taskId]?.[oldName] === 'renaming' && (
                      <span className='text-xs text-blue-600 ml-1'>...</span>
                    )}
                    {bulkRenameStatus[taskId]?.[oldName] === 'success' && (
                      <span className='text-xs text-green-600 ml-1'>✓</span>
                    )}
                    {bulkRenameStatus[taskId]?.[oldName] === 'error' && (
                      <span className='text-xs text-red-600 ml-1'>✗</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
            <div className='flex justify-end gap-2 mt-6'>
              <button
                className='px-4 py-2 rounded bg-gray-200'
                onClick={() => setBulkRenameOpen(false)}
                disabled={bulkActionLoading}
              >
                Annuleren
              </button>
              <button
                className='px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700'
                onClick={handleBulkRename}
                disabled={bulkActionLoading}
              >
                Hernoem geselecteerde
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakenVerzekeraar;
