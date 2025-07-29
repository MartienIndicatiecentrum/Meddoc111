import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import FileUploader from '@/components/upload/FileUploader';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Upload, FileText, ArrowRight } from 'lucide-react';

const DocumentUpload: React.FC = () => {
  const navigate = useNavigate();
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);

  const handleUploadSuccess = (fileName: string) => {
    setUploadedDocuments(prev => [...prev, fileName]);
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-4 rounded-full">
              <Upload className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Document Upload Center
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Upload your PDF documents to our AI-powered knowledge base.
            Once uploaded, you can chat with our AI assistant about the content of your documents.
          </p>
        </div>

        {/* Process Flow */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
            <div className="flex items-center space-x-4 bg-white p-6 rounded-lg shadow-sm border">
              <div className="bg-blue-100 p-3 rounded-full">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">1. Upload PDF</h3>
                <p className="text-gray-600 text-sm">Upload your document to our system</p>
              </div>
            </div>

            <ArrowRight className="w-6 h-6 text-gray-400 hidden md:block" />
            <div className="md:hidden w-6 h-6 flex items-center justify-center">
              <div className="w-1 h-8 bg-gray-300 rounded"></div>
            </div>

            <div className="flex items-center space-x-4 bg-white p-6 rounded-lg shadow-sm border">
              <div className="bg-green-100 p-3 rounded-full">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">2. AI Processing</h3>
                <p className="text-gray-600 text-sm">AI analyzes and indexes content</p>
              </div>
            </div>

            <ArrowRight className="w-6 h-6 text-gray-400 hidden md:block" />
            <div className="md:hidden w-6 h-6 flex items-center justify-center">
              <div className="w-1 h-8 bg-gray-300 rounded"></div>
            </div>

            <div className="flex items-center space-x-4 bg-white p-6 rounded-lg shadow-sm border">
              <div className="bg-purple-100 p-3 rounded-full">
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">3. Chat & Ask</h3>
                <p className="text-gray-600 text-sm">Ask questions about your documents</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <FileUploader onUploadSuccess={handleUploadSuccess} />
        </div>

        {/* Recently Uploaded Documents */}
        {uploadedDocuments.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-green-900 mb-4">
              ✅ Recently Uploaded Documents
            </h3>
            <div className="space-y-2">
              {uploadedDocuments.map((doc, index) => (
                <div key={index} className="flex items-center space-x-3 text-green-800">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">{doc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Step CTA */}
        <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Chat with Your Documents?
          </h2>
          <p className="text-gray-600 mb-6">
            Once your documents are uploaded and processed, you can start asking questions about their content.
          </p>
          <button
            onClick={() => navigate('/ai-chat')}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Start AI Chat
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>

        {/* Features Grid */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="bg-blue-100 p-3 rounded-full w-fit mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Smart Document Processing</h3>
            <p className="text-gray-600 text-sm">
              Advanced AI extracts and indexes key information from your PDFs for intelligent search and retrieval.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="bg-green-100 p-3 rounded-full w-fit mb-4">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Natural Language Queries</h3>
            <p className="text-gray-600 text-sm">
              Ask questions in plain language and get accurate answers based on your document content.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="bg-purple-100 p-3 rounded-full w-fit mb-4">
              <Upload className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Secure & Private</h3>
            <p className="text-gray-600 text-sm">
              Your documents are securely stored and processed with enterprise-grade privacy protection.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DocumentUpload;
