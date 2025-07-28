import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { clientService, Client } from '@/services/clientService';
import { 
  X, 
  Calendar as CalendarIcon, 
  Search, 
  Send,
  User,
  MessageCircle,
  AlertTriangle,
  Clock,
  Loader2,
  Eye,
  ExternalLink,
  Shield,
  AlertCircle,
  HelpCircle,
  Timer,
  CheckSquare,
  RotateCcw,
  Edit,
  Home,
  UserCheck,
  Building2,
  Stethoscope
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface LogboekEntry {
  id: string;
  date: string;
  from: {
    name: string;
    type: 'client' | 'employee' | 'insurer' | 'family' | 'verzekeraar';
    color: string;
  };
  type: 'Notitie' | 'Vraag Verzekeraar' | 'Vraag Client' | 'Indicatie' | 'Taak' | 'Documenten afronden en opsturen' | 'Reactie client' | 'Reactie verzekeraar' | 'Reactie Opdrachtgever' | 'Mijn reactie' | 'Vervolgreactie client' | 'Vervolgreactie verzekeraar' | 'Vervolgreactie Opdrachtgever' | 'Algemene response' | 'Anders' | string; // Allow custom types
  action: string;
  description: string;
  status: 'Geen urgentie' | 'Licht urgent' | 'Urgent' | 'Reactie nodig' | 'Afgehandeld' | 'In behandeling';
  isUrgent: boolean;
  needsResponse: boolean;
}

const Logboek: React.FC = () => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [logEntries, setLogEntries] = useState<LogboekEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Filter states
  const [filterFrom, setFilterFrom] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [filterDescription, setFilterDescription] = useState<string>('');
  const [clientSearchTerm, setClientSearchTerm] = useState<string>('');
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  
  // New entry form states
  const [newEntry, setNewEntry] = useState({
    fromName: '',
    fromType: 'employee' as 'client' | 'employee' | 'insurer' | 'family',
    type: 'Notitie' as 'Notitie' | 'Vraag Verzekeraar' | 'Vraag Client' | 'Indicatie' | 'Taak' | 'Documenten afronden en opsturen' | 'Reactie client' | 'Reactie verzekeraar' | 'Reactie Opdrachtgever' | 'Mijn reactie' | 'Vervolgreactie client' | 'Vervolgreactie verzekeraar' | 'Vervolgreactie Opdrachtgever' | 'Algemene response' | 'Anders',
    customType: '', // For "Anders" option
    action: '',
    description: '',
    isUrgent: false,
    needsResponse: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LogboekEntry | null>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    action: '',
    description: '',
    status: 'Geen urgentie' as 'Geen urgentie' | 'Licht urgent' | 'Urgent' | 'Reactie nodig' | 'Afgehandeld' | 'In behandeling'
  });

  useEffect(() => {
    loadClients();
  }, []);

  // Debug functie om localStorage status te controleren
  const debugLocalStorage = useCallback(() => {
    const saved = localStorage.getItem('recentClients');
    console.log('Current localStorage recentClients:', saved);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log('Parsed recent client IDs:', parsed);
      } catch (error) {
        console.error('Error parsing localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadLogEntries(selectedClient.id);
      setShowAllRecent(false);
    } else if (showAllRecent) {
      loadRecentLogEntries();
    }
  }, [selectedClient, showAllRecent]);

  const loadClients = useCallback(async () => {
    try {
      const allClients = await clientService.getClients();
      console.log('Loaded clients:', allClients); // Debug log
      setClients(allClients);
      
      // Laad recente clienten uit localStorage
      const savedRecentClients = localStorage.getItem('recentClients');
      console.log('Loading clients - localStorage savedRecentClients:', savedRecentClients);
      
      if (savedRecentClients) {
        try {
          const recentClientIds = JSON.parse(savedRecentClients);
          console.log('Parsed recent client IDs:', recentClientIds);
          
          const recentClients = recentClientIds
            .map((id: string) => {
              const client = allClients.find(client => client.id === id);
              console.log(`Looking for client ID ${id}:`, client ? client.name : 'NOT FOUND');
              return client;
            })
            .filter(Boolean)
            .slice(0, 5);
          
          console.log('Final recent clients to set:', recentClients.map(c => c.name));
          setRecentClients(recentClients);
          console.log('Loaded recent clients from localStorage:', recentClients);
        } catch (error) {
          console.error('Error parsing recent clients from localStorage:', error);
          // Fallback naar eerste 5 clienten
          setRecentClients(allClients.slice(0, 5));
        }
      } else {
        // Geen recente clienten opgeslagen, gebruik eerste 5
        console.log('No recent clients in localStorage, using first 5 clients');
        setRecentClients(allClients.slice(0, 5));
      }
      
      if (allClients.length > 0) {
        setSelectedClient(allClients[0]);
        console.log('Selected first client:', allClients[0]); // Debug log
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  }, []);

  const getColorForType = useCallback((type: 'client' | 'employee' | 'insurer' | 'family'): string => {
    switch (type) {
      case 'client': return 'purple';
      case 'employee': return 'blue';
      case 'insurer': return 'green';
      case 'family': return 'orange';
      case 'verzekeraar': return 'red';
      default: return 'gray';
    }
  }, []);

  const getIconForType = useCallback((type: string) => {
    switch (type) {
      case 'client': return UserCheck;
      case 'employee': return Stethoscope;
      case 'insurer': return Building2;
      case 'family': return User;
      case 'verzekeraar': return Building2;
      default: return User;
    }
  }, []);



  const getDefaultNameForType = useCallback((type: 'client' | 'employee' | 'insurer' | 'family'): string => {
    switch (type) {
      case 'client': return 'Cliënt';
      case 'employee': return 'Medewerker';
      case 'insurer': return 'Verzekeraar';
      case 'family': return 'Familie';
      default: return 'Medewerker';
    }
  }, []);

  // Filter clients based on search term
  const filteredClients = useMemo(() => {
    if (!clientSearchTerm) return clients;
    return clients.filter(client => 
      client.name.toLowerCase().includes(clientSearchTerm.toLowerCase())
    );
  }, [clients, clientSearchTerm]);

  const getStatusBadgeVariant = useCallback((status: string) => {
    switch (status) {
      case 'Geen urgentie': return 'default';
      case 'Licht urgent': return 'secondary';
      case 'Urgent': return 'destructive';
      case 'Reactie nodig': return 'outline';
      case 'Afgehandeld': return 'default';
      case 'In behandeling': return 'outline';
      default: return 'outline';
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'Geen urgentie': return Shield;
      case 'Licht urgent': return AlertCircle;
      case 'Urgent': return AlertTriangle;
      case 'Reactie nodig': return HelpCircle;
      case 'Afgehandeld': return CheckSquare;
      case 'In behandeling': return RotateCcw;
      default: return Clock;
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Geen urgentie': return 'text-green-600 bg-green-50 border-green-200';
      case 'Licht urgent': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'Reactie nodig': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Afgehandeld': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'In behandeling': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }, []);

  const loadLogEntries = useCallback(async (clientId: string) => {
    try {
      setLoading(true);
      const entries = await clientService.getClientLogEntries(clientId);
      
      // Transform database entries to UI format
      const transformedEntries: LogboekEntry[] = entries.map(entry => ({
        id: entry.id,
        date: new Date(entry.date).toLocaleString('nl-NL'),
        from: {
          name: entry.from_name,
          type: entry.from_type,
          color: entry.from_color || getColorForType(entry.from_type)
        },
        type: entry.type,
        action: entry.action,
        description: entry.description,
        status: entry.status,
        isUrgent: entry.is_urgent,
        needsResponse: entry.needs_response
      }));
      
      setLogEntries(transformedEntries);
    } catch (error) {
      console.error('Error loading log entries:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRecentLogEntries = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading recent log entries...');
      const entries = await clientService.getRecentLogEntries(5);
      console.log('Recent log entries from database:', entries);
      
      // Transform database entries to UI format
      const transformedEntries: LogboekEntry[] = entries.map(entry => ({
        id: entry.id,
        date: new Date(entry.date).toLocaleString('nl-NL'),
        from: {
          name: entry.from_name,
          type: entry.from_type,
          color: entry.from_color || getColorForType(entry.from_type)
        },
        type: entry.type,
        action: entry.action,
        description: entry.description,
        status: entry.status,
        isUrgent: entry.is_urgent,
        needsResponse: entry.needs_response
      }));
      
      console.log('Transformed entries:', transformedEntries);
      console.log('Color mapping example:', transformedEntries.map(entry => ({
        name: entry.from.name,
        type: entry.from.type,
        color: entry.from.color
      })));
      setLogEntries(transformedEntries);
    } catch (error) {
      console.error('Error loading recent log entries:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddEntry = useCallback(async () => {
    console.log('handleAddEntry called');
    console.log('selectedClient:', selectedClient);
    console.log('newEntry:', newEntry);
    
    if (!selectedClient) {
      console.error('No client selected');
      alert('Selecteer eerst een cliënt');
      return;
    }
    
    // Type bericht is nu ook optioneel - gebruik standaard waarde als niet geselecteerd

    setIsSubmitting(true);

    try {
      // Determine the final type value - use default if not selected
      const finalType = newEntry.type === 'Anders' && newEntry.customType 
        ? newEntry.customType 
        : newEntry.type || 'Notitie';

      const logEntryData = {
        client_id: selectedClient.id,
        date: new Date().toISOString(),
        from_name: newEntry.fromName || getDefaultNameForType(newEntry.fromType),
        from_type: newEntry.fromType,
        from_color: getColorForType(newEntry.fromType),
        type: finalType,
        action: newEntry.action || `${finalType} toegevoegd`,
        description: newEntry.description || 'Geen beschrijving',
        status: (newEntry.isUrgent ? 'Urgent' : newEntry.needsResponse ? 'Reactie nodig' : 'Geen urgentie') as 'Geen urgentie' | 'Licht urgent' | 'Urgent' | 'Reactie nodig' | 'Afgehandeld' | 'In behandeling',
        is_urgent: newEntry.isUrgent,
        needs_response: newEntry.needsResponse
      };

      console.log('Sending log entry data:', logEntryData);
      console.log('Selected client for entry:', selectedClient);

      const entry = await clientService.createLogEntry(logEntryData);

      console.log('Response from createLogEntry:', entry);

      if (entry) {
        console.log('Log entry created successfully');
        // Reset form and reload entries
        setNewEntry({
          fromName: '',
          fromType: 'employee',
          type: 'Notitie',
          customType: '',
          action: '',
          description: '',
          isUrgent: false,
          needsResponse: false
        });
        setShowAddForm(false);
        loadLogEntries(selectedClient.id);
        
        // Update recente clienten na het toevoegen van een bericht
        setRecentClients(prev => {
          const filtered = prev.filter(c => c.id !== selectedClient.id);
          const updated = [selectedClient, ...filtered].slice(0, 5);
          
          // Sla recente clienten op in localStorage
          const recentClientIds = updated.map(c => c.id);
          localStorage.setItem('recentClients', JSON.stringify(recentClientIds));
          console.log('Saved recent clients to localStorage after adding entry:', recentClientIds);
          
          return updated;
        });
        
        alert('Bericht succesvol toegevoegd!');
      } else {
        console.error('No entry returned from createLogEntry');
        alert('Fout bij het toevoegen van het bericht. Controleer de console voor details.');
      }
    } catch (error) {
      console.error('Error adding log entry:', error);
      alert(`Fout bij het toevoegen van het bericht: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedClient, newEntry, loadLogEntries, getDefaultNameForType]);

  const filteredEntries = useMemo(() => {
    return logEntries.filter(entry => {
      if (filterFrom && entry.from.name.toLowerCase().includes(filterFrom.toLowerCase())) return false;
      if (filterType && filterType !== 'all' && entry.type !== filterType) return false;
      if (filterStatus && filterStatus !== 'all' && entry.status !== filterStatus) return false;
      if (filterDate) {
        const entryDate = new Date(entry.date);
        const filterDateStr = format(filterDate, "dd-MM-yyyy", { locale: nl });
        const entryDateStr = format(entryDate, "dd-MM-yyyy", { locale: nl });
        if (entryDateStr !== filterDateStr) return false;
      }
      if (filterDescription && !entry.description.toLowerCase().includes(filterDescription.toLowerCase())) return false;
      return true;
    });
  }, [logEntries, filterFrom, filterType, filterStatus, filterDate, filterDescription]);

  // Optimized filter handlers
  const handleFilterFromChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterFrom(e.target.value);
  }, []);

  const handleFilterTypeChange = useCallback((value: string) => {
    setFilterType(value);
  }, []);

  const handleFilterStatusChange = useCallback((value: string) => {
    setFilterStatus(value);
  }, []);

  const handleFilterDateChange = useCallback((date: Date | undefined) => {
    setFilterDate(date);
  }, []);

  const handleFilterDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterDescription(e.target.value);
  }, []);

  const clearFilters = useCallback(() => {
    setFilterFrom('');
    setFilterType('all');
    setFilterStatus('all');
    setFilterDate(undefined);
    setFilterDescription('');
  }, []);

  const handleClientChange = useCallback((value: string) => {
    console.log('handleClientChange called with value:', value);
    console.log('Available clients:', clients);
    
    if (value === 'all') {
      setSelectedClient(null);
      setShowAllRecent(true);
      console.log('Selected: All recent messages');
    } else {
      const client = clients.find(c => c.id === value);
      console.log('Found client:', client);
      
      if (client) {
        setSelectedClient(client);
        setShowAllRecent(false);
        console.log('Selected client:', client.name);
        
        // Update recente clienten - voeg deze client toe aan het begin van de lijst
        setRecentClients(prev => {
          console.log('Previous recent clients:', prev.map(c => c.name));
          const filtered = prev.filter(c => c.id !== client.id);
          const updated = [client, ...filtered].slice(0, 5);
          console.log('Updated recent clients:', updated.map(c => c.name));
          
          // Sla recente clienten op in localStorage
          const recentClientIds = updated.map(c => c.id);
          localStorage.setItem('recentClients', JSON.stringify(recentClientIds));
          console.log('Saved recent clients to localStorage:', recentClientIds);
          
          // Debug: controleer localStorage direct
          const saved = localStorage.getItem('recentClients');
          console.log('localStorage after save:', saved);
          
          return updated;
        });
      } else {
        console.error('Client not found for id:', value);
      }
    }
  }, [clients]);

  const handleClientSelect = useCallback((client: Client | null) => {
    if (client === null) {
      // "Alle recente berichten" geselecteerd
      setSelectedClient(null);
      setShowAllRecent(true);
      console.log('Selected: All recent messages');
    } else {
      // Specifieke client geselecteerd
      setSelectedClient(client);
      setShowAllRecent(false);
      console.log('Selected client:', client.name);
      
      // Update recente clienten - voeg deze client toe aan het begin van de lijst
      setRecentClients(prev => {
        console.log('Previous recent clients:', prev.map(c => c.name));
        const filtered = prev.filter(c => c.id !== client.id);
        const updated = [client, ...filtered].slice(0, 5);
        console.log('Updated recent clients:', updated.map(c => c.name));
        
        // Sla recente clienten op in localStorage
        const recentClientIds = updated.map(c => c.id);
        localStorage.setItem('recentClients', JSON.stringify(recentClientIds));
        console.log('Saved recent clients to localStorage:', recentClientIds);
        
        // Debug: controleer localStorage direct
        const saved = localStorage.getItem('recentClients');
        console.log('localStorage after save:', saved);
        
        return updated;
      });
    }
    
    // Sluit de Popover na selectie
    setClientPopoverOpen(false);
  }, []);

  const handleNewEntryChange = useCallback((field: string, value: string | boolean) => {
    setNewEntry(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleOpenEntry = useCallback((entry: LogboekEntry) => {
    setSelectedEntry(entry);
    setEditForm({
      action: entry.action,
      description: entry.description,
      status: entry.status
    });
    setIsEditing(false);
    setShowEntryModal(true);
  }, []);

  const handleCloseEntryModal = useCallback(() => {
    setShowEntryModal(false);
    setSelectedEntry(null);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!selectedEntry) return;
    
    try {
      // Update in database
      await clientService.updateLogEntry(selectedEntry.id, {
        action: editForm.action,
        description: editForm.description,
        status: editForm.status
      });
      
      // Update local state
      setLogEntries(prev => prev.map(entry => 
        entry.id === selectedEntry.id 
          ? { 
              ...entry, 
              action: editForm.action,
              description: editForm.description,
              status: editForm.status
            }
          : entry
      ));
      
      // Update selected entry
      setSelectedEntry(prev => prev ? {
        ...prev,
        action: editForm.action,
        description: editForm.description,
        status: editForm.status
      } : null);
      
      setIsEditing(false);
      console.log('Entry updated successfully');
    } catch (error) {
      console.error('Error updating entry:', error);
      alert('Fout bij het opslaan van de wijzigingen');
    }
  }, [selectedEntry, editForm]);

  const handleStatusChange = useCallback(async (entryId: string, newStatus: string) => {
    try {
      // Update in database
      await clientService.updateLogEntry(entryId, { 
        status: newStatus as 'Geen urgentie' | 'Licht urgent' | 'Urgent' | 'Reactie nodig' | 'Afgehandeld' | 'In behandeling' 
      });
      
      // Update local state
      setLogEntries(prev => prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, status: newStatus as 'Geen urgentie' | 'Licht urgent' | 'Urgent' | 'Reactie nodig' | 'Afgehandeld' | 'In behandeling' }
          : entry
      ));
      
      // Update selected entry if it's the same one
      if (selectedEntry && selectedEntry.id === entryId) {
        setSelectedEntry(prev => prev ? { ...prev, status: newStatus as 'Geen urgentie' | 'Licht urgent' | 'Urgent' | 'Reactie nodig' | 'Afgehandeld' | 'In behandeling' } : null);
      }
      
      console.log(`Status updated to: ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Fout bij het wijzigen van de status');
    }
  }, [selectedEntry]);

  return (
    <div className="w-full h-full p-3">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <h1 className="text-lg font-bold text-gray-900">
            Logboek - {selectedClient ? `Client: ${selectedClient.name}` : 'Recente berichten'}
          </h1>
        </div>
        <p className="text-gray-600">
          {selectedClient ? 'Communicatie logboek voor cliënt' : '3 meest recente berichten van alle cliënten'}
        </p>
      </div>

      {/* Client Selection */}
      <Card className="mb-4 w-full">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2 bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!selectedClient) {
                  alert('Selecteer eerst een cliënt om een nieuw bericht toe te voegen');
                } else {
                  setShowAddForm(!showAddForm);
                }
              }}
              className="flex items-center gap-2 bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
            >
              <Send className="h-4 w-4" />
              Nieuw bericht
            </Button>
            
            <User className="h-5 w-5 text-gray-500" />
            <Button
              variant="outline"
              size="sm"
              onClick={debugLocalStorage}
              className="text-xs"
            >
              Debug localStorage
            </Button>
            {clients.length > 0 ? (
              <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-64 justify-start text-left font-normal border-purple-300 focus:border-purple-500"
                  >
                    {selectedClient ? selectedClient.name : "Selecteer cliënt"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="start">
                  <div className="p-2">
                    <div className="relative">
                      <Input
                        placeholder="Zoek en selecteer cliënt"
                        value={clientSearchTerm}
                        onChange={(e) => setClientSearchTerm(e.target.value)}
                        className="mb-2 pr-8"
                      />
                      {clientSearchTerm && (
                        <button
                          onClick={() => setClientSearchTerm('')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto">
                    {/* Alle recente berichten */}
                    <div 
                      className="px-2 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                      onClick={() => {
                        handleClientSelect(null);
                        setClientSearchTerm('');
                      }}
                    >
                      <span className="mr-2">📋</span>
                      Alle recente berichten (3)
                    </div>
                    
                    {/* Recente clienten sectie */}
                    {recentClients.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs font-medium text-gray-500 border-b border-gray-200">
                          Recente cliënten
                        </div>
                        {recentClients.map(client => (
                          <div
                            key={client.id}
                            className="px-2 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              handleClientSelect(client);
                              setClientSearchTerm('');
                            }}
                          >
                            {client.name}
                          </div>
                        ))}
                      </>
                    )}
                    
                    {/* Alle clienten sectie */}
                    {filteredClients.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs font-medium text-gray-500 border-b border-gray-200">
                          Alle cliënten
                        </div>
                        {/* Filter out recent clients from the full list */}
                        {filteredClients
                          .filter(client => !recentClients.some(rc => rc.id === client.id))
                          .map(client => (
                            <div
                              key={client.id}
                              className="px-2 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                handleClientSelect(client);
                                setClientSearchTerm('');
                              }}
                            >
                              {client.name}
                            </div>
                          ))}
                      </>
                    )}
                    
                    {filteredClients.length === 0 && clientSearchTerm && (
                      <div className="px-2 py-1 text-sm text-gray-500">
                        Geen cliënten gevonden voor "{clientSearchTerm}"
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <div className="text-gray-500">
                {loading ? 'Cliënten laden...' : 'Geen cliënten gevonden'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-4 w-full">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Gewijzigd door</label>
              <Input
                placeholder="Zoek op naam"
                value={filterFrom}
                onChange={handleFilterFromChange}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Type</label>
              <Select value={filterType} onValueChange={handleFilterTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle types" />
                </SelectTrigger>
                                  <SelectContent>
                    <SelectItem value="all">Alle types</SelectItem>
                  <SelectItem value="Notitie">Notitie</SelectItem>
                  <SelectItem value="Vraag Verzekeraar">Vraag Verzekeraar</SelectItem>
                  <SelectItem value="Vraag Client">Vraag Client</SelectItem>
                  <SelectItem value="Indicatie">Indicatie</SelectItem>
                  <SelectItem value="Taak">Taak</SelectItem>
                  <SelectItem value="Documenten afronden en opsturen">Documenten afronden en opsturen</SelectItem>
                  <SelectItem value="Reactie client">Reactie client</SelectItem>
                  <SelectItem value="Reactie verzekeraar">Reactie verzekeraar</SelectItem>
                  <SelectItem value="Reactie Opdrachtgever">Reactie Opdrachtgever</SelectItem>
                  <SelectItem value="Mijn reactie">Mijn reactie</SelectItem>
                  <SelectItem value="Vervolgreactie client">Vervolgreactie client</SelectItem>
                  <SelectItem value="Vervolgreactie verzekeraar">Vervolgreactie verzekeraar</SelectItem>
                  <SelectItem value="Vervolgreactie Opdrachtgever">Vervolgreactie Opdrachtgever</SelectItem>
                  <SelectItem value="Algemene response">Algemene response</SelectItem>
                  <SelectItem value="Anders">Anders</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
              <Select value={filterStatus} onValueChange={handleFilterStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle statussen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  <SelectItem value="Geen urgentie">Geen urgentie</SelectItem>
                  <SelectItem value="Licht urgent">Licht urgent</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                  <SelectItem value="Reactie nodig">Reactie nodig</SelectItem>
                  <SelectItem value="Afgehandeld">Afgehandeld</SelectItem>
                  <SelectItem value="In behandeling">In behandeling</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Datum</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {filterDate ? (
                      format(filterDate, "dd-MM-yyyy", { locale: nl })
                    ) : (
                      <span className="text-gray-500">Selecteer datum</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filterDate}
                    onSelect={handleFilterDateChange}
                    initialFocus
                    locale={nl}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Beschrijving</label>
              <Input
                placeholder="Zoek in berichten"
                value={filterDescription}
                onChange={handleFilterDescriptionChange}
              />
            </div>
          </div>
          
          {/* Clear filters button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-gray-600"
            >
              <X className="h-4 w-4 mr-2" />
              Filters wissen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* New Entry Form */}
      {showAddForm && (
        <Card className="mb-6">
                  <CardHeader>
          <CardTitle className="text-lg">Nieuw bericht toevoegen</CardTitle>
          <p className="text-sm text-gray-600">Alleen cliënt selectie is verplicht</p>
        </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Van (optioneel)</label>
                <Input
                  placeholder="Naam (leeg = standaard naam voor type)"
                  value={newEntry.fromName}
                  onChange={(e) => handleNewEntryChange('fromName', e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Type afzender (optioneel)</label>
                <Select value={newEntry.fromType} onValueChange={(value: 'client' | 'employee' | 'insurer' | 'family') => handleNewEntryChange('fromType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Medewerker</SelectItem>
                    <SelectItem value="client">Cliënt</SelectItem>
                    <SelectItem value="insurer">Verzekeraar</SelectItem>
                    <SelectItem value="family">Familie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Type bericht (optioneel)</label>
                <Select value={newEntry.type} onValueChange={(value: 'Notitie' | 'Vraag Verzekeraar' | 'Vraag Client' | 'Indicatie' | 'Taak' | 'Documenten afronden en opsturen' | 'Reactie client' | 'Reactie verzekeraar' | 'Reactie Opdrachtgever' | 'Mijn reactie' | 'Vervolgreactie client' | 'Vervolgreactie verzekeraar' | 'Vervolgreactie Opdrachtgever' | 'Algemene response' | 'Anders') => handleNewEntryChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer type bericht (standaard: Notitie)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Notitie">Notitie</SelectItem>
                    <SelectItem value="Vraag Verzekeraar">Vraag Verzekeraar</SelectItem>
                    <SelectItem value="Vraag Client">Vraag Client</SelectItem>
                    <SelectItem value="Indicatie">Indicatie</SelectItem>
                    <SelectItem value="Taak">Taak</SelectItem>
                    <SelectItem value="Documenten afronden en opsturen">Documenten afronden en opsturen</SelectItem>
                    <SelectItem value="Reactie client">Reactie client</SelectItem>
                    <SelectItem value="Reactie verzekeraar">Reactie verzekeraar</SelectItem>
                    <SelectItem value="Reactie Opdrachtgever">Reactie Opdrachtgever</SelectItem>
                    <SelectItem value="Mijn reactie">Mijn reactie</SelectItem>
                    <SelectItem value="Vervolgreactie client">Vervolgreactie client</SelectItem>
                    <SelectItem value="Vervolgreactie verzekeraar">Vervolgreactie verzekeraar</SelectItem>
                    <SelectItem value="Vervolgreactie Opdrachtgever">Vervolgreactie Opdrachtgever</SelectItem>
                    <SelectItem value="Algemene response">Algemene response</SelectItem>
                    <SelectItem value="Anders">Anders</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Custom type field for "Anders" option */}
              {newEntry.type === 'Anders' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Specifiek type</label>
                  <Input
                    placeholder="Voer het specifieke type in..."
                    value={newEntry.customType}
                    onChange={(e) => handleNewEntryChange('customType', e.target.value)}
                  />
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Actie (optioneel)</label>
                <Input
                  placeholder="Actie beschrijving (optioneel)"
                  value={newEntry.action}
                  onChange={(e) => handleNewEntryChange('action', e.target.value)}
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Beschrijving (optioneel)</label>
              <Textarea
                placeholder="Voer het bericht in... (optioneel)"
                value={newEntry.description}
                onChange={(e) => handleNewEntryChange('description', e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="urgent"
                  checked={newEntry.isUrgent}
                  onCheckedChange={(checked) => handleNewEntryChange('isUrgent', checked as boolean)}
                />
                <label htmlFor="urgent" className="text-sm font-medium text-gray-700">Urgent</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="needsResponse"
                  checked={newEntry.needsResponse}
                  onCheckedChange={(checked) => handleNewEntryChange('needsResponse', checked as boolean)}
                />
                <label htmlFor="needsResponse" className="text-sm font-medium text-gray-700">Reactie nodig</label>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleAddEntry} 
                disabled={!selectedClient || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Bezig met verzenden...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Bericht toevoegen
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAddForm(false)}
                disabled={isSubmitting}
              >
                Annuleren
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Log Entries Table */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Communicatie Logboek</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Laden...</span>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg w-full">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-1 px-2 font-medium text-gray-700 w-[120px] whitespace-nowrap align-middle">Datum</th>
                    <th className="text-left py-1 px-2 font-medium text-gray-700 w-[100px] whitespace-nowrap align-middle">Van</th>
                    <th className="text-left py-1 px-20 font-medium text-gray-700 w-[120px] whitespace-nowrap align-middle">Type</th>
                    <th className="text-left py-1 px-2 font-medium text-gray-700 w-[150px] whitespace-nowrap align-middle">Actie</th>
                    <th className="text-left py-1 px-2 font-medium text-gray-700 w-[220px] whitespace-nowrap align-middle">Status</th>
                    <th className="text-left py-1 px-2 font-medium text-gray-700 w-[100px] whitespace-nowrap align-middle">Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-gray-50 cursor-pointer py-0" onClick={() => handleOpenEntry(entry)}>
                      <td className="py-1 px-2 text-sm text-gray-600 whitespace-nowrap align-middle">{entry.date}</td>
                                                                    <td className="py-0 px-1 align-middle">
                        <div className={`flex items-center gap-0.5 ${
                          entry.from.type === 'employee' ? 'justify-start' : 'justify-end'
                        }`} style={{ minWidth: '200px' }}>
                          {React.createElement(getIconForType(entry.from.type), { 
                            className: `w-4 h-4 flex-shrink-0 ${
                              entry.from.color === 'blue' ? 'text-blue-600' :
                              entry.from.color === 'purple' ? 'text-purple-600' :
                              entry.from.color === 'green' ? 'text-green-600' :
                              entry.from.color === 'red' ? 'text-red-600' :
                              entry.from.color === 'orange' ? 'text-orange-600' :
                              'text-gray-600'
                            }`
                          })}
                          <span className={`text-sm font-normal truncate px-0.5 py-0 rounded border ${
                            entry.from.color === 'blue' ? 'border-blue-300 bg-blue-50' :
                            entry.from.color === 'purple' ? 'border-purple-300 bg-purple-50' :
                            entry.from.color === 'green' ? 'border-green-300 bg-green-50' :
                            entry.from.color === 'red' ? 'border-red-300 bg-red-50' :
                            entry.from.color === 'orange' ? 'border-orange-300 bg-orange-50' :
                            'border-gray-300 bg-gray-50'
                          }`}>{entry.from.name}</span>
                        </div>
                      </td>
                      <td className="py-1 px-20 align-middle">
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {entry.type}
                        </Badge>
                      </td>
                      <td className="py-1 px-2 text-sm text-gray-600 truncate align-middle">{entry.action}</td>
                      <td className="py-1 px-2 align-middle">
                        <div className="flex items-center gap-2">
                          <Select 
                            value={entry.status} 
                            onValueChange={(value) => handleStatusChange(entry.id, value)}
                            onOpenChange={(open) => {
                              if (open) {
                                // Prevent row click when opening dropdown
                                event?.stopPropagation();
                              }
                            }}
                          >
                            <SelectTrigger className={`w-44 h-7 text-xs border-gray-300 bg-white ${getStatusColor(entry.status)}`}>
                              <div className="flex items-center gap-2">
                                {React.createElement(getStatusIcon(entry.status), { className: "h-3 w-3 flex-shrink-0" })}
                                <SelectValue className="truncate" />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Geen urgentie">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-3 w-3 text-green-600" />
                                  Geen urgentie
                                </div>
                              </SelectItem>
                              <SelectItem value="Licht urgent">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="h-3 w-3 text-orange-600" />
                                  Licht urgent
                                </div>
                              </SelectItem>
                              <SelectItem value="Urgent">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-3 w-3 text-red-600" />
                                  Urgent
                                </div>
                              </SelectItem>
                              <SelectItem value="Reactie nodig">
                                <div className="flex items-center gap-2">
                                  <HelpCircle className="h-3 w-3 text-blue-600" />
                                  Reactie nodig
                                </div>
                              </SelectItem>
                              <SelectItem value="Afgehandeld">
                                <div className="flex items-center gap-2">
                                  <CheckSquare className="h-3 w-3 text-gray-600" />
                                  Afgehandeld
                                </div>
                              </SelectItem>
                              <SelectItem value="In behandeling">
                                <div className="flex items-center gap-2">
                                  <RotateCcw className="h-3 w-3 text-purple-600" />
                                  In behandeling
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {entry.status === 'Reactie nodig' && (
                            <HelpCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          )}
                          {entry.status === 'Urgent' && (
                            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                          )}
                        </div>
                      </td>
                      <td className="py-1 px-2 align-middle">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEntry(entry);
                          }}
                          className="flex items-center gap-1 whitespace-nowrap"
                        >
                          <Eye className="h-3 w-3 flex-shrink-0" />
                          Open
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredEntries.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Geen logboek entries gevonden
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entry Detail Modal */}
      {showEntryModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                                                                                 <div className={`w-4 h-4 rounded-full bg-${selectedEntry.from.color}-50 border border-${selectedEntry.from.color}-400`}></div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Bericht Details
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseEntryModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Datum & Tijd</label>
                    <p className="text-sm text-gray-900 mt-1 break-words">{selectedEntry.date}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Van</label>
                    <div className="flex items-center gap-2 mt-1">
                                              <div className={`w-3 h-3 rounded-full bg-${selectedEntry.from.color}-50 border border-${selectedEntry.from.color}-400 flex-shrink-0`}></div>
                      <span className="text-sm text-gray-900 break-words">{selectedEntry.from.name}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Type</label>
                    <div className="mt-1">
                      <Badge variant="outline" className="text-xs">
                        {selectedEntry.type}
                      </Badge>
                    </div>
                  </div>
                                  <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Select 
                      value={selectedEntry.status} 
                      onValueChange={(value) => handleStatusChange(selectedEntry.id, value)}
                    >
                      <SelectTrigger className={`w-40 h-8 text-xs ${getStatusColor(selectedEntry.status)}`}>
                        <div className="flex items-center gap-2">
                          {React.createElement(getStatusIcon(selectedEntry.status), { className: "h-3 w-3" })}
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Geen urgentie">
                          <div className="flex items-center gap-2">
                            <Shield className="h-3 w-3 text-green-600" />
                            Geen urgentie
                          </div>
                        </SelectItem>
                        <SelectItem value="Licht urgent">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-3 w-3 text-orange-600" />
                            Licht urgent
                          </div>
                        </SelectItem>
                        <SelectItem value="Urgent">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3 text-red-600" />
                            Urgent
                          </div>
                        </SelectItem>
                        <SelectItem value="Reactie nodig">
                          <div className="flex items-center gap-2">
                            <HelpCircle className="h-3 w-3 text-blue-600" />
                            Reactie nodig
                          </div>
                        </SelectItem>
                        <SelectItem value="Afgehandeld">
                          <div className="flex items-center gap-2">
                            <CheckSquare className="h-3 w-3 text-gray-600" />
                            Afgehandeld
                          </div>
                        </SelectItem>
                        <SelectItem value="In behandeling">
                          <div className="flex items-center gap-2">
                            <RotateCcw className="h-3 w-3 text-purple-600" />
                            In behandeling
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                  </div>
                </div>
                </div>

                {/* Action */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Actie</label>
                  {isEditing ? (
                    <div className="mt-2">
                      <Textarea
                        value={editForm.action}
                        onChange={(e) => setEditForm(prev => ({ ...prev, action: e.target.value }))}
                        className="min-h-[80px]"
                        placeholder="Voer de actie in..."
                      />
                    </div>
                  ) : (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-900 break-words leading-relaxed">
                        {selectedEntry.action}
                      </p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Beschrijving</label>
                  {isEditing ? (
                    <div className="mt-2">
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        className="min-h-[120px]"
                        placeholder="Voer de beschrijving in..."
                      />
                    </div>
                  ) : (
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg min-h-[100px]">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap break-words leading-relaxed">
                        {selectedEntry.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Flags */}

              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 flex-shrink-0">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Annuleren
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Opslaan
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Bewerken
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleCloseEntryModal}
              >
                Sluiten
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logboek; 