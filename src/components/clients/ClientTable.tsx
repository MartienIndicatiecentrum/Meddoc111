import React from 'react';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from '@tanstack/react-table';
import { Client } from './types';

interface ClientTableProps {
  clients: Client[];
  columns: ColumnDef<Client, any>[];
  onEdit: (client: Client) => void;
  onViewDetails: (clientId: string) => void;
  onQuickAction: (action: string, clientId: string) => void;
  selectedClients?: string[];
  onSelectClient?: (clientId: string) => void;
}

const ClientTable: React.FC<ClientTableProps> = ({ clients, columns, onEdit, onViewDetails, onQuickAction, selectedClients = [], onSelectClient }) => {
  const table = useReactTable({
    data: clients,
    columns,
    getCoreRowModel: getCoreRowModel(),
    debugTable: false,
  });
  return (
    <div className="overflow-x-auto bg-white rounded shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-100">
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="hover:bg-gray-50">
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-4 py-2 whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {clients.length === 0 && (
        <div className="text-gray-400 italic p-8 text-center">Geen cliënten gevonden.</div>
      )}
    </div>
  );
};

export default ClientTable;
