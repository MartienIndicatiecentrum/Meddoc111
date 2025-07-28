import os
import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL") or "https://ltasjbgamoljvqoclgkf.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0YXNqYmdhbW9sanZxb2NsZ2tmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQwODU1MywiZXhwIjoyMDY3OTg0NTUzfQ.PdVN2_rq9m_EbR8jNJKbzImPz5rVip0i18iBrGEXgps"
TABLE = "documents"

headers = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"
}

def get_file_paths():
    url = f"{SUPABASE_URL}/rest/v1/{TABLE}?select=id,file_path"
    res = requests.get(url, headers=headers)
    return res.json()

def check_file_exists(bucket, path):
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}"
    res = requests.head(url, headers=headers)
    return res.status_code == 200

def main():
    docs = get_file_paths()
    print(f"Aantal documenten: {len(docs)}")
    for doc in docs:
        file_path = doc.get("file_path")
        if not file_path or '/' not in file_path:
            print(f"[LEEG OF ONGELDIG] {file_path}")
            continue
        bucket, path = file_path.split('/', 1)
        # Elk deel apart encoderen
        encoded_path = '/'.join([requests.utils.quote(part, safe='') for part in path.split('/')])
        exists = check_file_exists(bucket, encoded_path)
        if exists:
            print(f"[OK] {file_path}")
        else:
            print(f"[NIET GEVONDEN] {file_path}")
    print("Klaar!")

if __name__ == "__main__":
    main() 