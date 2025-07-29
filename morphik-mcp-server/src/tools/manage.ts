import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MorphikClient } from '../morphik-client.js';
import { logger, sanitizeFolderName } from '../utils.js';

export function createManagementTools(client: MorphikClient): Tool[] {
  return [
    {
      name: 'morphik_create_folder',
      description: 'Create a new folder in Morphik for organizing documents',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the folder to create'
          },
          sanitize: {
            type: 'boolean',
            description: 'Automatically sanitize folder name (default: true)',
            default: true
          }
        },
        required: ['name']
      },
      handler: async (args: any) => {
        try {
          const { name, sanitize = true } = args;

          const folderName = sanitize ? sanitizeFolderName(name) : name;

          logger.info(`Creating folder: ${folderName}`);

          // Check if folder already exists
          const existingFolder = await client.getFolderInfo(folderName);
          if (existingFolder) {
            return {
              success: true,
              message: `Folder '${folderName}' already exists`,
              folderInfo: existingFolder
            };
          }

          await client.createFolder(folderName);

          return {
            success: true,
            message: `Folder '${folderName}' created successfully`,
            folderName
          };
        } catch (error) {
          logger.error('Folder creation failed', { error });
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    },

    {
      name: 'morphik_delete_folder',
      description: 'Delete a folder and all its documents from Morphik',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the folder to delete'
          },
          confirmDelete: {
            type: 'boolean',
            description: 'Confirm deletion (must be true to proceed)',
            default: false
          }
        },
        required: ['name', 'confirmDelete']
      },
      handler: async (args: any) => {
        try {
          const { name, confirmDelete } = args;

          if (!confirmDelete) {
            return {
              success: false,
              error: 'Deletion not confirmed. Set confirmDelete to true to proceed.'
            };
          }

          logger.info(`Deleting folder: ${name}`);

          // Check if folder exists
          const folderInfo = await client.getFolderInfo(name);
          if (!folderInfo) {
            return {
              success: false,
              error: `Folder '${name}' not found`
            };
          }

          await client.deleteFolder(name);

          return {
            success: true,
            message: `Folder '${name}' deleted successfully`,
            deletedDocumentCount: folderInfo.documentCount
          };
        } catch (error) {
          logger.error('Folder deletion failed', { error });
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    },

    {
      name: 'morphik_get_folder_info',
      description: 'Get information about a specific folder',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the folder to get info for'
          }
        },
        required: ['name']
      },
      handler: async (args: any) => {
        try {
          const { name } = args;

          logger.info(`Getting folder info: ${name}`);

          const folderInfo = await client.getFolderInfo(name);

          if (!folderInfo) {
            return {
              success: false,
              error: `Folder '${name}' not found`
            };
          }

          return {
            success: true,
            folder: {
              name: folderInfo.name,
              documentCount: folderInfo.documentCount,
              createdAt: folderInfo.createdAt,
              hasRules: (folderInfo.rules?.length || 0) > 0
            }
          };
        } catch (error) {
          logger.error('Failed to get folder info', { error });
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    }
  ];
}