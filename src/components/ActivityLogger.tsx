
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, User, MapPin, _Filter, _Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ActivityLog {
  id: string;
  document_id: string;
  document_title: string;
  user_id: string;
  user_name: string;
  action: 'upload' | 'view' | 'edit' | 'delete' | 'restore' | 'status_change' | 'ai_query';
  details: {
    description: string;
    old_value?: string;
    new_value?: string;
    ip_address: string;
    user_agent: string;
  };
  timestamp: Date;
}

interface ActivityLoggerProps {
  cardWidth?: number;
}

export const ActivityLogger: React.FC<ActivityLoggerProps> = ({ cardWidth }) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showRecent, setShowRecent] = useState(false);

  // Mock data voor demonstratie
  useEffect(() => {
    const mockActivities: ActivityLog[] = [
      {
        id: '1',
        document_id: '1',
        document_title: 'Medisch Rapport - Jan de Vries',
        user_id: 'user1',
        user_name: 'Dr. Sarah van der Berg',
        action: 'upload',
        details: {
          description: 'Document geüpload en AI-analyse gestart',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timestamp: new Date(Date.now() - 3600000)
      },
      {
        id: '2',
        document_id: '2',
        document_title: 'Verzekeringsbrief - Zilveren Kruis',
        user_id: 'user1',
        user_name: 'Dr. Sarah van der Berg',
        action: 'status_change',
        details: {
          description: 'Status gewijzigd van "nieuw" naar "in behandeling"',
          old_value: 'nieuw',
          new_value: 'in_behandeling',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timestamp: new Date(Date.now() - 1800000)
      },
      {
        id: '3',
        document_id: '1',
        document_title: 'Medisch Rapport - Jan de Vries',
        user_id: 'user2',
        user_name: 'Nurse Emma Janssen',
        action: 'view',
        details: {
          description: 'Document bekeken in volledig scherm modus',
          ip_address: '192.168.1.101',
          user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        timestamp: new Date(Date.now() - 900000)
      },
      {
        id: '4',
        document_id: '3',
        document_title: 'Laboratorium Uitslag',
        user_id: 'user1',
        user_name: 'Dr. Sarah van der Berg',
        action: 'ai_query',
        details: {
          description: 'AI zoekopdracht: "Zoek alle laboratorium uitslagen van deze maand"',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timestamp: new Date(Date.now() - 300000)
      },
      {
        id: '5',
        document_id: '2',
        document_title: 'Verzekeringsbrief - Zilveren Kruis',
        user_id: 'user3',
        user_name: 'Admin Peter de Wit',
        action: 'edit',
        details: {
          description: 'Document annotaties toegevoegd',
          ip_address: '192.168.1.102',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timestamp: new Date(Date.now() - 150000)
      }
    ];

    setActivities(mockActivities);
    setFilteredActivities(mockActivities);
  }, []);

  // Filter activities
  useEffect(() => {
    let filtered = activities;

    if (searchQuery) {
      filtered = filtered.filter(activity =>
        activity.document_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.details.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter(activity => activity.action === actionFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(activity => activity.timestamp >= filterDate);
    }

    setFilteredActivities(filtered);
  }, [activities, searchQuery, actionFilter, dateFilter]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'upload': return <Upload className="h-4 w-4" />;
      case 'view': return <Eye className="h-4 w-4" />;
      case 'edit': return <Edit className="h-4 w-4" />;
      case 'delete': return <Trash2 className="h-4 w-4" />;
      case 'restore': return <RotateCcw className="h-4 w-4" />;
      case 'status_change': return <Activity className="h-4 w-4" />;
      case 'ai_query': return <Search className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'upload': return 'bg-green-100 text-green-800';
      case 'view': return 'bg-blue-100 text-blue-800';
      case 'edit': return 'bg-yellow-100 text-yellow-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'restore': return 'bg-purple-100 text-purple-800';
      case 'status_change': return 'bg-orange-100 text-orange-800';
      case 'ai_query': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'upload': return 'Upload';
      case 'view': return 'Bekeken';
      case 'edit': return 'Bewerkt';
      case 'delete': return 'Verwijderd';
      case 'restore': return 'Hersteld';
      case 'status_change': return 'Status Gewijzigd';
      case 'ai_query': return 'AI Zoekopdracht';
      default: return 'Activiteit';
    }
  };

  const exportActivities = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Timestamp,Document,Gebruiker,Actie,Beschrijving,IP Adres\n"
      + filteredActivities.map(activity =>
          `${activity.timestamp.toLocaleString('nl-NL')},${activity.document_title},${activity.user_name},${getActionLabel(activity.action)},${activity.details.description},${activity.details.ip_address}`
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `activiteiten_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Card style={cardWidth ? { width: cardWidth, boxSizing: 'border-box' } : {}}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>Activiteiten Logboek</span>
          </CardTitle>
          <CardDescription>
            Volledige audit trail van alle acties in het documentmanagement systeem
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Zoek in activiteiten..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Acties</SelectItem>
                <SelectItem value="upload">Upload</SelectItem>
                <SelectItem value="view">Bekeken</SelectItem>
                <SelectItem value="edit">Bewerkt</SelectItem>
                <SelectItem value="status_change">Status Wijziging</SelectItem>
                <SelectItem value="ai_query">AI Zoekopdrachten</SelectItem>
                <SelectItem value="delete">Verwijderd</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Tijd</SelectItem>
                <SelectItem value="today">Vandaag</SelectItem>
                <SelectItem value="week">Deze Week</SelectItem>
                <SelectItem value="month">Deze Maand</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={exportActivities}>
              <Download className="h-4 w-4 mr-2" />
              Exporteren
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Upload className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Uploads</p>
                  <p className="text-xl font-bold">
                    {activities.filter(a => a.action === 'upload').length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Views</p>
                  <p className="text-xl font-bold">
                    {activities.filter(a => a.action === 'view').length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Status Wijzigingen</p>
                  <p className="text-xl font-bold">
                    {activities.filter(a => a.action === 'status_change').length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-600">AI Zoekopdrachten</p>
                  <p className="text-xl font-bold">
                    {activities.filter(a => a.action === 'ai_query').length}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Activity Feed */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Recente Activiteiten ({filteredActivities.length})
              </h3>
              <button
                onClick={() => setShowRecent(v => !v)}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 16px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: 15,
                }}
                aria-expanded={showRecent}
                aria-controls="recent-activities-dropdown"
              >
                {showRecent ? 'Verberg' : 'Toon'} recente activiteiten ({filteredActivities.length})
              </button>
            </div>
            {showRecent && (
              <div id="recent-activities-dropdown" className="space-y-3">
                {filteredActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-full ${getActionColor(activity.action)}`}>
                      {getActionIcon(activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <Badge className={getActionColor(activity.action)}>
                            {getActionLabel(activity.action)}
                          </Badge>
                          <span className="text-sm font-medium text-gray-900">
                            {activity.document_title}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{activity.timestamp.toLocaleString('nl-NL')}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {activity.details.description}
                      </p>
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{activity.user_name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Globe className="h-3 w-3" />
                        <span>{activity.details.ip_address}</span>
                      </div>
                      {activity.details.old_value && activity.details.new_value && (
                        <span>
                          {activity.details.old_value} → {activity.details.new_value}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {filteredActivities.length === 0 && showRecent && (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Geen activiteiten gevonden voor de huidige filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
