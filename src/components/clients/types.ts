// MedDoc Pro - Client Types (volgens prompt)

export type ClientStatus =
  | 'intake_pending'
  | 'assessment_phase'
  | 'care_planning'
  | 'active_care'
  | 'care_suspended'
  | 'care_ended'
  | 'transferred';

export type CareLevel = 'wlz_1' | 'wlz_2' | 'wlz_3' | 'wlz_4' | 'wlz_5' | 'wmo' | 'zvw';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  address?: string;
}

export interface CareService {
  id: string;
  name: string;
  frequency: string;
  duration: number;
  lastProvided?: Date;
  nextScheduled?: Date;
  provider: string;
}

// Placeholder types for completeness
type Medication = any;
type MobilityLevel = any;
type CognitiveLevel = any;
type OmahaStatus = any;

export interface Client {
  id: string;
  bsn: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  profilePhoto?: string;
  contact: {
    phone: string;
    mobile?: string;
    email?: string;
    emergencyContact: EmergencyContact;
    preferredContactMethod: 'phone' | 'email' | 'sms' | 'app';
  };
  address: {
    street: string;
    houseNumber: string;
    houseNumberAddition?: string;
    postalCode: string;
    city: string;
    municipality: string;
    coordinates?: { lat: number; lng: number };
    accessInstructions?: string;
  };
  care: {
    startDate: Date;
    endDate?: Date;
    status: ClientStatus;
    careLevel: CareLevel;
    indicationNumber?: string;
    insuranceNumber: string;
    insuranceCompany: string;
    primaryDiagnosis: string[];
    secondaryDiagnoses?: string[];
    allergies?: string[];
    medications?: Medication[];
    mobility: MobilityLevel;
    cognitiveStatus: CognitiveLevel;
  };
  workflow: {
    intakeCompleted: boolean;
    omahaAssessment: OmahaStatus;
    careplanApproved: boolean;
    indicationSubmitted: boolean;
    activeServices: CareService[];
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  assignedCareCoordinator: string;
  tags: string[];
  notes: string;
  isActive: boolean;
}
