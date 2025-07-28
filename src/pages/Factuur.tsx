import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import SearchableClientDropdown from '@/components/forms/SearchableClientDropdown';
import { supabase } from '@/integrations/supabase/client';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  Calendar,
  Euro,
  FileText,
  User,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientId: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'concept' | 'verzonden' | 'betaald' | 'achterstallig';
  description: string;
  items: InvoiceItem[];
  document_urls?: string[]; // Array of document URLs
  documentUrl?: string | null; // Primary document URL for easy access
  opdrachtgever?: string; // Opdrachtgever type (Particulier, ICN, IBN, IN, MMS)
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'FAC-2024-001',
    clientName: 'A. Arkojan Arakelyan',
    clientId: '1',
    date: '2024-01-15',
    dueDate: '2024-02-15',
    amount: 250.00,
    status: 'betaald',
    description: 'Medische consultatie en behandeling',
    items: [
      {
        id: '1',
        description: 'Consultatie',
        quantity: 1,
        unitPrice: 150.00,
        total: 150.00
      },
      {
        id: '2',
        description: 'Behandeling',
        quantity: 1,
        unitPrice: 100.00,
        total: 100.00
      }
    ]
  },
  {
    id: '2',
    invoiceNumber: 'FAC-2024-002',
    clientName: 'M.J. van Langbroek',
    clientId: '2',
    date: '2024-01-20',
    dueDate: '2024-02-20',
    amount: 180.00,
    status: 'verzonden',
    description: 'Fysiotherapie sessies',
    items: [
      {
        id: '1',
        description: 'Fysiotherapie sessie',
        quantity: 3,
        unitPrice: 60.00,
        total: 180.00
      }
    ]
  }
];

const Factuur: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('alle');
  const [opdrachtgeverFilter, setOpdrachtgeverFilter] = useState<string>('alle');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [clients, setClients] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showInvoiceOverview, setShowInvoiceOverview] = useState(false);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [statistics, setStatistics] = useState({
    totalInvoices: 0,
    uploadedDocuments: 0,
    totalAmount: 0,
    paidAmount: 0,
    outstandingAmount: 0
  });

  const getStatusBadge = (status: Invoice['status']) => {
    const statusConfig = {
      concept: { label: 'Concept', className: 'bg-gray-100 text-gray-800' },
      verzonden: { label: 'Verzonden', className: 'bg-blue-100 text-blue-800' },
      betaald: { label: 'Betaald', className: 'bg-green-100 text-green-800' },
      achterstallig: { label: 'Achterstallig', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status];
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Fetch clients and invoices from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch clients
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, naam, telefoon, email, adres')
          .order('naam');
        
        if (clientsError) {
          console.error('Error fetching clients:', clientsError);
        } else {
          setClients(clientsData || []);
        }

        // Fetch invoices from clientfactuur table
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('clientfactuur')
          .select(`
            id,
            factuurnummer,
            client_naam,
            client_id,
            opdrachtgever,
            bedrag,
            datum_aangemaakt,
            datum_verstuur,
            datum_betaald,
            status,
            beschrijving,
            notities,
            document_urls
          `)
          .order('created_at', { ascending: false });
        
        if (invoicesError) {
          console.error('Error fetching invoices:', invoicesError);
          // Fallback to mock data if database fails
          setInvoices(mockInvoices);
        } else {
          // Transform Supabase data to match Invoice interface
          const transformedInvoices: Invoice[] = (invoicesData || []).map(invoice => ({
            id: invoice.id,
            invoiceNumber: invoice.factuurnummer || `INV-${invoice.id.slice(0, 8)}`,
            clientName: invoice.client_naam || 'Onbekende cliënt',
            clientId: invoice.client_id || invoice.id,
            date: invoice.datum_aangemaakt || new Date().toISOString().split('T')[0],
            dueDate: invoice.datum_verstuur || new Date().toISOString().split('T')[0],
            amount: parseFloat(invoice.bedrag?.toString() || '0'),
            status: mapSupabaseStatus(invoice.status),
            description: invoice.beschrijving || 'Geen beschrijving',
            items: [], // Items would need separate table
            document_urls: invoice.document_urls || [], // Add document URLs for preview
            documentUrl: invoice.document_urls && invoice.document_urls.length > 0 ? invoice.document_urls[0] : null, // First document URL for easy access
            opdrachtgever: invoice.opdrachtgever || null // Add opdrachtgever for filtering
          }));
          
          setInvoices(transformedInvoices);
          
          // Calculate statistics
          const totalAmount = transformedInvoices.reduce((sum, inv) => sum + inv.amount, 0);
          const paidAmount = transformedInvoices
            .filter(inv => inv.status === 'betaald')
            .reduce((sum, inv) => sum + inv.amount, 0);
          
          // Count uploaded documents (facturen with document_urls)
          const uploadedDocuments = (invoicesData || []).filter(invoice => 
            invoice.document_urls && invoice.document_urls.length > 0
          ).length;
          
          console.log('📊 Statistics calculated:', {
            totalInvoices: transformedInvoices.length,
            uploadedDocuments,
            totalAmount,
            paidAmount
          });
          
          setStatistics({
            totalInvoices: transformedInvoices.length,
            uploadedDocuments,
            totalAmount,
            paidAmount,
            outstandingAmount: totalAmount - paidAmount
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback to mock data
        setInvoices(mockInvoices);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter invoices based on search term, status, opdrachtgever, and selected client
  const filteredInvoices = invoices.filter(invoice => {
    // Search term filter (invoice number or client name)
    const matchesSearch = !searchTerm || 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'alle' || invoice.status === statusFilter;
    
    // Opdrachtgever filter - check if invoice has opdrachtgever field
    const matchesOpdrachtgever = opdrachtgeverFilter === 'alle' || 
      (invoice as any).opdrachtgever === opdrachtgeverFilter;
    
    // Client filter
    const matchesClient = !selectedClient || invoice.clientName === selectedClient;
    
    return matchesSearch && matchesStatus && matchesOpdrachtgever && matchesClient;
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  // Helper function to map Supabase status to Invoice status
  const mapSupabaseStatus = (status: string): Invoice['status'] => {
    switch (status) {
      case 'betaald': return 'betaald';
      case 'verzonden': return 'verzonden';
      case 'achterstallig': return 'achterstallig';
      case 'openstaand': return 'achterstallig'; // Map openstaand to achterstallig for now
      default: return 'concept';
    }
  };

  // Test functie om de documents bucket te controleren
  const testDocumentsBucket = async () => {
    try {
      console.log('Testing documents bucket access...');
      
      // Test bucket toegang
      const { data, error } = await supabase.storage
        .from('documents')
        .list('', {
          limit: 5
        });

      if (error) {
        console.error('Documents bucket toegang fout:', error);
        return false;
      }

      console.log('Documents bucket toegang OK. Gevonden bestanden:', data.length);
      console.log('Eerste paar bestanden:', data);
      return true;
      
    } catch (error) {
      console.error('Bucket test fout:', error);
      return false;
    }
  };

  // Verbeterde upload functie voor single file
  const uploadFactuur = async (file: File) => {
    try {
      console.log('Starting upload process...');
      console.log('File input found:', !!file);
      
      if (!file) {
        throw new Error('Geen bestand geselecteerd');
      }

      // Maak een unieke filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Upload naar facturen subfolder in documents bucket
      const filePath = `facturen/${fileName}`;

      console.log('Uploading file to documents bucket:', fileName);
      console.log('File size:', file.size, 'bytes');
      console.log('File path:', filePath);

      // Upload naar de bestaande 'documents' bucket
      const { data, error } = await supabase.storage
        .from('documents')  // Gebruik bestaande bucket
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error details:', error);
        throw new Error(`Upload fout: ${error.message}`);
      }

      console.log('Upload succesvol:', data);

      // Krijg de publieke URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      console.log('File URL:', urlData.publicUrl);

      return {
        path: data.path,
        fullPath: data.fullPath,
        publicUrl: urlData.publicUrl,
        fileName: fileName,
        originalName: file.name
      };

    } catch (error) {
      console.error('Upload proces fout:', error);
      throw error;
    }
  };

  // Functie om factuur data op te slaan in database
  const saveFactuurToDatabase = async (uploadResult: any, file: File, formData: any) => {
    try {
      const factuurData = {
        factuurnummer: formData.factuurnummer || `FAC-${Date.now()}`,
        client_naam: formData.selectedClients.join(', ') || 'Te bepalen',
        opdrachtgever: formData.selectedOpdrachtgever,
        bedrag: 100.00, // Default amount, required field
        datum_verstuur: formData.dateSent || null,
        datum_betaald: formData.datePaid || null,
        status: formData.selectedStatus,
        beschrijving: `Geüpload bestand: ${file.name}`,
        notities: formData.notes || null,
        document_urls: [uploadResult.publicUrl]
      };

      const { data, error } = await supabase
        .from('clientfactuur')
        .insert([factuurData])
        .select();

      if (error) {
        console.error('Database save error:', error);
        throw new Error(`Database fout: ${error.message}`);
      }

      console.log('Factuur opgeslagen in database:', data);
      return data[0];
      
    } catch (error) {
      console.error('Database save fout:', error);
      throw error;
    }
  };

  // Handle actual file upload to Supabase Storage and database
  const handleUploadFacturen = async () => {
    setUploading(true);
    console.log('🚀 Starting upload process...');
    
    try {
      // Get form data
      const fileInput = document.getElementById('uploadFile') as HTMLInputElement;
      const factuurnummerInput = document.getElementById('uploadFactuurnummer') as HTMLInputElement;
      const dateSentInput = document.getElementById('uploadDateSent') as HTMLInputElement;
      const datePaidInput = document.getElementById('uploadDatePaid') as HTMLInputElement;
      const notesInput = document.getElementById('uploadNotes') as HTMLTextAreaElement;
      
      console.log('📁 File input found:', !!fileInput);
      
      // Get selected clients
      const selectedClients: string[] = [];
      const clientCheckboxes = document.querySelectorAll('input[id^="client-"]:checked');
      clientCheckboxes.forEach((checkbox: any) => {
        const clientId = checkbox.id.replace('client-', '');
        const client = clients.find(c => c.id === clientId);
        if (client) selectedClients.push(client.naam);
      });
      
      console.log('👥 Selected clients:', selectedClients);
      
      // Get selected opdrachtgever
      const opdrachtgeverSelect = document.querySelector('[data-testid="uploadOpdrachtgever"]') as HTMLSelectElement;
      const selectedOpdrachtgever = opdrachtgeverSelect?.value || 'Particulier';
      
      // Get selected status
      const statusSelect = document.querySelector('[data-testid="uploadStatus"]') as HTMLSelectElement;
      const selectedStatus = statusSelect?.value || 'concept';
      
      console.log('📋 Form data:', {
        opdrachtgever: selectedOpdrachtgever,
        status: selectedStatus,
        factuurnummer: factuurnummerInput?.value
      });
      
      const files = fileInput?.files;
      if (!files || files.length === 0) {
        console.log('❌ No files selected');
        toast.error('Selecteer minimaal één bestand om te uploaden');
        return;
      }
      
      console.log(`📄 Found ${files.length} files to upload`);
      
      // Test eerst bucket toegang
      console.log('Testing bucket access...');
      const bucketOK = await testDocumentsBucket();
      
      if (!bucketOK) {
        toast.error('Kan geen toegang krijgen tot documents bucket - check console voor details');
        return;
      }

      console.log('Bucket access OK, starting upload...');
      
      const uploadResults: any[] = [];
      
      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        console.log(`⬆️ Uploading file ${i + 1}/${files.length}: ${file.name} (${file.size} bytes)`);
        
        try {
          // Upload bestand
          const result = await uploadFactuur(file);
          console.log('Upload resultaat:', result);
          
          // Prepare form data for this file
          const formData = {
            factuurnummer: factuurnummerInput?.value ? `${factuurnummerInput.value}${files.length > 1 ? `-${i + 1}` : ''}` : `FAC-${Date.now()}-${i + 1}`,
            selectedClients,
            selectedOpdrachtgever,
            selectedStatus,
            dateSent: dateSentInput?.value || null,
            datePaid: datePaidInput?.value || null,
            notes: notesInput?.value || null
          };
          
          // Save to database
          await saveFactuurToDatabase(result, file, formData);
          
          uploadResults.push(result);
          
        } catch (fileError) {
          console.error(`Upload fout voor ${file.name}:`, fileError);
          toast.error(`Upload gefaald voor ${file.name}: ${fileError.message}`);
        }
      }
      
      if (uploadResults.length === 0) {
        toast.error('Geen bestanden succesvol geüpload');
        return;
      }
      
      console.log('🎉 Upload process completed successfully!');
      toast.success(`${uploadResults.length} facturen succesvol geüpload en opgeslagen!`);
      setShowUploadModal(false);
      
      // Refresh data to show new invoices
      window.location.reload();
      
    } catch (error) {
      console.error('💥 Upload process failed:', error);
      toast.error(`Er is een fout opgetreden bij het uploaden: ${error}`);
    } finally {
      setUploading(false);
    }
  };



  // Use statistics from state instead of calculating from filtered invoices
  const filteredTotalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const filteredPaidAmount = filteredInvoices.filter(inv => inv.status === 'betaald').reduce((sum, invoice) => sum + invoice.amount, 0);
  const filteredOutstandingAmount = filteredTotalAmount - filteredPaidAmount;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Receipt className="w-8 h-8 text-blue-600" />
              Facturen
            </h1>
            <p className="text-gray-600 mt-1">Beheer en overzicht van alle facturen</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Uploaden Factuur
            </Button>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nieuwe Factuur
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/factuur-generator'}
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Factuur Generator
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:bg-gray-50"
            onClick={() => setShowInvoiceOverview(true)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Geüploade Documenten</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : statistics.uploadedDocuments}
                  </p>
                  <p className="text-xs text-gray-500">
                    van {statistics.totalInvoices} totaal
                  </p>
                  <p className="text-xs text-blue-600 font-medium mt-1">
                    Klik voor overzicht →
                  </p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Totaal Bedrag</p>
                  <p className="text-2xl font-bold text-gray-900">
                    €{loading ? '...' : statistics.totalAmount.toFixed(2)}
                  </p>
                </div>
                <Euro className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Betaald</p>
                  <p className="text-2xl font-bold text-green-600">
                    €{loading ? '...' : statistics.paidAmount.toFixed(2)}
                  </p>
                </div>
                <Euro className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Uitstaand</p>
                  <p className="text-2xl font-bold text-orange-600">
                    €{loading ? '...' : statistics.outstandingAmount.toFixed(2)}
                  </p>
                </div>
                <Euro className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              {/* Search and Status Row */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Zoek op factuurnummer of cliënt..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle statussen</SelectItem>
                      <SelectItem value="concept">Concept</SelectItem>
                      <SelectItem value="verzonden">Verzonden</SelectItem>
                      <SelectItem value="betaald">Betaald</SelectItem>
                      <SelectItem value="achterstallig">Achterstallig</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Opdrachtgever Filter Row */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Filter op Cliënt
                    </Label>
                    <SearchableClientDropdown
                      clients={clients}
                      value={selectedClient}
                      onChange={setSelectedClient}
                      placeholder="Selecteer een cliënt om te filteren..."
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Receipt className="w-4 h-4" />
                      Filter op Opdrachtgever
                    </Label>
                    <Select value={opdrachtgeverFilter} onValueChange={setOpdrachtgeverFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Alle opdrachtgevers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alle">Alle opdrachtgevers</SelectItem>
                        <SelectItem value="Particulier">Particulier</SelectItem>
                        <SelectItem value="ICN">ICN</SelectItem>
                        <SelectItem value="IBN">IBN</SelectItem>
                        <SelectItem value="IN">IN</SelectItem>
                        <SelectItem value="MMS">MMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="w-full md:w-48 flex items-end">
                  {selectedClient && (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedClient('')}
                      className="w-full"
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Wis Filter
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoices List */}
        <Card>
          <CardHeader>
            <CardTitle>Facturen Overzicht</CardTitle>
            <CardDescription>
              {filteredInvoices.length} facturen gevonden
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Geen facturen gevonden</h3>
                <p className="text-gray-600 mb-4">
                  Er zijn geen facturen die voldoen aan je zoekcriteria.
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Eerste factuur maken
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{invoice.invoiceNumber}</h3>
                          {getStatusBadge(invoice.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{invoice.clientName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Datum: {new Date(invoice.date).toLocaleDateString('nl-NL')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Euro className="w-4 h-4" />
                            <span className="font-medium">€{invoice.amount.toFixed(2)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{invoice.description}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toast.success(`Factuur ${invoice.invoiceNumber} bekijken...`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toast.success(`Factuur ${invoice.invoiceNumber} downloaden...`)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toast.success(`Factuur ${invoice.invoiceNumber} bewerken...`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Invoice Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Facturen Uploaden</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploadModal(false)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="uploadFile">Selecteer Factuur Bestanden</Label>
                  <Input 
                    id="uploadFile" 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    multiple
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Ondersteunde formaten: PDF, JPG, PNG, DOC, DOCX<br />
                    <strong>Tip:</strong> Houd Ctrl ingedrukt om meerdere bestanden te selecteren
                  </p>
                </div>
                <div>
                  <Label>Koppel aan Cliënten (optioneel)</Label>
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                    {clients.map((client) => (
                      <div key={client.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`client-${client.id}`}
                          className="rounded border-gray-300"
                        />
                        <label
                          htmlFor={`client-${client.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {client.naam}
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Selecteer een of meerdere cliënten
                  </p>
                </div>
                <div>
                  <Label htmlFor="uploadOpdrachtgever">Koppeld aan Opdrachtgever (optioneel)</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer opdrachtgever type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="particulier">Particulier</SelectItem>
                      <SelectItem value="icn">ICN</SelectItem>
                      <SelectItem value="ibn">IBN</SelectItem>
                      <SelectItem value="in">IN</SelectItem>
                      <SelectItem value="mms">MMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="uploadFactuurnummer">Factuurnummer (optioneel)</Label>
                  <Input 
                    id="uploadFactuurnummer" 
                    placeholder="Bijv. FAC-2024-003"
                    className="mt-2"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="uploadDateSent">Datum van Versturen (optioneel)</Label>
                    <Input 
                      id="uploadDateSent" 
                      type="date"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="uploadDatePaid">Datum van Betaling (optioneel)</Label>
                    <Input 
                      id="uploadDatePaid" 
                      type="date"
                      className="mt-2"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="uploadStatus">Status</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openstaand">Openstaand</SelectItem>
                      <SelectItem value="betaald">Betaald</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="uploadNotes">Notities (optioneel)</Label>
                  <Textarea 
                    id="uploadNotes" 
                    placeholder="Extra notities over deze factuur..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1"
                  >
                    Annuleren
                  </Button>
                  <Button
                    onClick={handleUploadFacturen}
                    disabled={uploading}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploaden...' : 'Upload Facturen'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Invoice Modal Placeholder */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Nieuwe Factuur Maken</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="invoiceNumber">Factuurnummer</Label>
                    <Input id="invoiceNumber" placeholder="FAC-2024-003" />
                  </div>
                  <div>
                    <Label htmlFor="client">Cliënt</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer cliënt" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">A. Arkojan Arakelyan</SelectItem>
                        <SelectItem value="2">M.J. van Langbroek</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="opdrachtgeverType">Opdrachtgever Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer opdrachtgever type (optioneel)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="particulier">Particulier</SelectItem>
                        <SelectItem value="icn">ICN</SelectItem>
                        <SelectItem value="ibn">IBN</SelectItem>
                        <SelectItem value="in">IN</SelectItem>
                        <SelectItem value="mms">MMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    {/* Empty div for grid alignment */}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Factuurdatum</Label>
                    <Input id="date" type="date" />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Vervaldatum</Label>
                    <Input id="dueDate" type="date" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Beschrijving</Label>
                  <Textarea id="description" placeholder="Beschrijving van de factuur..." />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1"
                  >
                    Annuleren
                  </Button>
                  <Button
                    onClick={() => {
                      toast.success('Factuur aangemaakt!');
                      setShowCreateModal(false);
                    }}
                    className="flex-1"
                  >
                    Factuur Maken
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Overview Modal */}
        {showInvoiceOverview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Facturen Overzicht</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {statistics.uploadedDocuments} geüploade documenten van {statistics.totalInvoices} totaal
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInvoiceOverview(false)}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Sluiten
                  </Button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">Laden...</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoices.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Nog geen facturen gevonden</p>
                        <p className="text-sm">Upload je eerste factuur om te beginnen</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {invoices
                          .filter(invoice => {
                            // Filter only invoices with uploaded documents if needed
                            return true; // Show all invoices for now
                          })
                          .map((invoice) => (
                            <div key={invoice.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    <div>
                                      <h3 className="font-medium text-gray-900">{invoice.invoiceNumber}</h3>
                                      <p className="text-sm text-gray-600">{invoice.clientName}</p>
                                    </div>
                                  </div>
                                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4" />
                                      {invoice.date}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Euro className="w-4 h-4" />
                                      €{invoice.amount.toFixed(2)}
                                    </span>
                                    {getStatusBadge(invoice.status)}
                                  </div>
                                  {invoice.description && (
                                    <p className="mt-2 text-sm text-gray-600">{invoice.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedDocument(invoice);
                                      setShowDocumentPreview(true);
                                    }}
                                    title="Document preview"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    title="Download document"
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Totaal: €{statistics.totalAmount.toFixed(2)} | 
                    Betaald: €{statistics.paidAmount.toFixed(2)} | 
                    Uitstaand: €{statistics.outstandingAmount.toFixed(2)}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowUploadModal(true)}
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Nieuwe Factuur Uploaden
                    </Button>
                    <Button
                      onClick={() => setShowInvoiceOverview(false)}
                    >
                      Sluiten
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Preview Modal */}
        {showDocumentPreview && selectedDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Document Preview</h2>
                    <p className="text-sm text-gray-600">
                      {selectedDocument.invoiceNumber} - {selectedDocument.clientName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Download functionality can be added here
                        toast.info('Download functionaliteit komt binnenkort');
                      }}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowDocumentPreview(false);
                        setSelectedDocument(null);
                      }}
                    >
                      Sluiten
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 overflow-auto max-h-[calc(90vh-120px)]">
                {(() => {
                  // Debug: Log the selected document to see what data is available
                  console.log('🔍 Selected document for preview:', selectedDocument);
                  console.log('📄 Document URLs:', selectedDocument.document_urls);
                  console.log('🔗 Primary document URL:', selectedDocument.documentUrl);
                  
                  // Get document URL from the invoice data
                  const documentUrl = selectedDocument.documentUrl || 
                    (selectedDocument.document_urls && selectedDocument.document_urls.length > 0 ? selectedDocument.document_urls[0] : null);
                  
                  console.log('🎯 Final document URL for preview:', documentUrl);
                  
                  if (!documentUrl) {
                    return (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <FileText className="w-16 h-16 mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium mb-2">Geen document beschikbaar</h3>
                        <p className="text-sm text-center mb-4">
                          Er is geen document gekoppeld aan deze factuur.
                        </p>
                        <div className="text-xs text-gray-400 bg-gray-100 p-3 rounded max-w-md">
                          <strong>Debug info:</strong><br/>
                          Document URLs: {JSON.stringify(selectedDocument.document_urls)}<br/>
                          Primary URL: {selectedDocument.documentUrl || 'null'}<br/>
                          Invoice ID: {selectedDocument.id}
                        </div>
                      </div>
                    );
                  }
                  
                  // Determine file type from URL
                  const fileExtension = documentUrl.split('.').pop()?.toLowerCase();
                  const isPdf = fileExtension === 'pdf';
                  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
                  
                  if (isPdf) {
                    return (
                      <div className="w-full h-full">
                        <iframe
                          src={documentUrl}
                          className="w-full h-[600px] border border-gray-300 rounded"
                          title="PDF Preview"
                        />
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          PDF wordt weergegeven. Als het niet laadt, 
                          <a 
                            href={documentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline ml-1"
                          >
                            klik hier om te openen in nieuwe tab
                          </a>
                        </p>
                      </div>
                    );
                  }
                  
                  if (isImage) {
                    return (
                      <div className="flex justify-center">
                        <img
                          src={documentUrl}
                          alt={`Document ${selectedDocument.invoiceNumber}`}
                          className="max-w-full max-h-[600px] object-contain border border-gray-300 rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="flex flex-col items-center justify-center py-12 text-gray-500">
                                  <FileText class="w-16 h-16 mb-4 text-gray-300" />
                                  <p>Kan afbeelding niet laden</p>
                                  <a href="${documentUrl}" target="_blank" class="text-blue-600 hover:underline mt-2">
                                    Open in nieuwe tab
                                  </a>
                                </div>
                              `;
                            }
                          }}
                        />
                      </div>
                    );
                  }
                  
                  // For other file types, show a download link
                  return (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                      <FileText className="w-16 h-16 mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium mb-2">Preview niet beschikbaar</h3>
                      <p className="text-sm text-center mb-4">
                        Dit bestandstype ({fileExtension?.toUpperCase()}) kan niet worden weergegeven in de browser.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => window.open(documentUrl, '_blank')}
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Open in nieuwe tab
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = documentUrl;
                            link.download = selectedDocument.invoiceNumber || 'document';
                            link.click();
                          }}
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Factuur:</span> {selectedDocument.invoiceNumber} | 
                    <span className="font-medium text-gray-500">Cliënt:</span> <span className="inline-block px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 border border-purple-500 font-medium text-xs ml-1">{selectedDocument.clientName}</span> | 
                    <span className="font-medium">Bedrag:</span> €{selectedDocument.amount?.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedDocument.status && (
                      <div className="flex items-center gap-2">
                        <span>Status:</span>
                        {getStatusBadge(selectedDocument.status)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Factuur;
