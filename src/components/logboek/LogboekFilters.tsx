import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar as CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface LogboekFiltersProps {
  filterFrom: string;
  filterType: string;
  filterStatus: string;
  filterDate: Date | undefined;
  filterDescription: string;
  onFilterChange: (key: string, value: any) => void;
  onClearFilters: () => void;
}

// Constants for filter options
const ENTRY_TYPES = [
  'all',
  'Notitie',
  'Vraag Verzekeraar',
  'Vraag Client',
  'Indicatie',
  'Taak',
  'Documenten afronden en opsturen',
  'Reactie client',
  'Reactie verzekeraar',
  'Reactie Opdrachtgever',
  'Mijn reactie',
  'Vervolgreactie client',
  'Vervolgreactie verzekeraar',
  'Vervolgreactie Opdrachtgever',
  'Algemene response',
  'Anders',
] as const;

const STATUS_OPTIONS = [
  'all',
  'Geen urgentie',
  'Licht urgent',
  'Urgent',
  'Reactie nodig',
  'Afgehandeld',
  'In behandeling',
] as const;

export const LogboekFilters: React.FC<LogboekFiltersProps> = ({
  filterFrom,
  filterType,
  filterStatus,
  filterDate,
  filterDescription,
  onFilterChange,
  onClearFilters,
}) => {
  const [debouncedFrom, setDebouncedFrom] = useState(filterFrom);
  const [debouncedDescription, setDebouncedDescription] =
    useState(filterDescription);

  // Debounce search inputs (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFrom(filterFrom);
    }, 300);

    return () => clearTimeout(timer);
  }, [filterFrom]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDescription(filterDescription);
    }, 300);

    return () => clearTimeout(timer);
  }, [filterDescription]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filterFrom ||
      filterType !== 'all' ||
      filterStatus !== 'all' ||
      filterDate ||
      filterDescription
    );
  }, [filterFrom, filterType, filterStatus, filterDate, filterDescription]);

  const handleInputChange = (key: string, value: string) => {
    onFilterChange(key, value);
  };

  const handleDateChange = (date: Date | undefined) => {
    onFilterChange('filterDate', date);
  };

  return (
    <div className='space-y-4 mb-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold flex items-center space-x-2'>
          <Filter className='h-5 w-5' />
          <span>Filters</span>
        </h3>

        {hasActiveFilters && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onClearFilters}
            className='flex items-center space-x-2 text-red-600 hover:text-red-700'
          >
            <X className='h-4 w-4' />
            <span>Filters wissen</span>
          </Button>
        )}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* Modified by filter */}
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Gewijzigd door</label>
          <Input
            placeholder='Zoek op naam...'
            value={filterFrom}
            onChange={e => handleInputChange('filterFrom', e.target.value)}
            className='h-9'
          />
        </div>

        {/* Type filter */}
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Type</label>
          <Select
            value={filterType}
            onValueChange={value => handleInputChange('filterType', value)}
          >
            <SelectTrigger className='h-9'>
              <SelectValue placeholder='Alle types' />
            </SelectTrigger>
            <SelectContent>
              {ENTRY_TYPES.map(type => (
                <SelectItem key={type} value={type}>
                  {type === 'all' ? 'Alle types' : type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status filter */}
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Status</label>
          <Select
            value={filterStatus}
            onValueChange={value => handleInputChange('filterStatus', value)}
          >
            <SelectTrigger className='h-9'>
              <SelectValue placeholder='Alle statussen' />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(status => (
                <SelectItem key={status} value={status}>
                  {status === 'all' ? 'Alle statussen' : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date filter */}
        <div className='space-y-2'>
          <label className='text-sm font-medium'>Datum</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className='h-9 w-full justify-start text-left font-normal'
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                {filterDate
                  ? format(filterDate, 'PPP', { locale: nl })
                  : 'Selecteer datum'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                mode='single'
                selected={filterDate}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Description search */}
      <div className='space-y-2'>
        <label className='text-sm font-medium'>Zoek op naam</label>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
          <Input
            placeholder='Zoek in beschrijvingen...'
            value={filterDescription}
            onChange={e =>
              handleInputChange('filterDescription', e.target.value)
            }
            className='h-9 pl-10'
          />
        </div>
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className='flex flex-wrap gap-2'>
          {filterFrom && (
            <Badge variant='secondary' className='flex items-center space-x-1'>
              <span>Van: {filterFrom}</span>
              <X
                className='h-3 w-3 cursor-pointer'
                onClick={() => handleInputChange('filterFrom', '')}
              />
            </Badge>
          )}
          {filterType !== 'all' && (
            <Badge variant='secondary' className='flex items-center space-x-1'>
              <span>Type: {filterType}</span>
              <X
                className='h-3 w-3 cursor-pointer'
                onClick={() => handleInputChange('filterType', 'all')}
              />
            </Badge>
          )}
          {filterStatus !== 'all' && (
            <Badge variant='secondary' className='flex items-center space-x-1'>
              <span>Status: {filterStatus}</span>
              <X
                className='h-3 w-3 cursor-pointer'
                onClick={() => handleInputChange('filterStatus', 'all')}
              />
            </Badge>
          )}
          {filterDate && (
            <Badge variant='secondary' className='flex items-center space-x-1'>
              <span>
                Datum: {format(filterDate, 'dd/MM/yyyy', { locale: nl })}
              </span>
              <X
                className='h-3 w-3 cursor-pointer'
                onClick={() => handleDateChange(undefined)}
              />
            </Badge>
          )}
          {filterDescription && (
            <Badge variant='secondary' className='flex items-center space-x-1'>
              <span>Zoek: {filterDescription}</span>
              <X
                className='h-3 w-3 cursor-pointer'
                onClick={() => handleInputChange('filterDescription', '')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
