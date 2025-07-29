import React, { useState, useMemo } from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle, Circle, ArrowRight, Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Task {
  id: string;
  client_id: string;
  taakbeschrijving: string;
  taaktype?: string;
  status: string;
  urgentie_status: string;
  deadline?: string;
  taak_datum?: string;
  taak_tijd?: string;
  opdrachtgever?: string;
  updated_at?: string;
  notities?: string;
  extra_notitie?: string;
  verzekeraar?: string;
  indicatie_type?: string;
  upload_documenten?: string[] | null;
}

interface TodoListProps {
  tasks: Task[];
  clientMap: Record<string, string>;
  onEditTask?: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: string) => void;
  onUrgencyChange?: (taskId: string, newUrgency: string) => void;
  onTaskTypeChange?: (taskId: string, newTaskType: string) => void;
}

const TodoList: React.FC<TodoListProps> = ({
  tasks,
  clientMap,
  onEditTask,
  onStatusChange,
  onUrgencyChange,
  onTaskTypeChange
}) => {
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deadlineFilter, setDeadlineFilter] = useState<string>('all');
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'afgehandeld':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_behandeling':
        return <ArrowRight className="w-4 h-4 text-blue-600" />;
      case 'wachten_op_info':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'opvolging':
        return <ArrowRight className="w-4 h-4 text-purple-600" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'afgehandeld':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_behandeling':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'wachten_op_info':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'opvolging':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyColor = (urgentie: string) => {
    switch (urgentie) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'hoog':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normaal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'laag':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDeadlineStatus = (deadline?: string) => {
    if (!deadline) return { status: 'no-deadline', color: 'text-gray-500', icon: null };

    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'overdue', color: 'text-red-600', icon: <AlertTriangle className="w-4 h-4 text-red-600" /> };
    } else if (diffDays === 0) {
      return { status: 'today', color: 'text-orange-600', icon: <AlertTriangle className="w-4 h-4 text-orange-600" /> };
    } else if (diffDays <= 3) {
      return { status: 'soon', color: 'text-yellow-600', icon: <Clock className="w-4 h-4 text-yellow-600" /> };
    } else {
      return { status: 'normal', color: 'text-gray-600', icon: <Calendar className="w-4 h-4 text-gray-600" /> };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Filter tasks based on selected filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const clientName = clientMap[task.client_id] || 'Onbekende cliënt';
      const deadlineStatus = getDeadlineStatus(task.deadline);

      // Client filter
      if (clientFilter && clientFilter !== 'all' && clientName !== clientFilter) {
        return false;
      }

      // Status filter
      if (statusFilter && statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }

      // Deadline filter
      if (deadlineFilter && deadlineFilter !== 'all') {
        switch (deadlineFilter) {
          case 'overdue':
            if (deadlineStatus.status !== 'overdue') return false;
            break;
          case 'today':
            if (deadlineStatus.status !== 'today') return false;
            break;
          case 'soon':
            if (deadlineStatus.status !== 'soon') return false;
            break;
          case 'no-deadline':
            if (task.deadline) return false;
            break;
        }
      }

      return true;
    });
  }, [tasks, clientFilter, statusFilter, deadlineFilter, clientMap]);

  const [sortBy, setSortBy] = useState<'alphabetical' | 'urgency' | 'deadline'>('alphabetical');

  // Vervang de sortedTasks definitie door een useMemo die altijd sorteert op basis van sortBy en filteredTasks:
  const sortedTasks = useMemo(() => {
    const urgencyOrder = { urgent: 4, hoog: 3, normaal: 2, laag: 1 };
    const tasksToSort = [...filteredTasks];
    switch (sortBy) {
      case 'urgency': {
        return tasksToSort.sort((a, b) => {
          const aUrgency = urgencyOrder[a.urgentie_status as keyof typeof urgencyOrder] || 0;
          const bUrgency = urgencyOrder[b.urgentie_status as keyof typeof urgencyOrder] || 0;
          if (aUrgency !== bUrgency) {
            return bUrgency - aUrgency;
          }
          if (a.deadline && b.deadline) {
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          }
          if (!a.deadline && b.deadline) return 1;
          if (a.deadline && !b.deadline) return -1;
          return 0;
        });
      }
      case 'deadline': {
        return tasksToSort.sort((a, b) => {
          if (a.deadline && b.deadline) {
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          }
          if (!a.deadline && b.deadline) return 1;
          if (a.deadline && !b.deadline) return -1;
          const aUrgency2 = urgencyOrder[a.urgentie_status as keyof typeof urgencyOrder] || 0;
          const bUrgency2 = urgencyOrder[b.urgentie_status as keyof typeof urgencyOrder] || 0;
          if (aUrgency2 !== bUrgency2) {
            return bUrgency2 - aUrgency2;
          }
          return 0;
        });
      }
      case 'alphabetical':
      default: {
        return tasksToSort.sort((a, b) => {
          const aDesc = a.taakbeschrijving?.toLowerCase() || '';
          const bDesc = b.taakbeschrijving?.toLowerCase() || '';
          if (aDesc !== bDesc) {
            return aDesc.localeCompare(bDesc);
          }
          // Tweede criterium: clientnaam
          const aClient = (clientMap[a.client_id] || '').toLowerCase();
          const bClient = (clientMap[b.client_id] || '').toLowerCase();
          if (aClient !== bClient) {
            return aClient.localeCompare(bClient);
          }
          // Derde criterium: id
          return a.id.localeCompare(b.id);
        });
      }
    }
  }, [filteredTasks, sortBy, clientMap]);

  // Nieuwe mapping voor status achtergrondkleur
  const statusBgColor: Record<string, string> = {
    nieuw: 'bg-[#e3fcec]', // lichtgroen
    in_behandeling: 'bg-[#e3f0fc]', // lichtblauw
    wachten_op_info: 'bg-[#fff6e3]', // lichtgeel
    opvolging: 'bg-[#f3e3fc]', // lichtpaars
    afgehandeld: 'bg-[#f0f0f0]', // lichtgrijs
  };

  // Nieuwe mapping voor urgentie achtergrondkleur
  const urgencyBgColor: Record<string, string> = {
    laag: 'bg-[#e3fcec]', // lichtgroen
    normaal: 'bg-[#e3f0fc]', // lichtblauw
    hoog: 'bg-[#ffd7b3]', // donkerder oranje
    urgent: 'bg-[#fde3e3]', // lichtrood
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Todo List
            <Badge variant="secondary" className="ml-2 text-xs">
              {sortedTasks.length} van {tasks.length} taken
            </Badge>
          </CardTitle>
        </div>

        {/* Simplified Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Filter className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-600">Filters:</span>
          </div>

          {/* Client Filter */}
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-32 h-7 text-xs">
              <SelectValue placeholder="Cliënt" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle cliënten</SelectItem>
              {Object.values(clientMap)
                .filter(clientName => clientName && clientName !== 'Onbekende cliënt')
                .sort()
                .slice(0, 10) // Limit to first 10 clients
                .map((clientName) => (
                  <SelectItem key={clientName} value={clientName}>
                    {clientName}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-28 h-7 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statussen</SelectItem>
              <SelectItem value="nieuw">Nieuw</SelectItem>
              <SelectItem value="in_behandeling">In behandeling</SelectItem>
              <SelectItem value="wachten_op_info">Wachten op info</SelectItem>
              <SelectItem value="opvolging">Opvolging</SelectItem>
              <SelectItem value="afgehandeld">Afgerond</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {(clientFilter !== 'all' || statusFilter !== 'all') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setClientFilter('all');
                setStatusFilter('all');
                setDeadlineFilter('all');
              }}
              className="h-7 w-7 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Geen taken gevonden</p>
            </div>
          ) : (
            sortedTasks.map((task) => {
              const deadlineStatus = getDeadlineStatus(task.deadline);
              const clientName = clientMap[task.client_id] || 'Onbekende cliënt';

              return (
                <div
                  key={task.id}
                  className="border rounded-lg p-3 hover:shadow-md transition-all duration-200 bg-white cursor-pointer hover:border-blue-300 hover:bg-blue-50"
                  onClick={() => {
                    if (onEditTask) {
                      onEditTask(task);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (onEditTask) {
                        onEditTask(task);
                      }
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {/* Status Icon */}
                      <div className="mt-0.5 flex-shrink-0">
                        {getStatusIcon(task.status)}
                      </div>

                      {/* Task Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 text-xs leading-tight line-clamp-2">
                            {task.taakbeschrijving}
                          </h4>
                          {onEditTask && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 px-1 text-xs hover:bg-blue-100 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTask(task);
                              }}
                            >
                              Bewerk
                            </Button>
                          )}
                        </div>

                        <p className="text-xs mb-1">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 border border-purple-500 font-medium text-xs">
                            Cliënt: {clientName}
                          </span>
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-1">
                          {/* Status Dropdown */}
                          <Select
                            value={task.status}
                            onValueChange={(newStatus) => {
                              if (onStatusChange) {
                                onStatusChange(task.id, newStatus);
                              }
                            }}
                          >
                            <SelectTrigger
                              className={`h-5 px-1 text-xs border-0 w-24 ${statusBgColor[task.status] || 'bg-white'}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectValue>
                                {task.status === 'afgehandeld' ? 'Afgerond' :
                                 task.status === 'in_behandeling' ? 'In behandeling' :
                                 task.status === 'wachten_op_info' ? 'Wachten op info' :
                                 task.status === 'opvolging' ? 'Opvolging' :
                                 'Nieuw'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="nieuw">Nieuw</SelectItem>
                              <SelectItem value="in_behandeling">In behandeling</SelectItem>
                              <SelectItem value="wachten_op_info">Wachten op info</SelectItem>
                              <SelectItem value="opvolging">Opvolging</SelectItem>
                              <SelectItem value="afgehandeld">Afgerond</SelectItem>
                            </SelectContent>
                          </Select>

                          {/* Urgency Dropdown */}
                          <Select
                            value={task.urgentie_status}
                            onValueChange={(newUrgency) => {
                              if (onUrgencyChange) {
                                onUrgencyChange(task.id, newUrgency);
                              }
                            }}
                          >
                            <SelectTrigger
                              className={`h-5 px-1 text-xs border-0 w-20 ${urgencyBgColor[task.urgentie_status] || 'bg-white'}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectValue>
                                {task.urgentie_status === 'urgent' ? 'Urgent' :
                                 task.urgentie_status === 'hoog' ? 'Hoog' :
                                 task.urgentie_status === 'normaal' ? 'Normaal' :
                                 'Laag'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="laag">Laag</SelectItem>
                              <SelectItem value="normaal">Normaal</SelectItem>
                              <SelectItem value="hoog">Hoog</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>

                          {/* Task Type Dropdown */}
                          <Select
                            value={task.taaktype || 'no-type'}
                            onValueChange={(newTaskType) => {
                              if (onTaskTypeChange) {
                                onTaskTypeChange(task.id, newTaskType === 'no-type' ? '' : newTaskType);
                              }
                            }}
                          >
                            <SelectTrigger
                              className="h-5 px-1 text-xs border-0 w-20 bg-purple-100 text-purple-800 border-purple-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectValue placeholder="Type">
                                {task.taaktype || 'Type'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="no-type">Geen type</SelectItem>
                              <SelectItem value="indicatie">Indicatie</SelectItem>
                              <SelectItem value="behandeling">Behandeling</SelectItem>
                              <SelectItem value="controle">Controle</SelectItem>
                              <SelectItem value="administratie">Administratie</SelectItem>
                              <SelectItem value="overleg">Overleg</SelectItem>
                              <SelectItem value="documentatie">Documentatie</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Deadline */}
                        {task.deadline && (
                          <div className={`flex items-center gap-1 text-xs ${deadlineStatus.color}`}>
                            {deadlineStatus.icon}
                            <span>
                              Deadline: {formatDate(task.deadline)}
                              {deadlineStatus.status === 'overdue' && ' (Verlopen)'}
                              {deadlineStatus.status === 'today' && ' (Vandaag)'}
                              {deadlineStatus.status === 'soon' && ' (Binnenkort)'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodoList;