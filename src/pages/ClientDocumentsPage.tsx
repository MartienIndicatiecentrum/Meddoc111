import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import DocumentDetailModal from "@/components/documents/DocumentDetailModal";
import { toast } from "sonner";

interface Document {
  id: number;
  title: string;
  type: string;
  category: string;
  status: string;
  created_at: string;
  file_path?: string;
  file_size?: number;
  client_id?: number;
  date: string;
}

interface ClientDocumentsPageProps {
  clientId: string;
}

const ClientDocumentsPage: React.FC<ClientDocumentsPageProps> = ({ clientId }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, type, category, status, created_at, file_path, file_size, client_id, date")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) {
        console.error('Error fetching client documents:', error);
        toast.error('Kon documenten niet laden');
        setDocuments([]);
      } else if (data) {
        console.log('Client documents fetched:', data.length, 'documents');
        setDocuments(data);
      }
      setLoading(false);
    };
    if (clientId) fetchDocuments();
  }, [clientId]);

  if (!clientId) return <div className="p-8">Geen cliënt geselecteerd.</div>;
  if (loading) return <div className="p-8">Bezig met laden...</div>;

  return (
    <div className="max-w-3xl mx-auto mt-8 bg-white rounded shadow p-6">
      <h2 className="text-xl font-bold mb-4">Documenten van cliënt</h2>
      {documents.length === 0 ? (
        <div>Geen documenten gevonden.</div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acties</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td className="px-6 py-4 whitespace-nowrap flex items-center">
                  <FileText className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-900">{doc.title}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{doc.status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(doc.created_at).toLocaleDateString('nl-NL')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      console.log('🔍 Bekijk button clicked in ClientDocumentsPage, document:', doc);
                      setSelectedDocument(doc);
                    }}
                  >
                    Bekijken
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Document Detail Modal */}
      <DocumentDetailModal
        open={!!selectedDocument}
        onClose={() => {
          console.log('🚪 ClientDocumentsPage modal closing');
          setSelectedDocument(null);
        }}
        document={selectedDocument}
      />

      {/* Debug info for modal state */}
      {selectedDocument && (
        <div className="fixed bottom-4 right-4 bg-green-200 border border-green-400 p-3 rounded text-xs z-[70] max-w-sm">
          <div className="font-semibold mb-2">🔧 ClientDocumentsPage Debug</div>
          <div>Modal should be open: {!!selectedDocument ? 'YES' : 'NO'}</div>
          <div>Document ID: {selectedDocument.id}</div>
          <div>Document title: {selectedDocument.title}</div>
          <div>File path: {selectedDocument.file_path || 'ONTBREEKT'}</div>
          <div>Document type: {selectedDocument.type}</div>
          <button
            onClick={() => setSelectedDocument(null)}
            className="mt-2 text-xs bg-green-600 text-white px-2 py-1 rounded"
          >
            Close Debug
          </button>
        </div>
      )}
    </div>
  );
};

export default ClientDocumentsPage;