import requests

document_id = "aanvullende vragen Seropjan 412612239 PGB.pdf"
vraag = "Wat is het antwoord op de aanvullende vragen?"

query = {
    "question": vraag,
    "document_id": document_id
}

try:
    res = requests.post("http://localhost:5000/query", json=query)
    print(f"✅ Statuscode: {res.status_code}")
    print(res.json())
except Exception as e:
    print("❌ Fout bij het stellen van de vraag:", str(e))
