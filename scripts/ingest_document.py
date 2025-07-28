import requests

# 📂 Supabase-bestandslink (géén spaties, gebruik %20 voor spaties)
file_url = "https://ltasjbgamoljvqoclgkf.supabase.co/storage/v1/object/public/documents/public/1752599220358_aanvullende%20vragen%20Seropjan%20412612239%20PGB.pdf"

# 📄 Unieke document-ID (mag gewoon de bestandsnaam zijn)
document_id = "aanvullende vragen Seropjan 412612239 PGB.pdf"

# 🔧 JSON payload voor ingest
document_data = {
    "file_url": file_url,
    "document_id": document_id
}

print("📤 Verzenden naar RAG-server...")

# 🚀 POST-verzoek naar de RAG-ingest endpoint
try:
    res = requests.post("http://localhost:5000/ingest", json=document_data)
    print(f"✅ Statuscode: {res.status_code}")
    print(res.json())
except Exception as e:
    print("❌ Fout tijdens verzenden naar RAG-server:", str(e))
