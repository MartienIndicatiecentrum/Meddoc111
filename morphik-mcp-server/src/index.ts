#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { MorphikClient } from './morphik-client.js';
import { createUploadTools } from './tools/upload.js';
import { createQueryTools } from './tools/query.js';
import { createManagementTools } from './tools/manage.js';
import { logger } from './utils.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MORPHIK_API_KEY', 'MORPHIK_API_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Initialize Morphik client
const morphikClient = new MorphikClient({
  apiKey: process.env.MORPHIK_API_KEY!,
  apiUrl: process.env.MORPHIK_API_URL!,
  defaultFolder: process.env.MORPHIK_DEFAULT_FOLDER
});

// Create MCP server
const server = new Server(
  {
    name: 'morphik-mcp-server',
    version: '1.0.0',
    capabilities: {
      tools: {}
    }
  },
  {}
);

// Register all tools
const allTools = [
  ...createUploadTools(morphikClient),
  ...createQueryTools(morphikClient),
  ...createManagementTools(morphikClient)
];

// Handler for listing tools
server.setRequestHandler('tools/list' as any, async () => {
  return {
    tools: allTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  };
});

// Handler for calling tools
server.setRequestHandler('tools/call' as any, async (request: any) => {
  const { name, arguments: args } = request.params;

  const tool = allTools.find(t => t.name === name);

  if (!tool) {
    throw new Error(`Tool not found: ${name}`);
  }

  try {
    logger.info(`Executing tool: ${name}`, { args });
    const result = await (tool.handler as any)(args);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    logger.error(`Tool execution failed: ${name}`, { error });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();

  logger.info('Starting Morphik MCP server...');

  await server.connect(transport);

  logger.info('Morphik MCP server started successfully');
}

// Handle errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
main().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});