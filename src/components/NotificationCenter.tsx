import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bell,
  Calendar,
  AlertTriangle,
  CheckCircle,
  FileText,
  Clock,
  X,
  Settings,
} from 'lucide-react';

interface Notification {
  id: string;
  type:
    | 'deadline_approaching'
    | 'status_change'
    | 'new_document'
    | 'ai_insight';
  title: string;
  message: string;
  document_id?: string;
  document_title?: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Mock notifications
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'deadline_approaching',
        title: 'Deadline Nadert',
        message: 'Medisch Rapport - Jan de Vries verloopt over 2 dagen',
        document_id: '1',
        document_title: 'Medisch Rapport - Jan de Vries',
        timestamp: new Date(Date.now() - 300000),
        read: false,
        priority: 'high',
      },
      {
        id: '2',
        type: 'ai_insight',
        title: 'AI Inzicht',
        message: 'Nieuwe cross-referentie gevonden tussen 3 documenten',
        timestamp: new Date(Date.now() - 900000),
        read: false,
        priority: 'normal',
      },
      {
        id: '3',
        type: 'status_change',
        title: 'Status Gewijzigd',
        message: 'Verzekeringsbrief - Zilveren Kruis is nu "afgehandeld"',
        document_id: '2',
        document_title: 'Verzekeringsbrief - Zilveren Kruis',
        timestamp: new Date(Date.now() - 1800000),
        read: true,
        priority: 'normal',
      },
      {
        id: '4',
        type: 'new_document',
        title: 'Nieuw Document',
        message: 'Laboratorium Uitslag is geüpload en verwerkt',
        document_id: '3',
        document_title: 'Laboratorium Uitslag',
        timestamp: new Date(Date.now() - 3600000),
        read: true,
        priority: 'low',
      },
    ];

    setNotifications(mockNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayNotifications = showAll
    ? notifications
    : notifications.slice(0, 5);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deadline_approaching':
        return <Calendar className='h-4 w-4 text-orange-500' />;
      case 'status_change':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'new_document':
        return <FileText className='h-4 w-4 text-blue-500' />;
      case 'ai_insight':
        return <AlertTriangle className='h-4 w-4 text-purple-500' />;
      default:
        return <Bell className='h-4 w-4 text-gray-500' />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='ghost' className='relative'>
          <Bell className='h-5 w-5' />
          {unreadCount > 0 && (
            <Badge className='absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs'>
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className='w-96 p-0' align='end'>
        <Card className='border-0 shadow-lg'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-lg flex items-center space-x-2'>
                <Bell className='h-5 w-5 text-blue-600' />
                <span>Notificaties</span>
              </CardTitle>
              <div className='flex items-center space-x-2'>
                {unreadCount > 0 && (
                  <Button variant='ghost' size='sm' onClick={markAllAsRead}>
                    Alle als gelezen
                  </Button>
                )}
                <Button variant='ghost' size='sm'>
                  <Settings className='h-4 w-4' />
                </Button>
              </div>
            </div>
            {unreadCount > 0 && (
              <CardDescription>
                Je hebt {unreadCount} ongelezen notificatie
                {unreadCount !== 1 ? 's' : ''}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className='p-0'>
            <div className='max-h-96 overflow-y-auto'>
              {displayNotifications.length > 0 ? (
                <div className='space-y-0'>
                  {displayNotifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className='flex items-start space-x-3'>
                        <div className='flex-shrink-0 mt-1'>
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center justify-between mb-1'>
                            <h4 className='text-sm font-medium text-gray-900'>
                              {notification.title}
                            </h4>
                            <div className='flex items-center space-x-2'>
                              <Badge
                                variant='outline'
                                className={`text-xs ${getPriorityColor(notification.priority)}`}
                              >
                                {notification.priority}
                              </Badge>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() =>
                                  removeNotification(notification.id)
                                }
                                className='h-6 w-6 p-0'
                              >
                                <X className='h-3 w-3' />
                              </Button>
                            </div>
                          </div>

                          <p className='text-sm text-gray-700 mb-2'>
                            {notification.message}
                          </p>

                          <div className='flex items-center justify-between'>
                            <div className='flex items-center space-x-1 text-xs text-gray-500'>
                              <Clock className='h-3 w-3' />
                              <span>
                                {notification.timestamp.toLocaleString(
                                  'nl-NL',
                                  {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    day: '2-digit',
                                    month: '2-digit',
                                  }
                                )}
                              </span>
                            </div>

                            {!notification.read && (
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => markAsRead(notification.id)}
                                className='text-xs text-blue-600 hover:text-blue-800'
                              >
                                Markeer als gelezen
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='p-8 text-center'>
                  <Bell className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                  <p className='text-gray-500'>Geen notificaties</p>
                </div>
              )}
            </div>

            {notifications.length > 5 && (
              <div className='p-4 border-t'>
                <Button
                  variant='ghost'
                  className='w-full'
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll
                    ? 'Toon minder'
                    : `Toon alle ${notifications.length} notificaties`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};
