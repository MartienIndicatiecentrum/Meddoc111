import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileText,
  Image,
  Download,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

// Constants for file validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png'
];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  file?: File;
}

interface DocumentManagerProps {
  documents: Document[];
  onDocumentUpload: (files: FileList) => Promise<void>;
  onDocumentDelete: (documentId: string) => Promise<void>;
  onDocumentDownload: (document: Document) => void;
  onDocumentPreview: (document: Document) => void;
  uploading?: boolean;
  className?: string;
}

// File validation utility
const validateFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `Bestand is te groot. Maximum grootte is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `Bestandstype niet ondersteund. Toegestane types: PDF, JPG, PNG.`
    };
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: `Bestandsextensie niet ondersteund. Toegestane extensies: .pdf, .jpg, .jpeg, .png.`
    };
  }

  return { isValid: true };
};

// Sanitize filename for security
const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_') // Remove invalid characters
    .replace(/\.\./g, '_') // Prevent directory traversal
    .substring(0, 255); // Limit length
};

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  documents,
  onDocumentUpload,
  onDocumentDelete,
  onDocumentDownload,
  onDocumentPreview,
  uploading = false,
  className = ''
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [objectUrls, setObjectUrls] = useState<Set<string>>(new Set());

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      objectUrls.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [objectUrls]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = useCallback(async (files: FileList) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate each file
    Array.from(files).forEach(file => {
      const validation = validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    // Show errors if any
    if (errors.length > 0) {
      errors.forEach(error => {
        toast.error(error);
      });
    }

    // Upload valid files
    if (validFiles.length > 0) {
      try {
        // Create a new FileList-like object
        const dataTransfer = new DataTransfer();
        validFiles.forEach(file => dataTransfer.items.add(file));

        await onDocumentUpload(dataTransfer.files);
        toast.success(`${validFiles.length} bestand(en) succesvol geüpload`);
      } catch (error) {
        toast.error('Fout bij uploaden van bestanden');
        console.error('Upload error:', error);
      }
    }
  }, [onDocumentUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const handleDocumentDownload = useCallback((document: Document) => {
    try {
      if (document.url) {
        // SECURITY FIX: Use window.document.createElement instead of document.createElement
        const link = window.document.createElement('a');
        link.href = document.url;
        link.download = sanitizeFilename(document.name);
        link.target = '_blank';
        link.rel = 'noopener noreferrer'; // Security: prevent opener hijacking

        // Add to DOM temporarily
        window.document.body.appendChild(link);
        link.click();

        // Clean up
        window.document.body.removeChild(link);
      }
    } catch (error) {
      toast.error('Fout bij downloaden van document');
      console.error('Download error:', error);
    }
  }, []);

  const handleDocumentDelete = useCallback(async (documentId: string) => {
    try {
      await onDocumentDelete(documentId);
      toast.success('Document succesvol verwijderd');
    } catch (error) {
      toast.error('Fout bij verwijderen van document');
      console.error('Delete error:', error);
    }
  }, [onDocumentDelete]);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Documenten</span>
            {uploading && (
              <Badge variant="secondary" className="ml-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                Uploaden...
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Upload area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 mb-2">
              Sleep bestanden hierheen of klik om te selecteren
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Ondersteunde formaten: PDF, JPG, PNG (max 10MB)
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Bestanden selecteren
            </label>
          </div>

          {/* Document list */}
          {documents.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Geüploade documenten:</h4>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getFileIcon(doc.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {sanitizeFilename(doc.name)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(doc.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDocumentPreview(doc)}
                      className="h-8 w-8 p-0"
                      title="Bekijken"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDocumentDownload(doc)}
                      className="h-8 w-8 p-0"
                      title="Downloaden"
                    >
                      <Download className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDocumentDelete(doc.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      title="Verwijderen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {documents.length === 0 && !uploading && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nog geen documenten geüpload</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};