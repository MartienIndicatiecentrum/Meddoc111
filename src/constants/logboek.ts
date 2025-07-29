// Logboek Entry Types
export const ENTRY_TYPES = [
  'Notitie',
  'Vraag Verzekeraar',
  'Vraag Client',
  'Indicatie',
  'Taak',
  'Documenten afronden en opsturen',
  'Reactie client',
  'Reactie verzekeraar',
  'Reactie Opdrachtgever',
  'Mijn reactie',
  'Vervolgreactie client',
  'Vervolgreactie verzekeraar',
  'Vervolgreactie Opdrachtgever',
  'Algemene response',
  'Anders'
] as const;

export type EntryType = typeof ENTRY_TYPES[number];

// Status Options
export const STATUS_OPTIONS = [
  'Geen urgentie',
  'Licht urgent',
  'Urgent',
  'Reactie nodig',
  'Afgehandeld',
  'In behandeling'
] as const;

export type StatusType = typeof STATUS_OPTIONS[number];

// From Types
export const FROM_TYPES = [
  'client',
  'employee',
  'insurer',
  'family'
] as const;

export type FromType = typeof FROM_TYPES[number];

// File Upload Constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png'
] as const;

export const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'] as const;

// Pagination
export const ITEMS_PER_PAGE = 50;

// Debounce delay for search inputs
export const SEARCH_DEBOUNCE_DELAY = 300;

// Status Colors
export const STATUS_COLORS = {
  'Geen urgentie': 'bg-gray-100 text-gray-800',
  'Licht urgent': 'bg-yellow-100 text-yellow-800',
  'Urgent': 'bg-red-100 text-red-800',
  'Reactie nodig': 'bg-orange-100 text-orange-800',
  'Afgehandeld': 'bg-green-100 text-green-800',
  'In behandeling': 'bg-blue-100 text-blue-800'
} as const;

// Type Icons
export const TYPE_ICONS = {
  'Notitie': 'FileText',
  'Vraag Verzekeraar': 'MessageSquare',
  'Vraag Client': 'User',
  'Indicatie': 'CheckSquare',
  'Taak': 'ListTodo',
  'Documenten afronden en opsturen': 'Send',
  'Reactie client': 'MessageCircle',
  'Reactie verzekeraar': 'Building2',
  'Reactie Opdrachtgever': 'UserCheck',
  'Mijn reactie': 'Reply',
  'Vervolgreactie client': 'MessageCircle',
  'Vervolgreactie verzekeraar': 'Building2',
  'Vervolgreactie Opdrachtgever': 'UserCheck',
  'Algemene response': 'MessageSquare',
  'Anders': 'MoreHorizontal'
} as const;

// Keyboard Shortcuts
export const KEYBOARD_SHORTCUTS = {
  NEW_ENTRY: 'Ctrl+N',
  CLOSE_MODAL: 'Escape',
  SAVE: 'Ctrl+S',
  SEARCH: 'Ctrl+F'
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'Bestand is te groot. Maximum grootte is 10MB.',
  INVALID_FILE_TYPE: 'Bestandstype niet ondersteund. Toegestane types: PDF, JPG, PNG.',
  UPLOAD_FAILED: 'Fout bij uploaden van bestanden',
  DELETE_FAILED: 'Fout bij verwijderen van document',
  DOWNLOAD_FAILED: 'Fout bij downloaden van document',
  SAVE_FAILED: 'Fout bij opslaan van bericht',
  LOAD_FAILED: 'Fout bij laden van gegevens',
  NETWORK_ERROR: 'Netwerk fout. Controleer uw verbinding.',
  VALIDATION_ERROR: 'Vul alle verplichte velden in.'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  UPLOAD_SUCCESS: 'Document succesvol geüpload',
  DELETE_SUCCESS: 'Document succesvol verwijderd',
  SAVE_SUCCESS: 'Bericht succesvol opgeslagen',
  UPDATE_SUCCESS: 'Bericht succesvol bijgewerkt'
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 2000,
  MIN_ACTION_LENGTH: 5,
  MAX_ACTION_LENGTH: 500,
  MAX_CUSTOM_TYPE_LENGTH: 100
} as const;