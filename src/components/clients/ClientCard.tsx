import React, { useState } from 'react';
import { Client } from './types';
import { User, Phone, Mail, MapPin, Info, BadgeCheck, Trash2, X, AlertTriangle, Calendar, FileText, Heart, Clock, Shield, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { useClientDocumentCount } from '../../hooks/useClientDocumentCount';

export interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onViewDetails: (clientId: string) => void;
  onQuickAction: (action: string, clientId: string) => void;
  onDelete?: (clientId: string) => void;
  isSelected?: boolean;
  onSelect?: (clientId: string) => void;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  intake_pending: { label: 'Intake Pending', variant: 'outline', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  assessment_phase: { label: 'Assessment', variant: 'secondary', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  care_planning: { label: 'Planning', variant: 'outline', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  active_care: { label: 'Active Care', variant: 'default', color: 'text-green-600 bg-green-50 border-green-200' },
  care_suspended: { label: 'Suspended', variant: 'secondary', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  care_ended: { label: 'Ended', variant: 'outline', color: 'text-gray-600 bg-gray-50 border-gray-200' },
  transferred: { label: 'Transferred', variant: 'outline', color: 'text-gray-600 bg-gray-100 border-gray-300' },
};

const careLevelConfig: Record<string, { label: string; priority: number; color: string }> = {
  wlz_1: { label: 'WLZ-1', priority: 1, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  wlz_2: { label: 'WLZ-2', priority: 2, color: 'text-indigo-700 bg-indigo-100 border-indigo-300' },
  wlz_3: { label: 'WLZ-3', priority: 3, color: 'text-indigo-800 bg-indigo-200 border-indigo-400' },
  wlz_4: { label: 'WLZ-4', priority: 4, color: 'text-indigo-900 bg-indigo-300 border-indigo-500' },
  wlz_5: { label: 'WLZ-5', priority: 5, color: 'text-white bg-indigo-600 border-indigo-600' },
  wmo: { label: 'WMO', priority: 0, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  zvw: { label: 'ZVW', priority: 0, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
};

export const ClientCard: React.FC<ClientCardProps> = ({ client, onEdit, onViewDetails, onQuickAction, onDelete, isSelected, onSelect }) => {
  const [deleteMode, setDeleteMode] = useState<'idle' | 'confirm' | 'deleting'>('idle');
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const initials = `${client.firstName[0] ?? ''}${client.lastName[0] ?? ''}`.toUpperCase();
  const { documentCount, loading: documentCountLoading } = useClientDocumentCount(client.id);
  
  const statusInfo = statusConfig[client.care.status] || statusConfig.intake_pending;
  const careLevelInfo = careLevelConfig[client.care.careLevel] || careLevelConfig.wmo;
  
  const age = new Date().getFullYear() - new Date(client.dateOfBirth).getFullYear();
  const nextAppointment = client.workflow.activeServices[0]?.nextScheduled;

  const handleDelete = async () => {
    if (deleteMode === 'confirm') {
      setDeleteMode('deleting');
      try {
        await onDelete?.(client.id);
        setDeleteMode('idle');
      } catch (error) {
        console.error('Error deleting client:', error);
        setDeleteMode('idle');
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteMode('idle');
  };

  return (
    <Card 
      className={`relative min-h-[320px] flex flex-col transition-all duration-200 cursor-pointer group ${
        isSelected ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-lg'
      } ${
        deleteMode === 'confirm' ? 'ring-2 ring-red-500 bg-red-50' : 'hover:shadow-md'
      } ${
        isHovered ? 'transform scale-[1.01]' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewDetails(client.id)}
    >
      {/* Delete confirmation overlay */}
      {deleteMode === 'confirm' && (
        <div className="absolute inset-0 bg-red-50/95 rounded-lg flex items-center justify-center z-10 backdrop-blur-sm">
          <div className="text-center p-4">
            <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-red-800 mb-1">Cliënt definitief verwijderen?</p>
            <p className="text-xs text-red-600 mb-4">{client.fullName}</p>
            <div className="flex gap-2 justify-center">
              <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); handleDelete(); }}>
                <Trash2 className="w-3 h-3 mr-1" /> Verwijderen
              </Button>
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleCancelDelete(); }}>
                <X className="w-3 h-3 mr-1" /> Annuleren
              </Button>
            </div>
          </div>
        </div>
      )}

      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-100 text-purple-800 border border-purple-500 font-semibold text-sm transition-colors group-hover:bg-purple-200 group-hover:border-purple-600">
                <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-semibold text-xs flex-shrink-0">
                  {initials}
                </div>
                {client.fullName}
              </div>
              <div className="flex items-center space-x-2 mt-1">
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-4 text-xs font-semibold border border-black hover:bg-gray-100 hover:text-black transition"
              onClick={(e) => { e.stopPropagation(); onViewDetails(client.id); }}
            >
              Open
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex-1 flex flex-col justify-between">
        <div className="flex-1 flex flex-col">
          {/* Client details - Fixed height container */}
          <div className="space-y-3 text-sm h-32 flex flex-col justify-start">
            <div className="flex items-center text-gray-600">
              <User className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
              <span>{age} jaar • BSN: {client.bsn.slice(-4).padStart(7, '***-**-')}</span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
              <span className="truncate" title={`${client.address.street} ${client.address.houseNumber}, ${client.address.city}`}>
                {client.address.street} {client.address.houseNumber}, {client.address.city}
              </span>
            </div>
            
            <div className="flex items-center text-gray-600">
              <Phone className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
              <span>{client.contact.phone || 'Geen telefoonnummer'}</span>
              {client.contact.email && (
                <>
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <Mail className="w-4 h-4 mr-1 text-gray-400" />
                  <span className="truncate max-w-[120px]" title={client.contact.email}>{client.contact.email}</span>
                </>
              )}
            </div>

            {/* Insurance information */}
            {(client.care.insuranceCompany !== 'Geen informatie beschikbaar' || client.care.insuranceNumber !== 'Geen informatie beschikbaar') && (
              <div className="flex items-center text-gray-600">
                <Shield className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                <span className="truncate">
                  {client.care.insuranceCompany !== 'Geen informatie beschikbaar' && client.care.insuranceCompany}
                  {client.care.insuranceCompany !== 'Geen informatie beschikbaar' && client.care.insuranceNumber !== 'Geen informatie beschikbaar' && ' • '}
                  {client.care.insuranceNumber !== 'Geen informatie beschikbaar' && `Nr: ${client.care.insuranceNumber}`}
                </span>
              </div>
            )}

            {/* Active services count */}
            {client.workflow.activeServices.length > 0 && (
              <div className="flex items-center text-green-600">
                <Heart className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-xs">{client.workflow.activeServices.length} actieve zorgdienst(en)</span>
              </div>
            )}
          </div>

          {/* Next appointment info - Fixed position */}
          <div className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded mt-2 mb-4">
            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-xs font-medium">
              {nextAppointment
                ? `Volgende afspraak: ${new Date(nextAppointment).toLocaleDateString('nl-NL')}`
                : 'Geen afspraak gepland'}
            </span>
          </div>

          <Separator className="my-4" />

          {/* Action buttons - Fixed at bottom */}
          <div className="flex items-center justify-between gap-2 mt-auto">
            <div className="flex gap-2 flex-nowrap justify-start">
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 px-2 text-xs hover:bg-blue-50 hover:text-blue-600 min-w-0"
                onClick={(e) => { e.stopPropagation(); onQuickAction('call', client.id); }}
                disabled={!client.contact.phone}
                title="Bellen"
              >
                <Phone className="w-3 h-3" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 px-2 text-xs hover:bg-blue-50 hover:text-blue-600 min-w-0"
                onClick={(e) => { e.stopPropagation(); onQuickAction('email', client.id); }}
                disabled={!client.contact.email}
                title="Email"
              >
                <Mail className="w-3 h-3" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 px-2 text-xs hover:bg-green-50 hover:text-green-600 min-w-0"
                onClick={(e) => { e.stopPropagation(); onEdit(client); }}
                title="Bewerken"
              >
                <BadgeCheck className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 px-2 text-xs"
                onClick={(e) => { e.stopPropagation(); onViewDetails(client.id); }}
                title="Details"
              >
                <FileText className="w-3 h-3 mr-1" />
                Details
              </Button>
              
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 px-2 text-xs hover:bg-blue-50 hover:text-blue-600"
                onClick={(e) => { e.stopPropagation(); navigate(`/clienten/${client.id}/documenten`); }}
                title="Documenten"
              >
                <FolderOpen className="w-3 h-3 mr-1" />
                Documenten
                {documentCountLoading ? (
                  <div className="ml-1 w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                ) : (
                  <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold border border-blue-600">
                    {documentCount}
                  </span>
                )}
              </Button>
              
              {onDelete && deleteMode === 'idle' && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 px-2 text-xs hover:bg-red-50 hover:text-red-600 min-w-0"
                  onClick={(e) => { e.stopPropagation(); setDeleteMode('confirm'); }}
                  title="Verwijderen"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Loading state for delete */}
        {deleteMode === 'deleting' && (
          <div className="absolute inset-0 bg-white/90 rounded-lg flex items-center justify-center z-20">
            <div className="flex items-center text-sm text-gray-600">
              <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full mr-2"></div>
              Verwijderen...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientCard;