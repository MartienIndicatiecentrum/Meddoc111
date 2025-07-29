import React from "react";
import { User, Tag, Search, Folder } from 'lucide-react';
import ReactSelect from 'react-select';

interface Client {
  id: number;
  naam: string;
  email?: string;
}

interface Folder {
  id: number;
  title: string;
  description?: string;
}

interface Document {
  id: number | string;
  title: string;
  type: string;
  category?: string;
  client_id?: number | string;
}

interface DocumentFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  selectedClient: string;
  onClientChange: (value: string) => void;
  clients: Client[];
  clientsLoading?: boolean;
  selectedFolder: string;
  onFolderChange: (value: string) => void;
  folders: Folder[];
  foldersLoading?: boolean;
  documents?: Document[];
}

const DocumentFilters: React.FC<DocumentFiltersProps> = ({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  selectedClient,
  onClientChange,
  clients,
  clientsLoading = false,
  selectedFolder,
  onFolderChange,
  folders,
  foldersLoading = false,
  documents = []
}) => {
  const [searchClient, setSearchClient] = React.useState('');
  const [showFoldersOverview, setShowFoldersOverview] = React.useState(false);
  // Count documents for each folder
  const folderCounts = React.useMemo(() => {
    const folderNames = folders.map(f => f.title);
    const counts: Record<string, number> = {};

    // Count unknown documents (no category or category not matching any folder)
    const unknownCount = documents.filter(doc =>
      doc.type !== 'folder' && (!doc.category || !folderNames.includes(doc.category))
    ).length;
    counts['UNKNOWN'] = unknownCount;

    // Count documents for each folder
    folders.forEach(folder => {
      const count = documents.filter(doc =>
        doc.type !== 'folder' && doc.category === folder.title
      ).length;
      counts[folder.id] = count;
    });

    return counts;
  }, [documents, folders]);

  return (
  <div className="w-full max-w-full bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-md md:sticky md:top-6 md:z-20 animate-fade-in">
    {/* Search Input */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
        <Search className="w-4 h-4 text-blue-500" />
        Zoeken
      </label>
      <input
        type="text"
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        placeholder="Zoek op titel of beschrijving..."
        className="w-full max-w-full min-w-[12rem] sm:min-w-[16rem] md:min-w-[18rem] lg:min-w-[20rem] xl:min-w-[22rem] border border-gray-300 rounded-lg px-3 py-2 mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        aria-label="Zoek documenten"
      />
    </div>

    {/* Filters in een responsive rij */}
    <div className="flex flex-col gap-3 w-full mt-2">
      {/* Client Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
          <User className="w-4 h-4 text-green-500" />
          Cliënt
        </label>
        <ReactSelect
          className="w-full max-w-full mb-2"
          classNamePrefix="react-select"
          isClearable
          isSearchable
          isDisabled={clientsLoading}
          placeholder="Alle cliënten"
          value={
            selectedClient
              ? clients
                  .map(client => {
                    const docCount = documents.filter(doc => doc.client_id && String(doc.client_id) === String(client.id)).length;
                    return {
                      value: client.id.toString(),
                      label: `${client.naam} (${docCount})`,
                    };
                  })
                  .find(opt => opt.value === selectedClient)
              : null
          }
          options={clients.map(client => {
            const docCount = documents.filter(doc => doc.client_id && String(doc.client_id) === String(client.id)).length;
            return {
              value: client.id.toString(),
              label: `${client.naam} (${docCount})`,
            };
          })}
          onChange={option => onClientChange(option ? option.value : '')}
          styles={{
            container: base => ({ ...base, width: '100%' }),
            menu: base => ({ ...base, zIndex: 9999 }),
          }}
        />
        {clientsLoading && (
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            Cliënten laden...
          </div>
        )}
      </div>

      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
          <Tag className="w-4 h-4 text-purple-500" />
          Categorie
        </label>
        <ReactSelect
          className="w-full max-w-full mb-2"
          classNamePrefix="react-select"
          isClearable
          isSearchable
          placeholder="Alle categorieën"
          value={category ? { value: category, label: category } : null}
          options={categories.map(cat => ({ value: cat, label: cat }))}
          onChange={option => onCategoryChange(option ? option.value : '')}
          styles={{ container: base => ({ ...base, width: '100%' }), menu: base => ({ ...base, zIndex: 9999 }) }}
        />
      </div>

      {/* Toggle voor Folder Overview */}
      <div className="mb-2 flex items-center gap-2">
        <input
          type="checkbox"
          id="showFoldersOverview"
          checked={showFoldersOverview}
          onChange={e => setShowFoldersOverview(e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="showFoldersOverview" className="text-sm text-gray-700 select-none cursor-pointer">
          Toon beschikbare mappen
        </label>
      </div>
      {!foldersLoading && folders.length > 0 && showFoldersOverview && (
        <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200 animate-fade-in">
          <div className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
            <Folder className="w-4 h-4 text-yellow-500" />
            Beschikbare mappen:
          </div>
          <div className="space-y-1">
            <div className="text-xs text-blue-600 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Folder className="w-3 h-3" />
                Alle mappen
              </div>
              <span className="text-blue-500 font-medium">{folders.length} mappen</span>
            </div>
            <div className="text-xs text-gray-500 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Folder className="w-3 h-3" />
                Onbekend
              </div>
              <span className="text-gray-400 font-medium">{folderCounts['UNKNOWN'] || 0} docs</span>
            </div>
            {folders.map(folder => (
              <div key={folder.id} className="text-xs text-gray-600 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Folder className="w-3 h-3" />
                  <span>{folder.title}</span>
                  {folder.description && (
                    <span className="text-gray-400">- {folder.description}</span>
                  )}
                </div>
                <span className="text-gray-400 font-medium">{folderCounts[folder.id] || 0} docs</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Daarna de Folder Filter dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Folder className="w-4 h-4 inline mr-2" />
          Mappen
        </label>
        <ReactSelect
          className="w-full max-w-full mb-2"
          classNamePrefix="react-select"
          isClearable
          isSearchable
          isDisabled={foldersLoading}
          placeholder="-- Geen mappen gekozen --"
          value={
            selectedFolder
              ? [
                  { value: '', label: '-- Geen mappen gekozen --' },
                  { value: 'ALL', label: 'Alle mappen' },
                  ...folders.map(folder => ({
                    value: folder.id.toString(),
                    label: `${folder.title} (${folderCounts[folder.id] || 0} docs)`
                  }))
                ].find(opt => opt.value === selectedFolder)
              : null
          }
          options={[
            { value: '', label: '-- Geen mappen gekozen --' },
            { value: 'ALL', label: 'Alle mappen' },
            ...folders.map(folder => ({
              value: folder.id.toString(),
              label: `${folder.title} (${folderCounts[folder.id] || 0} docs)`
            }))
          ]}
          onChange={option => onFolderChange(option ? option.value : '')}
          styles={{ container: base => ({ ...base, width: '100%' }), menu: base => ({ ...base, zIndex: 9999 }) }}
        />
        {foldersLoading && (
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            Mappen laden...
          </div>
        )}
      </div>
    </div>

    {/* Active Filters Summary */}
    {(search || selectedClient || category || selectedFolder) && (
      <div className="pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-600 mb-2">Actieve filters:</div>
        <div className="flex flex-wrap gap-1">
          {search && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
              Zoek: "{search}"
            </span>
          )}
          {selectedClient && (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
              Cliënt: {clients.find(c => c.id.toString() === selectedClient)?.naam || 'Onbekend'}
            </span>
          )}
          {category && (
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
              Categorie: {category}
            </span>
          )}
          {selectedFolder && (
            (() => {
              // Special handling for UNKNOWN and ALL filters
              if (selectedFolder === 'UNKNOWN') {
                return (
                  <span
                    className="px-3 py-1 rounded-full text-xs flex items-center gap-1 border"
                    style={{
                      border: '2px solid #f3f4f6',
                      background: '#f9fafb',
                      color: '#6b7280',
                    }}
                  >
                    <Folder className="w-4 h-4 mr-1 inline-block" />
                    Map: Onbekend
                  </span>
                );
              }

              if (selectedFolder === 'ALL') {
                return (
                  <span
                    className="px-3 py-1 rounded-full text-xs flex items-center gap-1 border"
                    style={{
                      border: '2px solid #dbeafe',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                    }}
                  >
                    <Folder className="w-4 h-4 mr-1 inline-block" />
                    Alle mappen
                  </span>
                );
              }

              // Vind de folder en client voor kleur
              const folder = folders.find(f => f.id.toString() === selectedFolder);
              // Genereer een pastel kleur op basis van folder-id
              function pastelColorFromId(id: string | number) {
                const idStr = String(id);
                const hash = idStr.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
                const hue = hash % 360;
                return `hsl(${hue}, 70%, 90%)`;
              }
              const borderColor = folder ? pastelColorFromId(folder.id) : '#eee';
              const idStr = folder ? String(folder.id) : '0';
              const textColor = folder ? `hsl(${idStr.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360}, 60%, 35%)` : '#555';
              return (
                <span
                  className="px-3 py-1 rounded-full text-xs flex items-center gap-1 border"
                  style={{
                    border: `2px solid ${borderColor}`,
                    background: '#fff',
                    color: textColor,
                  }}
                >
                  <Folder className="w-4 h-4 mr-1 inline-block" />
                  Map: {folder?.title || 'Onbekend'}
                </span>
              );
            })()
          )}
        </div>
        <button
          onClick={() => {
            onSearchChange('');
            onClientChange('');
            onCategoryChange('');
            onFolderChange('');
          }}
          className="text-xs text-red-600 hover:text-red-700 mt-2 font-medium"
        >
          Alle filters wissen
        </button>
      </div>
    )}
  </div>
  );
};

export default DocumentFilters;
export type { Client, Folder };
