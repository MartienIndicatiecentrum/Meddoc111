#!/usr/bin/env python3
"""
Script to generate embeddings for existing documents in Supabase
"""
import os
import sys
import requests
import json
from typing import List, Dict
import time

# Supabase configuration - GEEN hardcoded keys meer!
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

# Check of alle environment variables zijn ingesteld
if not SUPABASE_URL:
    print("Error: SUPABASE_URL environment variable is not set")
    print("Set it with: set SUPABASE_URL=your_supabase_url")
    sys.exit(1)

if not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set")
    print("Set it with: set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key")
    sys.exit(1)

if not OPENAI_API_KEY:
    print("Error: OPENAI_API_KEY environment variable is not set")
    print("Set it with: set OPENAI_API_KEY=your_openai_api_key")
    sys.exit(1)

headers = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json"
}

def generate_embedding(text: str) -> List[float]:
    """Generate embedding using OpenAI API"""
    try:
        response = requests.post(
            "https://api.openai.com/v1/embeddings",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "input": text[:8000],  # Limit text to 8000 chars
                "model": "text-embedding-ada-002"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            return data["data"][0]["embedding"]
        else:
            print(f"OpenAI API error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return None

def get_documents_without_embeddings() -> List[Dict]:
    """Get all documents that have content but no embeddings"""
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/documents",
        headers=headers,
        params={
            "select": "id,title,content",
            "content": "not.is.null",
            "vector_embedding": "is.null",
            "deleted_at": "is.null"
        }
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching documents: {response.status_code} - {response.text}")
        return []

def update_document_embedding(document_id: str, embedding: List[float]) -> bool:
    """Update document with embedding"""
    response = requests.patch(
        f"{SUPABASE_URL}/rest/v1/documents",
        headers=headers,
        params={"id": f"eq.{document_id}"},
        json={"vector_embedding": embedding}
    )
    
    return response.status_code == 200

def process_documents():
    """Process all documents without embeddings"""
    documents = get_documents_without_embeddings()
    print(f"Found {len(documents)} documents to process")
    
    for i, doc in enumerate(documents):
        print(f"\nProcessing {i+1}/{len(documents)}: {doc['title']}")
        
        if not doc.get('content'):
            print("  - No content, skipping")
            continue
        
        # Generate embedding
        embedding = generate_embedding(doc['content'])
        
        if embedding:
            # Update document
            if update_document_embedding(doc['id'], embedding):
                print("  Embedding generated and saved")
            else:
                print("  Failed to save embedding")
        else:
            print("  Failed to generate embedding")
        
        # Rate limiting - OpenAI allows 3 requests per minute for free tier
        time.sleep(0.5)

if __name__ == "__main__":
    print("Starting embedding generation for documents...")
    print(f"Using Supabase URL: {SUPABASE_URL}")
    process_documents()
    print("\nDone!")