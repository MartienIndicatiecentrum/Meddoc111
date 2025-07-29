import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowLeft, Download } from 'lucide-react';
import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.js`;

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
  file_path?: string;
  client_id?: string;
}

const statusColors: Record<string, string> = {
  nieuw: 'bg-blue-100 text-blue-800',
  in_behandeling: 'bg-yellow-100 text-yellow-800',
  wacht_op_info: 'bg-orange-100 text-orange-800',
  afgehandeld: 'bg-green-100 text-green-800',
  geannuleerd: 'bg-gray-100 text-gray-800',
};

const DocumentPreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [document, setDocument] = useState<Document | null>(null);
  const [client, setClient] = useState<{ naam: string; geboortedatum?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fromDocumentList = location.state?.fromDocumentList;
  const clientIdFromState = location.state?.clientId;

  useEffect(() => {
    const fetchDocument = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) {
        setDocument(data);
        if (data.client_id) {
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('naam, geboortedatum')
            .eq('id', data.client_id)
            .single();
          if (!clientError && clientData) {
            setClient(clientData);
          } else {
            setClient(null);
          }
        } else {
          setClient(null);
        }
      }
      setLoading(false);
    };
    fetchDocument();
  }, [id]);

  const extractTextFromPDF = async (pdfUrl: string): Promise<string> => {
    try {
      const loadingTask = getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: TextItem) => item.str).join(' ') + '\n';
      }
      return text;
    } catch (e) {
      return '';
    }
  };

  const askClaude = async (question: string) => {
    setChatLoading(true);
    setChatMessages((msgs) => [...msgs, { role: 'user', content: question }]);
    let documentText = '';
    if (document?.file_path && document?.mime_type?.includes('pdf')) {
      documentText = await extractTextFromPDF(document.file_path);
    }
    try {
      const endpoint = process.env.NODE_ENV === 'development'
        ? 'https://ltasjbgamoljvqoclgkf.functions.supabase.co/ask-claude'
        : '/functions/v1/ask-claude';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, documentText })
      });
      const data = await res.json();
      setChatMessages((msgs) => [...msgs, { role: 'ai', content: data.answer || 'Geen antwoord ontvangen.' }]);
    } catch (e) {
      setChatMessages((msgs) => [...msgs, { role: 'ai', content: 'Er ging iets mis met de AI.' }]);
    }
    setChatLoading(false);
  };

  const fetchDocumentFromDb = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();
    if (!error && data) {
      setDocument(data);
    }
    setLoading(false);
  };

  if (loading) return <div className="p-8">Bezig met laden...</div>;
  if (!document) return <div className="p-8">Document niet gevonden.</div>;

  const priorityOptions = [
    { value: 'normaal', label: 'Normaal' },
    { value: 'hoog', label: 'Hoog' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'laag', label: 'Laag' },
  ];
  const statusOptions = [
    { value: 'nieuw', label: 'Openstaand' },
    { value: 'in_behandeling', label: 'In behandeling' },
    { value: 'afgehandeld', label: 'Afgehandeld' },
    { value: 'geannuleerd', label: 'Geannuleerd' },
  ];

  return (
    <div className="w-screen h-screen min-h-0 min-w-0 bg-background flex flex-col">
      {/* Back button */}
      <div className="absolute top-4 left-4 z-20">
        <Button variant="ghost" size="sm" onClick={() => {
          if (fromDocumentList) {
            navigate('/', { state: { openDocumentList: true, clientId: clientIdFromState } });
          } else {
            navigate(-1);
          }
        }}>
          <ArrowLeft className="h-5 w-5 mr-1" /> Terug
        </Button>
      </div>
      {/* Main content grid */}
      <div className="flex-1 flex flex-col md:flex-row w-full h-full min-h-0 min-w-0">
        {/* Document info */}
        <div className="w-full md:w-1/2 h-full overflow-y-auto px-6 py-8 bg-white border-r border-gray-200 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <span className="text-2xl font-bold">{document.title}</span>
          </div>
          {client && (
            <div className="text-blue-900 font-semibold">
                              <span className="inline-block px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 border border-purple-500 font-medium text-xs">
                  Cliënt: {client.naam}
                </span>
              {client.geboortedatum && (
                <span className="text-gray-600 font-normal"> (geboren {new Date(client.geboortedatum).toLocaleDateString('nl-NL')})</span>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-2">
            {document.status && (
              <Badge className={statusColors[document.status] || 'bg-gray-100 text-gray-800'}>
                {document.status.replace('_', ' ')}
              </Badge>
            )}
            {document.created_at && (
              <span className="text-gray-500 text-sm">
                {new Date(document.created_at).toLocaleDateString('nl-NL')}
              </span>
            )}
          </div>
          <div className="mb-2">
            <span className="text-gray-700 font-medium">Type:</span> {document.type || '-'}<br />
            <span className="text-gray-700 font-medium">Bestandsgrootte:</span> {document.file_size ? `${(document.file_size / 1024).toFixed(1)} KB` : '-'}<br />
            <span className="text-gray-700 font-medium">MIME-type:</span> {document.mime_type || '-'}
          </div>
          {/* Status radio group */}
          <div className="flex gap-4 my-2 p-2 border border-blue-200 rounded bg-blue-50">
            {statusOptions.map(opt => (
              <label key={opt.value} className="flex items-center gap-1">
                <input
                  type="radio"
                  name="status"
                  checked={document.status === opt.value}
                  onChange={async () => {
                    if (document.status !== opt.value) {
                      setUpdating(true);
                      setStatusError(null);
                      const { data, error } = await supabase
                        .from('documents')
                        .update({ status: opt.value })
                        .eq('id', document.id);
                      if (!error) {
                        await fetchDocumentFromDb();
                        window.dispatchEvent(new Event('document-status-updated'));
                      } else {
                        setStatusError('Status wijzigen mislukt: ' + error.message);
                      }
                      setUpdating(false);
                    }
                  }}
                  disabled={updating}
                /> {opt.label}
              </label>
            ))}
          </div>
          {/* Prioriteit radio group */}
          <div className="flex gap-4 my-2 p-2 border border-red-200 rounded bg-red-50">
            <span className="font-medium text-red-700">Prioriteit:</span>
            {priorityOptions.map(opt => (
              <label key={opt.value} className="flex items-center gap-1">
                <input
                  type="radio"
                  name="priority"
                  checked={document.priority === opt.value}
                  onChange={async () => {
                    if (document.priority !== opt.value) {
                      setUpdating(true);
                      setStatusError(null);
                      const { data, error } = await supabase
                        .from('documents')
                        .update({ priority: opt.value })
                        .eq('id', document.id);
                      if (!error) {
                        await fetchDocumentFromDb();
                        window.dispatchEvent(new Event('document-status-updated'));
                      } else {
                        setStatusError('Prioriteit wijzigen mislukt: ' + error.message);
                      }
                      setUpdating(false);
                    }
                  }}
                  disabled={updating}
                /> {opt.label}
              </label>
            ))}
          </div>
          {statusError && (
            <div className="text-red-600 font-semibold mb-2">{statusError}</div>
          )}
        </div>
        {/* Document preview */}
        <div className="w-full md:w-1/2 h-full flex items-center justify-center bg-gray-100">
          {document.file_path ? (
            document.mime_type?.includes('pdf') ? (
              <iframe src={document.file_path} title="Document preview" className="w-full h-full min-h-0 min-w-0 border-none" />
            ) : document.mime_type?.startsWith('image/') ? (
              <img src={document.file_path} alt={document.title} className="w-full h-full object-contain" />
            ) : (
              <a href={document.file_path} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download bestand</a>
            )
          ) : (
            <Button variant="outline" className="flex items-center gap-2" disabled>
              <Download className="h-4 w-4" /> Geen bestand gevonden
            </Button>
          )}
        </div>
      </div>
      {/* Chatbox onderaan */}
      <div className="w-full bg-white border-t border-blue-200 p-4 flex flex-col gap-2">
        <h3 className="font-bold mb-2 text-blue-700">Stel een vraag over dit document</h3>
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto mb-2">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
              <span className={msg.role === 'user' ? 'bg-blue-100 text-blue-800 px-2 py-1 rounded' : 'bg-gray-100 text-gray-800 px-2 py-1 rounded'}>
                {msg.content}
              </span>
            </div>
          ))}
          {chatLoading && <div className="text-gray-400">AI is aan het typen...</div>}
        </div>
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (chatInput.trim()) {
              await askClaude(chatInput.trim());
              setChatInput('');
            }
          }}
        >
          <input
            type="text"
            className="flex-1 border rounded px-2 py-1"
            placeholder="Typ je vraag..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={chatLoading}
          />
          <Button type="submit" disabled={chatLoading || !chatInput.trim()}>
            Verstuur
          </Button>
        </form>
      </div>
    </div>
  );
};

export default DocumentPreview;