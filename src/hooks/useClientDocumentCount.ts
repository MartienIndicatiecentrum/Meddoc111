import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

export const useClientDocumentCount = (clientId: string) => {
  const [documentCount, setDocumentCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocumentCount = async () => {
      if (!clientId) {
        setDocumentCount(0);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { count, error } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', clientId)
          .is('deleted_at', null);

        if (error) {
          console.error('Error fetching document count:', error);
          setError(error.message);
          setDocumentCount(0);
        } else {
          setDocumentCount(count || 0);
        }
      } catch (err) {
        console.error('Error fetching document count:', err);
        setError('Er is een fout opgetreden bij het ophalen van het aantal documenten');
        setDocumentCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentCount();
  }, [clientId]);

  return { documentCount, loading, error };
};