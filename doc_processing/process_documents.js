const axios = require('axios');
const pdfParse = require('pdf-parse');

// Vul hier je Supabase gegevens in:
const SUPABASE_URL = 'https://ltasjbgamoljvqoclgkf.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0YXNqYmdhbW9sanZxb2NsZ2tmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQwODU1MywiZXhwIjoyMDY3OTg0NTUzfQ.PdVN2_rq9m_EbR8jNJKbzImPz5rVip0i18iBrGEXgps';

const headers = {
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
};

async function getDocuments() {
  const url = `${SUPABASE_URL}/rest/v1/documents?select=id,file_path,content&or=(content.is.null,content.eq.)`;
  const response = await axios.get(url, { headers });
  return response.data;
}

async function updateDocument(id, text) {
  const url = `${SUPABASE_URL}/rest/v1/documents?id=eq.${id}`;
  await axios.patch(
    url,
    { content: text },
    {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
    }
  );
}

(async () => {
  const docs = await getDocuments();
  console.log(`Aantal documenten zonder tekst gevonden: ${docs.length}`);
  for (const doc of docs) {
    const filePath = doc.file_path;
    if (!filePath) continue;

    // Split bucket en pad
    const [bucket, ...pathParts] = filePath.replace(/^\/+/, '').split('/');
    if (!bucket || pathParts.length === 0) {
      console.log(`❌ Ongeldig file_path: ${filePath}`);
      continue;
    }
    const path = pathParts.join('/');
    // Encodeer elk deel apart
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${encodedPath}`;
    console.log(`Downloaden: ${filePath}`);
    console.log(`Download-URL: ${url}`);

    try {
      const response = await axios.get(url, {
        headers,
        responseType: 'arraybuffer',
      });
      const dataBuffer = response.data;
      const pdfData = await pdfParse(dataBuffer);
      const text = pdfData.text;
      await updateDocument(doc.id, text);
      console.log(`✅ Document ${doc.id} verwerkt en tekst opgeslagen.`);
    } catch (err) {
      if (err.response) {
        console.log(
          `❌ Fout bij document ${doc.id}: ${err.response.status} - ${err.response.statusText}`
        );
      } else {
        console.log(`❌ Fout bij document ${doc.id}: ${err.message}`);
      }
    }
  }
})();
