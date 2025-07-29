import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { _Progress } from "@/components/ui/progress";
import { _Badge } from "@/components/ui/badge";
import { _Upload, File, _X, _CheckCircle, _AlertCircle, FileText, Image, FileSpreadsheet } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import KiesClientDropdown from "@/components/KiesClientDropdown";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { morphikService } from "@/services/morphikService";

interface Client {
  id: string; // uuid
  naam: string;
  geboortedatum?: string;
  email?: string;
}

interface DocumentUploadProps {
  onUpload: (file: File) => void;
  onClose: () => void;
  clientId?: string; // nieuw
  onAfterUpload?: () => void;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface NewClientData {
  naam: string;
  geboortedatum: string;
  adres: string;
  telefoon: string;
  email: string;
  bsn: string;
  verzekeraar: string;
  polisnummer: string;
  algemene_informatie: string;
}

interface Document {
  id: string;
  title: string;
  status: string;
  date: string;
  file_path: string;
  mime_type: string;
  document_type: string;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUpload, _onClose, clientId, _onAfterUpload }) => {
  // Filter voor document dropdown
  const [_documentSearch, _setDocumentSearch] = useState("");
  const [_selectedDocument, _setSelectedDocument] = useState<string | null>(null);
  // Filter state voor documenttype
  const [_filterType, _setFilterType] = useState<string | null>(null);
  const [viewType, setViewType] = useState<string>('all');

  // Client zoeken en selectie
  const [_clientSearch, _setClientSearch] = useState("");
  const [_clients, _setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [addingClient, setAddingClient] = useState(false);

  // Document states
  const [_status, _setStatus] = useState<'nieuw' | 'in_behandeling' | 'afgehandeld'>('nieuw');
  const [_priority, _setPriority] = useState<'laag' | 'normaal' | 'hoog' | 'urgent'>('normaal');
  const [_documentType, _setDocumentType] = useState('');
  const [_description, _setDescription] = useState('');
  const [_documentDate, _setDocumentDate] = useState('');
  const [_provider, _setProvider] = useState('');
  const [_category, _setCategory] = useState('');
  const [_insurer, _setInsurer] = useState('');
  const [_isPrivate, _setIsPrivate] = useState(false);
  const [_otherTypeDescription, _setOtherTypeDescription] = useState('');
  const [enableMorphikSync, setEnableMorphikSync] = useState(true); // Default to true for easy testing

  // Preview modal state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);

  // Upload states
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [_isProcessing, _setIsProcessing] = useState(false);

  // Uitgebreide client gegevens
  const [newClient, setNewClient] = useState<NewClientData>({
    naam: '',
    geboortedatum: '',
    adres: '',
    telefoon: '',
    email: '',
    bsn: '',
    verzekeraar: '',
    polisnummer: '',
    algemene_informatie: ''
  });

  // Dummy openstaande documenten (vervang dit met echte data uit Supabase)
  const [openDocuments] = useState<Document[]>(
    [
      { id: '1', title: 'Vragen verzekeraar.pdf', status: 'in_behandeling', date: '2025-07-15', file_path: 'https://example.com/doc1.pdf', mime_type: 'application/pdf', document_type: 'vragen_verzekeraar' },
      { id: '2', title: 'Antwoordbrief Verzekeraar.pdf', status: 'nieuw', date: '2025-07-14', file_path: 'https://example.com/doc2.pdf', mime_type: 'application/pdf', document_type: 'antwoordbrief_verzekeraar' },
      { id: '3', title: 'Antwoorden familie.txt', status: 'nieuw', date: '2025-07-13', file_path: 'https://example.com/doc3.txt', mime_type: 'text/plain', document_type: 'antwoorden_familie_client' },
      { id: '4', title: 'Verslag Fysio.jpg', status: 'in_behandeling', date: '2025-07-12', file_path: 'https://example.com/doc4.jpg', mime_type: 'image/jpeg', document_type: 'verslag_fysio_ergo' },
      { id: '5', title: 'Verslag huisarts.pdf', status: 'nieuw', date: '2025-07-11', file_path: 'https://example.com/doc5.pdf', mime_type: 'application/pdf', document_type: 'verslag_huisarts' },
      { id: '6', title: 'Medische verslagen.pdf', status: 'in_behandeling', date: '2025-07-10', file_path: 'https://example.com/doc6.pdf', mime_type: 'application/pdf', document_type: 'medische_verslagen' },
    ]
  );

  // Haal bestaande cliënten op
  const fetchClients = async () => {
    const { data, error } = await supabase.from('clients').select('id,naam,geboortedatum,email').order('naam');
    if (!error && data) _setClients(data);
  };
  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingClient(true);
    const { data, error } = await supabase.from('clients').insert([
      {
        naam: newClient.naam,
        geboortedatum: newClient.geboortedatum,
        adres: newClient.adres,
        telefoon: newClient.telefoon,
        email: newClient.email,
        bsn: newClient.bsn,
        verzekeraar: newClient.verzekeraar,
        polisnummer: newClient.polisnummer,
        algemene_informatie: newClient.algemene_informatie
      },
    ]).select();
    setAddingClient(false);
    if (error) {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    } else if (data && data[0]) {
      setShowNewClient(false);
      resetNewClientForm();
      setSelectedClient(data[0].id);
      toast({ title: 'Cliënt toegevoegd', description: 'Nieuwe cliënt is aangemaakt.' });
      await fetchClients(); // Automatisch verversen na toevoegen
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending' as const
    }));
    setUploadFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback((acceptedFiles: File[]) => {
      const newFiles: UploadFile[] = acceptedFiles.map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        status: 'pending' as const
      }));
      setUploadFiles(prev => [...prev, ...newFiles]);
    }, []),
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  });

  const _getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4" />;
    if (mimeType.includes('image')) return <Image className="w-4 h-4" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const _getFileTypeColor = (mimeType: string) => {
    if (mimeType.includes('pdf')) return 'bg-red-100 text-red-800';
    if (mimeType.includes('image')) return 'bg-green-100 text-green-800';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const _formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const _removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(file => file.id !== id));
  };

  // Gebruik clientId als deze is meegegeven, anders de interne selectedClient
  const effectiveClientId = clientId ?? selectedClient;

  // Bucket mapping voor documenttypes
  const bucketMap: Record<string, string> = {
    'Indicatie': 'indicatie',
    'Vragen verzekeraar': 'vragenverzekeraar',
    'Antwoordbrief verzekeraar': 'antwoordbrieven',
    'Brief huisarts': 'briefhuisarts',
    'Brief Fysio': 'brieffysio',
    'Brief Ergo': 'briefergo',
    'Brief Ziekenhuis': 'briefziekenhuis',
    'Anders': 'documents',
  };

  // State voor 2-stapsverificatie en uploadbevestiging
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<UploadFile | null>(null);
  const [uploadBucket, setUploadBucket] = useState<string>('documents');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // State voor opdrachtgever
  const [opdrachtgever, setOpdrachtgever] = useState('');

  // State voor indicatie type
  const [indicatieType, setIndicatieType] = useState('');

  // Nieuwe upload handler met 2-stapsverificatie
  const handleUploadWithConfirm = (file: UploadFile) => {
    // Bepaal bucket op basis van documentType
    const bucket = bucketMap[documentType] || 'documents';
    setUploadBucket(bucket);
    setPendingUpload(file);
    setShowConfirmModal(true);
  };

  // Pas simulateUpload aan om juiste bucket te gebruiken en na upload bevestiging te tonen
  const simulateUpload = async (uploadFile: UploadFile, bucketOverride?: string) => {
    setUploadFiles(prev => prev.map(f => f.id === uploadFile.id ? { ...f, status: 'uploading' as const } : f));
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setUploadFiles(prev => prev.map(f => f.id === uploadFile.id ? { ...f, progress: i } : f));
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUploadFiles(prev => prev.map(f => f.id === uploadFile.id ? { ...f, status: 'success' as const, progress: 100 } : f));
    // Log de client_id bij upload
    if (!effectiveClientId) {
      toast({ title: 'Geen cliënt geselecteerd', description: 'Kies een cliënt voordat je uploadt.', variant: 'destructive' });
      return;
    }
    // 1. Upload bestand naar Supabase Storage
    const _fileExt = uploadFile.file.name.split('.').pop();
    const filePath = `${Date.now()}_${uploadFile.file.name}`;
    const bucket = bucketOverride || bucketMap[documentType] || 'documents';
    const { data: _storageData, error: storageError } = await supabase.storage
      .from(bucket)
      .upload(filePath, uploadFile.file, { contentType: uploadFile.file.type });
    if (storageError) {
      toast({ title: 'Upload fout', description: 'Fout bij uploaden naar storage: ' + storageError.message, variant: 'destructive' });
      return;
    }
    // 2. Maak publieke URL
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    let fileUrl = publicUrlData?.publicUrl || '';
    if (fileUrl && !fileUrl.startsWith('http')) {
      fileUrl = `https://${fileUrl}`;
    }
    setUploadedFileUrl(fileUrl);
    setUploadedFileName(uploadFile.file.name);
    setShowSuccessModal(true);
    // 3. Sla document op in database met file_path
    const insertData = {
      title: uploadFile.file.name,
      client_id: effectiveClientId,
      file_path: fileUrl,
      mime_type: uploadFile.file.type,
      file_size: uploadFile.file.size,
      status,
      priority,
      document_type: documentType,
      other_type_description: documentType.toLowerCase() === 'overig' ? otherTypeDescription : null,
      description,
      document_date: documentDate,
      category,
      Opdrachtgever: opdrachtgever, // <-- hoofdletter O
      indicatie_type: documentType === 'Indicatie' ? indicatieType : null,
    };
    if (typeof provider !== 'undefined') insertData['zorgverlener'] = provider;
    if (typeof insurer !== 'undefined') insertData['verzekeraar'] = insurer;
    if (typeof description !== 'undefined') insertData['opmerking'] = description;

    // Insert document into database
    const { data: insertedDoc, error: insertError } = await supabase
      .from('documents')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      toast({
        title: 'Database fout',
        description: 'Fout bij opslaan document: ' + insertError.message,
        variant: 'destructive'
      });
      return;
    }

    // Sync to Morphik if enabled
    if (enableMorphikSync && insertedDoc) {
      try {
        toast({
          title: 'Morphik Sync',
          description: 'Document wordt gesynchroniseerd met Morphik AI...'
        });

        const syncResult = await morphikService.syncDocument(
          insertedDoc.id,
          fileUrl,
          effectiveClientId,
          {
            documentType,
            status,
            priority,
            uploadDate: new Date().toISOString()
          }
        );

        if (syncResult.success) {
          toast({
            title: 'Sync succesvol',
            description: 'Document is gesynchroniseerd met Morphik AI voor geavanceerde analyse.'
          });
        } else {
          toast({
            title: 'Sync waarschuwing',
            description: `Document is opgeslagen maar Morphik sync mislukt: ${syncResult.error}`,
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Morphik sync error:', error);
        toast({
          title: 'Sync fout',
          description: 'Document is opgeslagen maar kon niet met Morphik synchroniseren.',
          variant: 'destructive'
        });
      }
    }

    onUpload(uploadFile.file);
  };

  // Pas handleUploadAll aan om 2-stapsverificatie te gebruiken
  const _handleUploadAll = async () => {
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending');
    for (const file of pendingFiles) {
      await simulateUpload(file);
    }
  };

  // Voorgedefinieerde document types
  const documentTypes = [
    { value: 'all', label: 'Alle documenten' },
    { value: 'vragen_verzekeraar', label: 'Vragen verzekeraar' },
    { value: 'antwoordbrief_verzekeraar', label: 'Antwoordbrief Verzekeraar' },
    { value: 'antwoorden_familie_client', label: 'Antwoorden familie/client' },
    { value: 'verslag_fysio_ergo', label: 'Verslag Fysio/Ergo' },
    { value: 'verslag_huisarts', label: 'Verslag huisarts' },
    { value: 'medische_verslagen', label: 'Medische verslagen' }
  ];

  // Handler voor het resetten van het nieuwe client formulier
  const resetNewClientForm = () => {
    setNewClient({
      naam: '',
      geboortedatum: '',
      adres: '',
      telefoon: '',
      email: '',
      bsn: '',
      verzekeraar: '',
      polisnummer: '',
      algemene_informatie: ''
    });
  };

  // Filtering functie voor documenten
  const filteredDocuments = openDocuments.filter(doc => {
    if (viewType === 'all') return true;
    return doc.document_type === viewType;
  });

  return (
    <div className="p-4">
      {/* Client selector bovenaan uploadscherm */}
      {!clientId ? (
        <div className="mb-4 flex items-center gap-4">
          <span className="font-medium">Selecteer cliënt:</span>
          <KiesClientDropdown value={selectedClient ?? ""} onSelect={setSelectedClient} />
        </div>
      ) : (
        <div className="mb-4 flex items-center gap-4">
          <span className="font-medium">Geselecteerde cliënt:</span>
          <span className="px-3 py-2 border border-black rounded-lg bg-gray-50">{clientId}</span>
        </div>
      )}
      {(!clientId && selectedClient) && (
        <div className="mb-4 flex flex-wrap gap-4">
          <Button variant="outline" onClick={() => {/* TODO: documenten inzien */}}>Documenten inzien</Button>
          <Button variant="outline" onClick={() => {/* TODO: openstaande taken */}}>Openstaande taken inzien</Button>
          <Button variant="outline" onClick={() => {/* TODO: afgeronde taken */}}>Afgeronde taken inzien</Button>
          <Button variant="default" onClick={() => {/* TODO: nieuwe taak toevoegen */}}>Nieuwe taak toevoegen</Button>
        </div>
      )}
      {/* Document type selector en Nieuwe Client knop */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <label htmlFor="documentType" className="block text-sm font-medium text-gray-700">
            Document Type
          </label>
          <select
            id="documentType"
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={viewType}
            onChange={(e) => setViewType(e.target.value)}
            title="Selecteer document type"
          >
            {documentTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <Button
          onClick={() => setShowNewClient(true)}
          className="mt-6"
          variant="outline"
        >
          + Nieuwe Cliënt
        </Button>
      </div>

      {/* Morphik AI Sync Toggle */}
      <div className="flex items-center space-x-2 mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <Switch
          id="morphik-sync"
          checked={enableMorphikSync}
          onCheckedChange={setEnableMorphikSync}
        />
        <Label htmlFor="morphik-sync" className="cursor-pointer">
          <span className="font-medium">Sync naar Morphik AI</span>
          <span className="text-sm text-gray-600 ml-2">
            Documenten worden automatisch gesynchroniseerd voor geavanceerde AI-analyse
          </span>
        </Label>
      </div>

      {/* Modal voor nieuwe client */}
      {showNewClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Nieuwe Cliënt Toevoegen</CardTitle>
              <CardDescription>Vul de gegevens van de nieuwe cliënt in</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddClient} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="naam" className="block text-sm font-medium text-gray-700">Naam</label>
                    <input
                      type="text"
                      id="naam"
                      value={newClient.naam}
                      onChange={(e) => setNewClient({ ...newClient, naam: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="geboortedatum" className="block text-sm font-medium text-gray-700">Geboortedatum</label>
                    <input
                      type="date"
                      id="geboortedatum"
                      value={newClient.geboortedatum}
                      onChange={(e) => setNewClient({ ...newClient, geboortedatum: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail</label>
                  <input
                    type="email"
                    id="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="opdrachtgever" className="block text-sm font-medium text-gray-700">Opdrachtgever</label>
                  <select
                    id="opdrachtgever"
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={opdrachtgever}
                    onChange={e => setOpdrachtgever(e.target.value)}
                    required
                  >
                    <option value="">-- Kies opdrachtgever --</option>
                    <option value="Indicatiecentrum Nederland">Indicatiecentrum Nederland</option>
                    <option value="Indicatie Nederland">Indicatie Nederland</option>
                    <option value="Indicatiebureau Nederland">Indicatiebureau Nederland</option>
                  </select>
                </div>
                {documentType === 'Indicatie' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Type indicatie</label>
                    <select
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={indicatieType}
                      onChange={e => setIndicatieType(e.target.value)}
                      required
                    >
                      <option value="">-- Kies type indicatie --</option>
                      <option value="Bestaande indicatie">Bestaande indicatie</option>
                      <option value="Nieuwe indicatie">Nieuwe indicatie</option>
                    </select>
                  </div>
                )}
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewClient(false)}
                  >
                    Annuleren
                  </Button>
                  <Button
                    type="submit"
                    disabled={addingClient}
                  >
                    {addingClient ? 'Bezig met toevoegen...' : 'Toevoegen'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Document lijst */}
      <div className="space-y-4">
        {filteredDocuments.map(doc => (
          <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">{doc.title}</h3>
                <p className="text-sm text-gray-500">Status: {doc.status}</p>
                <p className="text-sm text-gray-500">Datum: {doc.date}</p>
              </div>
              <button
                onClick={() => {
                  setPreviewUrl(doc.file_path);
                  setPreviewType(doc.mime_type);
                  setPreviewTitle(doc.title);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                aria-label={`Preview ${doc.title}`}
              >
                Preview
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setPreviewUrl(null)}
              aria-label="Sluit preview"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="p-4">
              <h2 className="text-xl font-bold mb-4">{previewTitle}</h2>
              {previewType?.startsWith('image/') ? (
                <img src={previewUrl} alt={previewTitle || 'Preview'} className="max-w-full h-auto" />
              ) : (
                <iframe
                  src={previewUrl}
                  title={previewTitle || 'Document preview'}
                  className="w-full h-[70vh]"
                />
              )}
            </div>
          </div>
        </div>
      )}
      {/* 2-stapsverificatie modal */}
      {showConfirmModal && pendingUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Bevestigen upload</h2>
            <p>Het document wordt opgeslagen in <b>{uploadBucket}</b>. Klopt dit?</p>
            <div className="flex justify-end gap-4 mt-6">
              <Button variant="outline" onClick={() => { setShowConfirmModal(false); setPendingUpload(null); }}>Annuleren</Button>
              <Button variant="default" onClick={async () => {
                setShowConfirmModal(false);
                if (pendingUpload) await simulateUpload(pendingUpload, uploadBucket);
                setPendingUpload(null);
              }}>Ja, uploaden</Button>
            </div>
          </div>
        </div>
      )}
      {/* Upload bevestiging modal */}
      {showSuccessModal && uploadedFileUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Upload geslaagd</h2>
            <p>Document is opgeslagen in <b>{uploadBucket}</b>.</p>
            <div className="flex justify-end gap-4 mt-6">
              <Button variant="outline" onClick={() => setShowSuccessModal(false)}>Sluiten</Button>
              <Button variant="default" onClick={() => {
                setShowSuccessModal(false);
                setPreviewUrl(uploadedFileUrl);
                setPreviewType('application/pdf');
                setPreviewTitle(uploadedFileName);
              }}>Bekijk document</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
