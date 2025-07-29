import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DocumentViewer } from '@/components/DocumentViewer';
import { Button } from '@/components/ui/button';
import type { Document as SupabaseDocument } from '@/types/database';

const DocumentViewerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<SupabaseDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocument = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) {
        setDocument({
          ...data,
          type: data.document_type,
          deadline: data.deadline ? new Date(data.deadline) : undefined,
          created_at: data.created_at ? new Date(data.created_at) : new Date(),
        });
      }
      setLoading(false);
    };
    if (id) fetchDocument();
  }, [id]);

  return (
    <>
      <Button style={{ position: 'fixed', top: 16, left: 16, zIndex: 1000 }} onClick={() => navigate('/', { state: { openDropdown: true } })}>
        &larr; Terug naar dashboard
      </Button>
      <div className="w-full">
        {loading ? (
          <div style={{ width: '100vw', height: '100vh' }}>Laden...</div>
        ) : document ? (
          <DocumentViewer document={document} />
        ) : (
          <div style={{ width: '100vw', height: '100vh' }}>Document niet gevonden</div>
        )}
      </div>
    </>
  );
};

export default DocumentViewerPage;