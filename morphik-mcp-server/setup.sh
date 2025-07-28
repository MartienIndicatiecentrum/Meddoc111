#!/bin/bash

echo "Setting up Morphik MCP Server..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Copy env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "Please edit .env and add your Morphik API key"
fi

# Build the project
echo "Building TypeScript..."
npm run build

echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your MORPHIK_API_KEY"
echo "2. Update .cursor/mcp.json with your API key"
echo "3. Restart your MCP client (Cursor/Claude Desktop)"