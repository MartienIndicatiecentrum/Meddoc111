import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';

interface NewClientFormProps {
  onClose: () => void;
  onClientAdded?: (clientId: string) => void;
}

interface ClientFormData {
  naam: string;
  adres: string;
  geboortedatum: string;
  telefoonnummer: string;
  bsn: string;
  clientnummer: string;
  verzekeraar: string;
  polisnummer: string;
  extra_informatie: string;
}

export const NewClientForm: React.FC<NewClientFormProps> = ({
  onClose,
  onClientAdded,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>({
    naam: '',
    adres: '',
    geboortedatum: '',
    telefoonnummer: '',
    bsn: '',
    clientnummer: '',
    verzekeraar: '',
    polisnummer: '',
    extra_informatie: '',
  });
  const [datumHuisbezoek, setDatumHuisbezoek] = useState<Date | undefined>(
    undefined
  );
  const [tijdHuisbezoek, setTijdHuisbezoek] = useState<string>('');
  const [showHuisbezoekCalendar, setShowHuisbezoekCalendar] = useState(false);
  const [datumIndicatie, setDatumIndicatie] = useState<Date | undefined>(
    undefined
  );
  const [showIndicatieCalendar, setShowIndicatieCalendar] = useState(false);
  const [afspraakHuisbezoekGemaakt, setAfspraakHuisbezoekGemaakt] =
    useState(false);
  const [heeftNieuweIndicatie, setHeeftNieuweIndicatie] = useState(false); // Voor UI logica

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let datumhuisbezoek = null;
      if (datumHuisbezoek) {
        if (tijdHuisbezoek) {
          // Combineer datum en tijd tot ISO-string
          const [hours, minutes] = tijdHuisbezoek.split(':');
          const combined = new Date(datumHuisbezoek);
          combined.setHours(Number(hours));
          combined.setMinutes(Number(minutes));
          datumhuisbezoek = combined.toISOString();
        } else {
          datumhuisbezoek = datumHuisbezoek.toISOString();
        }
      }
      const datumindicatie = datumIndicatie
        ? datumIndicatie.toISOString()
        : null;

      const insertData = {
        naam: formData.naam,
        adres: formData.adres,
        geboortedatum: formData.geboortedatum,
        telefoon: formData.telefoonnummer,
        bsn: formData.bsn,
        clientnummer: formData.clientnummer,
        verzekeraar: formData.verzekeraar,
        polisnummer: formData.polisnummer,
        algemene_informatie: formData.extra_informatie,
        datumhuisbezoek,
        datumindicatie,
        afspraak_huisbezoek_gemaakt: heeftNieuweIndicatie
          ? afspraakHuisbezoekGemaakt
          : null,
        created_at: new Date().toISOString(),
      };

      console.log('Attempting to insert client with data:', insertData);

      const { data, error } = await supabase
        .from('clients')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      toast({
        title: 'Cliënt toegevoegd',
        description: 'De nieuwe cliënt is succesvol toegevoegd.',
      });

      if (data && onClientAdded) {
        onClientAdded(data.id);
      }

      onClose();
    } catch (error: any) {
      console.error('Full error:', error);
      toast({
        title: 'Fout bij toevoegen',
        description:
          error.message ||
          error.error_description ||
          'Er is een fout opgetreden bij het toevoegen van de cliënt.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50'>
      <Card className='w-full max-w-5xl'>
        <CardHeader>
          <CardTitle>Nieuwe Cliënt</CardTitle>
          <CardDescription>
            Vul de gegevens van de nieuwe cliënt in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-8'>
            <div className='grid grid-cols-3 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='naam'>Naam *</Label>
                <Input
                  id='naam'
                  name='naam'
                  value={formData.naam}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='geboortedatum'>Geboortedatum</Label>
                <Input
                  id='geboortedatum'
                  name='geboortedatum'
                  type='date'
                  value={formData.geboortedatum}
                  onChange={handleInputChange}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='adres'>Adres</Label>
                <Input
                  id='adres'
                  name='adres'
                  value={formData.adres}
                  onChange={handleInputChange}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='telefoonnummer'>Telefoonnummer</Label>
                <Input
                  id='telefoonnummer'
                  name='telefoonnummer'
                  type='tel'
                  value={formData.telefoonnummer}
                  onChange={handleInputChange}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='bsn'>BSN</Label>
                <Input
                  id='bsn'
                  name='bsn'
                  value={formData.bsn}
                  onChange={handleInputChange}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='clientnummer'>Cliëntnummer</Label>
                <Input
                  id='clientnummer'
                  name='clientnummer'
                  value={formData.clientnummer}
                  onChange={handleInputChange}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='verzekeraar'>Verzekeraar</Label>
                <Input
                  id='verzekeraar'
                  name='verzekeraar'
                  value={formData.verzekeraar}
                  onChange={handleInputChange}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='polisnummer'>Polisnummer</Label>
                <Input
                  id='polisnummer'
                  name='polisnummer'
                  value={formData.polisnummer}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className='grid grid-cols-3 gap-6'>
              <div className='space-y-2 col-span-1'>
                <Label>Datum huisbezoek (optioneel)</Label>
                <div className='flex items-center gap-4 flex-wrap'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setShowHuisbezoekCalendar(v => !v)}
                    className='w-44 justify-start'
                  >
                    {datumHuisbezoek
                      ? format(datumHuisbezoek, 'dd-MM-yyyy')
                      : 'Kies datum'}
                  </Button>
                  {showHuisbezoekCalendar && (
                    <div className='z-50 bg-white rounded shadow p-2 mt-2'>
                      <Calendar
                        mode='single'
                        selected={datumHuisbezoek}
                        onSelect={date => {
                          setDatumHuisbezoek(date);
                          setShowHuisbezoekCalendar(false);
                        }}
                        initialFocus
                      />
                    </div>
                  )}
                </div>
                {datumHuisbezoek && (
                  <Input
                    type='time'
                    value={tijdHuisbezoek}
                    onChange={e => setTijdHuisbezoek(e.target.value)}
                    className='mt-2 w-44'
                    placeholder='Tijd huisbezoek (optioneel)'
                  />
                )}
              </div>
              <div className='space-y-2 col-span-1'>
                <Label>Datum indicatie (optioneel)</Label>
                <div className='flex items-center gap-4 flex-wrap'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setShowIndicatieCalendar(v => !v)}
                    className='w-44 justify-start'
                  >
                    {datumIndicatie
                      ? format(datumIndicatie, 'dd-MM-yyyy')
                      : 'Kies datum'}
                  </Button>
                  {showIndicatieCalendar && (
                    <div className='z-50 bg-white rounded shadow p-2 mt-2'>
                      <Calendar
                        mode='single'
                        selected={datumIndicatie}
                        onSelect={date => {
                          setDatumIndicatie(date);
                          setShowIndicatieCalendar(false);
                        }}
                        initialFocus
                      />
                    </div>
                  )}
                </div>
              </div>
              {heeftNieuweIndicatie && (
                <div className='space-y-2 col-span-1 flex flex-col justify-end'>
                  <Label>Afspraak huisbezoek al gemaakt?</Label>
                  <div className='flex items-center gap-2 mt-2'>
                    <Switch
                      checked={afspraakHuisbezoekGemaakt}
                      onCheckedChange={setAfspraakHuisbezoekGemaakt}
                      id='afspraak_huisbezoek_gemaakt'
                    />
                    <span>{afspraakHuisbezoekGemaakt ? 'Ja' : 'Nee'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className='space-y-2 col-span-3'>
              <Label htmlFor='extra_informatie'>Extra informatie</Label>
              <Textarea
                id='extra_informatie'
                name='extra_informatie'
                value={formData.extra_informatie}
                onChange={handleInputChange}
                className='min-h-[150px]'
                placeholder='Voeg hier eventuele extra informatie toe...'
              />
            </div>

            <div className='flex justify-end space-x-4 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={onClose}
                disabled={isSubmitting}
              >
                Annuleren
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Bezig met opslaan...' : 'Opslaan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
