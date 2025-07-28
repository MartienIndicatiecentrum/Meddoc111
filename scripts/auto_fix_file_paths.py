import os
import requests
from dotenv import load_dotenv
import re

load_dotenv()

# Zet altijd een geldige default URL en key
SUPABASE_URL = os.environ.get("SUPABASE_URL") or "https://ltasjbgamoljvqoclgkf.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0YXNqYmdhbW9sanZxb2NsZ2tmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQwODU1MywiZXhwIjoyMDY3OTg0NTUzfQ.PdVN2_rq9m_EbR8jNJKbzImPz5rVip0i18iBrGEXgps"
TABLE = "documents"
BUCKET = "public"

headers = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"
}

def list_bucket_files():
    # Haal alle bestanden op uit de bucket 'public'
    url = f"{SUPABASE_URL}/storage/v1/object/list/{BUCKET}?limit=10000"
    res = requests.get(url, headers=headers)
    files = []
    if res.status_code == 200:
        for entry in res.json():
            if entry.get("name"):
                files.append(entry["name"])
    else:
        print("Kon bestandenlijst niet ophalen uit bucket.")
    return files

def get_documents():
    # Haal alle documenten op met een niet-gevonden file_path
    res = requests.get(
        f"{SUPABASE_URL}/rest/v1/{TABLE}?select=id,file_path,title",
        headers=headers
    )
    return res.json()

def update_file_path(doc_id, new_path):
    # Update het file_path in de database
    url = f"{SUPABASE_URL}/rest/v1/{TABLE}?id=eq.{doc_id}"
    res = requests.patch(
        url,
        json={"file_path": f"public/{new_path}"},
        headers={**headers, "Content-Type": "application/json", "Prefer": "return=representation"}
    )
    return res.status_code == 200

def main():
    print("Bestanden in bucket ophalen...")
    files = list_bucket_files()
    if not files:
        print("Geen bestanden gevonden in bucket.")
        return

    print(f"Totaal {len(files)} bestanden gevonden in bucket.")
    docs = get_documents()
    fixed = 0
    for doc in docs:
        file_path = doc.get("file_path")
        doc_id = doc.get("id")
        title = doc.get("title")
        if not file_path or file_path.startswith("http"):
            continue
        # Pak alleen de bestandsnaam
        filename = file_path.split("/")[-1]
        # Zoek alle matches in de bucket
        matches = [f for f in files if f == filename]
        if len(matches) == 1:
            new_path = matches[0]
            print(f"[UPDATE] {file_path} -> public/{new_path} ({title})")
            if update_file_path(doc_id, new_path):
                fixed += 1
        elif len(matches) > 1:
            print(f"[MEERDERE MATCHES] {filename} ({title})")
        else:
            print(f"[GEEN MATCH] {filename} ({title})")
    print(f"\nAutomatisch gecorrigeerd: {fixed} documenten.")

if __name__ == "__main__":
    main()
