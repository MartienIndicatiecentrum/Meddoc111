import React, { useState } from "react";
import {
  FileText, Image, Download, Share2, Eye,
  X, ZoomIn, ZoomOut, RotateCw, Maximize2,
  Calendar, User, Tag, Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface DocumentDetailModalProps {
  open: boolean;
  onClose: () => void;
  document: {
    id: number;
    title: string;
    type: string;
    category: string;
    date: string;
    created_at?: string;
    updated_at?: string;
    file_path?: string;
    file_size?: number;
    client_id?: number;
    clientId?: number;
  } | null;
}

const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({ open, onClose, document }) => {
  const [previewMode, setPreviewMode] = useState<'info' | 'preview'>('info');
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  console.log('📄 DocumentDetailModal render:', { open, document, documentExists: !!document });
  console.log('📄 Document structure:', document ? {
    id: document.id,
    title: document.title,
    type: document.type,
    file_path: document.file_path,
    hasFilePath: !!document.file_path
  } : 'No document');

  if (!open || !document) {
    console.log('🗫c️ Modal not shown - open:', open, 'document exists:', !!document);
    return null;
  }

  console.log('🎆 Modal WILL RENDER with document:', document.title, 'file_path:', document.file_path);

  // Determine file type for preview with safe null/undefined handling
  const getFileType = (type: string | null | undefined) => {
    if (!type || typeof type !== 'string') return 'unknown';

    try {
      const lowerType = type.toLowerCase();
      if (lowerType.includes('pdf')) return 'pdf';
      if (lowerType.includes('image') || lowerType.includes('jpg') || lowerType.includes('png') || lowerType.includes('jpeg')) return 'image';
      if (lowerType.includes('doc') || lowerType.includes('docx')) return 'document';
      if (lowerType.includes('txt')) return 'text';
      return 'unknown';
    } catch (error) {
      console.error('Error determining file type:', error);
      return 'unknown';
    }
  };

  const fileType = getFileType(document?.type);

  // Mock preview content based on file type
  const renderPreview = () => {
    switch (fileType) {
      case 'pdf':
        return (
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-600" />
                PDF Preview
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 25))}
                  className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                  title="Uitzoomen"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600">{zoom}%</span>
                <button
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                  title="Inzoomen"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                {document?.file_path && (
                  <button
                    onClick={() => window.open(document.file_path, '_blank')}
                    className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                    title="Openen in nieuwe tab"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {document?.file_path ? (
              <div className="bg-white border rounded overflow-hidden" style={{ height: '500px' }}>
                <iframe
                  src={document.file_path + '#view=FitH'}
                  className="w-full h-full border-0"
                  title={`Preview van ${document.title}`}
                  onLoad={() => {
                    console.log('PDF preview loaded successfully');
                  }}
                  onError={(e) => {
                    console.error('PDF preview error:', e);
                    console.log('Direct PDF view failed, trying alternative methods...');
                    const iframe = e.target as HTMLIFrameElement;
                    const container = iframe.parentElement;

                    // Try different fallback methods
                    setTimeout(() => {
                      console.log('Trying Google Docs viewer as fallback...');
                      iframe.src = `https://docs.google.com/viewer?url=${encodeURIComponent(document.file_path)}&embedded=true`;

                      // If Google Docs also fails, show error with manual link
                      iframe.onerror = () => {
                        console.log('Google Docs viewer also failed, showing manual link...');
                        if (container) {
                          container.innerHTML = `
                            <div class="flex flex-col items-center justify-center h-full text-center bg-gray-50 rounded">
                              <div class="mb-4">
                                <svg class="w-16 h-16 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 14.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                </svg>
                                <h4 class="font-medium text-gray-700 mb-2">Kan PDF niet laden in preview</h4>
                                <p class="text-sm text-gray-600 mb-4">Probeer het document te openen in een nieuwe tab</p>
                              </div>
                              <button onclick="window.open('${document.file_path}', '_blank')"
                                      class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                Open PDF in nieuwe tab
                              </button>
                              <p class="text-xs text-gray-400 mt-3">Bestandspad: ${document.file_path}</p>
                            </div>
                          `;
                        }
                      };
                    }, 500);
                  }}
                />
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-gray-300 rounded p-8 text-center text-gray-500">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="font-medium text-gray-700 mb-2">Geen preview beschikbaar</h4>
                <p className="text-sm mb-4">Het bestandspad is niet beschikbaar voor dit document</p>
                <div className="space-y-2 bg-gray-100 p-4 rounded text-xs">
                  <p className="text-gray-600 font-medium">Debug informatie:</p>
                  <p className="text-gray-400">Document ID: {document.id}</p>
                  <p className="text-gray-400">Document type: {document.type}</p>
                  <p className="text-gray-400">Bestandspad: {document.file_path || 'ONTBREEKT'}</p>
                  <p className="text-gray-400">Client ID: {document.client_id || 'Geen'}</p>
                  {!document.file_path && (
                    <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded">
                      <p className="text-yellow-800 text-xs">
                        ⚠️ Dit document heeft geen file_path - het is mogelijk niet correct geüpload naar Supabase Storage.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      case 'image':
        return (
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Image className="w-5 h-5 text-green-600" />
                Afbeelding Preview
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 25))}
                  className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                  title="Uitzoomen"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600">{zoom}%</span>
                <button
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                  title="Inzoomen"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRotation((rotation + 90) % 360)}
                  className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                  title="Roteren"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                {document?.file_path && (
                  <button
                    onClick={() => window.open(document.file_path, '_blank')}
                    className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                    title="Openen in nieuwe tab"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {document?.file_path ? (
              <div className="bg-white border rounded p-4 text-center overflow-hidden">
                <img
                  src={document.file_path}
                  alt={document.title || 'Document afbeelding'}
                  className="max-w-full max-h-96 mx-auto object-contain"
                  style={{
                    transform: `scale(${zoom/100}) rotate(${rotation}deg)`,
                    transition: 'transform 0.3s ease'
                  }}
                  onError={(e) => {
                    console.error('Image preview error:', e);
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-gray-300 rounded p-8 text-center text-gray-500">
                <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="font-medium text-gray-700 mb-2">Geen preview beschikbaar</h4>
                <p className="text-sm">Het bestandspad is niet beschikbaar voor dit document</p>
              </div>
            )}
          </div>
        );
      case 'document':
        return (
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Document Preview
              </h3>
              {document?.file_path && (
                <button
                  onClick={() => window.open(document.file_path, '_blank')}
                  className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                  title="Openen in nieuwe tab"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {document?.file_path ? (
              <div className="bg-white border rounded overflow-hidden" style={{ height: '500px' }}>
                <iframe
                  src={document.file_path}
                  className="w-full h-full border-0"
                  title={`Preview van ${document.title}`}
                  onLoad={() => {
                    console.log('Document preview loaded successfully');
                  }}
                  onError={(e) => {
                    console.error('Document preview error:', e);
                    console.log('Trying Google Docs viewer as fallback...');
                    // Fallback: try Google Docs viewer
                    const iframe = e.target as HTMLIFrameElement;
                    iframe.src = `https://docs.google.com/viewer?url=${encodeURIComponent(document.file_path)}&embedded=true`;
                  }}
                />
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-gray-300 rounded p-8 text-center text-gray-500">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="font-medium text-gray-700 mb-2">Geen preview beschikbaar</h4>
                <p className="text-sm">Het bestandspad is niet beschikbaar voor dit document</p>
                <div className="mt-4 space-y-2 text-left">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            )}
          </div>
        );
      case 'text':
        return (
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                Tekst Preview
              </h3>
              {document?.file_path && (
                <button
                  onClick={() => window.open(document.file_path, '_blank')}
                  className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                  title="Openen in nieuwe tab"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {document?.file_path ? (
              <div className="bg-white border rounded overflow-hidden" style={{ height: '400px' }}>
                <iframe
                  src={document.file_path}
                  className="w-full h-full border-0"
                  title={`Preview van ${document.title}`}
                  onLoad={() => {
                    console.log('Text preview loaded successfully');
                  }}
                  onError={(e) => {
                    console.error('Text preview error:', e);
                    console.log('Trying to open in new tab as fallback...');
                    // On error, show message and provide link to open in new tab
                    const container = (e.target as HTMLIFrameElement).parentElement;
                    if (container) {
                      container.innerHTML = `
                        <div class="flex flex-col items-center justify-center h-full text-center">
                          <p class="text-gray-600 mb-4">Kan dit bestand niet weergeven in de preview</p>
                          <button onclick="window.open('${document.file_path}', '_blank')"
                                  class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            Open in nieuwe tab
                          </button>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
            ) : (
              <div className="bg-white border rounded p-4 font-mono text-sm">
                <div className="text-gray-500 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="font-sans">Geen tekstinhoud beschikbaar</p>
                  <p className="font-sans text-xs mt-2">Het bestandspad is niet beschikbaar</p>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Preview niet beschikbaar</h3>
            <p className="text-gray-600 mb-4">Voor dit bestandstype is geen preview beschikbaar</p>
            {document?.file_path && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">Je kunt het bestand wel downloaden of openen in een nieuwe tab</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => window.open(document.file_path, '_blank')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Maximize2 className="w-4 h-4" />
                    Openen
                  </button>
                  <button
                    onClick={handleDownload}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  const handleDownload = () => {
    if (!document) return;

    try {
      if (document.file_path) {
        // If we have a file path, open it in a new tab for download
        window.open(document.file_path, '_blank');
        toast.success(`"${document.title || 'Document'}" wordt gedownload...`);
      } else {
        toast.error('Download link niet beschikbaar voor dit document');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Fout bij downloaden van document');
    }
  };

  const handleShare = () => {
    if (!document) return;

    try {
      if (document.file_path) {
        navigator.clipboard.writeText(document.file_path);
        toast.success('Deel link gekopieerd naar klembord');
      } else {
        toast.error('Geen deelbare link beschikbaar');
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Fout bij delen van document');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      {/* Debug indicator */}
      <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded text-sm z-[60]">
        MODAL IS RENDERING: {document?.title}
      </div>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              title="Terug naar documenten"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Terug</span>
            </button>

            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{document?.title || 'Onbekend document'}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    {document?.type || 'Onbekend type'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {document?.date || (document?.created_at ? new Date(document.created_at).toLocaleDateString('nl-NL') : 'Onbekende datum')}
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {document?.category || 'Geen categorie'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setPreviewMode('info')}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  previewMode === 'info' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Info
              </button>
              <button
                onClick={() => setPreviewMode('preview')}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  previewMode === 'preview' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Eye className="w-4 h-4 inline mr-1" />
                Preview
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleDownload}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={handleShare}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Delen"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Sluiten"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {previewMode === 'info' ? (
            /* Document Information */
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Document Informatie</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bestandsnaam:</span>
                      <span className="font-medium">{document?.title || 'Onbekend'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{document?.type || 'Onbekend type'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Categorie:</span>
                      <span className="font-medium">{document?.category || 'Geen categorie'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Aangemaakt:</span>
                      <span className="font-medium">{document?.date || (document?.created_at ? new Date(document.created_at).toLocaleDateString('nl-NL') : 'Onbekende datum')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bestandsgrootte:</span>
                      <span className="font-medium">{document?.file_size ? `${(document.file_size / 1024 / 1024).toFixed(1)} MB` : 'Onbekend'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Toegang & Delen</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Eigenaar:</span>
                      <span className="font-medium">MedDoc Pro</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Laatst bekeken:</span>
                      <span className="font-medium">Vandaag</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gedeeld met:</span>
                      <span className="font-medium">Privé</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags and Notes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Tags & Notities</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Medisch</span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Belangrijk</span>
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">Review</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">Dit document bevat belangrijke medische informatie en moet regelmatig worden gereviewed.</p>
                </div>
              </div>
            </div>
          ) : (
            /* Document Preview */
            <div>
              {renderPreview()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Laatst gewijzigd: {document?.updated_at ? new Date(document.updated_at).toLocaleDateString('nl-NL') : (document?.date || 'Onbekend')}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              Door: MedDoc Pro
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Sluiten
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailModal;
