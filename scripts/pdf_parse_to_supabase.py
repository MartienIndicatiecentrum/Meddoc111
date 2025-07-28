import os
import requests
import io
from pdfminer.high_level import extract_text
from typing import List

# Automatisch ingevulde Supabase gegevens
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://ltasjbgamoljvqoclgkf.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get(
    "SUPABASE_SERVICE_ROLE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0YXNqYmdhbW9sanZxb2NsZ2tmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQwODU1MywiZXhwIjoyMDY3OTg0NTUzfQ.PdVN2_rq9m_EbR8jNJKbzImPz5rVip0i18iBrGEXgps"
)
PDF_BUCKET = "documents"  # Pas aan naar jouw bucketnaam indien nodig
TABLE = "documents"

headers = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"
}

def extract_documents() -> List[dict]:
    """Haalt documenten zonder content op, parseert PDF's, en werkt records bij."""
    res = requests.get(
        f"{SUPABASE_URL}/rest/v1/{TABLE}?content=is.null",
        headers=headers
    )
    documents = res.json()
    updated = []
    for doc in documents:
        file_path = doc.get("file_path")  # Controleer of dit veld klopt!
        if not file_path:
            print(f"Geen file_path voor document {doc.get('id')}")
            continue

        # PDF ophalen uit storage
        if file_path.startswith("http"):
            pdf_url = file_path
        else:
            if file_path.startswith('public/'):
                pdf_url = f"{SUPABASE_URL}/storage/v1/object/public/{file_path[len('public/') :]}"
            else:
                pdf_url = f"{SUPABASE_URL}/storage/v1/object/public/{file_path}"
        print(f"Probeer te downloaden: {pdf_url}")
        pdf_res = requests.get(pdf_url)
        if pdf_res.status_code != 200:
            print(f"Kan PDF niet downloaden: {pdf_url}")
            continue

        # Tekst extraheren
        pdf_bytes = io.BytesIO(pdf_res.content)
        try:
            text = extract_text(pdf_bytes)
        except Exception as e:
            print(f"Fout bij extractie: {e}")
            continue

        # Bijwerken van Supabase record
        update_res = requests.patch(
            f"{SUPABASE_URL}/rest/v1/{TABLE}?id=eq.{doc['id']}",
            json={"content": text},
            headers={**headers, "Content-Type": "application/json", "Prefer": "return=representation"}
        )
        if update_res.status_code == 200:
            updated.append(update_res.json()[0])
            print(f"Document {doc['id']} bijgewerkt.")
        else:
            print(f"Fout bij updaten: {update_res.text}")

    return updated

if __name__ == "__main__":
    result = extract_documents()
    print(f"Geüpdatet: {len(result)} documenten") 