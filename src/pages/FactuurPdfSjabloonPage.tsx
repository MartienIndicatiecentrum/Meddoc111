import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  FileText, 
  User, 
  Building,
  Calendar,
  Euro,
  Save
} from 'lucide-react';

// Uzovi-code mapping per verzekeraar
const UZOVI_CODES = {
  // Basis verzekeraars
  'De Friesland': '3358',
  'FBTO': '3351', 
  'Interpolis': '3313',
  'De Christelijke Zorgverzekeraar': '3311',
  'ZieZo': '3311',
  'CZ': '7119',
  'VGZ': '7095',
  'Menzis': '3332',
  'Anderzorg': '3334',
  'AGIS': '3336',
  'ASR': '9018',
  'OHRA': '7053',
  'Stad Holland': '7037',
  
  // Uitgebreide mapping uit Excel sheets
  'Avéro Achmea Zorgverzekeringen NV': '3329',
  'Menzis Zorgverzekeraar N.V.': '3332',
  'Anderzorg N.V.': '3334',
  'AGIS Zorgverzekeringen NV': '3336',
  'BetterDi@b+': '3340',
  'FBTO zorgverzekeringen N.V.': '3351',
  'Iptiq Life S.A.': '3352',
  'Caresq': '3356',
  'De Friesland Zorgverzekeraar N.V.': '3358',
  'ZEKUR': '3361',
  'Eno Zorgverzekeraar N.V.': '3397',
  'ASR Schadeverzekering N.V.': '3406',
  'Goudse Schadeverzekeringen N.V.': '3409',
  'Stad Holland Zorgverzekeraar OWM U.A.': '7037',
  'OHRA Zorgverzekeringen N.V.': '7053',
  'VGZ Zorgverzekeraar N.V.': '7095',
  'CZ Zorgverzekeringen N.V.': '7119',
  'AGIS Zorgverzekeringen, Groep Buitenlands Recht': '7125',
  'Turien & Co. Assuradeuren (VGZ)': '8001',
  'Aevitae (VGZ)': '8401',
  'VGZ voor de zorg N.V.': '9001',
  'ASR VERZEKERINGEN': '9018',
  'Centrale Verw. eenheid CZ: CZ, Nationale-Nederlanden': '9644',
  'Regeling Wlz financiering instellingen': '9994',
  'Regeling VOZD': '9995',
  
  // Alternatieve namen en afkortingen
  'Achmea': '3329',
  'Zilveren Kruis': '9018',
  'Nationale-Nederlanden': '9644',
  'Centrale Verwerkingseenheid CZ': '9644',
};

// Mapping van verzekeraar naar adresgegevens
const VERZEKERAAR_ADRESSEN: Record<string, { adres: string; postcode: string; plaats: string }> = {
  'Zilveren Kruis': { adres: 'Postbus 70001', postcode: '3000 KB', plaats: 'Rotterdam' },
  'De Friesland': { adres: 'Postbus 270', postcode: '8901 BB', plaats: 'Leeuwarden' },
  'FBTO': { adres: 'Postbus 318', postcode: '8901 BC', plaats: 'Leeuwarden' },
  'Interpolis': { adres: 'Postbus 75000', postcode: '5000 LC', plaats: 'Tilburg' },
  'De Christelijke Zorgverzekeraar': { adres: 'Postbus 25150', postcode: '5600 RS', plaats: 'Eindhoven' },
  'ZieZo': { adres: 'Postbus 70001', postcode: '3000 KB', plaats: 'Rotterdam' },
  'CZ': { adres: 'Postbus 90152', postcode: '5000 LD', plaats: 'Tilburg' },
  'CZdirect': { adres: 'Postbus 90152', postcode: '5000 LD', plaats: 'Tilburg' },
  'Just': { adres: 'Postbus 90152', postcode: '5000 LD', plaats: 'Tilburg' },
  'Nationale-Nederlanden': { adres: 'Postbus 90152', postcode: '5000 LD', plaats: 'Tilburg' },
  'OHRA': { adres: 'Postbus 90152', postcode: '5000 LD', plaats: 'Tilburg' },
  'VGZ': { adres: 'Postbus 445', postcode: '5600 AK', plaats: 'Eindhoven' },
  'VGZ Bewuzt': { adres: 'Postbus 445', postcode: '5600 AK', plaats: 'Eindhoven' },
  'IZA': { adres: 'Postbus 445', postcode: '5600 AK', plaats: 'Eindhoven' },
  'Univé': { adres: 'Postbus 445', postcode: '5600 AK', plaats: 'Eindhoven' },
  'United Consumers VGZ': { adres: 'Postbus 445', postcode: '5600 AK', plaats: 'Eindhoven' },
};

interface InvoiceData {
  // Factuurgegevens
  factuurnummer: string;
  factuurdatum: string;
  vervaldatum: string;
  
  // Verzekeraar gegevens
  verzekeraar: string;
  verzekeraarAdres: string;
  verzekeraarPostcode: string;
  verzekeraarPlaats: string;
  uzoviCode: string;
  
  // Cliëntgegevens
  clientNaam: string;
  clientGeboortedatum: string;
  clientBSN: string;
  clientPolisnummer: string;
  
  // Factuurregels
  factuurregels: Array<{
    id: string;
    beschrijving: string;
    aantal: number;
    eenheidsprijs: number;
    totaal: number;
  }>;
  
  // Extra informatie
  notities: string;
}

export default function FactuurPdfSjabloonPage() {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');
  
  const [clientData, setClientData] = useState<any>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    factuurnummer: '',
    factuurdatum: '',
    vervaldatum: '',
    verzekeraar: '',
    verzekeraarAdres: '',
    verzekeraarPostcode: '',
    verzekeraarPlaats: '',
    uzoviCode: '',
    clientNaam: '',
    clientGeboortedatum: '',
    clientBSN: '',
    clientPolisnummer: '',
    factuurregels: [
      { id: '1', beschrijving: '', aantal: 1, eenheidsprijs: 0, totaal: 0 }
    ],
    notities: ''
  });

  // Haal cliëntgegevens op bij component mount
  useEffect(() => {
    if (!clientId) return;

    const fetchClientData = async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      
      if (!error && data) {
        setClientData(data);
        
        // Genereer factuurnummer en datums
        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(today.getDate() + 14);
        
        const year = today.getFullYear();
        const randomNum = Math.floor(Math.random() * 999) + 1;
        const factuurnummer = `${year}-${randomNum.toString().padStart(3, '0')}`;
        
        // Haal verzekeraar adres op
        const verzekeraarAdres = VERZEKERAAR_ADRESSEN[data.verzekeraar] || { adres: '-', postcode: '', plaats: '' };
        const uzoviCode = UZOVI_CODES[data.verzekeraar] || '0000';
        
        // Zorg ervoor dat datum correct wordt geformatteerd voor HTML date input
        let formattedDate = '';
        if (data.geboortedatum) {
          try {
            const date = new Date(data.geboortedatum);
            if (!isNaN(date.getTime())) {
              // Format naar YYYY-MM-DD voor HTML date input
              formattedDate = date.toISOString().split('T')[0];
            }
          } catch (error) {
            console.error('Error formatting geboortedatum:', error);
          }
        }
        
        setInvoiceData(prev => ({
          ...prev,
          factuurnummer,
          factuurdatum: today.toLocaleDateString('nl-NL'),
          vervaldatum: dueDate.toLocaleDateString('nl-NL'),
          verzekeraar: data.verzekeraar || '',
          verzekeraarAdres: verzekeraarAdres.adres,
          verzekeraarPostcode: verzekeraarAdres.postcode,
          verzekeraarPlaats: verzekeraarAdres.plaats,
          uzoviCode: `${uzoviCode} / ${data.verzekeraar}`,
          clientNaam: data.naam || '',
          clientGeboortedatum: formattedDate,
          clientBSN: data.bsn || '',
          clientPolisnummer: data.polisnummer || data.machtigingsnummer || ''
        }));
      }
    };

    fetchClientData();
  }, [clientId]);

  const getUzoviCode = (verzekeraar: string) => {
    return UZOVI_CODES[verzekeraar] || '0000';
  };

  // Functie om datum correct te formatteren
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('nl-NL');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Functie om verzekeraar gegevens automatisch in te vullen
  const handleVerzekeraarSelect = async (selectedVerzekeraar: string) => {
    const verzekeraarAdres = VERZEKERAAR_ADRESSEN[selectedVerzekeraar] || { adres: '', postcode: '', plaats: '' };
    const uzoviCode = UZOVI_CODES[selectedVerzekeraar] || '0000';
    
    setInvoiceData(prev => ({
      ...prev,
      verzekeraar: selectedVerzekeraar,
      verzekeraarAdres: verzekeraarAdres.adres,
      verzekeraarPostcode: verzekeraarAdres.postcode,
      verzekeraarPlaats: verzekeraarAdres.plaats,
      uzoviCode: `${uzoviCode} / ${selectedVerzekeraar}`
    }));

    // Update verzekeraar in database als er een clientId is
    if (clientId) {
      try {
        const { error } = await supabase
          .from('clients')
          .update({ 
            verzekeraar: selectedVerzekeraar,
            verzekeraar_adres: verzekeraarAdres.adres,
            verzekeraar_postcode: verzekeraarAdres.postcode,
            verzekeraar_plaats: verzekeraarAdres.plaats,
            uzovi_code: `${uzoviCode} / ${selectedVerzekeraar}`
          })
          .eq('id', clientId);

        if (error) {
          console.error('Error updating verzekeraar:', error);
        } else {
          console.log('Verzekeraar updated in database');
        }
      } catch (error) {
        console.error('Error updating verzekeraar:', error);
      }
    }
  };

  const updateFactuurregel = (index: number, field: string, value: any) => {
    const newRegels = [...invoiceData.factuurregels];
    newRegels[index] = { ...newRegels[index], [field]: value };
    
    // Bereken totaal
    if (field === 'aantal' || field === 'eenheidsprijs') {
      newRegels[index].totaal = newRegels[index].aantal * newRegels[index].eenheidsprijs;
    }
    
    setInvoiceData(prev => ({ ...prev, factuurregels: newRegels }));
  };

  const addFactuurregel = () => {
    const newId = (invoiceData.factuurregels.length + 1).toString();
    setInvoiceData(prev => ({
      ...prev,
      factuurregels: [...prev.factuurregels, { id: newId, beschrijving: '', aantal: 1, eenheidsprijs: 0, totaal: 0 }]
    }));
  };

  const removeFactuurregel = (index: number) => {
    if (invoiceData.factuurregels.length > 1) {
      const newRegels = invoiceData.factuurregels.filter((_, i) => i !== index);
      setInvoiceData(prev => ({ ...prev, factuurregels: newRegels }));
    }
  };

  const getTotaalBedrag = () => {
    return invoiceData.factuurregels.reduce((sum, regel) => sum + regel.totaal, 0);
  };

  const generatePDF = () => {
    // Hier zou je de PDF generatie logica implementeren
    console.log('PDF data:', invoiceData);
    alert('PDF generatie functionaliteit wordt geïmplementeerd. Factuurgegevens zijn gereed.');
  };

  const printFactuur = () => {
    window.print();
  };

  if (!clientData) {
    return (
      <AppLayout>
        <div className="max-w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Geen cliënt geselecteerd</h3>
            <p className="text-gray-600 mb-4">
              Selecteer een cliënt om een factuur te maken.
            </p>
            <Link to="/factuur-generator">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Terug naar Factuur Generator
              </Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Factuur PDF Sjabloon</h1>
              <p className="text-gray-600 mt-2">Pas factuurgegevens aan en genereer PDF</p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/factuur-generator">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Terug naar Generator
                </Button>
              </Link>
              <Button onClick={generatePDF} className="bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={printFactuur}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Invulvelden */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Cliëntgegevens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientNaam">Naam</Label>
                    <Input
                      id="clientNaam"
                      value={invoiceData.clientNaam}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, clientNaam: e.target.value }))}
                      placeholder="Wordt automatisch ingevuld vanuit cliëntgegevens"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientGeboortedatum">Geboortedatum</Label>
                    <Input
                      id="clientGeboortedatum"
                      type="date"
                      value={invoiceData.clientGeboortedatum}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, clientGeboortedatum: e.target.value }))}
                      placeholder="Wordt automatisch ingevuld vanuit cliëntgegevens"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientBSN">BSN</Label>
                    <Input
                      id="clientBSN"
                      value={invoiceData.clientBSN}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, clientBSN: e.target.value }))}
                      placeholder="Wordt automatisch ingevuld vanuit cliëntgegevens"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientPolisnummer">Polisnummer</Label>
                    <Input
                      id="clientPolisnummer"
                      value={invoiceData.clientPolisnummer}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, clientPolisnummer: e.target.value }))}
                      placeholder="Wordt automatisch ingevuld vanuit cliëntgegevens"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Factuurgegevens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="factuurnummer">Factuurnummer</Label>
                    <Input
                      id="factuurnummer"
                      value={invoiceData.factuurnummer}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, factuurnummer: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="uzoviCode">Uzovi-code</Label>
                    <Input
                      id="uzoviCode"
                      value={invoiceData.uzoviCode}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, uzoviCode: e.target.value }))}
                      placeholder="Wordt automatisch ingevuld bij verzekeraar selectie"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="factuurdatum">Factuurdatum</Label>
                    <Input
                      id="factuurdatum"
                      value={invoiceData.factuurdatum}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, factuurdatum: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vervaldatum">Vervaldatum</Label>
                    <Input
                      id="vervaldatum"
                      value={invoiceData.vervaldatum}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, vervaldatum: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Verzekeraar Gegevens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="verzekeraar">Verzekeraar</Label>
                  <Select
                    value={invoiceData.verzekeraar}
                    onValueChange={handleVerzekeraarSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer een verzekeraar" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(UZOVI_CODES).map((verzekeraar) => (
                        <SelectItem key={verzekeraar} value={verzekeraar}>
                          {verzekeraar}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="verzekeraarAdres">Adres</Label>
                  <Input
                    id="verzekeraarAdres"
                    value={invoiceData.verzekeraarAdres}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, verzekeraarAdres: e.target.value }))}
                    placeholder="Wordt automatisch ingevuld bij verzekeraar selectie"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="verzekeraarPostcode">Postcode</Label>
                    <Input
                      id="verzekeraarPostcode"
                      value={invoiceData.verzekeraarPostcode}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, verzekeraarPostcode: e.target.value }))}
                      placeholder="Wordt automatisch ingevuld"
                    />
                  </div>
                  <div>
                    <Label htmlFor="verzekeraarPlaats">Plaats</Label>
                    <Input
                      id="verzekeraarPlaats"
                      value={invoiceData.verzekeraarPlaats}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, verzekeraarPlaats: e.target.value }))}
                      placeholder="Wordt automatisch ingevuld"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="w-5 h-5" />
                  Factuurregels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoiceData.factuurregels.map((regel, index) => (
                  <div key={regel.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <Label htmlFor={`beschrijving-${index}`}>Beschrijving</Label>
                        <Input
                          id={`beschrijving-${index}`}
                          value={regel.beschrijving}
                          onChange={(e) => updateFactuurregel(index, 'beschrijving', e.target.value)}
                          placeholder="Beschrijving van de dienst..."
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor={`aantal-${index}`}>Aantal</Label>
                        <Input
                          id={`aantal-${index}`}
                          type="number"
                          value={regel.aantal}
                          onChange={(e) => updateFactuurregel(index, 'aantal', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor={`eenheidsprijs-${index}`}>€ Prijs</Label>
                        <Input
                          id={`eenheidsprijs-${index}`}
                          type="number"
                          step="0.01"
                          value={regel.eenheidsprijs}
                          onChange={(e) => updateFactuurregel(index, 'eenheidsprijs', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Totaal</Label>
                        <div className="p-2 bg-gray-50 rounded border text-right font-medium">
                          €{regel.totaal.toFixed(2)}
                        </div>
                      </div>
                      <div className="col-span-1">
                        {invoiceData.factuurregels.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFactuurregel(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addFactuurregel} className="w-full">
                  + Regel toevoegen
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notities</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={invoiceData.notities}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, notities: e.target.value }))}
                  placeholder="Extra notities voor de factuur..."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Live Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Factuur Preview
                  <Badge variant="secondary">Live Preview</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white border border-gray-300 rounded-lg p-6 space-y-6">
                  {/* Factuur aan */}
                  <div>
                    <h3 className="font-bold text-lg mb-2">Factuur aan:</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="font-semibold">{invoiceData.verzekeraar || 'Verzekeraar'}</div>
                      <div>{invoiceData.verzekeraarAdres || '-'}</div>
                      <div>{invoiceData.verzekeraarPostcode} {invoiceData.verzekeraarPlaats}</div>
                    </div>
                  </div>

                  {/* Factuurgegevens */}
                  <div>
                    <h3 className="font-bold text-lg mb-2">Factuurgegevens:</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-semibold">Factuurnummer:</span> {invoiceData.factuurnummer}</div>
                      <div><span className="font-semibold">Factuurdatum:</span> {invoiceData.factuurdatum}</div>
                      <div><span className="font-semibold">Vervaldatum:</span> {invoiceData.vervaldatum}</div>
                      <div><span className="font-semibold">Uzovi-code:</span> {invoiceData.uzoviCode}</div>
                    </div>
                  </div>

                  {/* Cliëntgegevens */}
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-gray-500">Cliëntgegevens:</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="font-semibold">Naam:</span> {invoiceData.clientNaam}</div>
                      <div><span className="font-semibold">Geboortedatum:</span> {invoiceData.clientGeboortedatum}</div>
                      <div><span className="font-semibold">BSN:</span> {invoiceData.clientBSN}</div>
                      <div><span className="font-semibold">Polisnummer:</span> {invoiceData.clientPolisnummer}</div>
                    </div>
                  </div>

                  {/* Factuurregels */}
                  <div>
                    <h3 className="font-bold text-lg mb-2">Factuurregels:</h3>
                    <div className="space-y-2">
                      {invoiceData.factuurregels.map((regel, index) => (
                        <div key={regel.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                          <div className="flex-1">
                            <div className="font-medium">{regel.beschrijving || 'Beschrijving...'}</div>
                            <div className="text-sm text-gray-600">
                              {regel.aantal} × €{regel.eenheidsprijs.toFixed(2)}
                            </div>
                          </div>
                          <div className="font-semibold">€{regel.totaal.toFixed(2)}</div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center py-2 border-t-2 border-gray-300 font-bold">
                        <div>Totaal</div>
                        <div>€{getTotaalBedrag().toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Notities */}
                  {invoiceData.notities && (
                    <div>
                      <h3 className="font-bold text-lg mb-2">Notities:</h3>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        {invoiceData.notities}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 