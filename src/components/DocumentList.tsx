import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Pas het type aan op basis van je Supabase kolommen
interface Document {
  id: string;
  title: string;
  status?: string;
  created_at?: string;
  type?: string;
  priority?: string;
  file_size?: number;
  mime_type?: string;
  deadline?: Date | string;
}

const statusColors: Record<string, string> = {
  nieuw: 'bg-blue-100 text-blue-800',
  in_behandeling: 'bg-yellow-100 text-yellow-800',
  wacht_op_info: 'bg-orange-100 text-orange-800',
  afgehandeld: 'bg-green-100 text-green-800',
  geannuleerd: 'bg-gray-100 text-gray-800',
};

interface DocumentListProps {
  clientId?: string;
  onDocumentClick?: (doc: Document) => void;
  filterStatus?: string | null;
}

const DocumentList: React.FC<DocumentListProps> = ({
  clientId,
  onDocumentClick,
  filterStatus,
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription: any;
    const fetchDocuments = async () => {
      setLoading(true);
      let query = supabase.from('documents').select('*');
      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      const { data, error } = await query;
      if (error) {
        alert('Fout bij ophalen documenten: ' + error.message);
      } else {
        setDocuments(data || []);
      }
      setLoading(false);
    };
    fetchDocuments();

    // Subscribe to realtime changes
    subscription = supabase
      .channel('public:documents')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents' },
        payload => {
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      if (subscription && subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, [clientId]);

  if (loading) {
    return <div>Bezig met laden...</div>;
  }

  return (
    <div>
      <h2 className='text-xl font-bold mb-4'>Documenten</h2>
      <table className='min-w-full text-left border-collapse'>
        <thead>
          <tr>
            <th className='py-2 px-4 border-b'>Titel</th>
            <th className='py-2 px-4 border-b'>Status</th>
            <th className='py-2 px-4 border-b'>Datum</th>
          </tr>
        </thead>
        <tbody>
          {documents
            .filter(doc => {
              if (!filterStatus) {
                return true;
              }
              if (filterStatus === 'PRIORITEIT_URGENT') {
                return doc.priority === 'urgent';
              }
              return doc.status === filterStatus;
            })
            .map(doc => (
              <tr key={doc.id} className='hover:bg-gray-50'>
                <td className='py-2 px-4 border-b'>
                  <button
                    className='text-blue-600 hover:underline text-left'
                    style={{
                      cursor: 'pointer',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                    }}
                    onClick={() => onDocumentClick && onDocumentClick(doc)}
                  >
                    {doc.title}
                  </button>
                </td>
                <td className='py-2 px-4 border-b'>
                  {doc.status ? (
                    <span
                      className={`inline-block rounded px-2 py-1 text-xs font-semibold ${statusColors[doc.status] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {doc.status.replace('_', ' ')}
                    </span>
                  ) : (
                    <span className='text-gray-400'>-</span>
                  )}
                </td>
                <td className='py-2 px-4 border-b'>
                  {doc.created_at ? (
                    new Date(doc.created_at).toLocaleDateString('nl-NL')
                  ) : (
                    <span className='text-gray-400'>-</span>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentList;
