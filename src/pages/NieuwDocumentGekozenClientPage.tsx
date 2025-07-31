// Duplicaat van NewDocumentPage voor /nieuw-document-gekozen-client
import React, { useState } from 'react';
import KiesClientDropdown from '../components/KiesClientDropdown';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useNavigate, useLocation } from 'react-router-dom';

const documentTypes = [
  'Vragen verzekeraar',
  'Antwoordbrief verzekeraar',
  'Brief huisarts',
  'Brief Fysio',
  'Brief Ergo',
  'Brief Ziekenhuis',
  'Indicatie',
  'Antwoorden familie',
  'Anders',
];

import { supabase } from '../integrations/supabase/client';

const NieuwDocumentGekozenClientPage: React.FC = () => {
  // Nieuw: overzicht van geüploade documenten
  const [uploadedDocs, setUploadedDocs] = useState<
    Array<{ name: string; url: string; bucket: string }>
  >([]);
  const [step, setStep] = useState(1);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  // Voeg state toe voor indicatieType
  const [indicatieType, setIndicatieType] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // Voeg state toe voor bucket
  const [lastUsedBucket, setLastUsedBucket] = useState('documents');
  const [clientName, setClientName] = useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const clientIdFromUrl = params.get('clientId');
    if (clientIdFromUrl) {
      setSelectedClient(clientIdFromUrl);
    }
  }, [location.search]);

  React.useEffect(() => {
    // Haal de naam van de client op als selectedClient is gezet
    const fetchClientName = async () => {
      if (selectedClient) {
        const { data, error } = await supabase
          .from('clients')
          .select('naam')
          .eq('id', selectedClient)
          .single();
        if (!error && data) {
          setClientName(data.naam);
        } else {
          setClientName(null);
        }
      } else {
        setClientName(null);
      }
    };
    fetchClientName();
  }, [selectedClient]);

  // Specifieke velden per documentdoel
  const doelFields: Record<
    string,
    Array<{ name: string; label: string; type: string }>
  > = {
    'Vragen verzekeraar': [
      { name: 'verzekeraar', label: 'Naam verzekeraar', type: 'text' },
      { name: 'vraag', label: 'Vraag', type: 'textarea' },
    ],
    'Antwoordbrief verzekeraar': [
      { name: 'verzekeraar', label: 'Naam verzekeraar', type: 'text' },
      { name: 'antwoord', label: 'Antwoord', type: 'textarea' },
    ],
    'Brief huisarts': [
      { name: 'huisarts', label: 'Naam huisarts', type: 'text' },
      { name: 'inhoud', label: 'Inhoud brief', type: 'textarea' },
    ],
    'Brief Fysio': [
      { name: 'fysio', label: 'Naam fysiotherapeut', type: 'text' },
      { name: 'inhoud', label: 'Inhoud brief', type: 'textarea' },
    ],
    'Brief Ergo': [
      { name: 'ergo', label: 'Naam ergotherapeut', type: 'text' },
      { name: 'inhoud', label: 'Inhoud brief', type: 'textarea' },
    ],
    'Brief Ziekenhuis': [
      { name: 'ziekenhuis', label: 'Naam ziekenhuis', type: 'text' },
      { name: 'inhoud', label: 'Inhoud brief', type: 'textarea' },
    ],
    'Antwoorden familie': [
      { name: 'familielid', label: 'Naam familielid', type: 'text' },
      { name: 'antwoord', label: 'Antwoord', type: 'textarea' },
    ],
    Anders: [{ name: 'omschrijving', label: 'Omschrijving', type: 'textarea' }],
  };

  // Stap 3: upload en invulvelden
  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setShowPreview(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    let documentUrl = null;
    // In handleSubmit, bepaal bucket op basis van selectedType
    let bucket = 'documents';
    if (selectedType === 'Indicatie') {
      bucket = 'indicatie';
    } else if (selectedType === 'Vragen verzekeraar') {
      bucket = 'vragenverzekeraar';
    } else if (selectedType === 'Antwoordbrief verzekeraar') {
      bucket = 'antwoordbrieven';
    } else if (selectedType === 'Brief huisarts') {
      bucket = 'briefhuisarts';
    } else if (selectedType === 'Brief Fysio') {
      bucket = 'brieffysio';
    } else if (selectedType === 'Brief Ergo') {
      bucket = 'briefergo';
    } else if (selectedType === 'Brief Ziekenhuis') {
      bucket = 'briefziekenhuis';
    } else if (selectedType === 'Antwoorden familie') {
      bucket = 'informatiefamilie';
    }
    setLastUsedBucket(bucket);
    // Upload bestand naar Supabase Storage
    if (file) {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(`public/${Date.now()}_${file.name}`, file);
      if (error) {
        alert('Upload mislukt: ' + error.message);
        setIsSubmitting(false);
        return;
      }
      documentUrl = data?.path ? data.path : null;
    }
    // Sla documentgegevens op in Supabase DB
    // Fix: verander 'datumNotitie' naar 'bijzonderheden' voor Supabase
    const formDataForDb = { ...formData };
    if (formDataForDb.datumNotitie) {
      formDataForDb.Bijzonderheden = formDataForDb.datumNotitie;
      delete formDataForDb.datumNotitie;
    }
    // Zet status1/status2 om naar kolomnamen uit Supabase
    if (formDataForDb.status1) {
      formDataForDb.status = formDataForDb.status1;
      delete formDataForDb.status1;
    }
    if (formDataForDb.status2) {
      formDataForDb.urgency = formDataForDb.status2;
      delete formDataForDb.status2;
    }
    // Mapping van formData naar Supabase kolommen
    const dbInsert: Record<string, string | null> = {
      title: file ? file.name : null,
      verzekeraar: formDataForDb.verzekeraar || null,
      Bijzonderheden: formDataForDb.Bijzonderheden || null,
      opmerking: formDataForDb.opmerking || null,
      other_type_description: formDataForDb.omschrijving || null,
      file_path: documentUrl,
      bucket: bucket, // <-- toegevoegd
      // Extra: file_size en mime_type
      file_size: file ? String(file.size) : null,
      mime_type: file ? file.type : null,
      // Vul hier andere velden aan indien gewenst
    };
    // Voeg client info toe indien gewenst
    if (selectedClient) {
      dbInsert.client_id = selectedClient;
    }
    // Voeg type info toe indien gewenst
    if (selectedType) {
      dbInsert.category = selectedType;
    }
    // Geef indicatie_type toe aan dbInsert indien van toepassing
    if (selectedType === 'Indicatie' && indicatieType) {
      dbInsert.indicatie_type = indicatieType;
    }
    const { error: dbError } = await supabase
      .from('documents')
      .insert(dbInsert);
    if (dbError) {
      alert('Opslaan mislukt: ' + dbError.message);
    } else {
      alert('Document succesvol opgeslagen!');
      // Voeg toe aan overzicht van geüploade documenten
      if (file && documentUrl) {
        setUploadedDocs(prev => [
          ...prev,
          { name: file.name, url: documentUrl, bucket },
        ]);
      }
      setUploadSuccess(true);
      // Reset wizard (optioneel, of blijf op stap 3)
      // setStep(1);
      setSelectedType(null);
      setFormData({});
      setFile(null);
    }
    setIsSubmitting(false);
  };

  return (
    <div className='max-w-5xl mx-auto mt-10'>
      {uploadSuccess ? (
        <div className='text-center mt-10'>
          <h2 className='text-2xl font-bold mb-4'>
            Document succesvol geüpload!
          </h2>
          <div className='flex justify-center gap-4'>
            <Button onClick={() => navigate('/')}>
              Terug naar hoofdscherm
            </Button>
            <Button
              onClick={() => {
                setStep(1);
                // selectedClient blijft behouden
                setSelectedType(null);
                setFormData({});
                setFile(null);
                setUploadSuccess(false);
              }}
            >
              Nieuw document uploaden
            </Button>
          </div>
        </div>
      ) : (
        <div className='flex gap-8'>
          <div className='flex-1'>
            <Card>
              <h2 className='text-2xl font-bold mb-6'>Nieuw Document</h2>
              {step === 1 && (
                <div>
                  <h3 className='mb-2 font-semibold'>
                    Stap 1: Kies een cliënt
                  </h3>
                  <div className='flex gap-4 items-center mt-2'>
                    <div
                      style={{ minWidth: 220, maxWidth: 320, width: '100%' }}
                    >
                      <KiesClientDropdown
                        value={selectedClient ?? ''}
                        onSelect={clientId => setSelectedClient(clientId)}
                      />
                      {selectedClient && (
                        <div className='mt-2 p-2 border rounded bg-gray-50'>
                          <span className='inline-block px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 border border-purple-500 font-medium text-xs'>
                            Cliënt geselecteerd:{' '}
                            {clientName ? clientName : selectedClient}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      style={{ height: '56px' }}
                      disabled={!selectedClient}
                      onClick={() => setStep(2)}
                    >
                      Volgende
                    </Button>
                    <Button
                      style={{ height: '56px' }}
                      variant='outline'
                      onClick={() => navigate('/')}
                    >
                      Terug
                    </Button>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div>
                  <h3 className='mb-2 font-semibold'>
                    Stap 2: Kies het doel van het document
                  </h3>
                  <div className='grid gap-2 mb-4'>
                    {documentTypes.map(type => (
                      <Button
                        key={type}
                        variant={selectedType === type ? 'default' : 'outline'}
                        onClick={() => setSelectedType(type)}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                  {/* Toon vervolgkeuze als Indicatie is geselecteerd */}
                  {selectedType === 'Indicatie' && (
                    <div className='mb-4'>
                      <label className='block text-sm font-medium text-gray-700'>
                        Type indicatie
                      </label>
                      <select
                        className='mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                        value={indicatieType}
                        onChange={e => setIndicatieType(e.target.value)}
                        required
                      >
                        <option value=''>-- Kies type indicatie --</option>
                        <option value='Bestaande indicatie'>
                          Bestaande indicatie
                        </option>
                        <option value='Nieuwe indicatie'>
                          Nieuwe indicatie
                        </option>
                      </select>
                    </div>
                  )}
                  <Button className='mr-2' onClick={() => setStep(1)}>
                    Terug
                  </Button>
                  <Button
                    disabled={
                      !selectedType ||
                      (selectedType === 'Indicatie' && !indicatieType)
                    }
                    onClick={() => setStep(3)}
                  >
                    Volgende
                  </Button>
                </div>
              )}
              {step === 3 && selectedType && (
                <div>
                  <h3 className='mb-2 font-semibold'>
                    Stap 3: Vul documentgegevens in en upload bestand
                  </h3>
                  <form
                    className='space-y-4'
                    onSubmit={e => {
                      e.preventDefault();
                      handleSubmit();
                    }}
                  >
                    {doelFields[selectedType]?.map(field => (
                      <div key={field.name}>
                        <label
                          className='block mb-1 font-medium'
                          htmlFor={field.name}
                        >
                          {field.label}
                        </label>
                        {field.type === 'text' ? (
                          <input
                            type='text'
                            name={field.name}
                            id={field.name}
                            className='w-full border rounded px-3 py-2'
                            value={formData[field.name] || ''}
                            onChange={handleFieldChange}
                          />
                        ) : (
                          <textarea
                            name={field.name}
                            id={field.name}
                            className='w-full border rounded px-3 py-2'
                            value={formData[field.name] || ''}
                            onChange={handleFieldChange}
                          />
                        )}
                      </div>
                    ))}
                    <div>
                      <label
                        className='block mb-1 font-medium'
                        htmlFor='status1'
                      >
                        Status 1
                      </label>
                      <select
                        name='status1'
                        id='status1'
                        className='w-full border rounded px-3 py-2 mb-2'
                        value={formData.status1 || ''}
                        onChange={handleSelectChange}
                      >
                        <option value=''>-- Kies status --</option>
                        <option value='Openstaand'>Openstaand</option>
                        <option value='Urgent'>Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label
                        className='block mb-1 font-medium'
                        htmlFor='status2'
                      >
                        Status 2
                      </label>
                      <select
                        name='status2'
                        id='status2'
                        className='w-full border rounded px-3 py-2'
                        value={formData.status2 || ''}
                        onChange={handleSelectChange}
                      >
                        <option value=''>-- Kies status --</option>
                        <option value='Niet-Urgent' style={{ color: 'green' }}>
                          Niet-Urgent
                        </option>
                        <option value='Urgent' style={{ color: 'orange' }}>
                          Urgent
                        </option>
                        <option value='Zeer-Urgent' style={{ color: 'red' }}>
                          Zeer-Urgent
                        </option>
                      </select>
                    </div>
                    <div>
                      <label
                        className='block mb-1 font-medium'
                        htmlFor='datumNotitie'
                      >
                        Bijzonderheden
                      </label>
                      <input
                        type='date'
                        name='datumNotitie'
                        id='datumNotitie'
                        className='w-full border rounded px-3 py-2'
                        value={formData.datumNotitie || ''}
                        onChange={handleFieldChange}
                      />
                    </div>
                    <div>
                      <label className='block mb-1 font-medium'>
                        Upload document (PDF)
                      </label>
                      <div className='flex gap-2 items-center'>
                        <input
                          type='file'
                          accept='.pdf'
                          onChange={handleFileChange}
                          required
                        />
                        {file && (
                          <Button
                            type='button'
                            variant='outline'
                            onClick={() => setShowPreview(true)}
                          >
                            Preview
                          </Button>
                        )}
                      </div>
                    </div>
                    {/* Voeg hidden input toe voor indicatie_type als het van toepassing is */}
                    {selectedType === 'Indicatie' && (
                      <input
                        type='hidden'
                        name='indicatie_type'
                        value={indicatieType}
                      />
                    )}
                    <div className='flex gap-2 mt-4'>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => setStep(2)}
                      >
                        Terug
                      </Button>
                      <Button type='submit' disabled={isSubmitting}>
                        {isSubmitting ? 'Opslaan...' : 'Opslaan'}
                      </Button>
                    </div>
                  </form>
                  {/* Overzicht van gedane acties */}
                  {uploadedDocs.length > 0 && (
                    <div className='mt-8'>
                      <h4 className='font-semibold mb-2'>
                        Overzicht van geüploade documenten:
                      </h4>
                      <ul className='space-y-2'>
                        {uploadedDocs.map(doc => (
                          <li key={doc.url}>
                            <a
                              href={`https://ltasjbgamoljvqoclgkf.supabase.co/storage/v1/object/public/${doc.bucket}/${doc.url}`}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='block border rounded px-4 py-2 mb-2 bg-white hover:bg-gray-50'
                            >
                              {doc.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
          {/* Preview rechts */}
          {showPreview && file && (
            <div className='flex-1 max-w-2xl'>
              <Card className='p-4'>
                <h3 className='text-lg font-semibold mb-2'>
                  Preview: {file.name}
                </h3>
                <div
                  className='border rounded bg-gray-50 p-2'
                  style={{ minHeight: 400 }}
                >
                  <iframe
                    title='PDF preview'
                    src={URL.createObjectURL(file)}
                    width='100%'
                    height='500px'
                    style={{ border: 'none' }}
                  />
                </div>
                <Button
                  className='mt-4'
                  variant='outline'
                  onClick={() => setShowPreview(false)}
                >
                  Sluit preview
                </Button>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NieuwDocumentGekozenClientPage;
