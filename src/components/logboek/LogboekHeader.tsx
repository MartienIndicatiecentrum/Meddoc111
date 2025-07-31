import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Home,
  MessageSquare,
  UserCheck,
  Building2,
  Stethoscope,
  Plus,
} from 'lucide-react';

interface LogboekHeaderProps {
  selectedClient: any;
  onShowAddForm: () => void;
  onDebugLocalStorage: () => void;
  onSelectClient: () => void;
}

export const LogboekHeader: React.FC<LogboekHeaderProps> = ({
  selectedClient,
  onShowAddForm,
  onDebugLocalStorage,
  onSelectClient,
}) => {
  return (
    <div className='flex items-center justify-between mb-6'>
      <div className='flex items-center space-x-4'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => (window.location.href = '/')}
          className='flex items-center space-x-2'
        >
          <Home className='h-4 w-4' />
          <span>Home</span>
        </Button>

        <Button
          variant='default'
          size='sm'
          onClick={onShowAddForm}
          className='flex items-center space-x-2'
        >
          <Plus className='h-4 w-4' />
          <span>Nieuw bericht</span>
        </Button>

        <Button
          variant='ghost'
          size='sm'
          onClick={onDebugLocalStorage}
          className='flex items-center space-x-2'
        >
          <MessageSquare className='h-4 w-4' />
          <span>Debug localStorage</span>
        </Button>

        <Button
          variant='ghost'
          size='sm'
          onClick={onSelectClient}
          className='flex items-center space-x-2'
        >
          <UserCheck className='h-4 w-4' />
          <span>Selecteer cliënt</span>
        </Button>
      </div>

      {selectedClient && (
        <Card className='flex-1 max-w-md ml-4'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center space-x-2'>
              <Building2 className='h-4 w-4' />
              <span>Geselecteerde Cliënt</span>
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-0'>
            <div className='flex items-center space-x-2'>
              <Stethoscope className='h-4 w-4 text-blue-500' />
              <span className='font-medium'>{selectedClient.naam}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
