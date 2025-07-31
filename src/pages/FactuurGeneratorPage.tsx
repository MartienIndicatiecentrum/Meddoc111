import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import AppLayout from '@/components/layout/AppLayout';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Uzovi-code mapping per verzekeraar
const UZOVI_CODES = {
  // Basis verzekeraars
  'De Friesland': '3358',
  FBTO: '3351',
  Interpolis: '3313',
  'De Christelijke Zorgverzekeraar': '3311',
  ZieZo: '3311',
  CZ: '7119',
  VGZ: '7095',
  Menzis: '3332',
  Anderzorg: '3334',
  AGIS: '3336',
  ASR: '9018',
  OHRA: '7053',
  'Stad Holland': '7037',

  // Uitgebreide mapping uit Excel sheets
  'Avéro Achmea Zorgverzekeringen NV': '3329',
  'Menzis Zorgverzekeraar N.V.': '3332',
  'Anderzorg N.V.': '3334',
  'AGIS Zorgverzekeringen NV': '3336',
  'BetterDi@b+': '3340',
  'FBTO zorgverzekeringen N.V.': '3351',
  'Iptiq Life S.A.': '3352',
  Caresq: '3356',
  'De Friesland Zorgverzekeraar N.V.': '3358',
  ZEKUR: '3361',
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
  Achmea: '3329',
  'Zilveren Kruis': '9018',
  'Nationale-Nederlanden': '9644',
  'Centrale Verwerkingseenheid CZ': '9644',
};

// Mapping van verzekeraar naar adresgegevens
const VERZEKERAAR_ADRESSEN: Record<
  string,
  { adres: string; postcode: string; plaats: string }
> = {
  'Zilveren Kruis': {
    adres: 'Postbus 70001',
    postcode: '3000 KB',
    plaats: 'Rotterdam',
  },
  'De Friesland': {
    adres: 'Postbus 270',
    postcode: '8901 BB',
    plaats: 'Leeuwarden',
  },
  FBTO: { adres: 'Postbus 318', postcode: '8901 BC', plaats: 'Leeuwarden' },
  Interpolis: {
    adres: 'Postbus 75000',
    postcode: '5000 LC',
    plaats: 'Tilburg',
  },
  'De Christelijke Zorgverzekeraar': {
    adres: 'Postbus 25150',
    postcode: '5600 RS',
    plaats: 'Eindhoven',
  },
  ZieZo: { adres: 'Postbus 70001', postcode: '3000 KB', plaats: 'Rotterdam' },
  CZ: { adres: 'Postbus 90152', postcode: '5000 LD', plaats: 'Tilburg' },
  CZdirect: { adres: 'Postbus 90152', postcode: '5000 LD', plaats: 'Tilburg' },
  Just: { adres: 'Postbus 90152', postcode: '5000 LD', plaats: 'Tilburg' },
  'Nationale-Nederlanden': {
    adres: 'Postbus 90152',
    postcode: '5000 LD',
    plaats: 'Tilburg',
  },
  OHRA: { adres: 'Postbus 90152', postcode: '5000 LD', plaats: 'Tilburg' },
  VGZ: { adres: 'Postbus 445', postcode: '5600 AK', plaats: 'Eindhoven' },
  'VGZ Bewuzt': {
    adres: 'Postbus 445',
    postcode: '5600 AK',
    plaats: 'Eindhoven',
  },
  IZA: { adres: 'Postbus 445', postcode: '5600 AK', plaats: 'Eindhoven' },
  Univé: { adres: 'Postbus 445', postcode: '5600 AK', plaats: 'Eindhoven' },
  'United Consumers VGZ': {
    adres: 'Postbus 445',
    postcode: '5600 AK',
    plaats: 'Eindhoven',
  },
};

export default function FactuurGeneratorPage() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Factuur instellingen
  const [numberOfHours, setNumberOfHours] = useState('1');
  const [hourlyRate, setHourlyRate] = useState('45.00');
  const [vatRate, setVatRate] = useState('21');

  // Betaalgegevens
  const [iban, setIban] = useState('NL91ABNA0417164300');
  const [accountHolder, setAccountHolder] = useState('MedDoc AI Flow');
  const [paymentDescription, setPaymentDescription] = useState(
    'Factuur MedDoc AI Flow'
  );

  // Factuurregels
  const [invoiceLines, setInvoiceLines] = useState([
    {
      id: 1,
      date: '',
      description: '',
      hours: '1',
      rate: '45.00',
      total: '45.00',
    },
  ]);

  // Genereer factuurnummer en datums bij component mount
  useEffect(() => {
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 14); // 14 dagen na factuurdatum

    setInvoiceDate(today.toLocaleDateString('nl-NL'));
    setDueDate(dueDate.toLocaleDateString('nl-NL'));

    // Genereer factuurnummer (2025-XXX format)
    const year = today.getFullYear();
    const randomNum = Math.floor(Math.random() * 999) + 1;
    setInvoiceNumber(`${year}-${randomNum.toString().padStart(3, '0')}`);
  }, []);

  // Haal cliënten op
  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, naam, verzekeraar')
        .order('naam');
      setClients(data || []);
    };
    fetchClients();
  }, []);

  // Haal cliëntgegevens op bij selectie
  useEffect(() => {
    if (!selectedClient) {
      setClientData(null);
      return;
    }

    const fetchClientData = async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', selectedClient.id)
        .single();

      if (!error && data) {
        // Zorg ervoor dat alle verzekeraar gegevens correct worden ingevuld
        const verzekeraarAdres = VERZEKERAAR_ADRESSEN[data.verzekeraar] || {
          adres: '',
          postcode: '',
          plaats: '',
        };

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

        setClientData({
          ...data,
          // Zorg ervoor dat datum correct wordt geformatteerd
          geboortedatum: formattedDate,
          // Zorg ervoor dat verzekeraar gegevens correct zijn
          verzekeraar: data.verzekeraar || '',
          // Voeg verzekeraar adres gegevens toe als ze niet bestaan
          verzekeraarAdres: verzekeraarAdres.adres,
          verzekeraarPostcode: verzekeraarAdres.postcode,
          verzekeraarPlaats: verzekeraarAdres.plaats,
        });
      }
    };

    fetchClientData();
  }, [selectedClient]);

  const getUzoviCode = verzekeraar => {
    return UZOVI_CODES[verzekeraar] || '0000';
  };

  // Functie om verzekeraar gegevens automatisch in te vullen
  const handleVerzekeraarSelect = async selectedVerzekeraar => {
    if (clientData) {
      // Haal verzekeraar adres gegevens op
      const verzekeraarAdres = VERZEKERAAR_ADRESSEN[selectedVerzekeraar] || {
        adres: '',
        postcode: '',
        plaats: '',
      };
      const uzoviCode = UZOVI_CODES[selectedVerzekeraar] || '0000';

      // Update client data met alle verzekeraar gegevens
      setClientData(prev => ({
        ...prev,
        verzekeraar: selectedVerzekeraar,
        verzekeraarAdres: verzekeraarAdres.adres,
        verzekeraarPostcode: verzekeraarAdres.postcode,
        verzekeraarPlaats: verzekeraarAdres.plaats,
        uzoviCode: `${uzoviCode} / ${selectedVerzekeraar}`,
      }));

      // Update verzekeraar in database
      try {
        const { error } = await supabase
          .from('clients')
          .update({
            verzekeraar: selectedVerzekeraar,
            verzekeraar_adres: verzekeraarAdres.adres,
            verzekeraar_postcode: verzekeraarAdres.postcode,
            verzekeraar_plaats: verzekeraarAdres.plaats,
            uzovi_code: `${uzoviCode} / ${selectedVerzekeraar}`,
          })
          .eq('id', clientData.id);

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

  // Functie om datum correct te formatteren
  const formatDate = (dateString: string | null) => {
    if (!dateString) {
      return '';
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '';
      }
      return date.toLocaleDateString('nl-NL');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // Functie om datum input te parsen
  const parseDateInput = (dateInput: string) => {
    if (!dateInput) {
      return null;
    }

    // Probeer verschillende datum formaten
    const formats = [
      /^\d{1,2}-\d{1,2}-\d{4}$/, // DD-MM-YYYY
      /^\d{4}-\d{1,2}-\d{1,2}$/, // YYYY-MM-DD
      /^\d{1,2}\/\d{1,2}\/\d{4}$/, // DD/MM/YYYY
    ];

    for (const format of formats) {
      if (format.test(dateInput)) {
        const date = new Date(dateInput);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
        }
      }
    }

    return null;
  };

  // Functie om cliëntgegevens bij te werken in database
  const updateClientData = async (field: string, value: string) => {
    if (clientData) {
      try {
        const { error } = await supabase
          .from('clients')
          .update({ [field]: value })
          .eq('id', clientData.id);

        if (error) {
          console.error(`Error updating ${field}:`, error);
        } else {
          console.log(`${field} updated in database`);
        }
      } catch (error) {
        console.error(`Error updating ${field}:`, error);
      }
    }
  };

  const generatePDF = () => {
    if (!clientData) {
      return;
    }

    // Navigeer naar de PDF sjabloon pagina met cliënt ID
    window.location.href = `/factuur-pdf-sjabloon?clientId=${clientData.id}`;
  };

  // Bereken totaalbedrag
  const calculateTotal = () => {
    const subtotal = parseFloat(numberOfHours) * parseFloat(hourlyRate);
    const vatAmount = subtotal * (parseFloat(vatRate) / 100);
    return {
      subtotal: subtotal.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      total: (subtotal + vatAmount).toFixed(2),
    };
  };

  // Voeg factuurregel toe
  const addInvoiceLine = () => {
    const newId = Math.max(...invoiceLines.map(line => line.id)) + 1;
    setInvoiceLines([
      ...invoiceLines,
      {
        id: newId,
        date: '',
        description: '',
        hours: '1',
        rate: hourlyRate,
        total: hourlyRate,
      },
    ]);
  };

  // Verwijder factuurregel
  const removeInvoiceLine = id => {
    setInvoiceLines(invoiceLines.filter(line => line.id !== id));
  };

  // Update factuurregel
  const updateInvoiceLine = (id, field, value) => {
    setInvoiceLines(
      invoiceLines.map(line => {
        if (line.id === id) {
          const updatedLine = { ...line, [field]: value };
          if (field === 'hours' || field === 'rate') {
            const hours = parseFloat(updatedLine.hours) || 0;
            const rate = parseFloat(updatedLine.rate) || 0;
            updatedLine.total = (hours * rate).toFixed(2);
          }
          return updatedLine;
        }
        return line;
      })
    );
  };

  return (
    <AppLayout>
      <div className='max-w-full mx-auto py-8 px-4 sm:px-6 lg:px-8'>
        <div className='mb-8'>
          <div className='flex justify-between items-start mb-6'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Factuur Generator
              </h1>
              <p className='text-gray-600 mt-2'>
                Genereer automatisch facturen voor cliënten
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className='flex flex-wrap gap-4 items-center mb-6'>
            <Link to='/taken'>
              <Button
                variant='outline'
                className='bg-blue-600 text-white hover:bg-blue-700'
              >
                Terug naar Taken
              </Button>
            </Link>

            {/* Client Selection */}
            <Autocomplete
              options={clients}
              getOptionLabel={option => option.naam}
              value={selectedClient}
              onChange={(_, newValue) => setSelectedClient(newValue)}
              renderInput={params => (
                <TextField
                  {...params}
                  label='Selecteer cliënt'
                  variant='outlined'
                  size='small'
                  placeholder='Kies een cliënt voor factuur...'
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#e6f0fa',
                    },
                  }}
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              sx={{ minWidth: 300 }}
            />
          </div>
        </div>

        {/* Factuur Invulvelden */}
        {clientData ? (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* Invulvelden */}
            <div className='space-y-6'>
              <Card className='bg-white'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    📝 Factuur Invulvelden
                    <Badge variant='secondary'>Bewerkbaar</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {/* Cliëntgegevens */}
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='clientNaam' className='text-gray-500'>
                        Cliënt Naam
                      </Label>
                      <Input
                        id='clientNaam'
                        value={clientData.naam || ''}
                        onChange={e => {
                          setClientData(prev => ({
                            ...prev,
                            naam: e.target.value,
                          }));
                          updateClientData('naam', e.target.value);
                        }}
                        placeholder='Wordt automatisch ingevuld vanuit cliëntgegevens'
                      />
                    </div>
                    <div>
                      <Label htmlFor='clientGeboortedatum'>Geboortedatum</Label>
                      <Input
                        id='clientGeboortedatum'
                        type='date'
                        value={clientData.geboortedatum || ''}
                        onChange={e => {
                          const newDate = e.target.value;
                          setClientData(prev => ({
                            ...prev,
                            geboortedatum: newDate,
                          }));
                          updateClientData('geboortedatum', newDate);
                        }}
                        placeholder='Wordt automatisch ingevuld vanuit cliëntgegevens'
                      />
                    </div>
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='clientBSN'>BSN</Label>
                      <Input
                        id='clientBSN'
                        value={clientData.bsn || ''}
                        onChange={e => {
                          setClientData(prev => ({
                            ...prev,
                            bsn: e.target.value,
                          }));
                          updateClientData('bsn', e.target.value);
                        }}
                        placeholder='Wordt automatisch ingevuld vanuit cliëntgegevens'
                      />
                    </div>
                    <div>
                      <Label htmlFor='clientPolisnummer'>Polisnummer</Label>
                      <Input
                        id='clientPolisnummer'
                        value={
                          clientData.polisnummer ||
                          clientData.machtigingsnummer ||
                          ''
                        }
                        onChange={e => {
                          setClientData(prev => ({
                            ...prev,
                            polisnummer: e.target.value,
                          }));
                          updateClientData('polisnummer', e.target.value);
                        }}
                        placeholder='Wordt automatisch ingevuld vanuit cliëntgegevens'
                      />
                    </div>
                  </div>

                  {/* Factuurgegevens */}
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='factuurnummer'>Factuurnummer</Label>
                      <Input
                        id='factuurnummer'
                        value={invoiceNumber}
                        onChange={e => setInvoiceNumber(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor='uzoviCode'>Uzovi-code</Label>
                      <Input
                        id='uzoviCode'
                        value={
                          clientData.uzoviCode ||
                          `${getUzoviCode(clientData.verzekeraar)} / ${clientData.verzekeraar}`
                        }
                        onChange={e => {
                          setClientData(prev => ({
                            ...prev,
                            uzoviCode: e.target.value,
                          }));
                        }}
                        placeholder='Wordt automatisch ingevuld bij verzekeraar selectie'
                      />
                    </div>
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='factuurdatum'>Factuurdatum</Label>
                      <Input
                        id='factuurdatum'
                        value={invoiceDate}
                        onChange={e => setInvoiceDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor='vervaldatum'>Vervaldatum</Label>
                      <Input
                        id='vervaldatum'
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Verzekeraar gegevens */}
                  <div>
                    <Label htmlFor='verzekeraar'>Verzekeraar</Label>
                    <Select
                      value={clientData.verzekeraar || ''}
                      onValueChange={handleVerzekeraarSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Selecteer een verzekeraar' />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(UZOVI_CODES).map(verzekeraar => (
                          <SelectItem key={verzekeraar} value={verzekeraar}>
                            {verzekeraar}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor='verzekeraarAdres'>Verzekeraar Adres</Label>
                    <Input
                      id='verzekeraarAdres'
                      value={
                        clientData.verzekeraarAdres ||
                        VERZEKERAAR_ADRESSEN[clientData.verzekeraar]?.adres ||
                        ''
                      }
                      onChange={e => {
                        setClientData(prev => ({
                          ...prev,
                          verzekeraarAdres: e.target.value,
                        }));
                      }}
                      placeholder='Wordt automatisch ingevuld bij verzekeraar selectie'
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='verzekeraarPostcode'>Postcode</Label>
                      <Input
                        id='verzekeraarPostcode'
                        value={
                          clientData.verzekeraarPostcode ||
                          VERZEKERAAR_ADRESSEN[clientData.verzekeraar]
                            ?.postcode ||
                          ''
                        }
                        onChange={e => {
                          setClientData(prev => ({
                            ...prev,
                            verzekeraarPostcode: e.target.value,
                          }));
                        }}
                        placeholder='Wordt automatisch ingevuld'
                      />
                    </div>
                    <div>
                      <Label htmlFor='verzekeraarPlaats'>Plaats</Label>
                      <Input
                        id='verzekeraarPlaats'
                        value={
                          clientData.verzekeraarPlaats ||
                          VERZEKERAAR_ADRESSEN[clientData.verzekeraar]
                            ?.plaats ||
                          ''
                        }
                        onChange={e => {
                          setClientData(prev => ({
                            ...prev,
                            verzekeraarPlaats: e.target.value,
                          }));
                        }}
                        placeholder='Wordt automatisch ingevuld'
                      />
                    </div>
                  </div>

                  {/* Factuur instellingen */}
                  <div className='border-t pt-4'>
                    <h4 className='font-semibold text-gray-900 mb-3'>
                      💰 Factuur Instellingen
                    </h4>
                    <div className='grid grid-cols-3 gap-4'>
                      <div>
                        <Label htmlFor='numberOfHours'>Aantal uren</Label>
                        <Input
                          id='numberOfHours'
                          type='number'
                          step='0.5'
                          value={numberOfHours}
                          onChange={e => setNumberOfHours(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor='hourlyRate'>Uurtarief (€)</Label>
                        <Input
                          id='hourlyRate'
                          type='number'
                          step='0.01'
                          value={hourlyRate}
                          onChange={e => setHourlyRate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor='vatRate'>BTW percentage (%)</Label>
                        <Input
                          id='vatRate'
                          type='number'
                          value={vatRate}
                          onChange={e => setVatRate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Betaalgegevens */}
                  <div className='border-t pt-4'>
                    <h4 className='font-semibold text-gray-900 mb-3'>
                      💳 Betaalgegevens
                    </h4>
                    <div className='grid grid-cols-1 gap-4'>
                      <div>
                        <Label htmlFor='iban'>IBAN</Label>
                        <Input
                          id='iban'
                          value={iban}
                          onChange={e => setIban(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor='accountHolder'>Rekeninghouder</Label>
                        <Input
                          id='accountHolder'
                          value={accountHolder}
                          onChange={e => setAccountHolder(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor='paymentDescription'>Omschrijving</Label>
                        <Input
                          id='paymentDescription'
                          value={paymentDescription}
                          onChange={e => setPaymentDescription(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Factuurregels */}
              <Card className='bg-white'>
                <CardHeader>
                  <CardTitle className='flex items-center justify-between'>
                    📋 Factuurregels
                    <Button
                      onClick={addInvoiceLine}
                      variant='outline'
                      size='sm'
                      className='bg-blue-600 text-white hover:bg-blue-700'
                    >
                      + Regel toevoegen
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {invoiceLines.map((line, index) => (
                    <div
                      key={line.id}
                      className='border border-gray-200 rounded-lg p-4'
                    >
                      <div className='flex justify-between items-center mb-3'>
                        <h5 className='font-medium text-gray-900'>
                          Regel {index + 1}
                        </h5>
                        {invoiceLines.length > 1 && (
                          <Button
                            onClick={() => removeInvoiceLine(line.id)}
                            variant='outline'
                            size='sm'
                            className='text-red-600 hover:text-red-700'
                          >
                            Verwijder
                          </Button>
                        )}
                      </div>
                      <div className='grid grid-cols-2 gap-4 mb-3'>
                        <div>
                          <Label htmlFor={`date-${line.id}`}>Datum</Label>
                          <Input
                            id={`date-${line.id}`}
                            type='date'
                            value={line.date}
                            onChange={e =>
                              updateInvoiceLine(line.id, 'date', e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor={`hours-${line.id}`}>Uren</Label>
                          <Input
                            id={`hours-${line.id}`}
                            type='number'
                            step='0.5'
                            value={line.hours}
                            onChange={e =>
                              updateInvoiceLine(
                                line.id,
                                'hours',
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className='grid grid-cols-3 gap-4'>
                        <div className='col-span-2'>
                          <Label htmlFor={`description-${line.id}`}>
                            Omschrijving
                          </Label>
                          <Input
                            id={`description-${line.id}`}
                            value={line.description}
                            onChange={e =>
                              updateInvoiceLine(
                                line.id,
                                'description',
                                e.target.value
                              )
                            }
                            placeholder='Beschrijving van de geleverde dienst...'
                          />
                        </div>
                        <div>
                          <Label htmlFor={`rate-${line.id}`}>Tarief (€)</Label>
                          <Input
                            id={`rate-${line.id}`}
                            type='number'
                            step='0.01'
                            value={line.rate}
                            onChange={e =>
                              updateInvoiceLine(line.id, 'rate', e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className='mt-3 text-right'>
                        <span className='font-semibold text-gray-900'>
                          Totaal regel: € {line.total}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Acties */}
              <Card className='bg-white'>
                <CardHeader>
                  <CardTitle>📋 Factuur Acties</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <Button
                      onClick={generatePDF}
                      className='w-full bg-blue-600 hover:bg-blue-700'
                      disabled={!clientData}
                    >
                      📥 Download als PDF
                    </Button>

                    <Button
                      variant='outline'
                      className='w-full'
                      disabled={!clientData}
                    >
                      🖨️ Print Factuur
                    </Button>
                  </div>

                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                    <h4 className='font-medium text-blue-900 mb-2'>
                      💡 Over de Factuur Generator:
                    </h4>
                    <ul className='text-sm text-blue-800 space-y-1'>
                      <li>
                        • Selecteer een cliënt om automatisch factuurgegevens in
                        te vullen
                      </li>
                      <li>• Factuurnummer wordt automatisch gegenereerd</li>
                      <li>
                        • Uzovi-code wordt automatisch toegevoegd op basis van
                        verzekeraar
                      </li>
                      <li>
                        • Voeg meerdere factuurregels toe voor gedetailleerde
                        facturen
                      </li>
                      <li>• BTW wordt automatisch berekend</li>
                      <li>• Factuur kan direct gedownload of geprint worden</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Factuur Preview */}
            <Card className='bg-white'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  📄 Factuur Preview
                  <Badge variant='secondary'>Live Preview</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* Factuur aan */}
                <div>
                  <h3 className='font-bold text-lg mb-2'>Factuur aan:</h3>
                  <div className='bg-gray-50 p-4 rounded-lg'>
                    <div className='font-semibold'>
                      {clientData.verzekeraar || 'Verzekeraar'}
                    </div>
                    <div>
                      {VERZEKERAAR_ADRESSEN[clientData.verzekeraar]?.adres ||
                        '-'}
                    </div>
                    <div>
                      {VERZEKERAAR_ADRESSEN[clientData.verzekeraar]?.postcode ||
                        ''}{' '}
                      {VERZEKERAAR_ADRESSEN[clientData.verzekeraar]?.plaats ||
                        ''}
                    </div>
                  </div>
                </div>

                {/* Factuurgegevens */}
                <div>
                  <h3 className='font-bold text-lg mb-2'>Factuurgegevens:</h3>
                  <div className='space-y-2 text-sm'>
                    <div>
                      <span className='font-semibold'>Factuurnummer:</span>{' '}
                      {invoiceNumber}
                    </div>
                    <div>
                      <span className='font-semibold'>Factuurdatum:</span>{' '}
                      {invoiceDate}
                    </div>
                    <div>
                      <span className='font-semibold'>Vervaldatum:</span>{' '}
                      {dueDate}
                    </div>
                    <div>
                      <span className='font-semibold'>Uzovi-code:</span>{' '}
                      {getUzoviCode(clientData.verzekeraar)} /{' '}
                      {clientData.verzekeraar}
                    </div>
                  </div>
                </div>

                {/* Cliëntgegevens */}
                <div>
                  <h3 className='font-bold text-lg mb-2'>Cliëntgegevens:</h3>
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div>
                      <span className='font-semibold'>Naam:</span>{' '}
                      {clientData.naam}
                    </div>
                    <div>
                      <span className='font-semibold'>Geboortedatum:</span>{' '}
                      {clientData.geboortedatum
                        ? new Date(clientData.geboortedatum).toLocaleDateString(
                            'nl-NL'
                          )
                        : '-'}
                    </div>
                    <div>
                      <span className='font-semibold'>BSN:</span>{' '}
                      {clientData.bsn || '-'}
                    </div>
                    <div>
                      <span className='font-semibold'>Polisnummer:</span>{' '}
                      {clientData.polisnummer ||
                        clientData.machtigingsnummer ||
                        '-'}
                    </div>
                  </div>
                </div>

                {/* Factuurregels */}
                <div>
                  <h3 className='font-bold text-lg mb-2'>Factuurregels:</h3>
                  <div className='space-y-2'>
                    {invoiceLines.map((line, index) => (
                      <div key={line.id} className='bg-gray-50 p-3 rounded-lg'>
                        <div className='flex justify-between items-start'>
                          <div className='flex-1'>
                            <div className='font-medium text-sm'>
                              Regel {index + 1}
                            </div>
                            <div className='text-sm text-gray-600'>
                              {line.description || 'Geen omschrijving'}
                            </div>
                            <div className='text-xs text-gray-500'>
                              {line.date
                                ? new Date(line.date).toLocaleDateString(
                                    'nl-NL'
                                  )
                                : 'Geen datum'}{' '}
                              • {line.hours} uur • €{line.rate}/uur
                            </div>
                          </div>
                          <div className='font-semibold text-sm'>
                            € {line.total}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totaalbedrag */}
                <div>
                  <h3 className='font-bold text-lg mb-2'>Totaalbedrag:</h3>
                  <div className='bg-blue-50 p-4 rounded-lg space-y-2'>
                    <div className='flex justify-between'>
                      <span>Subtotaal:</span>
                      <span>€ {calculateTotal().subtotal}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span>BTW ({vatRate}%):</span>
                      <span>€ {calculateTotal().vatAmount}</span>
                    </div>
                    <div className='flex justify-between font-bold text-lg border-t pt-2'>
                      <span>Totaal:</span>
                      <span>€ {calculateTotal().total}</span>
                    </div>
                  </div>
                </div>

                {/* Betaalgegevens */}
                <div>
                  <h3 className='font-bold text-lg mb-2'>Betaalgegevens:</h3>
                  <div className='bg-gray-50 p-4 rounded-lg space-y-2 text-sm'>
                    <div>
                      <span className='font-semibold'>IBAN:</span> {iban}
                    </div>
                    <div>
                      <span className='font-semibold'>Rekeninghouder:</span>{' '}
                      {accountHolder}
                    </div>
                    <div>
                      <span className='font-semibold'>Omschrijving:</span>{' '}
                      {paymentDescription}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className='bg-white'>
            <CardContent className='p-8 text-center'>
              <div className='text-gray-400 text-6xl mb-4'>📄</div>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                Selecteer een cliënt
              </h3>
              <p className='text-gray-600 mb-4'>
                Kies een cliënt uit de dropdown hierboven om een factuur te
                genereren.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
