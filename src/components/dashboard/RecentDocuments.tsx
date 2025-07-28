import React, { useEffect, useState } from "react";
import { FileText, User, Clock, Loader2, AlertCircle, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRecentDocumentsWithClients, DocumentWithClient } from "@/services/documentProcessor";

interface RecentDocumentsProps {
  max?: number;
}

const RecentDocuments: React.FC<RecentDocumentsProps> = ({ max = 5 }) => {
  const [documents, setDocuments] = useState<DocumentWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentDocuments = async () => {
      try {
        setLoading(true);
        setError(null);
        const recentDocs = await getRecentDocumentsWithClients(max);
        setDocuments(recentDocs);
      } catch (err) {
        console.error('Error fetching recent documents:', err);
        setError('Kon recente documenten niet laden');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentDocuments();
  }, [max]);

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Zojuist';
    if (diffInHours < 24) return `${diffInHours} uur geleden`;
    if (diffInHours < 48) return 'Gisteren';
    return date.toLocaleDateString('nl-NL');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Recente documenten
        </h3>
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && documents.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Nog geen documenten geüpload</p>
        </div>
      )}

      {!loading && !error && documents.length > 0 && (
        <div className="space-y-3">
          {documents.map(doc => (
            <div 
              key={doc.id} 
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <FileText className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-gray-900 text-sm truncate" title={doc.title}>
                    {doc.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs hover:bg-blue-50 hover:text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/documenten');
                      }}
                      title="Bekijken"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{getRelativeTime(doc.created_at)}</span>
                    </div>
                  </div>
                </div>
                
                {doc.client_name && (
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={doc.client_avatar} alt={doc.client_name} />
                      <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                        {getInitials(doc.client_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-gray-600 truncate">{doc.client_name}</span>
                    {doc.category && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {doc.category}
                      </Badge>
                    )}
                  </div>
                )}
                
                {!doc.client_name && doc.category && (
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {doc.category}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentDocuments;
