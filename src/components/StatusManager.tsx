
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Play,
  Pause,
  X,
  Calendar,
  User,
  MessageSquare,
  ArrowRight,
  Filter
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Document {
  id: string;
  title: string;
  type: string;
  status: 'nieuw' | 'in_behandeling' | 'wacht_op_info' | 'afgehandeld' | 'geannuleerd';
  priority: 'laag' | 'normaal' | 'hoog' | 'urgent';
  deadline?: Date;
  created_at: Date;
  file_size: number;
  mime_type: string;
}

interface StatusManagerProps {
  documents: Document[];
  onDocumentUpdate: (updateFunction: (docs: Document[]) => Document[]) => void;
}

interface StatusUpdate {
  id: string;
  document_id: string;
  old_status: string;
  new_status: string;
  notes: string;
  updated_by: string;
  updated_at: Date;
}

export const StatusManager: React.FC<StatusManagerProps> = ({ documents, onDocumentUpdate }) => {
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [bulkPriority, setBulkPriority] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [recentUpdates, setRecentUpdates] = useState<StatusUpdate[]>([]);

  const statusOptions = [
    { value: 'nieuw', label: 'Nieuw', icon: Play, color: 'bg-blue-100 text-blue-800' },
    { value: 'in_behandeling', label: 'In Behandeling', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'wacht_op_info', label: 'Wacht op Info', icon: Pause, color: 'bg-orange-100 text-orange-800' },
    { value: 'afgehandeld', label: 'Afgehandeld', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
    { value: 'geannuleerd', label: 'Geannuleerd', icon: X, color: 'bg-gray-100 text-gray-800' }
  ];

  const priorityOptions = [
    { value: 'laag', label: 'Laag', color: 'bg-gray-100 text-gray-800' },
    { value: 'normaal', label: 'Normaal', color: 'bg-blue-100 text-blue-800' },
    { value: 'hoog', label: 'Hoog', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  const getStatusInfo = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const getPriorityInfo = (priority: string) => {
    return priorityOptions.find(p => p.value === priority) || priorityOptions[0];
  };

  const filteredDocuments = documents.filter(doc => 
    statusFilter === 'all' || doc.status === statusFilter
  );

  const handleDocumentSelect = (documentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocuments(prev => [...prev, documentId]);
    } else {
      setSelectedDocuments(prev => prev.filter(id => id !== documentId));
    }
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(filteredDocuments.map(doc => doc.id));
    }
  };

  const handleStatusUpdate = (documentId: string, newStatus: string, newPriority?: string) => {
    const document = documents.find(doc => doc.id === documentId);
    if (!document) return;

    // Create status update record
    const statusUpdate: StatusUpdate = {
      id: Date.now().toString(),
      document_id: documentId,
      old_status: document.status,
      new_status: newStatus,
      notes: notes,
      updated_by: 'Huidige Gebruiker',
      updated_at: new Date()
    };

    setRecentUpdates(prev => [statusUpdate, ...prev.slice(0, 9)]);

    // Update document
    onDocumentUpdate(docs => docs.map(doc => 
      doc.id === documentId 
        ? { 
            ...doc, 
            status: newStatus as any,
            ...(newPriority && { priority: newPriority as any })
          }
        : doc
    ));

    toast({
      title: "Status bijgewerkt",
      description: `${document.title} is nu "${newStatus.replace('_', ' ')}"`,
    });

    setNotes('');
  };

  const handleBulkUpdate = () => {
    if (selectedDocuments.length === 0) {
      toast({
        title: "Geen documenten geselecteerd",
        description: "Selecteer documenten om bulk updates uit te voeren",
        variant: "destructive",
      });
      return;
    }

    selectedDocuments.forEach(docId => {
      if (bulkStatus) {
        handleStatusUpdate(docId, bulkStatus, bulkPriority || undefined);
      }
    });

    setSelectedDocuments([]);
    setBulkStatus('');
    setBulkPriority('');
  };

  return (
    <div className="space-y-6">
      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Status Management</span>
          </CardTitle>
          <CardDescription>
            Beheer document statussen en prioriteiten individueel of in bulk
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Filter:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  {statusOptions.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedDocuments.length === filteredDocuments.length ? 'Deselecteer Alles' : 'Selecteer Alles'}
            </Button>
            
            {selectedDocuments.length > 0 && (
              <>
                <div className="flex items-center space-x-2">
                  <Select value={bulkStatus} onValueChange={setBulkStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Nieuwe Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={bulkPriority} onValueChange={setBulkPriority}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Nieuwe Prioriteit" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map(priority => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button onClick={handleBulkUpdate}>
                    Update ({selectedDocuments.length})
                  </Button>
                </div>
              </>
            )}
          </div>

          {notes !== '' && (
            <Textarea
              placeholder="Notities voor status update..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="max-w-md"
            />
          )}
        </CardContent>
      </Card>

      {/* Document List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Documenten ({filteredDocuments.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {filteredDocuments.map((doc) => {
                  const statusInfo = getStatusInfo(doc.status);
                  const priorityInfo = getPriorityInfo(doc.priority);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <div key={doc.id} className="p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedDocuments.includes(doc.id)}
                          onChange={(e) => handleDocumentSelect(doc.id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-gray-900">{doc.title}</h3>
                            <div className="flex items-center space-x-2">
                              <Badge className={priorityInfo.color}>
                                {priorityInfo.label}
                              </Badge>
                              <Badge className={statusInfo.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              {doc.created_at.toLocaleDateString('nl-NL')}
                              {doc.deadline && (
                                <span className="ml-4 flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Deadline: {doc.deadline.toLocaleDateString('nl-NL')}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Select
                                value={doc.status}
                                onValueChange={(value) => handleStatusUpdate(doc.id, value)}
                              >
                                <SelectTrigger className="w-32 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map(status => (
                                    <SelectItem key={status.value} value={status.value}>
                                      {status.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Updates */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <span>Recente Updates</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentUpdates.length > 0 ? (
                <div className="space-y-4">
                  {recentUpdates.map((update) => (
                    <div key={update.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {update.old_status}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <Badge variant="outline" className="text-xs">
                          {update.new_status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {documents.find(d => d.id === update.document_id)?.title}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{update.updated_by}</span>
                        <span>{update.updated_at.toLocaleTimeString('nl-NL')}</span>
                      </div>
                      {update.notes && (
                        <p className="text-xs text-gray-600 mt-2 italic">{update.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nog geen status updates</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
