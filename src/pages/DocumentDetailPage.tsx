import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from '@/components/layout/AppLayout';
import { mockAllDocuments } from '@/mock/clientData';

const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const doc = mockAllDocuments.find(d => d.id === Number(id));

  if (!doc) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-red-500">Document niet gevonden.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto bg-white rounded shadow p-8 mt-8">
        <button onClick={() => navigate(-1)} className="mb-4 text-primary-600 hover:underline">&larr; Terug</button>
        <div className="heading-lg mb-2">{doc.title}</div>
        <div className="text-xs text-gray-500 mb-2">{doc.type} | {doc.category}</div>
        <div className="text-xs text-gray-400 mb-4">Aangemaakt op: {doc.date}</div>
        <div className="text-sm text-gray-700 mb-8">
          <p>Uitgebreide documentinformatie en preview kunnen hier getoond worden.</p>
        </div>
        <button className="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700" onClick={() => navigate(-1)}>
          Sluiten
        </button>
      </div>
    </AppLayout>
  );
};

export default DocumentDetailPage;
