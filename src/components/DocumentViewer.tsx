import React, { useState, useEffect } from 'react';
import {
  _Card,
  _CardContent,
  _CardDescription,
  _CardHeader,
  _CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  _User,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  MapPin,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  title: string;
  type?: string;
  status:
    | 'nieuw'
    | 'in_behandeling'
    | 'wacht_op_info'
    | 'afgehandeld'
    | 'geannuleerd';
  priority: 'laag' | 'normaal' | 'hoog' | 'urgent';
  deadline?: Date;
  created_at: Date;
  file_size: number;
  mime_type: string;
  file_path: string; // Publieke URL naar het bestand
}

interface DocumentViewerProps {
  document: Document;
  fullscreen?: boolean;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  fullscreen,
}) => {
  const [annotations, setAnnotations] = useState<string>('');
  const [showAnnotations, setShowAnnotations] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'nieuw':
        return 'bg-blue-100 text-blue-800';
      case 'in_behandeling':
        return 'bg-yellow-100 text-yellow-800';
      case 'wacht_op_info':
        return 'bg-orange-100 text-orange-800';
      case 'afgehandeld':
        return 'bg-green-100 text-green-800';
      case 'geannuleerd':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'hoog':
        return 'bg-orange-100 text-orange-800';
      case 'normaal':
        return 'bg-blue-100 text-blue-800';
      case 'laag':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (fullscreen) {
    if (document.mime_type === 'application/pdf') {
      return (
        <iframe
          src={document.file_path}
          title='PDF Preview'
          width='100vw'
          height='100vh'
          style={{
            border: 'none',
            display: 'block',
            width: '100vw',
            height: '100vh',
          }}
        />
      );
    } else if (document.mime_type.startsWith('image/')) {
      return (
        <img
          src={document.file_path}
          alt={document.title}
          style={{
            width: '100vw',
            height: '100vh',
            objectFit: 'contain',
            margin: 0,
            display: 'block',
          }}
        />
      );
    } else {
      return (
        <a
          href={document.file_path}
          target='_blank'
          rel='noopener noreferrer'
          style={{
            display: 'block',
            width: '100vw',
            height: '100vh',
            textAlign: 'center',
            lineHeight: '100vh',
          }}
        >
          Download bestand
        </a>
      );
    }
  }
  // Standaard (niet-fullscreen) weergave:
  return (
    <div className='w-full px-8 md:px-16 py-8'>
      <div className='space-y-6'>
        {/* Document Info */}
        <div className='space-y-4'>
          <div>
            <h3 className='font-semibold text-gray-900 mb-2'>
              {document.title}
            </h3>
            <div className='grid grid-cols-1 gap-2 text-sm text-gray-600'>
              <div className='flex items-center space-x-2'>
                <Calendar className='h-4 w-4' />
                <span>
                  Toegevoegd: {document.created_at.toLocaleDateString('nl-NL')}
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <FileText className='h-4 w-4' />
                <span>Grootte: {formatFileSize(document.file_size)}</span>
              </div>
              {document.deadline && (
                <div className='flex items-center space-x-2'>
                  <Clock className='h-4 w-4' />
                  <span>
                    Deadline: {document.deadline.toLocaleDateString('nl-NL')}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Badge className={getStatusColor(document.status)}>
              {document.status.replace('_', ' ')}
            </Badge>
            <Badge className={getPriorityColor(document.priority)}>
              {document.priority}
            </Badge>
            <Badge variant='outline'>{document.type}</Badge>
          </div>
        </div>
        {/* Document Preview */}
        <div className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50'>
          <p className='text-gray-600 font-medium mb-2'>Document Preview</p>
          {document.mime_type === 'application/pdf' ? (
            <iframe
              src={document.file_path}
              title='PDF Preview'
              width='100%'
              height='500px'
              style={{ border: 'none' }}
            />
          ) : document.mime_type.startsWith('image/') ? (
            <img
              src={document.file_path}
              alt={document.title}
              style={{ maxWidth: '100%', maxHeight: '400px', margin: '0 auto' }}
            />
          ) : (
            <a
              href={document.file_path}
              target='_blank'
              rel='noopener noreferrer'
              className='text-blue-600 underline'
            >
              Download bestand
            </a>
          )}
        </div>
        {/* Action Buttons */}
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' size='sm'>
            <Eye className='h-4 w-4 mr-2' />
            Volledig Scherm
          </Button>
          <Button variant='outline' size='sm'>
            <Download className='h-4 w-4 mr-2' />
            Download
          </Button>
          <Button variant='outline' size='sm'>
            <Printer className='h-4 w-4 mr-2' />
            Print
          </Button>
          <Button variant='outline' size='sm'>
            <Share2 className='h-4 w-4 mr-2' />
            Delen
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowAnnotations(!showAnnotations)}
          >
            <MessageSquare className='h-4 w-4 mr-2' />
            Annotaties
          </Button>
        </div>
        {/* Annotations */}
        {showAnnotations && (
          <div className='space-y-4'>
            <div>
              <label className='text-sm font-medium text-gray-700 mb-2 block'>
                Notities en Annotaties
              </label>
              <Textarea
                placeholder='Voeg uw notities toe...'
                value={annotations}
                onChange={e => setAnnotations(e.target.value)}
                className='min-h-[100px]'
              />
            </div>
            <Button size='sm' className='w-full'>
              <Bookmark className='h-4 w-4 mr-2' />
              Notities Opslaan
            </Button>
          </div>
        )}
        {/* AI Insights */}
        <div className='bg-blue-50 p-4 rounded-lg'>
          <h4 className='font-semibold text-blue-900 mb-2 flex items-center'>
            <Edit3 className='h-4 w-4 mr-2' />
            AI Inzichten
          </h4>
          <div className='text-sm text-blue-800 space-y-2'>
            <p>• Document type: Medisch rapport</p>
            <p>
              • Belangrijke datums gedetecteerd:{' '}
              {document.deadline?.toLocaleDateString('nl-NL')}
            </p>
            <p>• Urgentie niveau: {document.priority}</p>
            <p>• Vervolgacties: Status update vereist</p>
          </div>
        </div>
      </div>
    </div>
  );
};
