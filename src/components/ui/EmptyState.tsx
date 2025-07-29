import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  FileText,
  Inbox
} from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  variant?: 'default' | 'search' | 'filter' | 'upload';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  secondaryAction,
  variant = 'default'
}) => {
  const getDefaultIcon = () => {
    switch (variant) {
      case 'search':
        return <Search className="h-12 w-12 text-gray-400" />;
      case 'filter':
        return <Filter className="h-12 w-12 text-gray-400" />;
      case 'upload':
        return <FileText className="h-12 w-12 text-gray-400" />;
      default:
        return <MessageSquare className="h-12 w-12 text-gray-400" />;
    }
  };

  const getDefaultAction = () => {
    switch (variant) {
      case 'search':
        return {
          label: 'Zoeken',
          icon: <Search className="h-4 w-4" />
        };
      case 'filter':
        return {
          label: 'Filters wissen',
          icon: <Filter className="h-4 w-4" />
        };
      case 'upload':
        return {
          label: 'Document uploaden',
          icon: <Plus className="h-4 w-4" />
        };
      default:
        return {
          label: 'Nieuw bericht',
          icon: <Plus className="h-4 w-4" />
        };
    }
  };

  const defaultIcon = icon || getDefaultIcon();
  const defaultAction = action || getDefaultAction();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          {defaultIcon}
        </div>
        <CardTitle className="text-lg font-medium text-gray-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-sm text-gray-600">
          {description}
        </p>

        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {action && (
              <Button
                onClick={action.onClick}
                className="flex items-center space-x-2"
              >
                {action.icon || defaultAction.icon}
                <span>{action.label}</span>
              </Button>
            )}

            {secondaryAction && (
              <Button
                variant="outline"
                onClick={secondaryAction.onClick}
                className="flex items-center space-x-2"
              >
                {secondaryAction.icon}
                <span>{secondaryAction.label}</span>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Specific empty state components for common scenarios
export const LogboekEmptyState: React.FC<{
  onAddNew?: () => void;
  onClearFilters?: () => void;
  hasFilters?: boolean;
}> = ({ onAddNew, onClearFilters, hasFilters = false }) => {
  if (hasFilters) {
    return (
      <EmptyState
        title="Geen resultaten gevonden"
        description="Er zijn geen logboek berichten die voldoen aan de huidige filters. Probeer andere zoekcriteria of wis de filters."
        variant="filter"
        action={onClearFilters ? {
          label: 'Filters wissen',
          onClick: onClearFilters,
          icon: <Filter className="h-4 w-4" />
        } : undefined}
        secondaryAction={onAddNew ? {
          label: 'Nieuw bericht',
          onClick: onAddNew,
          icon: <Plus className="h-4 w-4" />
        } : undefined}
      />
    );
  }

  return (
    <EmptyState
      title="Nog geen logboek berichten"
      description="Begin met het toevoegen van je eerste logboek bericht om de communicatie met cliënten bij te houden."
      action={onAddNew ? {
        label: 'Nieuw bericht',
        onClick: onAddNew,
        icon: <Plus className="h-4 w-4" />
      } : undefined}
    />
  );
};

export const DocumentEmptyState: React.FC<{
  onUpload?: () => void;
}> = ({ onUpload }) => {
  return (
    <EmptyState
      title="Nog geen documenten"
      description="Upload documenten om ze bij te voegen aan dit logboek bericht."
      variant="upload"
      action={onUpload ? {
        label: 'Document uploaden',
        onClick: onUpload,
        icon: <Plus className="h-4 w-4" />
      } : undefined}
    />
  );
};

export const SearchEmptyState: React.FC<{
  searchTerm: string;
  onClearSearch?: () => void;
}> = ({ searchTerm, onClearSearch }) => {
  return (
    <EmptyState
      title={`Geen resultaten voor "${searchTerm}"`}
      description="Probeer andere zoektermen of bekijk alle berichten."
      variant="search"
      action={onClearSearch ? {
        label: 'Zoekopdracht wissen',
        onClick: onClearSearch,
        icon: <Search className="h-4 w-4" />
      } : undefined}
    />
  );
};