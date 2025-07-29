import { useState, useCallback, useEffect } from 'react';
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

interface UseDocumentManagerOptions {
  onUpload?: (documents: Document[]) => Promise<void>;
  onDelete?: (documentId: string) => Promise<void>;
  onDownload?: (document: Document) => void;
  onPreview?: (document: Document) => void;
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

// Sanitize user input for XSS prevention
const sanitizeInput = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

export const useDocumentManager = (options: UseDocumentManagerOptions = {}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [objectUrls, setObjectUrls] = useState<Set<string>>(new Set());

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      objectUrls.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [objectUrls]);

  const handleFileUpload = useCallback(async (files: FileList) => {
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

    // Process valid files
    if (validFiles.length > 0) {
      setUploading(true);
      try {
        const newDocuments: Document[] = validFiles.map((file, index) => {
          const objectUrl = URL.createObjectURL(file);
          setObjectUrls(prev => new Set([...prev, objectUrl]));

          return {
            id: `temp-${Date.now()}-${index}`,
            name: sanitizeFilename(file.name),
            type: file.type,
            size: file.size,
            url: objectUrl,
            file: file
          };
        });

        setDocuments(prev => [...prev, ...newDocuments]);

        // Call optional upload callback
        if (options.onUpload) {
          await options.onUpload(newDocuments);
        }

        toast.success(`${validFiles.length} bestand(en) succesvol geüpload`);
      } catch (error) {
        toast.error('Fout bij uploaden van bestanden');
        console.error('Upload error:', error);
      } finally {
        setUploading(false);
      }
    }
  }, [options.onUpload]);

  const handleDocumentDelete = useCallback(async (documentId: string) => {
    try {
      // Remove from local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));

      // Call optional delete callback
      if (options.onDelete) {
        await options.onDelete(documentId);
      }

      toast.success('Document succesvol verwijderd');
    } catch (error) {
      toast.error('Fout bij verwijderen van document');
      console.error('Delete error:', error);
    }
  }, [options.onDelete]);

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

      // Call optional download callback
      if (options.onDownload) {
        options.onDownload(document);
      }
    } catch (error) {
      toast.error('Fout bij downloaden van document');
      console.error('Download error:', error);
    }
  }, [options.onDownload]);

  const handleDocumentPreview = useCallback((document: Document) => {
    if (options.onPreview) {
      options.onPreview(document);
    }
  }, [options.onPreview]);

  const clearDocuments = useCallback(() => {
    setDocuments([]);
  }, []);

  const addDocument = useCallback((document: Document) => {
    setDocuments(prev => [...prev, document]);
  }, []);

  const removeDocument = useCallback((documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
  }, []);

  const updateDocument = useCallback((documentId: string, updates: Partial<Document>) => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === documentId ? { ...doc, ...updates } : doc
      )
    );
  }, []);

  return {
    documents,
    uploading,
    handleFileUpload,
    handleDocumentDelete,
    handleDocumentDownload,
    handleDocumentPreview,
    clearDocuments,
    addDocument,
    removeDocument,
    updateDocument,
    // Utility functions
    validateFile,
    sanitizeFilename,
    sanitizeInput
  };
};