import React from 'react';
import { Client } from './types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Heart,
  Calendar,
  FileText,
  ClipboardList,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
  Users,
} from 'lucide-react';
import ClientNotes from './ClientNotes';

interface ClientDetailsModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (client: Client) => void;
  onQuickAction: (action: string, clientId: string) => void;
}

const statusLabels: Record<string, string> = {
  intake_pending: 'Intake Wachtend',
  assessment_phase: 'Assessment Fase',
  care_planning: 'Zorgplanning',
  active_care: 'Actieve Zorg',
  care_suspended: 'Zorg Onderbroken',
  care_ended: 'Zorg Beëindigd',
  transferred: 'Overgedragen',
};

const careLevelLabels: Record<string, string> = {
  wlz_1: 'WLZ-1',
  wlz_2: 'WLZ-2',
  wlz_3: 'WLZ-3',
  wlz_4: 'WLZ-4',
  wlz_5: 'WLZ-5',
  wmo: 'WMO',
  zvw: 'ZVW',
};

export const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({
  client,
  isOpen,
  onClose,
  onEdit,
  onQuickAction,
}) => {
  const [maxTabHeight, setMaxTabHeight] = React.useState<number | undefined>(
    undefined
  );
  const tabRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  React.useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => {
      const heights = tabRefs.current.map(ref => ref?.offsetHeight || 0);
      const max = Math.max(...heights);
      setMaxTabHeight(max > 0 ? max : undefined);
    }, 50);
  }, [isOpen, client]);

  if (!client) {
    return null;
  }

  const initials =
    `${client.firstName[0] ?? ''}${client.lastName[0] ?? ''}`.toUpperCase();
  const age =
    client.dateOfBirth.getFullYear() !== 1900
      ? new Date().getFullYear() - new Date(client.dateOfBirth).getFullYear()
      : null;
  const statusInfo = statusLabels[client.care.status] || client.care.status;
  const careLevelInfo =
    careLevelLabels[client.care.careLevel] || client.care.careLevel;

  // Helper function to display info or fallback with styling
  const displayInfo = (
    value: string | undefined | null,
    fallback: string = 'Geen informatie beschikbaar'
  ) => {
    const isEmpty =
      !value || value === fallback || value === 'Naam niet beschikbaar';
    return isEmpty ? (
      <span className='text-gray-400 italic'>{fallback}</span>
    ) : (
      <span className='text-gray-900'>{value}</span>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-hidden'>
        <DialogHeader className='pb-4'>
          <div className='flex items-center gap-4'>
            <div className='flex-1'>
              <DialogTitle className='text-2xl font-bold text-gray-500 mb-2'>
                <div className='inline-flex items-center gap-3 px-4 py-2 rounded-full bg-purple-100 text-purple-800 border border-purple-500 font-semibold'>
                  <div className='w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-semibold text-sm flex-shrink-0'>
                    {initials}
                  </div>
                  {client.fullName}
                </div>
              </DialogTitle>
              <div className='flex items-center gap-3'>
                <Badge
                  className={`px-3 py-1 ${
                    client.care.status === 'active_care'
                      ? 'bg-green-100 text-green-800'
                      : client.care.status === 'intake_pending'
                        ? 'bg-blue-100 text-blue-800'
                        : client.care.status === 'care_suspended'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {statusInfo}
                </Badge>
                <span className='text-sm text-gray-600'>BSN: {client.bsn}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue='general' className='flex-1 overflow-hidden'>
          <TabsList className='grid w-full grid-cols-5 mb-4'>
            <TabsTrigger value='general' className='text-xs'>
              Algemeen
            </TabsTrigger>
            <TabsTrigger value='care' className='text-xs'>
              Zorginfo
            </TabsTrigger>
            <TabsTrigger value='workflow' className='text-xs'>
              Workflow
            </TabsTrigger>
            <TabsTrigger value='services' className='text-xs'>
              Diensten
            </TabsTrigger>
            <TabsTrigger value='notes' className='text-xs'>
              Notities
            </TabsTrigger>
          </TabsList>

          <div
            className='overflow-y-auto max-h-[60vh] pr-4'
            style={{
              minHeight: maxTabHeight ? `${maxTabHeight}px` : undefined,
            }}
          >
            {/* General Information Tab */}
            <TabsContent
              ref={el => (tabRefs.current[0] = el)}
              value='general'
              className='space-y-6'
            >
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Personal Info */}
                <div className='space-y-4'>
                  <h3 className='font-semibold text-lg flex items-center gap-2'>
                    <User className='w-5 h-5 text-blue-600' />
                    Persoonlijke Gegevens
                  </h3>
                  <div className='space-y-3 text-sm'>
                    <div>
                      <span className='font-medium text-gray-700'>
                        Volledige naam:
                      </span>
                      <p>{displayInfo(client.fullName)}</p>
                    </div>
                    <div>
                      <span className='font-medium text-gray-700'>
                        Geboortedatum:
                      </span>
                      <p>
                        {age !== null ? (
                          <span className='text-gray-900'>
                            {client.dateOfBirth.toLocaleDateString('nl-NL')} (
                            {age} jaar)
                          </span>
                        ) : (
                          <span className='text-gray-400 italic'>
                            Geen informatie beschikbaar
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className='font-medium text-gray-700'>
                        Geslacht:
                      </span>
                      <p className='text-gray-400 italic'>Niet vermeld</p>
                    </div>
                    <div>
                      <span className='font-medium text-gray-700'>BSN:</span>
                      <p className='font-mono'>{displayInfo(client.bsn)}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className='space-y-4'>
                  <h3 className='font-semibold text-lg flex items-center gap-2'>
                    <Phone className='w-5 h-5 text-green-600' />
                    Contactgegevens
                  </h3>
                  <div className='space-y-3 text-sm'>
                    <div>
                      <span className='font-medium text-gray-700'>
                        Telefoon:
                      </span>
                      <p>{displayInfo(client.contact.phone)}</p>
                    </div>
                    {client.contact.mobile && (
                      <div>
                        <span className='font-medium text-gray-700'>
                          Mobiel:
                        </span>
                        <p>{displayInfo(client.contact.mobile)}</p>
                      </div>
                    )}
                    <div>
                      <span className='font-medium text-gray-700'>Email:</span>
                      <p>{displayInfo(client.contact.email)}</p>
                    </div>
                    <div>
                      <span className='font-medium text-gray-700'>
                        Voorkeur contact:
                      </span>
                      <p className='text-gray-900 capitalize'>
                        {client.contact.preferredContactMethod}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Address */}
                <div className='space-y-4'>
                  <h3 className='font-semibold text-lg flex items-center gap-2'>
                    <MapPin className='w-5 h-5 text-red-600' />
                    Adresgegevens
                  </h3>
                  <div className='space-y-3 text-sm'>
                    <div>
                      <span className='font-medium text-gray-700'>Adres:</span>
                      <p>
                        {displayInfo(
                          `${client.address.street} ${client.address.houseNumber}${client.address.houseNumberAddition ? ` ${client.address.houseNumberAddition}` : ''}`
                        )}
                      </p>
                    </div>
                    <div>
                      <span className='font-medium text-gray-700'>
                        Postcode:
                      </span>
                      <p>{displayInfo(client.address.postalCode)}</p>
                    </div>
                    <div>
                      <span className='font-medium text-gray-700'>Plaats:</span>
                      <p>{displayInfo(client.address.city)}</p>
                    </div>
                    <div>
                      <span className='font-medium text-gray-700'>
                        Gemeente:
                      </span>
                      <p>{displayInfo(client.address.municipality)}</p>
                    </div>
                    {client.address.accessInstructions && (
                      <div>
                        <span className='font-medium text-gray-700'>
                          Toegangsinstructies:
                        </span>
                        <p>{displayInfo(client.address.accessInstructions)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Insurance (op plek van noodcontact) */}
                <div className='space-y-4'>
                  <h3 className='font-semibold text-lg flex items-center gap-2'>
                    <Shield className='w-5 h-5 text-blue-600' />
                    Verzekering
                  </h3>
                  <div className='space-y-3 text-sm'>
                    <div>
                      <span className='font-medium text-gray-700'>
                        Verzekeringsnummer:
                      </span>
                      <p>{displayInfo(client.care.insuranceNumber)}</p>
                    </div>
                    <div>
                      <span className='font-medium text-gray-700'>
                        Verzekeringsmaatschappij:
                      </span>
                      <p>{displayInfo(client.care.insuranceCompany)}</p>
                    </div>
                    {client.care.indicationNumber && (
                      <div>
                        <span className='font-medium text-gray-700'>
                          Indicatienummer:
                        </span>
                        <p>{displayInfo(client.care.indicationNumber)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Medical Information */}
              <div className='space-y-4'>
                <h3 className='font-semibold text-lg flex items-center gap-2'>
                  <FileText className='w-5 h-5 text-purple-600' />
                  Medische Informatie
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <span className='font-medium text-gray-700'>
                      Primaire diagnose(s):
                    </span>
                    {client.care.primaryDiagnosis.length > 0 ? (
                      <ul className='mt-1 space-y-1'>
                        {client.care.primaryDiagnosis.map(
                          (diagnosis, index) => (
                            <li key={index} className='text-gray-900 text-sm'>
                              • {diagnosis}
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p className='text-gray-400 italic text-sm'>
                        Geen informatie beschikbaar
                      </p>
                    )}
                  </div>
                  <div>
                    <span className='font-medium text-gray-700'>
                      Secundaire diagnose(s):
                    </span>
                    {client.care.secondaryDiagnoses &&
                    client.care.secondaryDiagnoses.length > 0 ? (
                      <ul className='mt-1 space-y-1'>
                        {client.care.secondaryDiagnoses.map(
                          (diagnosis, index) => (
                            <li key={index} className='text-gray-900 text-sm'>
                              • {diagnosis}
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p className='text-gray-400 italic text-sm'>
                        Geen informatie beschikbaar
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Care Information Tab */}
            <TabsContent
              ref={el => (tabRefs.current[1] = el)}
              value='care'
              className='space-y-6'
            >
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Care Status */}
                <div className='space-y-4'>
                  <h3 className='font-semibold text-lg flex items-center gap-2'>
                    <Heart className='w-5 h-5 text-red-600' />
                    Zorgstatus
                  </h3>
                  <div className='space-y-3 text-sm'>
                    <div>
                      <span className='font-medium text-gray-700'>
                        Huidige status:
                      </span>
                      <p className='text-gray-900'>{statusInfo}</p>
                    </div>
                    <div>
                      <span className='font-medium text-gray-700'>
                        Zorgniveau:
                      </span>
                      <p className='text-gray-900'>{careLevelInfo}</p>
                    </div>
                    <div>
                      <span className='font-medium text-gray-700'>
                        Startdatum zorg:
                      </span>
                      <p className='text-gray-900'>
                        {client.care.startDate.toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                    {client.care.endDate && (
                      <div>
                        <span className='font-medium text-gray-700'>
                          Einddatum zorg:
                        </span>
                        <p className='text-gray-900'>
                          {client.care.endDate.toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className='font-medium text-gray-700'>
                        Toegewezen coördinator:
                      </span>
                      <p>{displayInfo(client.assignedCareCoordinator)}</p>
                    </div>
                  </div>
                </div>

                {/* Insurance */}
                <div className='space-y-4'>
                  <h3 className='font-semibold text-lg flex items-center gap-2'>
                    <Shield className='w-5 h-5 text-blue-600' />
                    Verzekering
                  </h3>
                  <div className='space-y-3 text-sm'>
                    <div>
                      <span className='font-medium text-gray-700'>
                        Verzekeringsnummer:
                      </span>
                      <p>{displayInfo(client.care.insuranceNumber)}</p>
                    </div>
                    <div>
                      <span className='font-medium text-gray-700'>
                        Verzekeringsmaatschappij:
                      </span>
                      <p>{displayInfo(client.care.insuranceCompany)}</p>
                    </div>
                    {client.care.indicationNumber && (
                      <div>
                        <span className='font-medium text-gray-700'>
                          Indicatienummer:
                        </span>
                        <p>{displayInfo(client.care.indicationNumber)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Medical Information */}
              <div className='space-y-4'>
                <h3 className='font-semibold text-lg flex items-center gap-2'>
                  <FileText className='w-5 h-5 text-purple-600' />
                  Medische Informatie
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <span className='font-medium text-gray-700'>
                      Primaire diagnose(s):
                    </span>
                    {client.care.primaryDiagnosis.length > 0 ? (
                      <ul className='mt-1 space-y-1'>
                        {client.care.primaryDiagnosis.map(
                          (diagnosis, index) => (
                            <li key={index} className='text-gray-900 text-sm'>
                              • {diagnosis}
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p className='text-gray-400 italic text-sm'>
                        Geen informatie beschikbaar
                      </p>
                    )}
                  </div>
                  <div>
                    <span className='font-medium text-gray-700'>
                      Secundaire diagnose(s):
                    </span>
                    {client.care.secondaryDiagnoses &&
                    client.care.secondaryDiagnoses.length > 0 ? (
                      <ul className='mt-1 space-y-1'>
                        {client.care.secondaryDiagnoses.map(
                          (diagnosis, index) => (
                            <li key={index} className='text-gray-900 text-sm'>
                              • {diagnosis}
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p className='text-gray-400 italic text-sm'>
                        Geen informatie beschikbaar
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Workflow Tab */}
            <TabsContent
              ref={el => (tabRefs.current[2] = el)}
              value='workflow'
              className='space-y-6'
            >
              <h3 className='font-semibold text-lg flex items-center gap-2'>
                <ClipboardList className='w-5 h-5 text-blue-600' />
                Proces Status
              </h3>
              <div className='w-full flex flex-col items-center'>
                <div className='flex flex-row items-center justify-center w-full gap-0 md:gap-8'>
                  {/* Intake */}
                  <div className='flex flex-col items-center flex-1 min-w-[100px]'>
                    <div
                      className='flex items-center justify-center w-10 h-10 rounded-full mb-1'
                      style={{
                        backgroundColor: client.workflow.intakeCompleted
                          ? '#dcfce7'
                          : '#fef9c3',
                      }}
                    >
                      {client.workflow.intakeCompleted ? (
                        <CheckCircle className='w-6 h-6 text-green-600' />
                      ) : (
                        <Clock className='w-6 h-6 text-yellow-600' />
                      )}
                    </div>
                    <span className='font-medium text-gray-700'>Intake</span>
                    <span className='text-xs text-gray-500'>
                      {client.workflow.intakeCompleted
                        ? 'Voltooid'
                        : 'In behandeling'}
                    </span>
                  </div>
                  {/* Line */}
                  <div
                    className='hidden md:block h-1 bg-gray-300 flex-1 mx-2'
                    style={{ minWidth: 24, maxWidth: 60, alignSelf: 'center' }}
                  />
                  {/* Indicatie */}
                  <div className='flex flex-col items-center flex-1 min-w-[100px]'>
                    <div
                      className='flex items-center justify-center w-10 h-10 rounded-full mb-1'
                      style={{
                        backgroundColor: client.workflow.indicationSubmitted
                          ? '#dcfce7'
                          : '#fef9c3',
                      }}
                    >
                      {client.workflow.indicationSubmitted ? (
                        <CheckCircle className='w-6 h-6 text-green-600' />
                      ) : (
                        <Clock className='w-6 h-6 text-yellow-600' />
                      )}
                    </div>
                    <span className='font-medium text-gray-700'>Indicatie</span>
                    <span className='text-xs text-gray-500'>
                      {client.workflow.indicationSubmitted
                        ? 'Ingediend'
                        : 'Nog niet ingediend'}
                    </span>
                  </div>
                  {/* Line */}
                  <div
                    className='hidden md:block h-1 bg-gray-300 flex-1 mx-2'
                    style={{ minWidth: 24, maxWidth: 60, alignSelf: 'center' }}
                  />
                  {/* Zorgplan */}
                  <div className='flex flex-col items-center flex-1 min-w-[100px]'>
                    <div
                      className='flex items-center justify-center w-10 h-10 rounded-full mb-1'
                      style={{
                        backgroundColor: client.workflow.careplanApproved
                          ? '#dcfce7'
                          : '#fef9c3',
                      }}
                    >
                      {client.workflow.careplanApproved ? (
                        <CheckCircle className='w-6 h-6 text-green-600' />
                      ) : (
                        <Clock className='w-6 h-6 text-yellow-600' />
                      )}
                    </div>
                    <span className='font-medium text-gray-700'>Zorgplan</span>
                    <span className='text-xs text-gray-500'>
                      {client.workflow.careplanApproved
                        ? 'Goedgekeurd'
                        : 'Wachtend op goedkeuring'}
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent
              ref={el => (tabRefs.current[3] = el)}
              value='services'
              className='space-y-6'
            >
              <h3 className='font-semibold text-lg flex items-center gap-2'>
                <Users className='w-5 h-5 text-green-600' />
                Actieve Zorgdiensten
              </h3>
              {client.workflow.activeServices.length > 0 ? (
                <div className='space-y-4'>
                  {client.workflow.activeServices.map(service => (
                    <div key={service.id} className='border rounded-lg p-4'>
                      <div className='flex justify-between items-start mb-2'>
                        <h4 className='font-medium text-gray-900'>
                          {service.name}
                        </h4>
                        <Badge variant='outline'>{service.provider}</Badge>
                      </div>
                      <div className='grid grid-cols-2 gap-4 text-sm text-gray-600'>
                        <div>
                          <span className='font-medium'>Frequentie:</span>{' '}
                          {service.frequency}
                        </div>
                        <div>
                          <span className='font-medium'>Duur:</span>{' '}
                          {service.duration} minuten
                        </div>
                        {service.nextScheduled && (
                          <div>
                            <span className='font-medium'>
                              Volgende afspraak:
                            </span>{' '}
                            {service.nextScheduled.toLocaleDateString('nl-NL')}
                          </div>
                        )}
                        {service.lastProvided && (
                          <div>
                            <span className='font-medium'>Laatste dienst:</span>{' '}
                            {service.lastProvided.toLocaleDateString('nl-NL')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-gray-400 italic text-center py-8'>
                  Geen informatie beschikbaar
                </p>
              )}
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent
              ref={el => (tabRefs.current[4] = el)}
              value='notes'
              className='space-y-6'
            >
              <ClientNotes clientId={client.id} />
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer Actions */}
        <div className='flex items-center justify-between pt-4 border-t'>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onQuickAction('call', client.id)}
              disabled={!client.contact.phone}
            >
              <Phone className='w-4 h-4 mr-2' />
              Bellen
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onQuickAction('email', client.id)}
              disabled={!client.contact.email}
            >
              <Mail className='w-4 h-4 mr-2' />
              Email
            </Button>
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' onClick={() => onEdit(client)}>
              Bewerken
            </Button>
            <Button size='sm' onClick={onClose}>
              Sluiten
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientDetailsModal;
