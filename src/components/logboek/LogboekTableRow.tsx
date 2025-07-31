import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  User,
  Building2,
  UserCheck,
  CheckSquare,
  ListTodo,
  Send,
  MessageCircle,
  Reply,
  MoreHorizontal,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { STATUS_COLORS, TYPE_ICONS } from '@/constants/logboek';
import type { LogboekEntry as LogboekEntryType } from '@/types/database';

interface LogboekTableRowProps {
  entry: LogboekEntryType;
  onView: (entry: LogboekEntryType) => void;
  onEdit: (entry: LogboekEntryType) => void;
  onDelete: (entry: LogboekEntryType) => void;
  isSelected?: boolean;
}

// Icon mapping component
const getTypeIcon = (type: string) => {
  const iconName = TYPE_ICONS[type as keyof typeof TYPE_ICONS] || 'FileText';

  const iconMap = {
    FileText,
    MessageSquare,
    User,
    CheckSquare,
    ListTodo,
    Send,
    MessageCircle,
    Building2,
    UserCheck,
    Reply,
    MoreHorizontal,
  };

  const IconComponent = iconMap[iconName as keyof typeof iconMap] || FileText;
  return <IconComponent className='h-4 w-4' />;
};

// Truncate text utility
const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
};

// Sanitize text for XSS prevention
const sanitizeText = (text: string): string => {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

export const LogboekTableRow = memo<LogboekTableRowProps>(
  ({ entry, onView, onEdit, onDelete, isSelected = false }) => {
    const handleView = () => onView(entry);
    const handleEdit = () => onEdit(entry);
    const handleDelete = () => onDelete(entry);

    const statusColor =
      STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] ||
      'bg-gray-100 text-gray-800';
    const sanitizedDescription = sanitizeText(entry.description || '');
    const sanitizedAction = sanitizeText(entry.action || '');

    return (
      <div
        className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
          isSelected ? 'bg-blue-50 border-blue-200' : ''
        }`}
      >
        <div className='grid grid-cols-12 gap-4 p-4 items-center'>
          {/* Type */}
          <div className='col-span-2'>
            <div className='flex items-center space-x-2'>
              {getTypeIcon(entry.type)}
              <span className='text-sm font-medium truncate'>{entry.type}</span>
            </div>
          </div>

          {/* Action */}
          <div className='col-span-3'>
            <p
              className='text-sm text-gray-900 truncate'
              title={sanitizedAction}
            >
              {truncateText(sanitizedAction, 80)}
            </p>
          </div>

          {/* Description */}
          <div className='col-span-3'>
            <p
              className='text-sm text-gray-600 truncate'
              title={sanitizedDescription}
            >
              {truncateText(sanitizedDescription, 100)}
            </p>
          </div>

          {/* Status */}
          <div className='col-span-1'>
            <Badge className={`text-xs ${statusColor}`}>{entry.status}</Badge>
          </div>

          {/* From */}
          <div className='col-span-1'>
            <p className='text-sm text-gray-600 truncate'>{entry.from_name}</p>
          </div>

          {/* Date */}
          <div className='col-span-1'>
            <p className='text-sm text-gray-500'>
              {entry.created_at
                ? format(new Date(entry.created_at), 'dd/MM', { locale: nl })
                : '-'}
            </p>
          </div>

          {/* Actions */}
          <div className='col-span-1'>
            <div className='flex items-center space-x-1'>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleView}
                className='h-8 w-8 p-0'
                title='Bekijken'
              >
                <Eye className='h-4 w-4' />
              </Button>

              <Button
                variant='ghost'
                size='sm'
                onClick={handleEdit}
                className='h-8 w-8 p-0'
                title='Bewerken'
              >
                <Edit className='h-4 w-4' />
              </Button>

              <Button
                variant='ghost'
                size='sm'
                onClick={handleDelete}
                className='h-8 w-8 p-0 text-red-600 hover:text-red-700'
                title='Verwijderen'
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

LogboekTableRow.displayName = 'LogboekTableRow';
