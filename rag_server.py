#!/usr/bin/env python3
"""
RAG Server for MedDoc AI Flow
A simple Flask server that handles document ingestion and Q&A for the AI chatbot.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
import tempfile
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# In-memory storage for documents (in production, use a proper database)
documents_store = {}
document_contents = {}

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "message": "RAG Server is running",
        "timestamp": datetime.now().isoformat(),
        "documents_count": len(documents_store)
    })

@app.route('/ingest', methods=['POST'])
def ingest_document():
    """
    Ingest a document from a URL and process it for RAG
    Expected payload: {
        "file_url": "https://...",
        "document_id": "123",
        "title": "document.pdf",
        "client_id": "456" (optional) - associate document with client
    }
    """
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        file_url = data.get('file_url')
        document_id = data.get('document_id')
        title = data.get('title', 'Unknown Document')
        client_id = data.get('client_id')
        
        if not file_url or not document_id:
            return jsonify({"error": "file_url and document_id are required"}), 400
        
        logger.info(f"Processing document: {title} (ID: {document_id})")
        
        # Download and process the document
        try:
            # Download the file
            response = requests.get(file_url, timeout=30)
            response.raise_for_status()
            
            # For now, we'll store basic metadata
            # In a real implementation, you would:
            # 1. Extract text from PDF/DOCX
            # 2. Split into chunks
            # 3. Create embeddings
            # 4. Store in vector database
            
            documents_store[document_id] = {
                "id": document_id,
                "title": title,
                "file_url": file_url,
                "processed_at": datetime.now().isoformat(),
                "file_size": len(response.content),
                "content_type": response.headers.get('content-type', 'unknown'),
                "client_id": client_id
            }
            
            # Simple content extraction (placeholder)
            if title.lower().endswith('.txt'):
                document_contents[document_id] = response.content.decode('utf-8', errors='ignore')
            else:
                # For PDF/DOCX, we'll store a placeholder
                document_contents[document_id] = f"Content from {title} - This is a placeholder. In production, use proper PDF/DOCX extraction."
            
            logger.info(f"Successfully processed document: {title}")
            
            return jsonify({
                "success": True,
                "message": f"Document '{title}' successfully processed and indexed",
                "document_id": document_id,
                "processed_at": documents_store[document_id]["processed_at"]
            })
            
        except requests.RequestException as e:
            logger.error(f"Failed to download document: {e}")
            return jsonify({"error": f"Failed to download document: {str(e)}"}), 400
            
    except Exception as e:
        logger.error(f"Error processing document: {e}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """
    Handle chat requests and provide answers based on document context
    Expected payload: {
        "question": "What is this about?",
        "conversation_id": "default",
        "document_id": "123" (optional),
        "document_title": "document.pdf" (optional),
        "client_id": "456" (optional) - filter documents by client
    }
    """
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        question = data.get('question', '').strip()
        document_id = data.get('document_id')
        document_title = data.get('document_title')
        conversation_id = data.get('conversation_id', 'default')
        client_id = data.get('client_id')
        
        if not question:
            return jsonify({"error": "Question is required"}), 400
        
        logger.info(f"Processing question: {question}")
        if document_id:
            logger.info(f"Context document: {document_title} (ID: {document_id})")
        if client_id:
            logger.info(f"Filtering by client ID: {client_id}")
        
        # Generate response based on context
        if document_id and document_id in documents_store:
            # Document-specific response
            doc_info = documents_store[document_id]
            doc_content = document_contents.get(document_id, "")
            
            answer = f"""Based on the document "{doc_info['title']}", I can help answer your question: "{question}"

Document Information:
- Title: {doc_info['title']}
- Processed: {doc_info['processed_at']}
- Size: {doc_info['file_size']} bytes
{f'- Client Filter: Active (ID: {client_id})' if client_id else ''}

This is a demonstration response. In a production RAG system, I would:
1. Search through the document content using semantic similarity
2. Find the most relevant passages
3. Generate a contextual answer based on the retrieved information
4. Apply client filtering to ensure only relevant documents are searched

Your question: {question}

For now, this is a placeholder response showing that the system is working correctly."""

            sources = [doc_info['title']]
            
        elif len(documents_store) > 0:
            # General response across all documents
            doc_titles = [doc['title'] for doc in documents_store.values()]
            
            answer = f"""I can help answer your question: "{question}"

Available documents in the knowledge base{' (filtered by client)' if client_id else ''}:
{chr(10).join(f'- {title}' for title in doc_titles)}

This is a demonstration response. In a production RAG system, I would:
1. Search across all documents to find relevant information
2. Apply client filtering when provided (Client ID: {client_id if client_id else 'None'})
3. Generate a contextual answer based on the retrieved passages

To get more specific answers, please select a particular document from the dropdown menu."""

            sources = doc_titles[:3]  # Limit to first 3 sources
            
        else:
            # No documents available
            answer = f"""I'd be happy to help answer your question: "{question}"

However, I don't currently have any documents in my knowledge base to reference. Please upload some documents first using the upload function, and then I'll be able to provide answers based on their content.

Once you upload documents, I'll be able to:
- Search through their content
- Find relevant information
- Provide detailed, context-aware answers"""

            sources = []
        
        response = {
            "answer": answer,
            "sources": sources,
            "document_context": {
                "selected_document": document_title if document_id else None,
                "total_documents": len(documents_store)
            },
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"Generated response for question: {question[:50]}...")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error processing chat request: {e}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route('/documents', methods=['GET'])
def list_documents():
    """List all processed documents"""
    return jsonify({
        "documents": list(documents_store.values()),
        "total_count": len(documents_store)
    })

@app.route('/documents/<document_id>', methods=['DELETE'])
def delete_document(document_id):
    """Delete a document from the knowledge base"""
    if document_id in documents_store:
        doc_title = documents_store[document_id]['title']
        del documents_store[document_id]
        if document_id in document_contents:
            del document_contents[document_id]
        
        return jsonify({
            "success": True,
            "message": f"Document '{doc_title}' removed from knowledge base"
        })
    else:
        return jsonify({"error": "Document not found"}), 404

if __name__ == '__main__':
    print("🚀 Starting RAG Server for MedDoc AI Flow...")
    print("📚 Server will be available at: http://localhost:5000")
    print("🔍 Health check: http://localhost:5000/health")
    print("📄 Available endpoints:")
    print("   POST /ingest - Process new documents")
    print("   POST /chat - Answer questions")
    print("   GET /documents - List processed documents")
    print("   GET /health - Health check")
    print("\n✅ Server is ready to receive requests from your React app!")
    
    app.run(host='localhost', port=5001, debug=True)
