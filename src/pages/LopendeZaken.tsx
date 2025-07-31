import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { clientService, Task } from '@/services/clientService';
import {
  BarChart3,
  Kanban,
  List,
  Search,
  ChevronDown,
  AlertTriangle,
  Clock,
  CheckCircle,
  Edit,
  Link,
  Paperclip,
  Trash2,
  Plus,
  Loader2,
} from 'lucide-react';

interface ProcessCard extends Task {
  client: string;
  isExpired: boolean;
}

const statusColumns = [
  {
    key: 'Niet gestart',
    title: 'Niet gestart',
    color: 'border-red-200 bg-red-50',
  },
  {
    key: 'In behandeling',
    title: 'In behandeling',
    color: 'border-blue-200 bg-blue-50',
  },
  {
    key: 'Wachten op info',
    title: 'Wachten op info',
    color: 'border-yellow-200 bg-yellow-50',
  },
  {
    key: 'Opvolging',
    title: 'Opvolging',
    color: 'border-purple-200 bg-purple-50',
  },
  { key: 'Afgerond', title: 'Afgerond', color: 'border-green-200 bg-green-50' },
];

const priorityColors = {
  Urgent: 'text-red-600',
  Hoog: 'text-gray-800',
  Medium: 'text-orange-600',
  Laag: 'text-gray-600',
};

const LopendeZaken: React.FC = () => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('Alles');
  const [tasks, setTasks] = useState<ProcessCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const allTasks = await clientService.getAllTasks();

      // Transform tasks to include client name and check if expired
      const transformedTasks: ProcessCard[] = allTasks.map(task => {
        const taskWithClient = task as Task & { clients?: { name: string } };
        const client = taskWithClient.clients?.name || 'Onbekende cliënt';
        const deadline = task.deadline ? new Date(task.deadline) : null;
        const isExpired = deadline ? deadline < new Date() : false;

        return {
          ...task,
          client,
          isExpired,
        };
      });

      setTasks(transformedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const urgentProcesses = tasks.filter(p => p.is_urgent).length;
  const expiredDeadlines = tasks.filter(p => p.is_expired).length;
  const completedProcesses = tasks.filter(p => p.status === 'Afgerond').length;

  const getProcessesByStatus = (status: string) => {
    return tasks.filter(process => process.status === status);
  };

  const ProcessCard: React.FC<{ process: ProcessCard }> = ({ process }) => {
    const columnColor =
      statusColumns.find(col => col.key === process.status)?.color || '';
    const progressColor =
      process.progress < 30
        ? 'bg-red-500'
        : process.progress < 70
          ? 'bg-yellow-500'
          : 'bg-green-500';

    return (
      <Card
        className={`mb-4 border-l-4 ${columnColor} shadow-sm hover:shadow-md transition-shadow`}
      >
        <CardContent className='p-4'>
          <div className='flex justify-between items-start mb-3'>
            <h4 className='font-medium text-sm text-gray-900 line-clamp-2'>
              {process.title}
            </h4>
            <div className='flex gap-1'>
              <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
                <Edit className='h-3 w-3' />
              </Button>
              <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
                <Link className='h-3 w-3' />
              </Button>
              <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
                <Paperclip className='h-3 w-3' />
              </Button>
              <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
                <Trash2 className='h-3 w-3' />
              </Button>
            </div>
          </div>

          <Badge
            variant='secondary'
            className='mb-3 bg-purple-100 text-purple-800'
          >
            {process.client}
          </Badge>

          <div className='mb-3'>
            <div className='text-xs text-gray-600 mb-1'>Voortgang</div>
            <div className='relative h-2 bg-gray-200 rounded-full overflow-hidden'>
              <div
                className={`h-full transition-all duration-300 ${progressColor}`}
                style={{ width: `${process.progress}%` }}
              />
            </div>
            <div className='text-xs text-gray-500 mt-1'>
              {process.progress}%
            </div>
          </div>

          <div className='space-y-1 text-xs'>
            <div>
              <span className='font-medium'>Type:</span> {process.type}
            </div>
            <div>
              <span className='font-medium'>Deadline:</span> {process.deadline}
            </div>
            <div>
              <span className='font-medium'>Prioriteit:</span>
              <span className={`ml-1 ${priorityColors[process.priority]}`}>
                {process.priority}
              </span>
            </div>
            <div>
              <span className='font-medium'>Verzekeraar:</span>{' '}
              {process.insurer}
            </div>
          </div>

          <div className='flex gap-1 mt-3'>
            {process.isExpired && (
              <Badge
                variant='outline'
                className='text-red-600 border-red-200 bg-white text-xs'
              >
                Verlopen
              </Badge>
            )}
            {process.is_urgent && (
              <Badge
                variant='outline'
                className='text-red-600 border-red-200 bg-white text-xs'
              >
                Urgent
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className='container mx-auto p-6 max-w-7xl'>
      {/* Header */}
      <div className='flex justify-between items-start mb-6'>
        <div>
          <div className='flex items-center gap-2 mb-1'>
            <BarChart3 className='h-5 w-5 text-blue-600' />
            <h1 className='text-2xl font-bold text-gray-900'>
              Lopende Processen
            </h1>
          </div>
          <p className='text-gray-600'>
            Overzicht van alle actieve zorgprocessen
          </p>
        </div>

        <div className='flex gap-2'>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setViewMode('kanban')}
            className='flex items-center gap-2'
          >
            <Kanban className='h-4 w-4' />
            Kanban
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setViewMode('list')}
            className='flex items-center gap-2'
          >
            <List className='h-4 w-4' />
            Lijst
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        <Card className='border-l-4 border-l-red-500'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-red-100 rounded-lg'>
                  <AlertTriangle className='h-5 w-5 text-red-600' />
                </div>
                <span className='text-sm font-medium text-gray-700'>
                  Urgente Processen
                </span>
              </div>
              <span className='text-2xl font-bold text-gray-900'>
                {urgentProcesses}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className='border-l-4 border-l-orange-500'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-orange-100 rounded-lg'>
                  <Clock className='h-5 w-5 text-orange-600' />
                </div>
                <span className='text-sm font-medium text-gray-700'>
                  Verlopen Deadlines
                </span>
              </div>
              <span className='text-2xl font-bold text-gray-900'>
                {expiredDeadlines}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className='border-l-4 border-l-green-500'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-green-100 rounded-lg'>
                  <CheckCircle className='h-5 w-5 text-green-600' />
                </div>
                <span className='text-sm font-medium text-gray-700'>
                  Afgeronde Processen
                </span>
              </div>
              <span className='text-2xl font-bold text-gray-900'>
                {completedProcesses}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className='flex flex-col sm:flex-row gap-4 mb-6'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
          <Input
            placeholder='Filter op cliënt'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='pl-10'
          />
        </div>

        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            className='flex items-center gap-1'
          >
            <ChevronDown className='h-4 w-4' />
          </Button>
          <Button
            variant={activeFilter === 'Urgent' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setActiveFilter('Urgent')}
          >
            Urgent
          </Button>
          <Button
            variant={activeFilter === 'Verlopen' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setActiveFilter('Verlopen')}
          >
            Verlopen
          </Button>
          <Button
            variant={activeFilter === 'Afgerond' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setActiveFilter('Afgerond')}
          >
            Afgerond
          </Button>
          <Button
            variant={activeFilter === 'Alles' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setActiveFilter('Alles')}
          >
            Alles
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      {viewMode === 'kanban' && (
        <div className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
          {statusColumns.map(column => {
            const processes = getProcessesByStatus(column.key);
            const count = processes.length;

            return (
              <div key={column.key} className='min-h-[600px]'>
                <div className='mb-4'>
                  <h3
                    className={`font-semibold text-sm ${
                      column.key === 'Niet gestart'
                        ? 'text-gray-600'
                        : column.key === 'In behandeling'
                          ? 'text-blue-600'
                          : column.key === 'Wachten op info'
                            ? 'text-yellow-600'
                            : column.key === 'Opvolging'
                              ? 'text-purple-600'
                              : 'text-green-600'
                    }`}
                  >
                    {column.title}
                  </h3>
                  <p className='text-xs text-gray-500'>{count} processen</p>
                </div>

                <div className='space-y-4'>
                  {processes.map(process => (
                    <ProcessCard key={process.id} process={process} />
                  ))}

                  <Button
                    variant='outline'
                    className='w-full border-dashed border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400'
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    Nieuw proces toevoegen
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className='space-y-4'>
          {loading ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='h-6 w-6 animate-spin text-blue-600' />
              <span className='ml-2 text-gray-600'>Laden...</span>
            </div>
          ) : (
            tasks.map(process => (
              <ProcessCard key={process.id} process={process} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default LopendeZaken;
