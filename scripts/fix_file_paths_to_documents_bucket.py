import os
import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL") or "https://ltasjbgamoljvqoclgkf.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0YXNqYmdhbW9sanZxb2NsZ2tmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQwODU1MywiZXhwIjoyMDY3OTg0NTUzfQ.PdVN2_rq9m_EbR8jNJKbzImPz5rVip0i18iBrGEXgps"
TABLE = "documents"

headers = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def get_public_filepaths():
    url = f"{SUPABASE_URL}/rest/v1/{TABLE}?select=id,file_path&file_path=like.public/%"
    res = requests.get(url, headers=headers)
    return res.json()

def update_file_path(doc_id, new_path):
    url = f"{SUPABASE_URL}/rest/v1/{TABLE}?id=eq.{doc_id}"
    res = requests.patch(url, json={"file_path": new_path}, headers=headers)
    return res.status_code == 200

def main():
    docs = get_public_filepaths()
    print(f"Aantal te corrigeren documenten: {len(docs)}")
    for doc in docs:
        old_path = doc["file_path"]
        if not old_path.startswith("public/"): continue
        new_path = "documents/" + old_path[len("public/"):]
        ok = update_file_path(doc["id"], new_path)
        if ok:
            print(f"[UPDATE] {old_path} -> {new_path}")
        else:
            print(f"[FOUT] {old_path} kon niet worden aangepast!")
    print("Klaar!")

if __name__ == "__main__":
    main() 