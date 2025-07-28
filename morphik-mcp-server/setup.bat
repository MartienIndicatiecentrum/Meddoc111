@echo off
echo Setting up Morphik MCP Server...

echo Installing dependencies...
call npm install

if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    echo Please edit .env and add your Morphik API key
)

echo Building TypeScript...
call npm run build

echo.
echo Setup complete!
echo.
echo Next steps:
echo 1. Edit .env and add your MORPHIK_API_KEY
echo 2. Update .cursor/mcp.json with your API key
echo 3. Restart your MCP client (Cursor/Claude Desktop)
pause