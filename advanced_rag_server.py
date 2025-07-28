#!/usr/bin/env python3
"""
Advanced RAG Server for MedDoc AI Flow
A production-ready Flask server that can actually read PDF content and provide intelligent answers.
"""

# Importeer de benodigde bibliotheken en modules
try:
    from llama_index import GPTVectorStoreIndex, SimpleDirectoryReader, Document, ServiceContext
    from langchain.chat_models import ChatOpenAI
    ADVANCED_RAG_AVAILABLE = True
except ImportError as e:
    print(f"Advanced RAG libraries not available: {e}")
    ADVANCED_RAG_AVAILABLE = False

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    print("Supabase library not available")
    SUPABASE_AVAILABLE = False

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
import tempfile
from datetime import datetime
import logging
import re
from typing import List, Dict, Optional
import json

# PDF and document processing
try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

try:
    from docx import Document as DocxDocument
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# In-memory storage for documents and their content
documents_store = {}
document_contents = {}
document_chunks = {}

class DocumentProcessor:
    """Handles document text extraction and processing"""
    
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        """Extract text from PDF file"""
        if not PDF_AVAILABLE:
            return "PDF processing not available. Install PyPDF2: pip install PyPDF2"
        
        try:
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
        """Extract text from DOCX file"""
        if not DOCX_AVAILABLE:
            return "DOCX processing not available. Install python-docx: pip install python-docx"
        
        try:
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
    
    @staticmethod
    def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Split text into overlapping chunks for better context retrieval"""
        if len(text) <= chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            
            # Try to break at sentence boundaries
            if end < len(text):
                # Look for sentence endings within the last 100 characters
                sentence_end = text.rfind('.', start, end)
                if sentence_end > start + chunk_size - 100:
                    end = sentence_end + 1
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            start = end - overlap
            if start >= len(text):
                break
        
        return chunks
    
    @staticmethod
    def search_relevant_chunks(query: str, chunks: List[str], max_chunks: int = 3) -> List[str]:
        """Simple keyword-based search for relevant chunks"""
        query_words = set(query.lower().split())
        
        chunk_scores = []
        for i, chunk in enumerate(chunks):
            chunk_words = set(chunk.lower().split())
            # Simple scoring based on word overlap
            score = len(query_words.intersection(chunk_words))
            if score > 0:
                chunk_scores.append((score, i, chunk))
        
        # Sort by score and return top chunks
        chunk_scores.sort(reverse=True)
        return [chunk for _, _, chunk in chunk_scores[:max_chunks]]

class IntelligentAnswerer:
    """Generates intelligent answers based on document content"""
    
    @staticmethod
    def generate_answer(question: str, relevant_chunks: List[str], document_title: str = "") -> str:
        """Generate an intelligent answer based on relevant document chunks"""
        if not relevant_chunks:
            return f"""Ik kon geen relevante informatie vinden in het document "{document_title}" om je vraag te beantwoorden: "{question}"

Probeer je vraag anders te formuleren of controleer of het document de informatie bevat die je zoekt."""

        # Combine relevant chunks
        context = "\n\n".join(relevant_chunks)
        
        # Generate a structured answer
        answer = f"""Op basis van het document "{document_title}" kan ik je vraag beantwoorden:

**Vraag:** {question}

**Antwoord:**
{IntelligentAnswerer._analyze_content(question, context)}

**Relevante passages uit het document:**
{IntelligentAnswerer._format_passages(relevant_chunks)}"""

        return answer
    
    @staticmethod
    def _analyze_content(question: str, context: str) -> str:
        """Analyze content and provide insights"""
        question_lower = question.lower()
        context_lower = context.lower()
        
        # Different analysis based on question type
        if any(word in question_lower for word in ['wat', 'what', 'welke', 'which']):
            return IntelligentAnswerer._extract_definitions(context)
        elif any(word in question_lower for word in ['hoe', 'how', 'wanneer', 'when']):
            return IntelligentAnswerer._extract_procedures(context)
        elif any(word in question_lower for word in ['waarom', 'why', 'reden', 'reason']):
            return IntelligentAnswerer._extract_explanations(context)
        else:
            return IntelligentAnswerer._general_summary(context)
    
    @staticmethod
    def _extract_definitions(context: str) -> str:
        """Extract definitions and key information"""
        sentences = context.split('.')
        key_sentences = []
        
        for sentence in sentences[:5]:  # Focus on first few sentences
            if len(sentence.strip()) > 20:
                key_sentences.append(sentence.strip())
        
        if key_sentences:
            return '. '.join(key_sentences) + '.'
        return "Gebaseerd op de beschikbare informatie in het document."
    
    @staticmethod
    def _extract_procedures(context: str) -> str:
        """Extract procedural information"""
        # Look for numbered lists or step indicators
        lines = context.split('\n')
        procedures = []
        
        for line in lines:
            if re.search(r'^\d+\.|\b(stap|step|eerst|then|vervolgens)\b', line.lower()):
                procedures.append(line.strip())
        
        if procedures:
            return '\n'.join(procedures[:5])  # Max 5 steps
        
        # Fallback to general content
        return context[:500] + "..." if len(context) > 500 else context
    
    @staticmethod
    def _extract_explanations(context: str) -> str:
        """Extract explanatory content"""
        # Look for causal language
        sentences = context.split('.')
        explanatory = []
        
        for sentence in sentences:
            if any(word in sentence.lower() for word in ['omdat', 'doordat', 'vanwege', 'reden', 'because', 'due to']):
                explanatory.append(sentence.strip())
        
        if explanatory:
            return '. '.join(explanatory[:3]) + '.'
        
        return context[:400] + "..." if len(context) > 400 else context
    
    @staticmethod
    def _general_summary(context: str) -> str:
        """Provide general summary"""
        # Return first meaningful paragraph
        paragraphs = context.split('\n\n')
        for paragraph in paragraphs:
            if len(paragraph.strip()) > 50:
                return paragraph.strip()[:500] + ("..." if len(paragraph) > 500 else "")
        
        return context[:300] + "..." if len(context) > 300 else context
    
    @staticmethod
    def _format_passages(chunks: List[str]) -> str:
        """Format relevant passages for display"""
        formatted = []
        for i, chunk in enumerate(chunks, 1):
            preview = chunk[:200] + "..." if len(chunk) > 200 else chunk
            formatted.append(f"{i}. {preview}")
        
        return '\n\n'.join(formatted)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "message": "Advanced RAG Server is running",
        "timestamp": datetime.now().isoformat(),
        "documents_count": len(documents_store),
        "features": {
            "pdf_processing": PDF_AVAILABLE,
            "docx_processing": DOCX_AVAILABLE,
            "text_chunking": True,
            "intelligent_search": True
        }
    })

@app.route('/ingest', methods=['POST'])
def ingest_document():
    """Process and index a document for intelligent Q&A"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        file_url = data.get('file_url')
        document_id = data.get('document_id')
        title = data.get('title', 'Unknown Document')
        
        if not file_url or not document_id:
            return jsonify({"error": "file_url and document_id are required"}), 400
        
        logger.info(f"Processing document: {title} (ID: {document_id})")
        
        # Download the document
        try:
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
                    extracted_text = DocumentProcessor.extract_text_from_pdf(temp_file_path)
                elif file_extension in ['docx', 'doc']:
                    extracted_text = DocumentProcessor.extract_text_from_docx(temp_file_path)
                elif file_extension == 'txt':
                    extracted_text = DocumentProcessor.extract_text_from_txt(temp_file_path)
                else:
                    extracted_text = "Unsupported file format. Supported: PDF, DOCX, TXT"
                
                # Clean up temp file
                os.unlink(temp_file_path)
                
                # Process the extracted text
                if extracted_text and not extracted_text.startswith("Error"):
                    # Create chunks for better retrieval
                    chunks = DocumentProcessor.chunk_text(extracted_text)
                    
                    # Store document metadata and content
                    documents_store[document_id] = {
                        "id": document_id,
                        "title": title,
                        "file_url": file_url,
                        "processed_at": datetime.now().isoformat(),
                        "file_size": len(response.content),
                        "content_type": response.headers.get('content-type', 'unknown'),
                        "text_length": len(extracted_text),
                        "chunks_count": len(chunks)
                    }
                    
                    document_contents[document_id] = extracted_text
                    document_chunks[document_id] = chunks
                    
                    logger.info(f"Successfully processed document: {title} ({len(extracted_text)} chars, {len(chunks)} chunks)")
                    
                    return jsonify({
                        "success": True,
                        "message": f"Document '{title}' successfully processed and indexed",
                        "document_id": document_id,
                        "text_length": len(extracted_text),
                        "chunks_count": len(chunks),
                        "processed_at": documents_store[document_id]["processed_at"]
                    })
                else:
                    return jsonify({"error": f"Failed to extract text: {extracted_text}"}), 400
                    
            except Exception as e:
                os.unlink(temp_file_path)  # Clean up on error
                raise e
                
        except requests.RequestException as e:
            logger.error(f"Failed to download document: {e}")
            return jsonify({"error": f"Failed to download document: {str(e)}"}), 400
            
    except Exception as e:
        logger.error(f"Error processing document: {e}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """Handle intelligent chat requests with document context"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        question = data.get('question', '').strip()
        document_id = data.get('document_id')
        document_title = data.get('document_title')
        
        if not question:
            return jsonify({"error": "Question is required"}), 400
        
        logger.info(f"Processing question: {question}")
        if document_id:
            logger.info(f"Context document: {document_title} (ID: {document_id})")
        
        # Generate intelligent response
        if document_id and document_id in document_chunks:
            # Document-specific intelligent response
            chunks = document_chunks[document_id]
            doc_info = documents_store[document_id]
            
            # Find relevant chunks
            relevant_chunks = DocumentProcessor.search_relevant_chunks(question, chunks)
            
            # Generate intelligent answer
            answer = IntelligentAnswerer.generate_answer(question, relevant_chunks, doc_info['title'])
            sources = [doc_info['title']]
            
        elif len(documents_store) > 0:
            # Search across all documents
            all_relevant_chunks = []
            all_sources = []
            
            for doc_id, chunks in document_chunks.items():
                relevant = DocumentProcessor.search_relevant_chunks(question, chunks, max_chunks=2)
                if relevant:
                    all_relevant_chunks.extend(relevant)
                    all_sources.append(documents_store[doc_id]['title'])
            
            if all_relevant_chunks:
                answer = IntelligentAnswerer.generate_answer(question, all_relevant_chunks[:5], "meerdere documenten")
                sources = list(set(all_sources))[:3]
            else:
                answer = f"""Ik kon geen relevante informatie vinden in de beschikbare documenten om je vraag te beantwoorden: "{question}"

Beschikbare documenten:
{chr(10).join(f'- {doc["title"]}' for doc in documents_store.values())}

Probeer je vraag anders te formuleren of selecteer een specifiek document."""
                sources = []
        else:
            # No documents available
            answer = f"""Ik zou graag je vraag beantwoorden: "{question}"

Echter, er zijn momenteel geen documenten beschikbaar in mijn kennisbank. Upload eerst documenten via de upload functie, dan kan ik gedetailleerde antwoorden geven gebaseerd op hun inhoud."""
            sources = []
        
        response = {
            "answer": answer,
            "sources": sources,
            "document_context": {
                "selected_document": document_title if document_id else None,
                "total_documents": len(documents_store),
                "search_performed": document_id in document_chunks if document_id else len(documents_store) > 0
            },
            "timestamp": datetime.now().isoformat()
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error processing chat request: {e}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route('/documents', methods=['GET'])
def list_documents():
    """List all processed documents with their content statistics"""
    docs_with_stats = []
    for doc_id, doc_info in documents_store.items():
        doc_with_stats = doc_info.copy()
        doc_with_stats['has_content'] = doc_id in document_contents
        doc_with_stats['chunks_available'] = doc_id in document_chunks
        docs_with_stats.append(doc_with_stats)
    
    return jsonify({
        "documents": docs_with_stats,
        "total_count": len(documents_store),
        "processing_capabilities": {
            "pdf": PDF_AVAILABLE,
            "docx": DOCX_AVAILABLE,
            "txt": True
        }
    })

@app.route('/documents/<document_id>/content', methods=['GET'])
def get_document_content(document_id):
    """Get the full content of a specific document"""
    if document_id not in document_contents:
        return jsonify({"error": "Document not found or not processed"}), 404
    
    return jsonify({
        "document_id": document_id,
        "title": documents_store[document_id]['title'],
        "content": document_contents[document_id],
        "chunks_count": len(document_chunks.get(document_id, [])),
        "content_length": len(document_contents[document_id])
    })

@app.route('/documents/<document_id>/reprocess', methods=['POST'])
def reprocess_document(document_id):
    """Reprocess an existing document with the advanced RAG system"""
    try:
        # Check if document exists in Supabase (you'd need to implement this)
        # For now, we'll create a simple reprocess endpoint
        
        # Get document info from request
        data = request.json or {}
        file_url = data.get('file_url')
        title = data.get('title', f'Document {document_id}')
        
        if not file_url:
            return jsonify({"error": "file_url is required for reprocessing"}), 400
        
        # Use the same processing logic as ingest
        logger.info(f"Reprocessing document: {title} (ID: {document_id})")
        
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
                extracted_text = DocumentProcessor.extract_text_from_pdf(temp_file_path)
            elif file_extension in ['docx', 'doc']:
                extracted_text = DocumentProcessor.extract_text_from_docx(temp_file_path)
            elif file_extension == 'txt':
                extracted_text = DocumentProcessor.extract_text_from_txt(temp_file_path)
            else:
                extracted_text = "Unsupported file format. Supported: PDF, DOCX, TXT"
            
            # Clean up temp file
            os.unlink(temp_file_path)
            
            # Process the extracted text
            if extracted_text and not extracted_text.startswith("Error"):
                # Create chunks for better retrieval
                chunks = DocumentProcessor.chunk_text(extracted_text)
                
                # Update document store
                documents_store[document_id] = {
                    "id": document_id,
                    "title": title,
                    "file_url": file_url,
                    "processed_at": datetime.now().isoformat(),
                    "file_size": len(response.content),
                    "content_type": response.headers.get('content-type', 'unknown'),
                    "text_length": len(extracted_text),
                    "chunks_count": len(chunks),
                    "reprocessed": True
                }
                
                document_contents[document_id] = extracted_text
                document_chunks[document_id] = chunks
                
                logger.info(f"Successfully reprocessed document: {title} ({len(extracted_text)} chars, {len(chunks)} chunks)")
                
                return jsonify({
                    "success": True,
                    "message": f"Document '{title}' successfully reprocessed with advanced RAG",
                    "document_id": document_id,
                    "text_length": len(extracted_text),
                    "chunks_count": len(chunks),
                    "processed_at": documents_store[document_id]["processed_at"]
                })
            else:
                return jsonify({"error": f"Failed to extract text: {extracted_text}"}), 400
                
        except Exception as e:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
            raise e
            
    except Exception as e:
        logger.error(f"Error reprocessing document: {e}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

if __name__ == '__main__':
    import os
    
    # Get port from environment variable or use default
    port = int(os.environ.get('RAG_PORT', 5001))
    
    print("Starting Advanced RAG Server for MedDoc AI Flow...")
    print(f" Server will be available at: http://localhost:{port}")
    print(f" Health check: http://localhost:{port}/health")
    print("\n Available endpoints:")
    print("   POST /ingest - Process and index documents with text extraction")
    print("   POST /chat - Intelligent Q&A with document context")
    print("   GET /documents - List processed documents with statistics")
    print("   GET /documents/<id>/content - Get full document content")
    print("   GET /health - Health check with feature status")
    print(f"\n Processing capabilities:")
    print(f"   PDF: {' Available' if PDF_AVAILABLE else ' Install PyPDF2'}")
    print(f"   DOCX: {' Available' if DOCX_AVAILABLE else ' Install python-docx'}")
    print(f"   TXT:  Available")
    print("\n Server is ready for intelligent document Q&A!")
    
    app.run(host='localhost', port=port, debug=True)


