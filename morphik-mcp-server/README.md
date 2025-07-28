# Morphik MCP Server

This MCP (Model Context Protocol) server integrates Morphik AI's document management and intelligent querying capabilities into the MedDoc AI Flow application.

## Features

- **Document Upload**: Upload single files or entire folders to Morphik AI
- **Intelligent Queries**: Use Morphik's agent mode for context-aware Q&A
- **Document Retrieval**: Search and retrieve documents with metadata
- **Folder Management**: Create and manage folders for document organization
- **Conversation Context**: Maintain chat sessions for continuous interactions

## Installation

1. Navigate to the morphik-mcp-server directory:
   ```bash
   cd morphik-mcp-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

4. Add your Morphik API credentials to `.env`:
   ```
   MORPHIK_API_KEY=your_api_key_here
   MORPHIK_API_URL=https://api.morphik.ai
   ```

5. Build the TypeScript code:
   ```bash
   npm run build
   ```

## Configuration

Add the Morphik MCP server to your `.cursor/mcp.json` or Claude Desktop configuration:

```json
{
  "morphik": {
    "command": "node",
    "args": ["morphik-mcp-server/dist/index.js"],
    "env": {
      "MORPHIK_API_KEY": "your_api_key_here",
      "MORPHIK_API_URL": "https://api.morphik.ai",
      "MORPHIK_DEFAULT_FOLDER": "meddoc-documents"
    }
  }
}
```

## Available Tools

### Upload Tools

#### `morphik_upload_file`
Upload a single file to Morphik AI.

**Parameters:**
- `filePath` (required): Path to the file to upload
- `folder` (optional): Target folder name
- `metadata` (optional): Additional metadata to attach

**Example:**
```typescript
await mcp.call('morphik_upload_file', {
  filePath: '/path/to/document.pdf',
  folder: 'client-123',
  metadata: {
    client_id: '123',
    document_type: 'medical_report'
  }
});
```

#### `morphik_upload_folder`
Upload all files from a folder to Morphik AI.

**Parameters:**
- `folderPath` (required): Path to the folder to upload
- `targetFolder` (required): Target folder name in Morphik
- `includeSubfolders` (optional): Include files from subfolders (default: true)
- `fileExtensions` (optional): Filter by file extensions (e.g., [".pdf", ".txt"])
- `metadata` (optional): Metadata to attach to all documents

**Example:**
```typescript
await mcp.call('morphik_upload_folder', {
  folderPath: '/documents/client-123',
  targetFolder: 'client-123-documents',
  fileExtensions: ['.pdf', '.docx'],
  metadata: {
    client_id: '123',
    upload_batch: 'batch-001'
  }
});
```

### Query Tools

#### `morphik_agent_query`
Query documents using Morphik's intelligent agent mode.

**Parameters:**
- `query` (required): The question to ask
- `folder` (optional): Folder to search within
- `chatId` (optional): Chat ID for conversation context
- `temperature` (optional): Response generation temperature (0-1)
- `maxTokens` (optional): Maximum tokens in response

**Example:**
```typescript
await mcp.call('morphik_agent_query', {
  query: "What medications is the patient currently taking?",
  folder: 'client-123-documents',
  chatId: 'session-456'
});
```

#### `morphik_retrieve_documents`
Search and retrieve documents based on criteria.

**Parameters:**
- `query` (optional): Search query
- `folder` (optional): Folder to search within
- `limit` (optional): Maximum documents to return (default: 10)
- `offset` (optional): Number of documents to skip
- `filters` (optional): Additional metadata filters
- `includeContent` (optional): Include document content (default: false)

**Example:**
```typescript
await mcp.call('morphik_retrieve_documents', {
  query: "blood pressure",
  folder: 'client-123-documents',
  limit: 5,
  filters: {
    document_type: 'medical_report'
  }
});
```

#### `morphik_sync_status`
Check the processing status of uploaded documents.

**Parameters:**
- `documentId` (required): Document ID to check

### Management Tools

#### `morphik_create_folder`
Create a new folder for document organization.

**Parameters:**
- `name` (required): Folder name
- `sanitize` (optional): Auto-sanitize folder name (default: true)

#### `morphik_delete_folder`
Delete a folder and all its documents.

**Parameters:**
- `name` (required): Folder name to delete
- `confirmDelete` (required): Must be true to proceed

#### `morphik_get_folder_info`
Get information about a folder.

**Parameters:**
- `name` (required): Folder name

## Usage in MedDoc AI Flow

### Integration with AI Chat

The Morphik agent can be used as an alternative or complement to the existing RAG system:

```typescript
// In your AI chat component
const response = await morphikQuery({
  query: userQuestion,
  folder: `client-${selectedClientId}`,
  chatId: sessionId
});
```

### Document Upload Integration

Extend the existing document upload flow to sync with Morphik:

```typescript
// After uploading to Supabase
await morphikUpload({
  filePath: uploadedFile.path,
  folder: `client-${clientId}`,
  metadata: {
    supabase_id: document.id,
    client_id: clientId,
    document_type: documentType
  }
});
```

## Error Handling

The server implements comprehensive error handling:
- Automatic retry with exponential backoff for transient failures
- Detailed error messages and logging
- Graceful degradation for non-critical operations

## Monitoring

Logs are written to the console with different levels:
- `debug`: Detailed debugging information
- `info`: General operational information
- `warn`: Warning messages
- `error`: Error messages

Set the log level using the `LOG_LEVEL` environment variable.

## Security Considerations

- API keys are stored securely in environment variables
- All uploads are authenticated using Bearer tokens
- Folder-based access control for document isolation
- No sensitive data is logged

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify your API key is correct
   - Check if the API URL is accessible

2. **Upload Failures**
   - Ensure file paths are correct and accessible
   - Check file size limits (if any)
   - Verify folder permissions

3. **Query Errors**
   - Ensure documents are fully processed before querying
   - Check folder names match exactly

### Debug Mode

Enable debug logging for detailed information:
```bash
LOG_LEVEL=debug npm start
```

## Development

### Running in Development Mode
```bash
npm run dev
```

### Building
```bash
npm run build
```

### Clean Build
```bash
npm run clean && npm run build
```

## License

This MCP server is part of the MedDoc AI Flow project and follows the same licensing terms.