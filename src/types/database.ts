/**
 * Centralized database types for the MedDoc application
 * This file contains all database-related interfaces and types
 */

// Base entity interface
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// Client-related types
export interface Client extends BaseEntity {
  name: string;
  naam?: string; // Dutch column name for backward compatibility
  email?: string;
  phone?: string;
  telefoon?: string; // Dutch column name for backward compatibility
  address?: string;
  city?: string;
  postal_code?: string;
  date_of_birth?: string;
  bsn_number?: string;
  insurance_number?: string;
  insurance_company?: string;
  contact_person_name?: string;
  contact_person_phone?: string;
  contact_person_email?: string;
  contact_person_relation?: string;
  status: ClientStatus;
  notes?: string;
}

export type ClientStatus = 'active' | 'inactive' | 'archived';

// Task-related types
export interface Task extends BaseEntity {
  client_id: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  deadline?: string;
  insurer?: string;
  external_party?: string;
  is_urgent: boolean;
  is_expired: boolean;
  needs_response: boolean;
}

export type TaskType =
  | 'Hulpmiddel Aanvraag'
  | 'PGB Aanvraag'
  | 'WMO Herindicatie'
  | 'Indicatie'
  | 'Vraagstelling'
  | 'Update'
  | 'Notitie';

export type TaskStatus =
  | 'Niet gestart'
  | 'In behandeling'
  | 'Wachten op info'
  | 'Opvolging'
  | 'Afgerond';

export type TaskPriority = 'Laag' | 'Medium' | 'Hoog' | 'Urgent';

// Log entry types
export interface LogEntry extends BaseEntity {
  client_id: string;
  client_name?: string; // Added for UI display
  date: string;
  from_name: string;
  from_type: FromType;
  from_color: string;
  type: LogEntryType;
  action: string;
  description: string;
  status: LogEntryStatus;
  is_urgent: boolean;
  needs_response: boolean;
}

export type FromType = 'client' | 'employee' | 'insurer' | 'family' | 'verzekeraar';

export type LogEntryType =
  | 'Notitie'
  | 'Vraag Verzekeraar'
  | 'Vraag Client'
  | 'Indicatie'
  | 'Taak'
  | 'Documenten afronden en opsturen'
  | 'Reactie client'
  | 'Reactie verzekeraar'
  | 'Reactie Opdrachtgever'
  | 'Mijn reactie'
  | 'Vervolgreactie client'
  | 'Vervolgreactie verzekeraar'
  | 'Vervolgreactie Opdrachtgever'
  | 'Algemene response'
  | 'Anders'
  | string; // Allow custom types

export type LogEntryStatus =
  | 'Geen urgentie'
  | 'Licht urgent'
  | 'Urgent'
  | 'Reactie nodig'
  | 'Afgehandeld'
  | 'In behandeling';

// Document types
export interface LogEntryDocument extends BaseEntity {
  log_entry_id: string;
  client_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  public_url?: string;
}

// Frontend-specific types
export interface LogboekEntry {
  id: string;
  date: string;
  client_id?: string;
  client_name?: string;
  document_count?: number; // Number of documents attached to this entry
  from: {
    name: string;
    type: FromType;
    color: string;
  };
  type: LogEntryType;
  action: string;
  description: string;
  status: LogEntryStatus;
  isUrgent: boolean;
  needsResponse: boolean;
}

// Form types
export interface NewEntryForm {
  fromName: string;
  fromType: FromType;
  type: LogEntryType;
  customType: string;
  action: string;
  description: string;
  isUrgent: boolean;
  needsResponse: boolean;
}

export interface EditEntryForm {
  action: string;
  description: string;
  status: LogEntryStatus;
}

// Document upload types
export interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  file?: File;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Filter types
export interface LogEntryFilters {
  from?: string;
  type?: string;
  status?: string;
  date?: Date;
  description?: string;
}

// Utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}
