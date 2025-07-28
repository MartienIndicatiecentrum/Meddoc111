import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { FileText, Users, Plus, Clock, AlertTriangle, CheckCircle, BarChart3 } from "lucide-react";
import { DocumentUpload } from "@/components/DocumentUpload";
import { NewClientForm } from "@/components/NewClientForm";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import KiesClientDropdown from "@/components/KiesClientDropdown";
import { useNavigate } from "react-router-dom";
import OpenTasksModal from "@/components/OpenTasksModal";
import ClosedTasksModal from "@/components/ClosedTasksModal";
import NewTaskModal from "@/components/NewTaskModal";
import { Select } from "@/components/ui/select";
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

interface DocumentStats {
  total: number;
  afgehandeld: number;
  inBehandeling: number;
  openstaand: number;
  urgent: number;
}

type DocumentStatus = 'afgehandeld' | 'in_behandeling' | 'openstaand' | 'urgent' | 'nieuw';

interface Document {
  id: string;
  status: DocumentStatus;
  created_at: string;
  title: string;
  bucket?: string;
  file_path?: string;
  category?: string;
  urgency?: string;
  client_id?: string;
}

interface Client {
  id: string;
  naam: string;
}

const getStatusColor = (status: DocumentStatus) => {
  switch (status) {
    case 'afgehandeld':
      return 'bg-green-100 text-green-800';
    case 'in_behandeling':
      return 'bg-yellow-100 text-yellow-800';
    case 'urgent':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

const getStatusText = (status: DocumentStatus) => {
  switch (status) {
    case 'afgehandeld':
      return 'Afgehandeld';
    case 'in_behandeling':
      return 'In Behandeling';
    case 'urgent':
      return 'Urgent';
    default:
      return 'Openstaand';
  }
};

const Index = () => {
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DocumentStats>({
    total: 0,
    afgehandeld: 0,
    inBehandeling: 0,
    openstaand: 0,
    urgent: 0
  });
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const navigate = useNavigate();
  const [showOpenTasks, setShowOpenTasks] = useState(false);
  const [showClosedTasks, setShowClosedTasks] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("alle");
  const [typeFilter, setTypeFilter] = useState<string>("alle");
  const [urgentieFilter, setUrgentieFilter] = useState<string>("alle");

  const documentTypeOptions = [
    "alle",
    "Vragen verzekeraar",
    "Antwoordbrief verzekeraar",
    "Brief huisarts",
    "Brief Fysio",
    "Brief Ergo",
    "Brief Ziekenhuis",
    "Indicatie",
    "Anders",
    "Urgent",
    "Zeer urgent"
  ];
  const urgentieOptions = [
    { value: "alle", label: "Alle urgentieën" },
    { value: "Niet urgent", label: "Niet urgent" },
    { value: "Urgent", label: "Urgent" },
    { value: "Zeer urgent", label: "Zeer urgent" },
  ];

  const statusOptions = [
    { value: "alle", label: "Alle documenten" },
    { value: "afgehandeld", label: "Afgehandelde documenten" },
    { value: "openstaand", label: "Openstaande documenten" },
  ];
  const doelOptions = [
    { value: "alle", label: "Alle doelen" },
    { value: "Vragen verzekeraar", label: "Vragen verzekeraar" },
    { value: "Antwoordbrief verzekeraar", label: "Antwoordbrief verzekeraar" },
    { value: "Brief huisarts", label: "Brief Huisarts" },
    { value: "Brief Fysio", label: "Brief Fysio" },
    { value: "Brief Ergo", label: "Brief Ergo" },
    { value: "Brief Ziekenhuis", label: "Brief Ziekenhuis" },
    { value: "Indicatie", label: "Indicatie" },
    { value: "Anders", label: "Anders" },
  ];

  // Haal cliënten op uit Supabase
  useEffect(() => {
    const fetchClients = async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, naam')
        .order('naam');
      if (!error && data) setClients(data);
    };
    fetchClients();
  }, []);

  // Pas bestaande document/staats-filters aan om te filteren op selectedClientId
  const filteredDocuments = recentDocuments.filter(doc => {
    const clientOk = !selectedClientId || doc.client_id === selectedClientId;
    const statusOk = statusFilter === "alle" ||
      (statusFilter === "afgehandeld" && doc.status === "afgehandeld") ||
      (statusFilter === "openstaand" && (doc.status === "openstaand" || doc.status === "nieuw"));
    const typeOk = typeFilter === "alle" || (doc.category && doc.category === typeFilter);
    const urgentieOk = urgentieFilter === "alle" || (doc.urgency === urgentieFilter);
    return clientOk && statusOk && typeOk && urgentieOk;
  });

  const fetchRecentDocuments = useCallback(async () => {
    try {
      let query = supabase
        .from('documents')
        .select('id, status, created_at, title, bucket, file_path')
        .order('created_at', { ascending: false });
      if (selectedClientId) {
        query = query.eq('client_id', selectedClientId);
      }
      const { data, error } = await query;
      
      if (error) throw error;

      if (data) {
        setRecentDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching recent documents:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het ophalen van recente documenten.",
        variant: "destructive",
      });
    }
  }, [selectedClientId]);

  const fetchDocumentStats = useCallback(async () => {
    try {
      let query = supabase
        .from('documents')
        .select('id, status, created_at');
      if (selectedClientId) {
        query = query.eq('client_id', selectedClientId);
      }
      const { data, error } = await query;
      
      if (error) throw error;

      if (data) {
        const newStats = data.reduce((acc: DocumentStats, doc: Document) => {
          acc.total++;
          switch (doc.status) {
            case 'afgehandeld': acc.afgehandeld++; break;
            case 'in_behandeling': acc.inBehandeling++; break;
            case 'openstaand': acc.openstaand++; break;
            case 'urgent': acc.urgent++; break;
          }
          return acc;
        }, {
          total: 0,
          afgehandeld: 0,
          inBehandeling: 0,
          openstaand: 0,
          urgent: 0
        });
        
        setStats(newStats);
      }
    } catch (error) {
      console.error('Error fetching document stats:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het ophalen van de statistieken.",
        variant: "destructive",
      });    }
  }, [selectedClientId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedClientId) {
        setRecentDocuments([]);
        setStats({ total: 0, afgehandeld: 0, inBehandeling: 0, openstaand: 0, urgent: 0 });
        return;
      }
      try {
        await Promise.all([
          fetchDocumentStats(),
          fetchRecentDocuments()
        ]);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast({
          title: "Fout",
          description: "Er is een fout opgetreden bij het ophalen van de gegevens.",
          variant: "destructive",
        });
      }
    };
    fetchData();
  }, [fetchDocumentStats, fetchRecentDocuments, selectedClientId]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <h1 className="text-xl font-semibold">MedDoc Pro</h1>
                <p className="text-sm text-gray-500">Medisch Documentmanagement</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewClient(true)}
                className="flex items-center"
              >
                <Users className="h-4 w-4 mr-2" />
                Nieuwe Cliënt
              </Button>
              <Button
                size="sm"
                className="flex items-center"
                asChild
              >
                <a href="/documenten">
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuw Document
                </a>
              </Button>
              <Button
                size="sm"
                className="flex items-center"
                asChild
              >
                <a href="/taken">
                  <Clock className="h-4 w-4 mr-2" />
                  Takenoverzicht
                </a>
              </Button>
              <Button
                size="sm"
                className="flex items-center"
                asChild
              >
                <a href="/PlanningApp">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  PlanningApp
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Material UI Autocomplete client selector bovenaan */}
      <div className="mb-4 flex items-center gap-2">
        <Autocomplete
          options={clients}
          getOptionLabel={(option) => option.naam}
          value={clients.find(c => c.id === selectedClientId) || null}
          onChange={(_, newValue) => setSelectedClientId(newValue ? newValue.id : null)}
          renderInput={(params) => (
            <TextField {...params} label="Selecteer cliënt" variant="outlined" size="small" />
          )}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          sx={{ minWidth: 300 }}
        />
      </div>

      {/* Client selector bovenaan dashboard */}
      {selectedClientId && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 flex flex-wrap gap-4 justify-center mb-8">
          <Button onClick={() => navigate('/documenten-inzien')} variant="outline">Documenten inzien</Button>
          <Button onClick={() => navigate('/documenten')} variant="default">Nieuw document toevoegen</Button>
          <Button onClick={() => navigate('/nieuwe-taak')} variant="default">Nieuwe taak</Button>
          <Button onClick={() => navigate('/taken')} variant="default">Takenoverzicht</Button>
          <Button onClick={() => setShowOpenTasks(true)} variant="outline">Openstaande taken inzien</Button>
          <Button onClick={() => setShowClosedTasks(true)} variant="outline">Afgeronde taken inzien</Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('documenten')}
              className={`py-4 px-1 border-b-2 ${
                activeTab === 'documenten'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Documenten
            </button>
          </div>
        </div>
      </nav>
      {/* Voeg hier de rest van je dashboard/documenten-tab content toe */}
    </div>
  );
};

export default Index;