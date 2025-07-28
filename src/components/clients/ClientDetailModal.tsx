import React from "react";

import { Client } from './types';

interface ClientDetailModalProps {
  open: boolean;
  onClose: () => void;
  client: Client | null;
}

const TABS = [
  { key: 'overview', label: 'Overzicht' },
  { key: 'care', label: 'Zorg' },
  { key: 'documents', label: 'Documenten' },
  { key: 'timeline', label: 'Tijdlijn' },
  { key: 'tasks', label: 'Taken' },
  { key: 'communication', label: 'Communicatie' },
  { key: 'family', label: 'Familie' },
  { key: 'billing', label: 'Facturatie' },
];

const ClientDetailModal: React.FC<ClientDetailModalProps> = ({ open, onClose, client }) => {
  const [activeTab, setActiveTab] = React.useState('overview');
  React.useEffect(() => {
    if (open) setActiveTab('overview');
  }, [open]);
  if (!open || !client) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30" role="dialog" aria-modal="true" aria-labelledby="client-modal-title">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-0 relative outline-none" tabIndex={-1}>
        {/* Sluitknop */}
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-primary-600 focus:outline-none focus:ring"
          onClick={onClose}
          aria-label="Sluit detailscherm"
        >
          &times;
        </button>
        {/* Profiel */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-6 border-b">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-3xl font-bold overflow-hidden">
            {client.profilePhoto ? (
              <img src={client.profilePhoto} alt={client.fullName} className="object-cover w-full h-full" />
            ) : (
              <span>{client.firstName[0]}{client.lastName[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="heading-md mb-1" id="client-modal-title">{client.fullName}</div>
            <div className="text-xs text-gray-500 mb-1">BSN: {client.bsn}</div>
            <div className="text-xs text-gray-400 mb-1">{client.address.street} {client.address.houseNumber}{client.address.houseNumberAddition ? client.address.houseNumberAddition : ''}, {client.address.postalCode} {client.address.city}</div>
            <div className="flex gap-2 flex-wrap mt-1">
              <span className="badge bg-blue-100 text-blue-800 text-xs">{client.care.status.replace('_', ' ')}</span>
              <span className="badge bg-cyan-100 text-cyan-800 text-xs">{client.care.careLevel.toUpperCase()}</span>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <nav className="flex border-b bg-gray-50" aria-label="Cliënt detail tabs">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring transition ${activeTab === tab.key ? 'border-b-2 border-primary-600 text-primary-700 bg-white' : 'text-gray-500 hover:text-primary-600'}`}
              aria-selected={activeTab === tab.key}
              aria-controls={`tabpanel-${tab.key}`}
              id={`tab-${tab.key}`}
              role="tab"
              tabIndex={activeTab === tab.key ? 0 : -1}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        {/* Tab panels */}
        <div className="p-6" role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}> 
          {activeTab === 'overview' && (
            <div>
              <h2 className="font-bold mb-2">Basisinformatie</h2>
              <ul className="text-sm text-gray-700">
                <li>Geboortedatum: {client.dateOfBirth.toLocaleDateString()}</li>
                <li>Geslacht: {client.gender}</li>
                <li>Telefoon: {client.contact.phone}</li>
                <li>Email: {client.contact.email}</li>
                <li>Voorkeurscontact: {client.contact.preferredContactMethod}</li>
                <li>Tags: {client.tags.join(', ')}</li>
              </ul>
              <h3 className="font-semibold mt-4 mb-1">Noodcontact</h3>
              <div className="text-xs text-gray-600">
                {client.contact.emergencyContact.name} ({client.contact.emergencyContact.relationship})<br/>
                {client.contact.emergencyContact.phone}
              </div>
              <div className="mt-4 text-xs text-gray-400">Aangemaakt op: {client.createdAt.toLocaleDateString()} | Laatst bijgewerkt: {client.updatedAt.toLocaleDateString()}</div>
            </div>
          )}
          {activeTab === 'care' && (
            <div>
              <h2 className="font-bold mb-2">Zorginformatie</h2>
              <ul className="text-sm text-gray-700">
                <li>Diagnose: {client.care.primaryDiagnosis.join(', ')}</li>
                <li>Verzekeraar: {client.care.insuranceCompany}</li>
                <li>Status: {client.care.status}</li>
                <li>Zorgniveau: {client.care.careLevel}</li>
                <li>Startdatum zorg: {client.care.startDate.toLocaleDateString()}</li>
                <li>Beëindigingsdatum: {client.care.endDate ? client.care.endDate.toLocaleDateString() : '-'}</li>
                <li>Allergieën: {client.care.allergies?.join(', ')}</li>
                <li>Medicatie: {client.care.medications?.length ? 'Ja' : 'Nee'}</li>
                <li>Mobiliteit: {client.care.mobility}</li>
                <li>Cognitieve status: {client.care.cognitiveStatus}</li>
              </ul>
            </div>
          )}
          {activeTab === 'documents' && (
            <div>
              <h2 className="font-bold mb-2">Documenten</h2>
              <p>Hier komen gekoppelde documenten en formulieren.</p>
            </div>
          )}
          {activeTab === 'timeline' && (
            <div>
              <h2 className="font-bold mb-2">Tijdlijn</h2>
              <p>Chronologisch zorgverloop en activiteiten.</p>
            </div>
          )}
          {activeTab === 'tasks' && (
            <div>
              <h2 className="font-bold mb-2">Taken</h2>
              <p>Openstaande en afgeronde taken van deze cliënt.</p>
            </div>
          )}
          {activeTab === 'communication' && (
            <div>
              <h2 className="font-bold mb-2">Communicatie</h2>
              <p>Berichten, notities, gesprekken met/over deze cliënt.</p>
            </div>
          )}
          {activeTab === 'family' && (
            <div>
              <h2 className="font-bold mb-2">Familie / Mantelzorg</h2>
              <p>Contacten van familie en mantelzorgers.</p>
            </div>
          )}
          {activeTab === 'billing' && (
            <div>
              <h2 className="font-bold mb-2">Facturatie</h2>
              <p>Financiële informatie en declaraties.</p>
            </div>
          )}
        </div>
        <div className="px-6 pb-6 flex justify-end">
          <button className="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring" onClick={onClose}>
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailModal;
