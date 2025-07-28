#!/usr/bin/env python3
"""
Vercel-optimized RAG Server for MedDoc AI Flow
Lightweight version without heavy ML dependencies for Vercel deployment.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
import tempfile
from datetime import datetime
import logging
import json
from typing import List, Dict, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# In-memory storage for documents (in production, use Supabase)
documents_store = {}
document_contents = {}

class LightweightDocumentProcessor:
    """Lightweight document processor without heavy dependencies"""
    
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        """Extract text from PDF file using PyPDF2"""
        try:
            import PyPDF2
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting PDF text: {e}")
            return f"Error reading PDF: {str(e)}"
    
    @staticmethod
    def extract_text_from_docx(file_path: str) -> str:
        """Extract text from DOCX file using python-docx"""
        try:
            from docx import Document as DocxDocument
            doc = DocxDocument(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting DOCX text: {e}")
            return f"Error reading DOCX: {str(e)}"
    
    @staticmethod
    def extract_text_from_txt(file_path: str) -> str:
        """Extract text from TXT file"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
                return file.read().strip()
        except Exception as e:
            logger.error(f"Error extracting TXT text: {e}")
            return f"Error reading TXT: {str(e)}"

class SimpleAnswerer:
    """Simple answer generator using OpenAI API directly"""
    
    @staticmethod
    def generate_answer(question: str, context: str, document_title: str = "") -> str:
        """Generate answer using OpenAI API"""
        try:
            import openai
            
            # Set up OpenAI client
            client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
            
            # Create a simple prompt
            prompt = f"""Based on the following document content, answer the user's question.

Document: {document_title}
Content: {context[:2000]}  # Limit context size

Question: {question}

Please provide a clear and helpful answer based on the document content. If the answer cannot be found in the content, say so."""

            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that answers questions based on document content."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.3
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Error generating answer: {e}")
            return f"I apologize, but I encountered an error while processing your question. Please try again later. Error: {str(e)}"

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "message": "Vercel RAG Server is running",
        "timestamp": datetime.now().isoformat(),
        "documents_count": len(documents_store),
        "version": "lightweight-1.0"
    })

@app.route('/ingest', methods=['POST'])
def ingest_document():
    """Ingest a document from a URL and process it"""
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
        response = requests.get(file_url, timeout=30)
        response.raise_for_status()
        
        # Save to temporary file for processing
        file_extension = title.split('.')[-1].lower() if '.' in title else 'unknown'
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file_extension}') as temp_file:
            temp_file.write(response.content)
            temp_file_path = temp_file.name
        
        # Extract text based on file type
        try:
            if file_extension == 'pdf':
                extracted_text = LightweightDocumentProcessor.extract_text_from_pdf(temp_file_path)
            elif file_extension in ['docx', 'doc']:
                extracted_text = LightweightDocumentProcessor.extract_text_from_docx(temp_file_path)
            elif file_extension == 'txt':
                extracted_text = LightweightDocumentProcessor.extract_text_from_txt(temp_file_path)
            else:
                extracted_text = "Unsupported file format. Supported: PDF, DOCX, TXT"
            
            # Clean up temp file
            os.unlink(temp_file_path)
            
            # Store document
            if extracted_text and not extracted_text.startswith("Error"):
                documents_store[document_id] = {
                    "id": document_id,
                    "title": title,
                    "file_url": file_url,
                    "processed_at": datetime.now().isoformat(),
                    "file_size": len(response.content),
                    "content_type": response.headers.get('content-type', 'unknown'),
                    "text_length": len(extracted_text),
                    "client_id": client_id
                }
                
                document_contents[document_id] = extracted_text
                
                logger.info(f"Successfully processed document: {title} ({len(extracted_text)} chars)")
                
                return jsonify({
                    "success": True,
                    "message": f"Document '{title}' successfully processed",
                    "document_id": document_id,
                    "text_length": len(extracted_text),
                    "processed_at": documents_store[document_id]["processed_at"]
                })
            else:
                return jsonify({"error": f"Failed to extract text: {extracted_text}"}), 400
                
        except Exception as e:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
            raise e
            
    except Exception as e:
        logger.error(f"Error processing document: {e}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """Handle chat requests with document context"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        question = data.get('question', '').strip()
        document_id = data.get('document_id')
        client_id = data.get('client_id')
        
        if not question:
            return jsonify({"error": "Question is required"}), 400
        
        logger.info(f"Processing question: {question[:50]}...")
        
        # Get document context
        document_title = ""
        context = ""
        
        if document_id and document_id in documents_store:
            doc_info = documents_store[document_id]
            document_title = doc_info['title']
            context = document_contents.get(document_id, "")
            
            # Filter by client if specified
            if client_id and doc_info.get('client_id') != client_id:
                return jsonify({"error": "Document not accessible for this client"}), 403
            
            # Generate answer using OpenAI
            answer = SimpleAnswerer.generate_answer(question, context, document_title)
            
        elif len(documents_store) > 0:
            # Search across all documents
            all_context = ""
            doc_titles = []
            
            for doc_id, doc_info in documents_store.items():
                if not client_id or doc_info.get('client_id') == client_id:
                    doc_titles.append(doc_info['title'])
                    all_context += f"\n\nDocument: {doc_info['title']}\n"
                    all_context += document_contents.get(doc_id, "")[:1000]  # Limit per document
            
            if all_context:
                answer = SimpleAnswerer.generate_answer(question, all_context, "Multiple Documents")
            else:
                answer = "No documents available for this client."
                
        else:
            answer = "I don't have any documents in my knowledge base to reference. Please upload some documents first."
        
        response = {
            "answer": answer,
            "sources": [document_title] if document_title else [],
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

@app.route('/documents/<document_id>/content', methods=['GET'])
def get_document_content(document_id):
    """Get full document content"""
    if document_id in document_contents:
        return jsonify({
            "document_id": document_id,
            "content": document_contents[document_id],
            "title": documents_store.get(document_id, {}).get('title', 'Unknown')
        })
    else:
        return jsonify({"error": "Document not found"}), 404

if __name__ == '__main__':
    print("🚀 Starting Vercel-optimized RAG Server...")
    print("📚 Server will be available at: http://localhost:5000")
    print("🔍 Health check: http://localhost:5000/health")
    print("📄 Available endpoints:")
    print("   POST /ingest - Process new documents")
    print("   POST /chat - Answer questions with OpenAI")
    print("   GET /documents - List processed documents")
    print("   GET /health - Health check")
    print("\n✅ Lightweight server ready for Vercel deployment!")
    
    app.run(host='localhost', port=5001, debug=True) 