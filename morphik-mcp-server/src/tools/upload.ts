import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { MorphikClient } from '../morphik-client.js';
import { FileUpload } from '../types.js';
import {
  readFileAsBuffer,
  getFilesInDirectory,
  getMimeType,
  extractMetadataFromPath,
  logger
} from '../utils.js';
import path from 'path';

export function createUploadTools(client: MorphikClient): Tool[] {
  return [
    {
      name: 'morphik_upload_file',
      description: 'Upload a single file to Morphik AI',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'Path to the file to upload'
          },
          folder: {
            type: 'string',
            description: 'Optional folder name to organize the document'
          },
          metadata: {
            type: 'object',
            description: 'Optional metadata to attach to the document',
            additionalProperties: true
          }
        },
        required: ['filePath']
      },
      handler: async (args: any) => {
        try {
          const { filePath, folder, metadata = {} } = args;

          logger.info(`Uploading file: ${filePath}`);

          const fileBuffer = await readFileAsBuffer(filePath);
          const mimeType = getMimeType(filePath);
          const pathMetadata = extractMetadataFromPath(filePath);

          const fileUpload: FileUpload = {
            path: filePath,
            content: fileBuffer,
            mimeType,
            metadata: { ...pathMetadata, ...metadata }
          };

          const result = await client.uploadFile(fileUpload, folder);

          if (result.success) {
            logger.info(`File uploaded successfully: ${result.documentId}`);
            return {
              success: true,
              documentId: result.documentId,
              message: `File ${path.basename(filePath)} uploaded successfully`
            };
          } else {
            throw new Error(result.error || 'Upload failed');
          }
        } catch (error) {
          logger.error('File upload failed', { error });
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    },

    {
      name: 'morphik_upload_folder',
      description: 'Upload all files in a folder to Morphik AI',
      inputSchema: {
        type: 'object',
        properties: {
          folderPath: {
            type: 'string',
            description: 'Path to the folder to upload'
          },
          targetFolder: {
            type: 'string',
            description: 'Target folder name in Morphik'
          },
          includeSubfolders: {
            type: 'boolean',
            description: 'Include files from subfolders (default: true)',
            default: true
          },
          fileExtensions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by file extensions (e.g., [".pdf", ".txt"])'
          },
          metadata: {
            type: 'object',
            description: 'Metadata to attach to all documents',
            additionalProperties: true
          }
        },
        required: ['folderPath', 'targetFolder']
      },
      handler: async (args: any) => {
        try {
          const {
            folderPath,
            targetFolder,
            fileExtensions = [],
            metadata = {}
          } = args;

          logger.info(`Uploading folder: ${folderPath} to ${targetFolder}`);

          let files = await getFilesInDirectory(folderPath);

          // Filter by extensions if specified
          if (fileExtensions.length > 0) {
            files = files.filter(file => {
              const ext = path.extname(file).toLowerCase();
              return fileExtensions.includes(ext);
            });
          }

          if (files.length === 0) {
            return {
              success: true,
              message: 'No files found to upload',
              uploadedCount: 0,
              failedCount: 0
            };
          }

          // Prepare file uploads
          const fileUploads: FileUpload[] = await Promise.all(
            files.map(async (filePath) => {
              const fileBuffer = await readFileAsBuffer(filePath);
              const mimeType = getMimeType(filePath);
              const pathMetadata = extractMetadataFromPath(filePath);
              const relativePath = path.relative(folderPath, filePath);

              return {
                path: filePath,
                content: fileBuffer,
                mimeType,
                metadata: {
                  ...pathMetadata,
                  ...metadata,
                  relativePath,
                  sourceFolderPath: folderPath
                }
              };
            })
          );

          // Upload in batches of 10
          const batchSize = 10;
          let totalUploaded = 0;
          let totalFailed = 0;

          for (let i = 0; i < fileUploads.length; i += batchSize) {
            const batch = fileUploads.slice(i, i + batchSize);
            const result = await client.uploadFiles(batch, targetFolder);

            totalUploaded += result.uploadedCount;
            totalFailed += result.failedCount;

            logger.info(`Batch ${Math.floor(i / batchSize) + 1} complete: ${result.uploadedCount} uploaded, ${result.failedCount} failed`);
          }

          return {
            success: totalFailed === 0,
            message: `Uploaded ${totalUploaded} files, ${totalFailed} failed`,
            uploadedCount: totalUploaded,
            failedCount: totalFailed,
            totalFiles: files.length
          };
        } catch (error) {
          logger.error('Folder upload failed', { error });
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    }
  ];
}