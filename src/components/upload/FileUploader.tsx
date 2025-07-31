import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';

interface FileUploadResult {
  success: boolean;
  publicUrl?: string;
  fileName?: string;
  error?: string;
}

interface LangChainResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface FileUploaderProps {
  onUploadSuccess?: (fileName: string) => void;
  clientId?: string;
  taskId?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadSuccess,
  clientId,
  taskId,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadResults, setUploadResults] = useState<FileUploadResult[]>([]);
  const [currentUploadIndex, setCurrentUploadIndex] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Accepted file types
  const acceptedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
  ];

  const acceptedExtensions = ['.pdf', '.docx', '.doc', '.txt'];

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      toast.error(
        'Bestandstype niet ondersteund. Alleen PDF, DOCX en TXT bestanden zijn toegestaan.'
      );
      return false;
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error('Bestand is te groot. Maximum bestandsgrootte is 50MB.');
      return false;
    }

    return true;
  };

  const uploadToSupabase = async (file: File): Promise<FileUploadResult> => {
    try {
      setUploadProgress('Bestand uploaden naar Supabase...');

      // Create unique filename with timestamp
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const uniqueFileName = `${timestamp}-${file.name}`;
      const uploadPath = `uploads/${uniqueFileName}`;

      console.log('Uploading file to Supabase:', {
        fileName: file.name,
        size: file.size,
        type: file.type,
        uploadPath,
      });

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(uploadPath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload fout: ${uploadError.message}`);
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('documents').getPublicUrl(uploadPath);

      console.log('Public URL obtained:', publicUrl);

      // Save document metadata to database
      setUploadProgress('Document metadata opslaan...');

      const documentRecord: any = {
        name: file.name,
        type: 'document',
        category: 'Upload',
        url: publicUrl,
        size: file.size,
        mime_type: file.type,
      };

      // Add client_id if provided
      if (clientId) {
        documentRecord.client_id = clientId;
      }

      const { data: documentData, error: dbError } = await supabase
        .from('documents')
        .insert(documentRecord)
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        // Don't fail the upload if database insert fails, just warn
        console.warn(
          'File uploaded successfully but database record creation failed:',
          dbError.message
        );
      } else {
        console.log('Document metadata saved:', documentData);
      }

      return {
        success: true,
        publicUrl,
        fileName: file.name,
      };
    } catch (error) {
      console.error('Upload to Supabase failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Onbekende upload fout',
      };
    }
  };

  const sendToLangChain = async (
    fileUrl: string
  ): Promise<LangChainResponse> => {
    try {
      setUploadProgress('Bestand verwerken met LangChain RAG server...');

      console.log('Sending to LangChain RAG server:', fileUrl);

      const response = await fetch('http://localhost:5001/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_url: fileUrl,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `LangChain server error: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();
      console.log('LangChain response:', result);

      return {
        success: true,
        message: result.message || 'Bestand succesvol verwerkt door RAG server',
      };
    } catch (error) {
      console.error('LangChain processing failed:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'LangChain verwerking mislukt',
      };
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const validFiles: File[] = [];
    const fileArray = Array.from(files);

    // Validate each file
    for (const file of fileArray) {
      if (validateFile(file)) {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      setUploadResults([]);
      setCurrentUploadIndex(0);
      toast.success(
        `${validFiles.length} bestand(en) geselecteerd voor upload`
      );
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Selecteer eerst één of meer bestanden');
      return;
    }

    setIsUploading(true);
    setUploadProgress('Upload starten...');
    setUploadResults([]);
    setCurrentUploadIndex(0);

    const results: FileUploadResult[] = [];
    const successfulUploads: string[] = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setCurrentUploadIndex(i);
        setUploadProgress(
          `Bestand ${i + 1} van ${selectedFiles.length} uploaden: ${file.name}`
        );

        try {
          // Step 1: Upload to Supabase
          const uploadResult = await uploadToSupabase(file);

          if (!uploadResult.success) {
            throw new Error(
              uploadResult.error || 'Upload naar Supabase mislukt'
            );
          }

          // Step 2: Send to LangChain RAG server
          const langChainResult = await sendToLangChain(
            uploadResult.publicUrl!
          );

          if (!langChainResult.success) {
            console.warn(
              `LangChain processing failed for ${file.name}, but file was uploaded successfully`
            );
            toast.warning(
              `Bestand ${file.name} geüpload, maar RAG verwerking mislukt`
            );
          }

          // Success for this file
          const result: FileUploadResult = {
            success: true,
            publicUrl: uploadResult.publicUrl,
            fileName: uploadResult.fileName,
          };

          results.push(result);
          successfulUploads.push(file.name);

          toast.success(
            `Bestand "${file.name}" succesvol geüpload en verwerkt!`
          );
        } catch (fileError) {
          console.error(`Upload failed for ${file.name}:`, fileError);
          const errorMessage =
            fileError instanceof Error ? fileError.message : 'Upload mislukt';

          const result: FileUploadResult = {
            success: false,
            fileName: file.name,
            error: errorMessage,
          };

          results.push(result);
          toast.error(`Upload fout voor ${file.name}: ${errorMessage}`);
        }
      }

      // Update results
      setUploadResults(results);

      // Call success callback for all successful uploads
      if (onUploadSuccess && successfulUploads.length > 0) {
        onUploadSuccess(successfulUploads.join(', '));
      }

      // Show summary
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      if (successCount === results.length) {
        toast.success(`Alle ${successCount} bestanden succesvol geüpload!`);
      } else if (successCount > 0) {
        toast.warning(
          `${successCount} bestanden succesvol, ${failCount} mislukt`
        );
      } else {
        toast.error(`Alle ${failCount} uploads mislukt`);
      }

      // Reset form
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload process failed:', error);
      toast.error('Upload proces volledig mislukt');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
      setCurrentUploadIndex(0);
    }
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    setUploadResults([]);
    setCurrentUploadIndex(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className='w-full max-w-2xl mx-auto p-6'>
      {/* Card Container */}
      <div className='bg-white rounded-lg border border-gray-200 shadow-sm'>
        <div className='p-6'>
          {/* Header */}
          <div className='mb-6'>
            <h2 className='text-2xl font-semibold text-gray-900 mb-2'>
              Document Uploader
            </h2>
            <p className='text-gray-600'>
              Upload PDF, DOCX of TXT bestanden naar Supabase en verwerk ze met
              LangChain RAG
            </p>
          </div>

          {/* File Input */}
          <div className='mb-6'>
            <label
              htmlFor='file-upload'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Selecteer bestanden
            </label>
            <input
              ref={fileInputRef}
              id='file-upload'
              type='file'
              multiple
              accept={acceptedExtensions.join(',')}
              onChange={handleFileSelect}
              disabled={isUploading}
              className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed'
            />
            <p className='mt-2 text-xs text-gray-500'>
              Ondersteunde formaten: PDF, DOCX, TXT (max 50MB)
            </p>
          </div>

          {/* Selected Files Display */}
          {selectedFiles.length > 0 && (
            <div className='mb-6 p-4 bg-gray-50 rounded-lg border'>
              <div className='flex items-center justify-between mb-3'>
                <h3 className='font-medium text-gray-900'>
                  {selectedFiles.length} bestand
                  {selectedFiles.length > 1 ? 'en' : ''} geselecteerd
                </h3>
                <button
                  onClick={clearSelection}
                  disabled={isUploading}
                  className='p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50'
                >
                  <X className='w-5 h-5' />
                </button>
              </div>
              <div className='space-y-2 max-h-32 overflow-y-auto'>
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className='flex items-center space-x-3 p-2 bg-white rounded border'
                  >
                    <FileText className='w-6 h-6 text-blue-600 flex-shrink-0' />
                    <div className='flex-1 min-w-0'>
                      <p className='font-medium text-gray-900 truncate'>
                        {file.name}
                      </p>
                      <p className='text-sm text-gray-500'>
                        {formatFileSize(file.size)} • {file.type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className='mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200'>
              <div className='flex items-center space-x-3'>
                <Loader2 className='w-5 h-5 text-blue-600 animate-spin' />
                <div>
                  <p className='font-medium text-blue-900'>
                    Upload in uitvoering...
                  </p>
                  <p className='text-sm text-blue-700'>{uploadProgress}</p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Results */}
          {uploadResults.length > 0 && (
            <div className='mb-6 space-y-3'>
              <h3 className='font-medium text-gray-900'>Upload Resultaten</h3>
              {uploadResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className='flex items-start space-x-3'>
                    {result.success ? (
                      <CheckCircle className='w-5 h-5 text-green-600 mt-0.5' />
                    ) : (
                      <AlertCircle className='w-5 h-5 text-red-600 mt-0.5' />
                    )}
                    <div className='flex-1'>
                      <p
                        className={`font-medium ${
                          result.success ? 'text-green-900' : 'text-red-900'
                        }`}
                      >
                        {result.success
                          ? 'Upload succesvol!'
                          : 'Upload mislukt'}
                      </p>
                      <p className='text-sm text-gray-700 mt-1'>
                        Bestand: {result.fileName}
                      </p>
                      {result.success && result.publicUrl && (
                        <p className='text-xs text-green-600 break-all mt-1'>
                          URL: {result.publicUrl}
                        </p>
                      )}
                      {!result.success && result.error && (
                        <p className='text-sm text-red-700 mt-1'>
                          Fout: {result.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          <div className='flex justify-end'>
            <button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isUploading}
              className='inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {isUploading ? (
                <>
                  <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                  Uploaden...
                </>
              ) : (
                <>
                  <Upload className='w-5 h-5 mr-2' />
                  Upload & Verwerk
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className='mt-6 bg-blue-50 rounded-lg border border-blue-200 p-4'>
        <h3 className='font-medium text-blue-900 mb-2'>Hoe het werkt:</h3>
        <ol className='text-sm text-blue-800 space-y-1'>
          <li>1. Selecteer een PDF, DOCX of TXT bestand (max 50MB)</li>
          <li>
            2. Bestand wordt geüpload naar Supabase Storage bucket 'documents'
          </li>
          <li>3. Public URL wordt gegenereerd voor het geüploade bestand</li>
          <li>
            4. URL wordt verzonden naar LangChain RAG server
            (localhost:5001/ingest)
          </li>
          <li>
            5. RAG server verwerkt het document voor AI-gestuurde zoekopdrachten
          </li>
        </ol>
      </div>
    </div>
  );
};

export default FileUploader;
