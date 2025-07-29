import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Switch from '@mui/material/Switch';
import { toast } from '@/hooks/use-toast';
import { ActivityLogger } from './ActivityLogger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Calendar,
  MapPin,
  Building,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  Circle,
  MessageSquare,
  Flag
} from 'lucide-react';

// Updated stapdefinities with new labels
const STAP_DEFINITIES = [
  { naam: 'inplannen_huisbezoek', label: 'Inplannen\nhuisbezoek', volgorde: 1, icon: Calendar },
  { naam: 'intake_afnemen', label: 'Intake\nafnemen', volgorde: 2, icon: User },
  { naam: 'indicatie_opstellen', label: 'Indicatie\nopstellen', volgorde: 3, icon: FileText },
  { naam: 'indicatie_opsturen', label: 'Indicatie\nopsturen', volgorde: 4, icon: Building },
  { naam: 'aanvullende_vragen_open', label: 'Aanvullende vragen verzekeraar openstaand', volgorde: 5, icon: MessageSquare },
  { naam: 'aanvullende_vragen_afgerond', label: 'Aanvullende vragen verzekeraar afgerond', volgorde: 6, icon: CheckCircle },
];

const URGENT_KEY = 'urgent_stappen_local';

export default function PGBProcessFlow({ clientId }) {
  const [procesStappen, setProcesStappen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stapIdMap, setStapIdMap] = useState({});
  const [optimisticStappen, setOptimisticStappen] = useState(null);
  const flowRef = useRef(null);
  const [flowWidth, setFlowWidth] = useState(undefined);
  const [vrijeTekst, setVrijeTekst] = useState('');
  const [vrijeTekstTimestamp, setVrijeTekstTimestamp] = useState('');
  const [opmerkingOpen, setOpmerkingOpen] = useState({}); // { [stapCode]: boolean }
  const [opmerkingen, setOpmerkingen] = useState({}); // { [stapCode]: [{ opmerking, opmerking_datum }] }
  const [opmerkingLoading, setOpmerkingLoading] = useState({}); // { [stapCode]: boolean }
  const [nieuweOpmerking, setNieuweOpmerking] = useState({}); // { [stapCode]: string }
  // State voor bewerken van opmerkingen
  const [editOpmerking, setEditOpmerking] = useState({}); // { [stapCode_index]: string }
  const [editingOpmerking, setEditingOpmerking] = useState({}); // { [stapCode_index]: boolean }
  // State voor clientgegevens
  const [clientData, setClientData] = useState(null);

  // Urgent state (alleen lokaal, per client)
  const [urgentStappen, setUrgentStappen] = useState(() => {
    // Per clientId opslaan
    const saved = localStorage.getItem(`${URGENT_KEY}_${clientId}`);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    async function fetchProcesStappen() {
    const { data, error } = await supabase
      .from('proces_stappen')
      .select('*')
      .eq('client_id', clientId)
      .order('volgorde');
    if (error) {
      setError(error.message);
        setLoading(false);
        return;
      }
      // Merge met STAP_DEFINITIES zodat altijd alle stappen zichtbaar zijn
      const stappen = STAP_DEFINITIES.map(stap => {
        const dbStap = data?.find(s => s.code === stap.naam);
        return dbStap ? { ...dbStap, label: stap.label, icon: stap.icon } : {
          code: stap.naam,
          volgorde: stap.volgorde,
          status: 'openstaand',
          afgehandeld_op: null,
          label: stap.label,
          icon: stap.icon,
        };
      });
      setProcesStappen(stappen);
      setLoading(false);
    }
    fetchProcesStappen();
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    setOpmerkingen({}); // Reset opmerkingen bij client-wissel
    async function fetchOpmerkingen() {
      const { data, error } = await supabase
        .from('stap_opmerkingen')
        .select('stap_code, opmerking, opmerking_datum')
        .eq('client_id', clientId);
      if (data) {
        const map = {};
        data.forEach(row => {
          if (!map[row.stap_code]) map[row.stap_code] = [];
          map[row.stap_code].push({ opmerking: row.opmerking, opmerking_datum: row.opmerking_datum });
        });
        Object.keys(map).forEach(code => {
          map[code].sort((a, b) => (b.opmerking_datum || '').localeCompare(a.opmerking_datum || ''));
        });
        setOpmerkingen(map);
      } else {
        setOpmerkingen({});
      }
    }
    fetchOpmerkingen();
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    async function fetchClientData() {
      const { data, error } = await supabase
        .from('clients')
        .select('naam, geboortedatum, clientnummer, bsn, adres, postcode, woonplaats, verzekeraar, polisnummer, machtigingsnummer')
        .eq('id', clientId)
        .single();
      if (!error && data) {
        setClientData(data);
      }
    }
    fetchClientData();
  }, [clientId]);

  const handleStatusChange = async (stapCode, nieuweStatus) => {
    if (optimisticStappen) return; // Voorkom dubbele updates

    setOptimisticStappen(prev =>
      prev ? prev.map(s => s.code === stapCode ? { ...s, status: nieuweStatus } : s) : null
    );

    await updateSingleStap(stapCode, nieuweStatus);
    setOptimisticStappen(null);
  };

  const updateSingleStap = async (stapCode, nieuweStatus, customAfgehandeldOp) => {
    try {
      const afgehandeldOp = nieuweStatus === 'afgehandeld' ? (customAfgehandeldOp || new Date().toISOString()) : null;

      const { error } = await supabase
        .from('proces_stappen')
        .upsert({
          client_id: clientId,
          code: stapCode,
          status: nieuweStatus,
          afgehandeld_op: afgehandeldOp,
          volgorde: STAP_DEFINITIES.find(s => s.naam === stapCode)?.volgorde || 0
        });

      if (error) {
        console.error('Error updating stap:', error);
        toast({
          title: "Fout",
          description: "Er is een fout opgetreden bij het bijwerken van de stap.",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setProcesStappen(prev =>
        prev.map(s => s.code === stapCode ? { ...s, status: nieuweStatus, afgehandeld_op: afgehandeldOp } : s)
      );

      toast({
        title: "Succes",
        description: `Stap "${STAP_DEFINITIES.find(s => s.naam === stapCode)?.label}" is ${nieuweStatus === 'afgehandeld' ? 'afgehandeld' : 'openstaand'} gemaakt.`,
      });

    } catch (error) {
      console.error('Error updating stap:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van de stap.",
        variant: "destructive",
      });
    }
  };

  const handleOpmerkingSave = async (stapCode) => {
    const opmerking = nieuweOpmerking[stapCode]?.trim();
    if (!opmerking) return;

    setOpmerkingLoading(prev => ({ ...prev, [stapCode]: true }));

    try {
      const { error } = await supabase
        .from('stap_opmerkingen')
        .insert({
          client_id: clientId,
          stap_code: stapCode,
          opmerking: opmerking,
          opmerking_datum: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving opmerking:', error);
        toast({
          title: "Fout",
          description: "Er is een fout opgetreden bij het opslaan van de opmerking.",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      const newOpmerking = { opmerking, opmerking_datum: new Date().toISOString() };
      setOpmerkingen(prev => ({
        ...prev,
        [stapCode]: [...(prev[stapCode] || []), newOpmerking]
      }));

      // Clear input
      setNieuweOpmerking(prev => ({ ...prev, [stapCode]: '' }));
      setOpmerkingOpen(prev => ({ ...prev, [stapCode]: false }));

      toast({
        title: "Opmerking toegevoegd",
        description: "De opmerking is succesvol toegevoegd.",
      });

    } catch (error) {
      console.error('Error saving opmerking:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het opslaan van de opmerking.",
        variant: "destructive",
      });
    } finally {
      setOpmerkingLoading(prev => ({ ...prev, [stapCode]: false }));
    }
  };

  const handleEditOpmerkingSave = async (stapCode, index) => {
    const opmerking = editOpmerking[`${stapCode}_${index}`]?.trim();
    if (!opmerking) return;

    setOpmerkingLoading(prev => ({ ...prev, [stapCode]: true }));

    try {
      const currentOpmerking = opmerkingen[stapCode][index];
      const { error } = await supabase
        .from('stap_opmerkingen')
        .update({ opmerking: opmerking })
        .eq('client_id', clientId)
        .eq('stap_code', stapCode)
        .eq('opmerking_datum', currentOpmerking.opmerking_datum);

      if (error) {
        console.error('Error updating opmerking:', error);
        toast({
          title: "Fout",
          description: "Er is een fout opgetreden bij het bijwerken van de opmerking.",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setOpmerkingen(prev => ({
        ...prev,
        [stapCode]: prev[stapCode].map((op, i) =>
          i === index ? { ...op, opmerking } : op
        )
      }));

      // Clear edit state
      setEditOpmerking(prev => ({ ...prev, [`${stapCode}_${index}`]: '' }));
      setEditingOpmerking(prev => ({ ...prev, [`${stapCode}_${index}`]: false }));

      toast({
        title: "Opmerking bijgewerkt",
        description: "De opmerking is succesvol bijgewerkt.",
      });

    } catch (error) {
      console.error('Error updating opmerking:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van de opmerking.",
        variant: "destructive",
      });
    } finally {
      setOpmerkingLoading(prev => ({ ...prev, [stapCode]: false }));
    }
  };

  const toggleUrgent = (stapCode) => {
    setUrgentStappen(prev => {
      const newUrgent = prev.includes(stapCode)
        ? prev.filter(code => code !== stapCode)
        : [...prev, stapCode];

      // Save to localStorage
      localStorage.setItem(`${URGENT_KEY}_${clientId}`, JSON.stringify(newUrgent));
      return newUrgent;
    });
  };

  const renderSwitchButton = (stap, idx) => (
    <div className="flex items-center gap-2">
      <Switch
        checked={stap.status === 'afgehandeld'}
        onChange={(e) => handleStatusChange(stap.code, e.target.checked ? 'afgehandeld' : 'openstaand')}
        color="primary"
        size="small"
      />
      <span className="text-xs text-gray-600">
        {stap.status === 'afgehandeld' ? 'Afgehandeld' : 'Openstaand'}
      </span>
    </div>
  );

  const renderVoegOpmerkingToeKnop = (stap, idx) => (
    <button
      className="w-full bg-blue-50 text-blue-700 rounded-lg py-2 px-3 font-medium hover:bg-blue-100 transition-colors duration-200 text-sm flex items-center justify-center gap-2"
      aria-label="Voeg opmerking toe"
      onClick={() => setOpmerkingOpen(prev => ({ ...prev, [stap.code]: !prev[stap.code] }))}
    >
      <MessageSquare className="w-4 h-4" />
      Opmerking
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 space-y-8">
      {/* Client Information Card */}
      {clientData && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl text-gray-800">
              <User className="w-6 h-6 text-blue-600" />
              Cliëntgegevens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Personal Information */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  Persoonlijke Gegevens
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Naam:</span>
                    <span className="font-medium">{clientData.naam || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Geboortedatum:</span>
                    <span className="font-medium">
                      {clientData.geboortedatum ? new Date(clientData.geboortedatum).toLocaleDateString('nl-NL') : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">BSN:</span>
                    <span className="font-medium">{clientData.bsn || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Clientnummer:</span>
                    <span className="font-medium">{clientData.clientnummer || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-500" />
                  Adresgegevens
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Adres:</span>
                    <span className="font-medium">{clientData.adres || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Postcode:</span>
                    <span className="font-medium">{clientData.postcode || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Woonplaats:</span>
                    <span className="font-medium">{clientData.woonplaats || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Insurance Information */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Building className="w-4 h-4 text-purple-500" />
                  Verzekeringsgegevens
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Verzekeraar:</span>
                    <span className="font-medium">{clientData.verzekeraar || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Polisnummer:</span>
                    <span className="font-medium">{clientData.polisnummer || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Machtigingsnummer:</span>
                    <span className="font-medium">{clientData.machtigingsnummer || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Process Flow */}
      <Card className="border-gray-200">
        <CardHeader>
          <div className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">PGB Proces Flow</CardTitle>
            <p className="text-gray-600">Beheer de voortgang van het PGB proces</p>
          </div>
        </CardHeader>
        <CardContent>
          {/* Process Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {(optimisticStappen || procesStappen).map((stap, idx) => {
              const IconComponent = stap.icon || Circle;
              const isUrgent = urgentStappen.includes(stap.code);
              const isCompleted = stap.status === 'afgehandeld';

              return (
                <Card
                  key={stap.code}
                  className={`relative transition-all duration-300 hover:shadow-lg ${
                    isUrgent
                      ? 'border-red-300 bg-red-50 ring-2 ring-red-200'
                      : isCompleted
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <CardContent className="p-4">
                    {/* Urgent Badge */}
                    {isUrgent && (
                      <Badge variant="destructive" className="absolute -top-2 -right-2 z-10">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Urgent
                      </Badge>
                    )}

                    {/* Step Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2">
                          {stap.label}
                        </h3>
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <Badge
                            variant={isCompleted ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {stap.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Completion Date */}
                    {isCompleted && stap.afgehandeld_op && (
                      <div className="mb-4 p-2 bg-green-100 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-green-700">
                          <CheckCircle className="w-3 h-3 flex-shrink-0" />
                          <span>Afgehandeld: {new Date(stap.afgehandeld_op).toLocaleDateString('nl-NL')}</span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3">
                      {/* Add Comment Button - More Subtle */}
                      <button
                        onClick={() => setOpmerkingOpen(prev => ({ ...prev, [stap.code]: !prev[stap.code] }))}
                        className="w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors duration-200 flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4 flex-shrink-0" />
                        <span>Opmerking toevoegen</span>
                      </button>

                      {/* Urgent Toggle */}
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isUrgent}
                          onChange={() => toggleUrgent(stap.code)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500 flex-shrink-0"
                        />
                        <Flag className="w-3 h-3 text-red-500 flex-shrink-0" />
                        <span className="text-gray-600">Markeer als urgent</span>
                      </label>

                      {/* Status Toggle */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-500">Status:</span>
                        <Switch
                          checked={isCompleted}
                          onChange={(e) => handleStatusChange(stap.code, e.target.checked ? 'afgehandeld' : 'openstaand')}
                          size="small"
                        />
                      </div>
                    </div>

                    {/* Comments Section */}
                    {opmerkingOpen[stap.code] && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="space-y-3">
                          {/* Add New Comment */}
                          <div className="space-y-2">
                            <textarea
                              value={nieuweOpmerking[stap.code] || ''}
                              onChange={(e) => setNieuweOpmerking(prev => ({ ...prev, [stap.code]: e.target.value }))}
                              placeholder="Voeg een opmerking toe..."
                              className="w-full p-2 text-sm border border-gray-300 rounded-md resize-none"
                              rows="2"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleOpmerkingSave(stap.code)}
                                disabled={opmerkingLoading[stap.code]}
                              >
                                {opmerkingLoading[stap.code] ? 'Opslaan...' : 'Opslaan'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setOpmerkingOpen(prev => ({ ...prev, [stap.code]: false }))}
                              >
                                Annuleren
                              </Button>
                            </div>
                          </div>

                          {/* Existing Comments */}
                          {opmerkingen[stap.code] && opmerkingen[stap.code].length > 0 && (
                            <div className="space-y-2">
                              <Separator />
                              <h4 className="text-xs font-medium text-gray-700">Opmerkingen:</h4>
                              {opmerkingen[stap.code].map((opmerking, index) => (
                                <div key={index} className="text-xs bg-white p-2 rounded border">
                                  <div className="text-gray-600 mb-1">
                                    {new Date(opmerking.opmerking_datum).toLocaleString('nl-NL')}
                                  </div>
                                  <div className="text-gray-800">{opmerking.opmerking}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Urgent Items Summary */}
          {urgentStappen.length > 0 && (
            <div className="mt-6">
              <Card className="border-red-300 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="w-5 h-5" />
                    Urgente Items ({urgentStappen.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {procesStappen
                      .filter(stap => urgentStappen.includes(stap.code))
                      .map((stap) => (
                        <div key={stap.code} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                          <div>
                            <div className="font-medium text-sm text-gray-900">{stap.label}</div>
                            <div className="text-xs text-gray-600">Status: {stap.status}</div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUrgent(stap.code)}
                          >
                            Verwijder urgent
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Logger */}
      <ActivityLogger clientId={clientId} />
    </div>
  );
}