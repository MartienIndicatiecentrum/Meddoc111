import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import {
  MorphikConfig,
  FileUpload,
  UploadResponse,
  BatchUploadResponse,
  QueryOptions,
  AgentResponse,
  RetrieveOptions,
  MorphikDocument,
  FolderInfo,
  ProcessingStatus,
} from './types.js';
import { logger, MorphikError, retryWithBackoff } from './utils.js';

export class MorphikClient {
  private api: AxiosInstance;
  private config: MorphikConfig;

  constructor(config: MorphikConfig) {
    this.config = config;
    this.api = axios.create({
      baseURL: config.apiUrl,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.api.interceptors.response.use(
      response => response,
      async error => {
        if (error.response) {
          logger.error('Morphik API error', {
            status: error.response.status,
            data: error.response.data,
          });

          throw new MorphikError(
            error.response.data?.message || 'API request failed',
            error.response.status,
            error.response.data
          );
        } else if (error.request) {
          throw new MorphikError(
            'No response from Morphik API',
            0,
            error.request
          );
        } else {
          throw new MorphikError('Request setup failed', 0, error.message);
        }
      }
    );
  }

  async uploadFile(file: FileUpload, folder?: string): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file.content, {
        filename: file.path.split('/').pop(),
        contentType: file.mimeType,
      });

      if (file.metadata) {
        formData.append('metadata', JSON.stringify(file.metadata));
      }

      if (folder || this.config.defaultFolder) {
        formData.append('folder_name', folder || this.config.defaultFolder!);
      }

      const response = await retryWithBackoff(() =>
        this.api.post('/ingest/file', formData, {
          headers: {
            ...formData.getHeaders(),
          },
        })
      );

      return {
        success: true,
        documentId: response.data.document_id,
        message: response.data.message,
      };
    } catch (error) {
      logger.error('Failed to upload file', { error, file: file.path });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async uploadFiles(
    files: FileUpload[],
    folder?: string
  ): Promise<BatchUploadResponse> {
    try {
      const formData = new FormData();

      files.forEach(file => {
        formData.append('files', file.content, {
          filename: file.path.split('/').pop(),
          contentType: file.mimeType,
        });
      });

      const metadata = files.map(f => f.metadata || {});
      formData.append('metadata', JSON.stringify(metadata));

      if (folder || this.config.defaultFolder) {
        formData.append('folder_name', folder || this.config.defaultFolder!);
      }

      const response = await retryWithBackoff(() =>
        this.api.post('/ingest/files', formData, {
          headers: {
            ...formData.getHeaders(),
          },
        })
      );

      return {
        success: true,
        uploadedCount: response.data.uploaded_count || files.length,
        failedCount: 0,
        results: response.data.results || [],
      };
    } catch (error) {
      logger.error('Failed to upload files', {
        error,
        fileCount: files.length,
      });
      return {
        success: false,
        uploadedCount: 0,
        failedCount: files.length,
        results: [],
      };
    }
  }

  async agentQuery(
    query: string,
    options: QueryOptions = {}
  ): Promise<AgentResponse> {
    try {
      const payload: any = { query };

      if (options.folder || this.config.defaultFolder) {
        payload.folder_name = options.folder || this.config.defaultFolder;
      }

      if (options.chatId) {
        payload.chat_id = options.chatId;
      }

      if (options.endUserId) {
        payload.end_user_id = options.endUserId;
      }

      if (options.temperature !== undefined) {
        payload.temperature = options.temperature;
      }

      if (options.maxTokens !== undefined) {
        payload.max_tokens = options.maxTokens;
      }

      const response = await this.api.post('/agent', payload);

      return {
        response: response.data.response || response.data.text,
        sources: response.data.sources,
        chatId: response.data.chat_id,
        metadata: response.data.metadata,
      };
    } catch (error) {
      logger.error('Agent query failed', { error, query });
      throw error;
    }
  }

  async retrieveDocuments(
    options: RetrieveOptions = {}
  ): Promise<MorphikDocument[]> {
    try {
      const params: any = {};

      if (options.query) {
        params.query = options.query;
      }

      if (options.folder || this.config.defaultFolder) {
        params.folder_name = options.folder || this.config.defaultFolder;
      }

      if (options.limit !== undefined) {
        params.limit = options.limit;
      }

      if (options.offset !== undefined) {
        params.offset = options.offset;
      }

      if (options.filters) {
        params.filters = JSON.stringify(options.filters);
      }

      const response = await this.api.get('/retrieve/docs', { params });

      return response.data.documents || [];
    } catch (error) {
      logger.error('Document retrieval failed', { error, options });
      throw error;
    }
  }

  async createFolder(name: string): Promise<void> {
    try {
      await this.api.post('/folders', { name });
      logger.info(`Folder '${name}' created successfully`);
    } catch (error) {
      logger.error('Failed to create folder', { error, name });
      throw error;
    }
  }

  async deleteFolder(name: string): Promise<void> {
    try {
      await this.api.delete(`/folders/${name}`);
      logger.info(`Folder '${name}' deleted successfully`);
    } catch (error) {
      logger.error('Failed to delete folder', { error, name });
      throw error;
    }
  }

  async getFolderInfo(name: string): Promise<FolderInfo | null> {
    try {
      const response = await this.api.get(`/folders/${name}`);
      return response.data;
    } catch (error) {
      if (error instanceof MorphikError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async getProcessingStatus(documentId: string): Promise<ProcessingStatus> {
    try {
      const response = await this.api.get(`/documents/${documentId}/status`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get processing status', { error, documentId });
      throw error;
    }
  }
}
