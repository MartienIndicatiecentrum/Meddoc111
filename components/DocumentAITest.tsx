// components/DocumentAITest.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { DocumentProcessor } from '../services/documentProcessor';
import { AIQuestionAnswering } from '../services/aiQuestionAnswering';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface Document {
  id: string;
  filename?: string;
  name?: string;
  content_text?: string;
  processed_at?: string;
  created_at?: string;
}

const DocumentAITest = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const documentProcessor = new DocumentProcessor();
  const aiQA = new AIQuestionAnswering();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setStatus('Loading documents...');
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {throw error;}
      setDocuments(data || []);
      setStatus(`Loaded ${data?.length || 0} documents`);
    } catch (error) {
      console.error('Error loading documents:', error);
      setError(`Error loading documents: ${error.message}`);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file first');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('Uploading and processing document...');

    try {
      const result = await documentProcessor.processNewDocument(
        selectedFile,
        selectedFile.name,
      );

      if (result.success) {
        setStatus('✅ Document uploaded and processed successfully!');
        setSelectedFile(null);
        await loadDocuments(); // Refresh the documents list
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setError(`Error uploading document: ${error.message}`);
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  const processExistingDocument = async (documentId: string) => {
    setLoading(true);
    setError('');
    setStatus('Processing existing document...');

    try {
      const result =
        await documentProcessor.processExistingDocument(documentId);

      if (result.success) {
        setStatus('✅ Document processed for AI successfully!');
        await loadDocuments(); // Refresh the documents list
      }
    } catch (error) {
      console.error('Error processing document:', error);
      setError(`Error processing document: ${error.message}`);
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('Generating answer...');

    try {
      const response = await aiQA.askQuestion(
        question,
        selectedDocumentId || undefined,
      );
      setAnswer(response);
      setStatus('✅ Answer generated successfully!');
    } catch (error) {
      console.error('Error asking question:', error);
      setError(`Error asking question: ${error.message}`);
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setError('');
    setStatus('Testing connections...');

    try {
      // Test Supabase connection
      const { data, error } = await supabase
        .from('documents')
        .select('count', { count: 'exact' });
      if (error) {throw new Error(`Supabase error: ${error.message}`);}

      // Test OpenAI connection
      const testEmbedding = await fetch(
        'https://api.openai.com/v1/embeddings',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-ada-002',
            input: 'test',
          }),
        },
      );

      if (!testEmbedding.ok) {
        throw new Error(`OpenAI API error: ${testEmbedding.statusText}`);
      }

      setStatus('✅ All connections working correctly!');
    } catch (error) {
      console.error('Connection test failed:', error);
      setError(`Connection test failed: ${error.message}`);
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='p-6 max-w-6xl mx-auto bg-gray-50 min-h-screen'>
      <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
        <h1 className='text-3xl font-bold mb-6 text-gray-800'>
          Document AI Test Interface
        </h1>

        {/* Connection Test */}
        <div className='mb-6 p-4 bg-blue-50 rounded-lg'>
          <h2 className='text-lg font-semibold mb-3'>🔧 Connection Test</h2>
          <button
            onClick={testConnection}
            disabled={loading}
            className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50'
          >
            Test Connections
          </button>
        </div>

        {/* Status Display */}
        {status && (
          <div className='mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded'>
            {status}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
            {error}
          </div>
        )}

        {/* File Upload Section */}
        <div className='mb-8 p-4 bg-gray-50 rounded-lg'>
          <h2 className='text-xl font-semibold mb-4'>
            📄 Upload New PDF Document
          </h2>
          <div className='flex items-center gap-4'>
            <input
              type='file'
              accept='.pdf'
              onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              disabled={loading}
              className='flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
            />
            <button
              onClick={handleFileUpload}
              disabled={loading || !selectedFile}
              className='px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50'
            >
              {loading ? 'Processing...' : 'Upload & Process'}
            </button>
          </div>
          {selectedFile && (
            <p className='mt-2 text-sm text-gray-600'>
              Selected: {selectedFile.name} (
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {/* Existing Documents */}
        <div className='mb-8'>
          <h2 className='text-xl font-semibold mb-4'>
            📚 Existing Documents ({documents.length})
          </h2>
          <div className='grid gap-3 max-h-60 overflow-y-auto'>
            {documents.map(doc => (
              <div
                key={doc.id}
                className='p-3 border rounded-lg bg-white flex justify-between items-center'
              >
                <div className='flex-1'>
                  <h3 className='font-medium text-gray-800'>
                    {doc.filename || doc.name || 'Unnamed Document'}
                  </h3>
                  <div className='text-xs text-gray-500 mt-1'>
                    ID: {doc.id.slice(0, 8)}...
                    {doc.content_text
                      ? ' • ✅ AI Ready'
                      : ' • ❌ Not Processed'}
                    {doc.processed_at &&
                      ` • Processed: ${new Date(doc.processed_at).toLocaleDateString()}`}
                  </div>
                </div>
                <div className='flex gap-2'>
                  {!doc.content_text && (
                    <button
                      onClick={() => processExistingDocument(doc.id)}
                      disabled={loading}
                      className='px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 disabled:opacity-50'
                    >
                      Process for AI
                    </button>
                  )}
                  {doc.content_text && (
                    <button
                      onClick={() =>
                        setSelectedDocumentId(
                          doc.id === selectedDocumentId ? '' : doc.id,
                        )
                      }
                      className={`px-3 py-1 text-sm rounded ${
                        selectedDocumentId === doc.id
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {selectedDocumentId === doc.id ? 'Selected' : 'Select'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {documents.length === 0 && (
            <p className='text-gray-500 text-center py-4'>
              No documents found. Upload a PDF to get started!
            </p>
          )}
        </div>

        {/* Question Interface */}
        <div className='mb-6 p-4 bg-blue-50 rounded-lg'>
          <h2 className='text-xl font-semibold mb-4'>
            🤖 Ask Questions About Your Documents
          </h2>

          <div className='mb-3'>
            <label className='block text-sm font-medium mb-2'>
              Document Scope:
            </label>
            <select
              value={selectedDocumentId}
              onChange={e => setSelectedDocumentId(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md'
            >
              <option value=''>All processed documents</option>
              {documents
                .filter(doc => doc.content_text)
                .map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.filename || doc.name || 'Unnamed Document'}
                  </option>
                ))}
            </select>
          </div>

          <div className='mb-3'>
            <label className='block text-sm font-medium mb-2'>
              Your Question:
            </label>
            <div className='flex gap-2'>
              <input
                type='text'
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder='What would you like to know about your documents?'
                className='flex-1 px-3 py-2 border border-gray-300 rounded-md'
                disabled={loading}
                onKeyPress={e => e.key === 'Enter' && handleAskQuestion()}
              />
              <button
                onClick={handleAskQuestion}
                disabled={loading || !question.trim()}
                className='px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50'
              >
                {loading ? 'Thinking...' : 'Ask'}
              </button>
            </div>
          </div>

          {/* Sample Questions */}
          <div className='mt-3'>
            <p className='text-sm text-gray-600 mb-2'>
              💡 Try these sample questions:
            </p>
            <div className='flex flex-wrap gap-2'>
              {[
                'What is the main topic of this document?',
                'Summarize the key points',
                'What are the conclusions?',
                'Are there any dates mentioned?',
                'What recommendations are made?',
              ].map((sampleQ, index) => (
                <button
                  key={index}
                  onClick={() => setQuestion(sampleQ)}
                  className='px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300'
                  disabled={loading}
                >
                  {sampleQ}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Answer Display */}
        {answer && (
          <div className='p-4 bg-green-50 rounded-lg'>
            <h3 className='font-semibold mb-2 text-green-800'>🎯 AI Answer:</h3>
            <div className='text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border'>
              {answer}
            </div>
          </div>
        )}

        {/* Debug Info */}
        <div className='mt-8 p-4 bg-gray-100 rounded-lg'>
          <h3 className='font-semibold mb-2'>🔍 Debug Information</h3>
          <div className='text-sm text-gray-600 space-y-1'>
            <p>• Documents loaded: {documents.length}</p>
            <p>
              • AI-ready documents:{' '}
              {documents.filter(d => d.content_text).length}
            </p>
            <p>• Selected document: {selectedDocumentId || 'All documents'}</p>
            <p>• Environment: {process.env.NODE_ENV}</p>
            <p>
              • Supabase URL configured:{' '}
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}
            </p>
            <p>
              • OpenAI key configured:{' '}
              {process.env.OPENAI_API_KEY ? '✅' : '❌'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentAITest;
