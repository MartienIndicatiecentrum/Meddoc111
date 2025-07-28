import os
import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://ltasjbgamoljvqoclgkf.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get(
    "SUPABASE_SERVICE_ROLE_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0YXNqYmdhbW9sanZxb2NsZ2tmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQwODU1MywiZXhwIjoyMDY3OTg0NTUzfQ.PdVN2_rq9m_EbR8jNJKbzImPz5rVip0i18iBrGEXgps"
)
TABLE = "documents"

headers = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"
}

def check_storage_paths():
    res = requests.get(
        f"{SUPABASE_URL}/rest/v1/{TABLE}?select=id,file_path,title",
        headers=headers
    )
    documents = res.json()
    found = []
    not_found = []
    for doc in documents:
        file_path = doc.get("file_path")
        if not file_path:
            print(f"[LEEG PAD] Document {doc.get('id')} - {doc.get('title')}")
            not_found.append(doc)
            continue
        if file_path.startswith("http"):
            url = file_path
        else:
            if file_path.startswith('public/'):
                url = f"{SUPABASE_URL}/storage/v1/object/public/{file_path[len('public/') :]}"
            else:
                url = f"{SUPABASE_URL}/storage/v1/object/public/{file_path}"
        try:
            r = requests.head(url)
            if r.status_code == 200:
                print(f"[OK] {url}")
                found.append(doc)
            else:
                print(f"[NIET GEVONDEN] {url} (status {r.status_code})")
                not_found.append(doc)
        except Exception as e:
            print(f"[FOUT] {url}: {e}")
            not_found.append(doc)
    print(f"\nSamenvatting:\nBestanden gevonden: {len(found)}\nNiet gevonden: {len(not_found)}")

if __name__ == "__main__":
    check_storage_paths() 