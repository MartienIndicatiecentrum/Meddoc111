import React, { useState, useEffect } from 'react';
import { Client, ClientStatus, CareLevel } from './types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { X } from 'lucide-react';

interface ClientEditModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedClient: Client) => void;
}

const statusOptions: { value: ClientStatus; label: string }[] = [
  { value: 'intake_pending', label: 'Intake Wachtend' },
  { value: 'assessment_phase', label: 'Assessment Fase' },
  { value: 'care_planning', label: 'Zorgplanning' },
  { value: 'active_care', label: 'Actieve Zorg' },
  { value: 'care_suspended', label: 'Zorg Onderbroken' },
  { value: 'care_ended', label: 'Zorg Beëindigd' },
  { value: 'transferred', label: 'Overgedragen' }
];

const careLevelOptions: { value: CareLevel; label: string }[] = [
  { value: 'wlz_1', label: 'WLZ-1' },
  { value: 'wlz_2', label: 'WLZ-2' },
  { value: 'wlz_3', label: 'WLZ-3' },
  { value: 'wlz_4', label: 'WLZ-4' },
  { value: 'wlz_5', label: 'WLZ-5' },
  { value: 'wmo', label: 'WMO' },
  { value: 'zvw', label: 'ZVW' }
];

export const ClientEditModal: React.FC<ClientEditModalProps> = ({
  client,
  isOpen,
  onClose,
  onSave
}) => {
  const [editedClient, setEditedClient] = useState<Client | null>(null);
  const [newTag, setNewTag] = useState('');

  // Initialize form data when client changes
  useEffect(() => {
    if (client) {
      setEditedClient({ ...client });
    }
  }, [client]);

  if (!client || !editedClient) return null;

  const handleSave = () => {
    if (editedClient) {
      onSave({
        ...editedClient,
        updatedAt: new Date()
      });
      onClose();
    }
  };

  const handleCancel = () => {
    setEditedClient({ ...client });
    onClose();
  };

  const updateField = (path: string, value: any) => {
    setEditedClient(prev => {
      if (!prev) return prev;

      const keys = path.split('.');
      const newClient = { ...prev };
      let current: any = newClient;

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newClient;
    });
  };

  const addTag = () => {
    if (newTag.trim() && !editedClient.tags.includes(newTag.trim())) {
      setEditedClient(prev => prev ? {
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      } : prev);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditedClient(prev => prev ? {
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    } : prev);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Cliënt Bewerken: {editedClient.fullName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="personal" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="personal">Persoonlijk</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="care">Zorginfo</TabsTrigger>
            <TabsTrigger value="other">Overig</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[60vh] pr-2">
            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Voornaam</Label>
                  <Input
                    id="firstName"
                    value={editedClient.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Achternaam</Label>
                  <Input
                    id="lastName"
                    value={editedClient.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bsn">BSN</Label>
                  <Input
                    id="bsn"
                    value={editedClient.bsn}
                    onChange={(e) => updateField('bsn', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Geboortedatum</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={editedClient.dateOfBirth.toISOString().split('T')[0]}
                    onChange={(e) => updateField('dateOfBirth', new Date(e.target.value))}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Contact Information Tab */}
            <TabsContent value="contact" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefoon</Label>
                  <Input
                    id="phone"
                    value={editedClient.contact.phone}
                    onChange={(e) => updateField('contact.phone', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editedClient.contact.email}
                    onChange={(e) => updateField('contact.email', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Adres</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="street">Straat</Label>
                    <Input
                      id="street"
                      value={editedClient.address.street}
                      onChange={(e) => updateField('address.street', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="houseNumber">Huisnummer</Label>
                    <Input
                      id="houseNumber"
                      value={editedClient.address.houseNumber}
                      onChange={(e) => updateField('address.houseNumber', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postalCode">Postcode</Label>
                    <Input
                      id="postalCode"
                      value={editedClient.address.postalCode}
                      onChange={(e) => updateField('address.postalCode', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Woonplaats</Label>
                    <Input
                      id="city"
                      value={editedClient.address.city}
                      onChange={(e) => updateField('address.city', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Noodcontact</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyName">Naam</Label>
                    <Input
                      id="emergencyName"
                      value={editedClient.contact.emergencyContact.name}
                      onChange={(e) => updateField('contact.emergencyContact.name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyRelationship">Relatie</Label>
                    <Input
                      id="emergencyRelationship"
                      value={editedClient.contact.emergencyContact.relationship}
                      onChange={(e) => updateField('contact.emergencyContact.relationship', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">Telefoon</Label>
                  <Input
                    id="emergencyPhone"
                    value={editedClient.contact.emergencyContact.phone}
                    onChange={(e) => updateField('contact.emergencyContact.phone', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Care Information Tab */}
            <TabsContent value="care" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Zorgstatus</Label>
                  <Select
                    value={editedClient.care.status}
                    onValueChange={(value: ClientStatus) => updateField('care.status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="careLevel">Zorgniveau</Label>
                  <Select
                    value={editedClient.care.careLevel}
                    onValueChange={(value: CareLevel) => updateField('care.careLevel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {careLevelOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="insuranceCompany">Verzekeraar</Label>
                  <Input
                    id="insuranceCompany"
                    value={editedClient.care.insuranceCompany}
                    onChange={(e) => updateField('care.insuranceCompany', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="insuranceNumber">Polisnummer</Label>
                  <Input
                    id="insuranceNumber"
                    value={editedClient.care.insuranceNumber}
                    onChange={(e) => updateField('care.insuranceNumber', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="indicationNumber">Machtigingsnummer</Label>
                <Input
                  id="indicationNumber"
                  value={editedClient.care.indicationNumber || ''}
                  onChange={(e) => updateField('care.indicationNumber', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Startdatum zorg</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={editedClient.care.startDate.toISOString().split('T')[0]}
                    onChange={(e) => updateField('care.startDate', new Date(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Einddatum zorg</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={editedClient.care.endDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => updateField('care.endDate', e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Other Information Tab */}
            <TabsContent value="other" className="space-y-4">
              <div>
                <Label htmlFor="notes">Notities</Label>
                <Textarea
                  id="notes"
                  value={editedClient.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="assignedCareCoordinator">Toegewezen zorgcoördinator</Label>
                <Input
                  id="assignedCareCoordinator"
                  value={editedClient.assignedCareCoordinator || ''}
                  onChange={(e) => updateField('assignedCareCoordinator', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editedClient.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nieuwe tag toevoegen"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    Toevoegen
                  </Button>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Annuleren
          </Button>
          <Button onClick={handleSave}>
            Opslaan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientEditModal;
