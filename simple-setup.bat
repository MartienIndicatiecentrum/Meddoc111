@echo off
echo 🚀 Starting Simple Test Setup...
echo.

REM Check if package.json exists
if not exist "package.json" (
    echo ❌ Error: package.json not found!
    echo Please run this script in your project root directory.
    pause
    exit /b 1
)

echo ✅ Found package.json

REM Create directories
echo 📁 Creating directories...
if not exist "src" mkdir "src"
if not exist "src\__tests__" mkdir "src\__tests__"
if not exist "src\components" mkdir "src\components"
echo ✅ Directories created

REM Create jest.config.js (simple version)
echo 📝 Creating jest.config.js...
echo module.exports = { > jest.config.js
echo   testEnvironment: 'jsdom', >> jest.config.js
echo   setupFilesAfterEnv: ['./src/setupTests.ts'], >> jest.config.js
echo   verbose: true >> jest.config.js
echo }; >> jest.config.js
echo ✅ jest.config.js created

REM Create setupTests.ts (simple version)
echo 📝 Creating setupTests.ts...
echo import '@testing-library/jest-dom'; > src\setupTests.ts
echo. >> src\setupTests.ts
echo global.fetch = jest.fn(); >> src\setupTests.ts
echo Element.prototype.scrollIntoView = jest.fn(); >> src\setupTests.ts
echo ✅ setupTests.ts created

echo.
echo 🎉 Basic setup complete!
echo.
echo 📋 Next steps:
echo 1. Run: npm test
echo 2. If you get module errors, we'll fix them step by step
echo.
pause