import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Calendar } from '../components/ui/calendar';
import { Button } from '../components/ui/button';
import { format } from 'date-fns';

interface TaskState {
  doelStatus: 'nieuwe_taak' | 'openstaand' | 'lopende_zaak' | 'afgehandeld';
  urgentieStatus: 'niet_urgent' | 'urgent' | 'zeer_urgent';
  opdrachtgever: string;
  subopdrachtgever: string;
  subopdrachtgeverOverig?: string;
  taakbeschrijving: string;
  indicatieOpties: string[];
  vraagstellingOpties: string[];
  vraagstellingDatum?: string;
}

const opdrachtgevers = [
  'Indicatie Nederland',
  'Indicatie Bureau Nederland',
  'Indicatie Centrum Nederland'
];
const subopdrachtgevers = [
  'Desa zorg',
  'Zorgservice plus',
  'Particulier',
  'Overig'
];
const taakbeschrijvingen = [
  'Indicatie (nieuw/verlening/wijzigen)',
  'Beantwoorden vragen verzekeraar',
  'Factuur maken'
];
const indicatieOpties = [
  'Nieuwe indicatie',
  'Verlenging bestaande indicatie',
  'Wijzigen bestaande indicatie'
];
const vraagstellingOpties = [
  'Nieuwe vraagstelling',
  'Verlenging bestaande indicatie',
  'Wijzigen bestaande indicatie'
];

interface StatusCardOption {
  value: string;
  label: string;
}

interface StatusCardProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: StatusCardOption[];
  color: string;
}

const StatusCard = ({ label, value, onChange, options, color }: StatusCardProps) => (
  <div className={`p-4 rounded-lg shadow bg-white flex-1 mb-4`}>
    <div className="font-semibold mb-2">{label}</div>
    <div className="flex gap-4">
      {options.map((opt: StatusCardOption) => (
        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={label}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className={`accent-${color}-500 w-5 h-5`}
            aria-label={opt.label}
          />
          <span className={`font-medium text-${color}-700`}>{opt.label}</span>
        </label>
      ))}
    </div>
  </div>
);

interface TaskDbInsert {
  client_id: string | null;
  doel_status: string;
  urgentie_status: string;
  opdrachtgever: string;
  subopdrachtgever: string;
  subopdrachtgever_overig: string | null;
  taakbeschrijving: string;
  indicatie_opties: string[];
  vraagstelling_opties: string[];
  vraagstelling_datum: string | null;
  documenten?: { naam: string; file_path?: string; file_url?: string; sanitized_name?: string }[];
  created_at: string;
  uitvoerdatum: string | null;
  deadline_datum: string | null;
  huisbezoek_datum?: string | null;
}

interface UploadedDocument {
  file: File;
  customName: string;
  fileName: string;
  filePath?: string;
  fileUrl?: string;
  sanitizedName?: string;
}

type UploadStatus = { success: boolean; message: string };

function sanitizeFileName(name: string): string {
  const ext = name.includes('.') ? '.' + name.split('.').pop() : '';
  const base = name.replace(ext, '');
  return (
    base
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_-]/g, '') +
    '_' +
    Date.now() +
    ext.toLowerCase()
  );
}

const NewTaskPage: React.FC = () => {
  const [state, setState] = useState<TaskState>({
    doelStatus: 'nieuwe_taak',
    urgentieStatus: 'niet_urgent',
    opdrachtgever: '',
    subopdrachtgever: '',
    taakbeschrijving: '',
    indicatieOpties: [],
    vraagstellingOpties: [],
  });
  const [showSubOverig, setShowSubOverig] = useState(false);
  const [searchOpdr, setSearchOpdr] = useState('');
  const [searchSub, setSearchSub] = useState('');
  const [searchTaak, setSearchTaak] = useState('');
  const location = useLocation();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [clientBirth, setClientBirth] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [files, setFiles] = useState<UploadedDocument[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus[]>([]);
  const [uitvoerdatum, setUitvoerdatum] = useState<Date | undefined>(new Date());
  const [deadlineDatum, setDeadlineDatum] = useState<Date | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDeadlineCalendar, setShowDeadlineCalendar] = useState(false);
  const [huisbezoekDatum, setHuisbezoekDatum] = useState<Date | undefined>(undefined);
  const [showHuisbezoekCalendar, setShowHuisbezoekCalendar] = useState(false);
  const navigate = useNavigate();

  // Haal clientId uit URL en fetch naam
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const clientIdFromUrl = params.get('clientId');
    if (clientIdFromUrl) {
      setSelectedClient(clientIdFromUrl);
      // Haal naam op
      supabase.from('clients').select('naam, geboortedatum').eq('id', clientIdFromUrl).single().then(({ data }) => {
        if (data) {
          setClientName(data.naam);
          setClientBirth(data.geboortedatum || null);
        }
      });
    }
  }, [location.search]);

  // Filtered dropdowns
  const filteredOpdrachtgevers = opdrachtgevers.filter(o => o.toLowerCase().includes(searchOpdr.toLowerCase()));
  const filteredSubopdrachtgevers = subopdrachtgevers.filter(s => s.toLowerCase().includes(searchSub.toLowerCase()));
  const filteredTaakbeschrijvingen = taakbeschrijvingen.filter(t => t.toLowerCase().includes(searchTaak.toLowerCase()));

  // Conditional rendering
  const showIndicatie = state.taakbeschrijving === 'Indicatie (nieuw/verlening/wijzigen)';
  const showVraagstelling = state.taakbeschrijving === 'Beantwoorden vragen verzekeraar';

  const validate = (): string | null => {
    if (!selectedClient) return 'Selecteer eerst een cliënt.';
    if (!state.opdrachtgever) return 'Kies een opdrachtgever.';
    if (state.subopdrachtgever === 'Overig' && !state.subopdrachtgeverOverig) return 'Specificeer de subopdrachtgever.';
    if (!state.taakbeschrijving) return 'Kies een taakbeschrijving.';
    if (state.taakbeschrijving === 'Indicatie (nieuw/verlening/wijzigen)' && state.indicatieOpties.length === 0)
      return 'Selecteer minstens één indicatie-optie.';
    if (state.taakbeschrijving === 'Beantwoorden vragen verzekeraar' && state.vraagstellingOpties.length === 0)
      return 'Selecteer minstens één vraagstelling-optie.';
    if (state.vraagstellingOpties.includes('Nieuwe vraagstelling') && !state.vraagstellingDatum)
      return 'Vul de datum in bij Nieuwe vraagstelling.';
    return null;
  };

  // Upload bestand naar Supabase Storage
  const uploadFiles = async (): Promise<UploadedDocument[]> => {
    const uploaded: UploadedDocument[] = [];
    const statusArr: UploadStatus[] = [];
    for (const [i, doc] of files.entries()) {
      try {
        const safeName = sanitizeFileName(doc.file.name);
        const filePath = `public/${safeName}`;
        const { data, error } = await supabase.storage.from('taken').upload(filePath, doc.file);
        if (!error && data?.path) {
          uploaded.push({
            ...doc,
            filePath: data.path,
            fileUrl: `https://ltasjbgamoljvqoclgkf.supabase.co/storage/v1/object/public/taken/${data.path}`,
            sanitizedName: safeName,
          });
          statusArr[i] = { success: true, message: 'Upload gelukt' };
        } else {
          statusArr[i] = { success: false, message: error?.message || JSON.stringify(error) || 'Onbekende fout' };
        }
      } catch (err: any) {
        statusArr[i] = { success: false, message: err?.message || 'Onbekende fout' };
      }
    }
    setUploadStatus(statusArr);
    return uploaded;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }
    setIsSubmitting(true);
    let uploadedDocs: UploadedDocument[] = [];
    if (files.length > 0) {
      uploadedDocs = await uploadFiles();
      setFiles(uploadedDocs); // update met urls
    }
    const documenten = uploadedDocs.map(doc => ({
      naam: doc.customName.trim() !== '' ? doc.customName : doc.fileName,
      file_path: doc.filePath,
      file_url: doc.fileUrl,
      sanitized_name: doc.sanitizedName,
    }));
    const dbInsert: TaskDbInsert = {
      client_id: selectedClient,
      doel_status: state.doelStatus,
      urgentie_status: state.urgentieStatus,
      opdrachtgever: state.opdrachtgever,
      subopdrachtgever: state.subopdrachtgever,
      subopdrachtgever_overig: state.subopdrachtgeverOverig || null,
      taakbeschrijving: state.taakbeschrijving,
      indicatie_opties: state.indicatieOpties,
      vraagstelling_opties: state.vraagstellingOpties,
      vraagstelling_datum: state.vraagstellingDatum || null,
      documenten,
      created_at: new Date().toISOString(),
      uitvoerdatum: uitvoerdatum ? uitvoerdatum.toISOString() : null,
      deadline_datum: deadlineDatum ? deadlineDatum.toISOString() : null,
      huisbezoek_datum: huisbezoekDatum ? huisbezoekDatum.toISOString() : null,
    };
    const { error } = await supabase.from('taken').insert(dbInsert);
    setIsSubmitting(false);
    if (!error) setSuccess(true);
    else setErrorMsg('Fout bij opslaan: ' + (error?.message || JSON.stringify(error) || 'Onbekende fout'));
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen py-10 px-2 md:px-0">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="mb-4 px-8 py-4 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 font-medium border border-blue-200 text-2xl"
          aria-label="Terug naar home"
        >
          ← Terug naar Home
        </button>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-2 md:gap-0">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1e293b]">Nieuwe Taak</h1>
          {selectedClient && clientName && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-900 font-medium md:ml-6 md:mt-0 mt-2">
                              <span className="inline-block px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 border border-purple-500 font-medium text-xs">
                  Cliënt geselecteerd: {clientName}{clientBirth ? ` (${clientBirth})` : ''}
                </span>
            </div>
          )}
        </div>
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:gap-16 gap-4 mb-8">
          <div className="p-4 rounded-lg shadow bg-white flex-1 mb-4 md:min-w-[260px]">
            <div className="font-semibold mb-2">Doel Status</div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="doelStatus"
                  value="nieuwe_taak"
                  checked={state.doelStatus === 'nieuwe_taak'}
                  onChange={() => setState(s => ({ ...s, doelStatus: 'nieuwe_taak' }))}
                  className="accent-green-500 w-5 h-5"
                  aria-label="Nieuwe taak"
                />
                <span className="font-medium text-green-700">Nieuwe taak</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="doelStatus"
                  value="openstaand"
                  checked={state.doelStatus === 'openstaand'}
                  onChange={() => setState(s => ({ ...s, doelStatus: 'openstaand' }))}
                  className="accent-red-500 w-5 h-5"
                  aria-label="Openstaand"
                />
                <span className="font-medium text-red-700">Openstaand</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="doelStatus"
                  value="lopende_zaak"
                  checked={state.doelStatus === 'lopende_zaak'}
                  onChange={() => setState(s => ({ ...s, doelStatus: 'lopende_zaak' }))}
                  className="accent-orange-500 w-5 h-5"
                  aria-label="Lopende zaak"
                />
                <span className="font-medium text-orange-700">Lopende zaak</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="doelStatus"
                  value="afgehandeld"
                  checked={state.doelStatus === 'afgehandeld'}
                  onChange={() => setState(s => ({ ...s, doelStatus: 'afgehandeld' }))}
                  className="accent-blue-500 w-5 h-5"
                  aria-label="Afgehandeld"
                />
                <span className="font-medium text-blue-700">Afgehandeld</span>
              </label>
            </div>
          </div>
          <div className="p-4 rounded-lg shadow bg-white flex-1 mb-4 md:min-w-[260px]">
            <div className="font-semibold mb-2">Urgentie Status</div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="urgentieStatus"
                  value="niet_urgent"
                  checked={state.urgentieStatus === 'niet_urgent'}
                  onChange={() => setState(s => ({ ...s, urgentieStatus: 'niet_urgent' }))}
                  className="accent-blue-500 w-5 h-5"
                  aria-label="Niet urgent"
                />
                <span className="font-medium text-blue-700">Niet urgent</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="urgentieStatus"
                  value="urgent"
                  checked={state.urgentieStatus === 'urgent'}
                  onChange={() => setState(s => ({ ...s, urgentieStatus: 'urgent' }))}
                  className="accent-orange-500 w-5 h-5"
                  aria-label="Urgent"
                />
                <span className="font-medium text-orange-700">Urgent</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="urgentieStatus"
                  value="zeer_urgent"
                  checked={state.urgentieStatus === 'zeer_urgent'}
                  onChange={() => setState(s => ({ ...s, urgentieStatus: 'zeer_urgent' }))}
                  className="accent-red-500 w-5 h-5"
                  aria-label="Zeer urgent"
                />
                <span className="font-medium text-red-700">Zeer urgent</span>
              </label>
            </div>
          </div>
        </div>
        {/* Main Form Section */}
        {success ? (
          <div className="bg-green-50 border border-green-200 rounded p-6 text-green-900 text-lg font-semibold text-center mb-8">
            Taak succesvol opgeslagen!
          </div>
        ) : (
        <form className="bg-white rounded-lg shadow p-6 md:p-10 space-y-6" autoComplete="off" onSubmit={handleSubmit}>
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800 font-medium mb-2">
              {errorMsg}
            </div>
          )}
          {/* Document upload veld */}
          <div>
            <label className="block text-sm font-semibold mb-1">Documenten uploaden (meerdere mogelijk)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              multiple
              onChange={e => {
                const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
                setFiles(selectedFiles.map(f => ({ file: f, customName: '', fileName: f.name })));
                setUploadStatus(selectedFiles.map(() => ({ success: false, message: '' }))); // Reset status for new files
              }}
              className="border rounded px-2 py-1 w-full"
              aria-label="Documenten uploaden"
              disabled={isSubmitting}
            />
            {files.length > 0 && (
              <div className="mt-2 space-y-2">
                {files.map((doc, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row md:items-center gap-2 border-b pb-2">
                    <span className="font-medium text-gray-800">{doc.fileName}</span>
                    <input
                      type="text"
                      placeholder="Optionele eigen naam"
                      value={doc.customName}
                      onChange={e => {
                        const newFiles = [...files];
                        newFiles[idx].customName = e.target.value;
                        setFiles(newFiles);
                      }}
                      className="border rounded px-2 py-1 flex-1"
                      aria-label="Optionele eigen naam voor document"
                      disabled={isSubmitting}
                    />
                    {doc.fileUrl && (
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline ml-2">Bekijk</a>
                    )}
                    {uploadStatus[idx] && (
                      <span className={uploadStatus[idx].success ? 'text-green-700 ml-2' : 'text-red-700 ml-2'}>
                        {uploadStatus[idx].message}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Dropdown 1: Opdrachtgever */}
          <div>
            <label htmlFor="opdrachtgever" className="block text-sm font-semibold mb-1">Opdrachtgever</label>
            <input
              type="text"
              placeholder="Zoek opdrachtgever..."
              value={searchOpdr}
              onChange={e => setSearchOpdr(e.target.value)}
              className="border rounded px-2 py-1 w-full mb-2"
              aria-label="Zoek opdrachtgever"
            />
            <select
              id="opdrachtgever"
              value={state.opdrachtgever}
              onChange={e => setState(s => ({ ...s, opdrachtgever: e.target.value }))}
              className="border rounded px-2 py-1 w-full"
              aria-label="Opdrachtgever"
            >
              <option value="">-- Kies opdrachtgever --</option>
              {filteredOpdrachtgevers.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          {/* Dropdown 2: Subopdrachtgever */}
          <div>
            <label htmlFor="subopdrachtgever" className="block text-sm font-semibold mb-1">Subopdrachtgever</label>
            <input
              type="text"
              placeholder="Zoek subopdrachtgever..."
              value={searchSub}
              onChange={e => setSearchSub(e.target.value)}
              className="border rounded px-2 py-1 w-full mb-2"
              aria-label="Zoek subopdrachtgever"
            />
            <select
              id="subopdrachtgever"
              value={state.subopdrachtgever}
              onChange={e => {
                setState(s => ({ ...s, subopdrachtgever: e.target.value }));
                setShowSubOverig(e.target.value === 'Overig');
              }}
              className="border rounded px-2 py-1 w-full"
              aria-label="Subopdrachtgever"
            >
              <option value="">-- Kies subopdrachtgever --</option>
              {filteredSubopdrachtgevers.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {showSubOverig && (
              <input
                type="text"
                placeholder="Specificeer subopdrachtgever..."
                value={state.subopdrachtgeverOverig || ''}
                onChange={e => setState(s => ({ ...s, subopdrachtgeverOverig: e.target.value }))}
                className="border rounded px-2 py-1 w-full mt-2 transition-all"
                aria-label="Specificeer subopdrachtgever"
              />
            )}
          </div>
          {/* Dropdown 3: Taakbeschrijving */}
          <div>
            <label htmlFor="taakbeschrijving" className="block text-sm font-semibold mb-1">Taakbeschrijving</label>
            <input
              type="text"
              placeholder="Zoek taakbeschrijving..."
              value={searchTaak}
              onChange={e => setSearchTaak(e.target.value)}
              className="border rounded px-2 py-1 w-full mb-2"
              aria-label="Zoek taakbeschrijving"
            />
            <select
              id="taakbeschrijving"
              value={state.taakbeschrijving}
              onChange={e => setState(s => ({ ...s, taakbeschrijving: e.target.value, indicatieOpties: [], vraagstellingOpties: [] }))}
              className="border rounded px-2 py-1 w-full"
              aria-label="Taakbeschrijving"
            >
              <option value="">-- Kies taakbeschrijving --</option>
              {filteredTaakbeschrijvingen.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          {/* Conditional Sections */}
          {showIndicatie && (
            <div className="transition-all duration-300 bg-[#f8fafc] rounded p-4 border">
              <div className="font-semibold mb-2">Indicatie opties</div>
              <div className="flex flex-col gap-2">
                {indicatieOpties.map(opt => (
                  <label key={opt} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={state.indicatieOpties.includes(opt)}
                      onChange={e => {
                        setState(s => ({
                          ...s,
                          indicatieOpties: e.target.checked
                            ? [...s.indicatieOpties, opt]
                            : s.indicatieOpties.filter(o => o !== opt)
                        }));
                      }}
                      className="accent-blue-500 w-5 h-5"
                      aria-label={opt}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {showVraagstelling && (
            <div className="transition-all duration-300 bg-[#f8fafc] rounded p-4 border">
              <div className="font-semibold mb-2">Vraagstelling opties</div>
              <div className="flex flex-col gap-2 mb-2">
                {vraagstellingOpties.map(opt => (
                  <label key={opt} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={state.vraagstellingOpties.includes(opt)}
                      onChange={e => {
                        setState(s => ({
                          ...s,
                          vraagstellingOpties: e.target.checked
                            ? [...s.vraagstellingOpties, opt]
                            : s.vraagstellingOpties.filter(o => o !== opt)
                        }));
                      }}
                      className="accent-blue-500 w-5 h-5"
                      aria-label={opt}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              {/* Datumkiezer bij Nieuwe vraagstelling */}
              {state.vraagstellingOpties.includes('Nieuwe vraagstelling') && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold">Datum nieuwe vraagstelling</label>
                  <input
                    type="date"
                    value={state.vraagstellingDatum || ''}
                    onChange={e => setState(s => ({ ...s, vraagstellingDatum: e.target.value }))}
                    className="border rounded px-2 py-1 w-full"
                    aria-label="Datum nieuwe vraagstelling"
                  />
                </div>
              )}
            </div>
          )}
          {/* Uitvoerdatum veld */}
          <div>
            <label className="block font-medium mb-1">Uitvoerdatum</label>
            <div className="flex items-center gap-4 flex-wrap">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCalendar((v) => !v)}
                className="w-44 justify-start"
              >
                {uitvoerdatum ? format(uitvoerdatum, 'dd-MM-yyyy') : 'Kies datum'}
              </Button>
              {showCalendar && (
                <div className="z-50 bg-white rounded shadow p-2 mt-2">
                  <Calendar
                    mode="single"
                    selected={uitvoerdatum}
                    onSelect={(date) => {
                      setUitvoerdatum(date);
                      setShowCalendar(false);
                    }}
                    initialFocus
                  />
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block font-medium mb-1">Deadline datum</label>
            <div className="flex items-center gap-4 flex-wrap">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeadlineCalendar((v) => !v)}
                className="w-44 justify-start"
              >
                {deadlineDatum ? format(deadlineDatum, 'dd-MM-yyyy') : 'Kies datum'}
              </Button>
              {showDeadlineCalendar && (
                <div className="z-50 bg-white rounded shadow p-2 mt-2">
                  <Calendar
                    mode="single"
                    selected={deadlineDatum}
                    onSelect={(date) => {
                      setDeadlineDatum(date);
                      setShowDeadlineCalendar(false);
                    }}
                    initialFocus
                  />
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block font-medium mb-1">Datum huisbezoek (optioneel)</label>
            <div className="flex items-center gap-4 flex-wrap">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowHuisbezoekCalendar((v) => !v)}
                className="w-44 justify-start"
              >
                {huisbezoekDatum ? format(huisbezoekDatum, 'dd-MM-yyyy') : 'Kies datum'}
              </Button>
              {showHuisbezoekCalendar && (
                <div className="z-50 bg-white rounded shadow p-2 mt-2">
                  <Calendar
                    mode="single"
                    selected={huisbezoekDatum}
                    onSelect={(date) => {
                      setHuisbezoekDatum(date);
                      setShowHuisbezoekCalendar(false);
                    }}
                    initialFocus
                  />
                </div>
              )}
            </div>
          </div>
          {/* Submit knop */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-[#2563eb] text-white font-semibold px-6 py-2 rounded shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              tabIndex={0}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Bezig...' : 'Opslaan'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default NewTaskPage;