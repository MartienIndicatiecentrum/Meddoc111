import React from 'react';
import { ClientStatus, CareLevel } from './types';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { X, Check, Users, Heart, ClipboardList } from 'lucide-react';

interface ClientFilters {
  status: ClientStatus[];
  careLevel: CareLevel[];
  assignedTo: string[];
  client: string[];
  hasActiveTasks: string[]; // now an array of selected statuses
}

interface ClientFiltersProps {
  filters: ClientFilters;
  onFiltersChange: (filters: ClientFilters) => void;
  onClose: () => void;
  coordinators: string[];
  clients: string[];
  activeFiltersCount: number;
  onClearAll: () => void;
}

const statusLabels: Record<ClientStatus, string> = {
  intake_pending: 'Intake Wachtend',
  assessment_phase: 'Assessment Fase',
  care_planning: 'Zorgplanning',
  active_care: 'Actieve Zorg',
  care_suspended: 'Zorg Onderbroken',
  care_ended: 'Zorg Beëindigd',
  transferred: 'Overgedragen'
};

const careLevelLabels: Record<CareLevel, string> = {
  wlz_1: 'WLZ-1',
  wlz_2: 'WLZ-2',
  wlz_3: 'WLZ-3',
  wlz_4: 'WLZ-4',
  wlz_5: 'WLZ-5',
  wmo: 'WMO',
  zvw: 'ZVW'
};

const ClientFilters: React.FC<ClientFiltersProps> = ({
  filters,
  onFiltersChange,
  onClose,
  coordinators,
  clients,
  activeFiltersCount,
  onClearAll
}) => {
  const updateFilter = <T extends keyof ClientFilters>(
    filterKey: T,
    value: ClientFilters[T]
  ) => {
    onFiltersChange({
      ...filters,
      [filterKey]: value
    });
  };

  const toggleArrayFilter = <T extends string>(
    filterKey: 'status' | 'careLevel' | 'assignedTo' | 'client',
    value: T
  ) => {
    const currentArray = filters[filterKey] as T[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilter(filterKey, newArray);
  };

  const toggleTasksStatus = (status: string) => {
    const current = filters.hasActiveTasks || [];
    const newArray = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    updateFilter('hasActiveTasks', newArray);
  };

  return (
    <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-xs text-gray-600 hover:text-gray-900"
              >
                Wis alles
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="w-4 h-4 text-gray-600" />
            <h4 className="font-medium text-sm text-gray-900">Status</h4>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {Object.entries(statusLabels).map(([status, label]) => (
              <label key={status} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={filters.status.includes(status as ClientStatus)}
                  onChange={() => toggleArrayFilter('status', status as ClientStatus)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Care Level Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-gray-600" />
            <h4 className="font-medium text-sm text-gray-900">Zorgniveau</h4>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {Object.entries(careLevelLabels).map(([careLevel, label]) => (
              <label key={careLevel} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={filters.careLevel.includes(careLevel as CareLevel)}
                  onChange={() => toggleArrayFilter('careLevel', careLevel as CareLevel)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Coordinator Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-gray-600" />
            <h4 className="font-medium text-sm text-gray-900">Zorgcoördinator</h4>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {coordinators.map((coordinator) => (
              <label key={coordinator} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={filters.assignedTo.includes(coordinator)}
                  onChange={() => toggleArrayFilter('assignedTo', coordinator)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{coordinator}</span>
              </label>
            ))}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Client Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-gray-600" />
            <h4 className="font-medium text-sm text-gray-900">Opdrachtgever</h4>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {clients.map((client) => (
              <label key={client} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={filters.client.includes(client)}
                  onChange={() => toggleArrayFilter('client', client)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{client}</span>
              </label>
            ))}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Active Tasks Filter */}
        <div className="mb-4">
          <h4 className="font-medium text-sm text-gray-900 mb-3">Actieve Taken</h4>
          <div className="space-y-2">
            {[
              { value: 'niet_gestart', label: 'Niet gestart' },
              { value: 'in_behandeling', label: 'In behandeling' },
              { value: 'wachten_op_info', label: 'Wachten op info' },
              { value: 'opvolging', label: 'Opvolging' },
              { value: 'afgerond', label: 'Afgerond' },
              { value: 'urgent', label: 'Urgent' },
            ].map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={filters.hasActiveTasks?.includes(opt.value)}
                  onChange={() => toggleTasksStatus(opt.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientFilters;