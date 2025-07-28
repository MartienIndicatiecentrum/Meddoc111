export interface DocumentSource {
  id?: string;
  title: string;
  document_type?: string;
  client_name?: string;
  created_at?: string;
  file_path?: string;
}

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[] | DocumentSource[];
  documentSource?: 'uploaded' | 'database';
  status?: 'sending' | 'sent' | 'error';
  isTyping?: boolean;
}

export interface ClientContext {
  id: string;
  name: string;
}

export interface ChatResponse {
  answer: string;
  sources?: string[] | DocumentSource[];
  error?: string;
  clientContext?: ClientContext;
}

export interface ChatRequest {
  question?: string;
  query?: string;
  clientId?: string | null;
  document_id?: string | null;
  mode?: 'uploaded' | 'database';
}

export interface Document {
  id: string;
  title: string;
  file_path: string;
  created_at: string;
  client_id?: string;
  document_type?: string;
}

export type DocumentSourceMode = 'uploaded' | 'database';

export interface PromptTemplate {
  label: string;
  prompt: string;
  icon: string;
  hasPlaceholder: boolean;
}