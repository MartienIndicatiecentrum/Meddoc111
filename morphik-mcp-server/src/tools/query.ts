import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MorphikClient } from '../morphik-client.js';
import { logger } from '../utils.js';

export function createQueryTools(client: MorphikClient): Tool[] {
  return [
    {
      name: 'morphik_agent_query',
      description:
        'Query documents using Morphik AI agent with conversation context',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The question or query to ask about the documents',
          },
          folder: {
            type: 'string',
            description: 'Optional folder to scope the search',
          },
          chatId: {
            type: 'string',
            description: 'Optional chat ID to maintain conversation context',
          },
          temperature: {
            type: 'number',
            description: 'Temperature for response generation (0-1)',
            minimum: 0,
            maximum: 1,
          },
          maxTokens: {
            type: 'number',
            description: 'Maximum tokens in response',
          },
        },
        required: ['query'],
      },
      handler: async (args: any) => {
        try {
          const { query, folder, chatId, temperature, maxTokens } = args;

          logger.info(`Agent query: ${query}`);

          const response = await client.agentQuery(query, {
            folder,
            chatId,
            temperature,
            maxTokens,
          });

          return {
            success: true,
            response: response.response,
            chatId: response.chatId,
            sources: response.sources?.map(source => ({
              documentId: source.documentId,
              content: source.content.substring(0, 200) + '...',
              relevanceScore: source.relevanceScore,
            })),
            sourceCount: response.sources?.length || 0,
          };
        } catch (error) {
          logger.error('Agent query failed', { error });
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    },

    {
      name: 'morphik_retrieve_documents',
      description: 'Retrieve documents from Morphik based on search criteria',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query to find relevant documents',
          },
          folder: {
            type: 'string',
            description: 'Folder to search within',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of documents to return',
            default: 10,
          },
          offset: {
            type: 'number',
            description: 'Number of documents to skip',
            default: 0,
          },
          filters: {
            type: 'object',
            description: 'Additional filters for document metadata',
            additionalProperties: true,
          },
          includeContent: {
            type: 'boolean',
            description: 'Include document content in response',
            default: false,
          },
        },
      },
      handler: async (args: any) => {
        try {
          const {
            query,
            folder,
            limit = 10,
            offset = 0,
            filters,
            includeContent = false,
          } = args;

          logger.info(`Retrieving documents: ${query || 'all'}`);

          const documents = await client.retrieveDocuments({
            query,
            folder,
            limit,
            offset,
            filters,
            includeContent,
          });

          return {
            success: true,
            documentCount: documents.length,
            documents: documents.map(doc => ({
              id: doc.id,
              name: doc.name,
              folder: doc.folder,
              metadata: doc.metadata,
              content: includeContent ? doc.content : undefined,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
            })),
            hasMore: documents.length === limit,
          };
        } catch (error) {
          logger.error('Document retrieval failed', { error });
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    },

    {
      name: 'morphik_sync_status',
      description: 'Check the processing status of uploaded documents',
      inputSchema: {
        type: 'object',
        properties: {
          documentId: {
            type: 'string',
            description: 'Document ID to check status for',
          },
        },
        required: ['documentId'],
      },
      handler: async (args: any) => {
        try {
          const { documentId } = args;

          logger.info(`Checking status for document: ${documentId}`);

          const status = await client.getProcessingStatus(documentId);

          return {
            success: true,
            documentId: status.documentId,
            status: status.status,
            progress: status.progress,
            message: status.message,
          };
        } catch (error) {
          logger.error('Status check failed', { error });
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      },
    },
  ];
}
