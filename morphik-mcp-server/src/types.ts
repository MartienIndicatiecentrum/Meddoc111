export interface MorphikConfig {
  apiKey: string;
  apiUrl: string;
  defaultFolder?: string;
}

export interface FileUpload {
  path: string;
  content: Buffer;
  metadata?: Record<string, any>;
  mimeType?: string;
}

export interface UploadResponse {
  success: boolean;
  documentId?: string;
  message?: string;
  error?: string;
}

export interface BatchUploadResponse {
  success: boolean;
  uploadedCount: number;
  failedCount: number;
  results: UploadResponse[];
}

export interface QueryOptions {
  folder?: string;
  chatId?: string;
  endUserId?: string;
  temperature?: number;
  maxTokens?: number;
  includeMetadata?: boolean;
}

export interface AgentResponse {
  response: string;
  sources?: DocumentSource[];
  chatId?: string;
  metadata?: Record<string, any>;
}

export interface DocumentSource {
  documentId: string;
  chunkId?: string;
  content: string;
  metadata?: Record<string, any>;
  relevanceScore?: number;
}

export interface RetrieveOptions {
  query?: string;
  folder?: string;
  limit?: number;
  offset?: number;
  filters?: Record<string, any>;
  includeContent?: boolean;
}

export interface MorphikDocument {
  id: string;
  name: string;
  folder?: string;
  metadata?: Record<string, any>;
  content?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FolderInfo {
  name: string;
  documentCount: number;
  createdAt: string;
  rules?: any[];
}

export interface ProcessingStatus {
  documentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  message?: string;
}