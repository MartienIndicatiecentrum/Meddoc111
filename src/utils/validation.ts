/**
 * Validation utilities using Zod schemas
 * Provides type-safe validation for forms and data
 */

import { z } from 'zod';

// Client validation schemas
export const ClientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Naam is verplicht').max(255, 'Naam is te lang'),
  email: z.string().email('Ongeldig e-mailadres').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  date_of_birth: z.string().optional(),
  bsn_number: z.string().optional(),
  insurance_number: z.string().optional(),
  insurance_company: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  notes: z.string().optional(),
});

export type ClientFormData = z.infer<typeof ClientSchema>;

// Log entry validation schemas
export const LogEntrySchema = z.object({
  fromName: z.string().min(1, 'Afzender naam is verplicht'),
  fromType: z.enum(['client', 'employee', 'insurer', 'family', 'verzekeraar']),
  type: z.string().min(1, 'Type is verplicht'),
  customType: z.string().optional(),
  action: z.string().optional(),
  description: z.string().min(1, 'Beschrijving is verplicht'),
  isUrgent: z.boolean().default(false),
  needsResponse: z.boolean().default(false),
});

export type LogEntryFormData = z.infer<typeof LogEntrySchema>;

// Task validation schemas
export const TaskSchema = z.object({
  client_id: z.string().uuid('Ongeldige client ID'),
  title: z.string().min(1, 'Titel is verplicht').max(255, 'Titel is te lang'),
  description: z.string().optional(),
  type: z.enum([
    'Hulpmiddel Aanvraag',
    'PGB Aanvraag',
    'WMO Herindicatie',
    'Indicatie',
    'Vraagstelling',
    'Update',
    'Notitie',
  ]),
  status: z
    .enum([
      'Niet gestart',
      'In behandeling',
      'Wachten op info',
      'Opvolging',
      'Afgerond',
    ])
    .default('Niet gestart'),
  priority: z.enum(['Laag', 'Medium', 'Hoog', 'Urgent']).default('Medium'),
  progress: z.number().min(0).max(100).default(0),
  deadline: z.string().optional(),
  insurer: z.string().optional(),
  external_party: z.string().optional(),
  is_urgent: z.boolean().default(false),
  needs_response: z.boolean().default(false),
});

export type TaskFormData = z.infer<typeof TaskSchema>;

// Document validation schemas
export const DocumentUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      file => file.size <= 10 * 1024 * 1024, // 10MB limit
      'Bestand is te groot (max 10MB)'
    )
    .refine(file => {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'text/plain',
      ];
      return allowedTypes.includes(file.type);
    }, 'Bestandstype niet ondersteund'),
  clientId: z.string().uuid('Ongeldige client ID'),
  logEntryId: z.string().uuid('Ongeldige log entry ID').optional(),
});

export type DocumentUploadData = z.infer<typeof DocumentUploadSchema>;

// Filter validation schemas
export const LogEntryFilterSchema = z.object({
  from: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  date: z.date().optional(),
  description: z.string().optional(),
});

export type LogEntryFilterData = z.infer<typeof LogEntryFilterSchema>;

// Utility functions for validation
export const validateClient = (data: unknown): ClientFormData => {
  return ClientSchema.parse(data);
};

export const validateLogEntry = (data: unknown): LogEntryFormData => {
  return LogEntrySchema.parse(data);
};

export const validateTask = (data: unknown): TaskFormData => {
  return TaskSchema.parse(data);
};

export const validateDocumentUpload = (data: unknown): DocumentUploadData => {
  return DocumentUploadSchema.parse(data);
};

export const validateLogEntryFilter = (data: unknown): LogEntryFilterData => {
  return LogEntryFilterSchema.parse(data);
};

// Safe validation functions that return errors instead of throwing
export const safeValidateClient = (
  data: unknown
):
  | { success: true; data: ClientFormData }
  | { success: false; errors: string[] } => {
  const result = ClientSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return {
      success: false,
      errors: result.error.errors.map(err => err.message),
    };
  }
};

export const safeValidateLogEntry = (
  data: unknown
):
  | { success: true; data: LogEntryFormData }
  | { success: false; errors: string[] } => {
  const result = LogEntrySchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return {
      success: false,
      errors: result.error.errors.map(err => err.message),
    };
  }
};

export const safeValidateTask = (
  data: unknown
):
  | { success: true; data: TaskFormData }
  | { success: false; errors: string[] } => {
  const result = TaskSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return {
      success: false,
      errors: result.error.errors.map(err => err.message),
    };
  }
};

// File validation utilities
export const validateFile = (
  file: File
): { valid: boolean; error?: string } => {
  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'Bestand is te groot (max 10MB)' };
  }

  // Check file type
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'text/plain',
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error:
        'Bestandstype niet ondersteund. Toegestane types: PDF, Word, JPEG, PNG, TXT',
    };
  }

  return { valid: true };
};

// Date validation utilities
export const validateDate = (
  date: string | Date
): { valid: boolean; error?: string } => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: 'Ongeldige datum' };
  }

  if (dateObj > new Date()) {
    return { valid: false, error: 'Datum kan niet in de toekomst liggen' };
  }

  return { valid: true };
};

// Email validation utility
export const validateEmail = (
  email: string
): { valid: boolean; error?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    return { valid: true }; // Email is optional
  }

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Ongeldig e-mailadres' };
  }

  return { valid: true };
};

// Phone number validation utility
export const validatePhone = (
  phone: string
): { valid: boolean; error?: string } => {
  if (!phone) {
    return { valid: true }; // Phone is optional
  }

  // Dutch phone number format
  const phoneRegex = /^(\+31|0)[1-9][0-9]{8}$/;

  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return { valid: false, error: 'Ongeldig telefoonnummer' };
  }

  return { valid: true };
};
