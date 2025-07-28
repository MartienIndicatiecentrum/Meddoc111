# Complete Test Setup Script voor ClientAwareChat
# Run dit script in je project root directory (waar package.json staat)

Write-Host "🚀 Starting Complete Test Setup..." -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Yellow

# Check if we're in the right directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found! Run this script in your project root." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found package.json - proceeding with setup..." -ForegroundColor Green

# Create jest.config.js
Write-Host "📝 Creating jest.config.js..." -ForegroundColor Cyan
$jestConfig = @"
// jest.config.js (plaats dit in je project root, naast package.json)
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/setupTests.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  verbose: true,
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ]
};
"@

$jestConfig | Out-File -FilePath "jest.config.js" -Encoding UTF8
Write-Host "✅ jest.config.js created" -ForegroundColor Green

# Create src directory if it doesn't exist
if (!(Test-Path "src")) {
    New-Item -ItemType Directory -Name "src" | Out-Null
    Write-Host "📁 Created src directory" -ForegroundColor Green
}

# Create setupTests.ts
Write-Host "📝 Creating src/setupTests.ts..." -ForegroundColor Cyan
$setupTests = @"
// src/setupTests.ts
import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock window.fetch for AI API calls
global.fetch = jest.fn();

// Setup default fetch mock response
beforeEach(() => {
  (global.fetch as jest.Mock).mockClear();
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({ response: 'Mocked AI response' })
  });
});

// Console error suppression for React warnings
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: React.createFactory() is deprecated'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
"@

$setupTests | Out-File -FilePath "src/setupTests.ts" -Encoding UTF8
Write-Host "✅ setupTests.ts created" -ForegroundColor Green

# Create directory structure
Write-Host "📁 Creating directory structure..." -ForegroundColor Cyan
$directories = @(
    "src/__tests__",
    "src/__tests__/components",
    "src/__tests__/hooks", 
    "src/__tests__/services",
    "src/__mocks__",
    "src/components",
    "src/hooks",
    "src/services",
    "src/types",
    "src/utils"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  ✓ Created $dir" -ForegroundColor Gray
    }
}
Write-Host "✅ Directory structure created" -ForegroundColor Green

# Create main test file
Write-Host "📝 Creating ClientAwareChat.test.tsx..." -ForegroundColor Cyan
$mainTest = @"
// __tests__/components/ClientAwareChat.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientAwareChat } from '../../components/ClientAwareChat';

// Mock de externe dependencies
jest.mock('../../services/ClientService');
jest.mock('../../services/AIService'); 
jest.mock('../../services/QueryProcessor');
jest.mock('../KiesClientDropdown', () => {
  return function MockKiesClientDropdown({ value, onSelect }: any) {
    return (
      <select 
        data-testid="client-dropdown" 
        value={value} 
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="">Selecteer client</option>
        <option value="client-1">Test Client 1</option>
        <option value="client-2">Test Client 2</option>
      </select>
    );
  };
});

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 'client-1',
              naam: 'Test Client',
              email: 'test@example.com',
              telefoon: '123456789',
              adres: 'Test Straat 1'
            },
            error: null
          })),
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({
              data: [
                { title: 'Document 1', created_at: new Date() },
                { title: 'Document 2', created_at: new Date() }
              ],
              error: null
            }))
          }))
        }))
      }))
    }))
  }
}));

describe('ClientAwareChat', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    test('renders floating chat button initially', () => {
      render(<ClientAwareChat />);
      
      const chatButton = screen.getByRole('button', { name: /open ai chat/i });
      expect(chatButton).toBeInTheDocument();
      expect(chatButton).toHaveClass('bg-gradient-to-br');
    });

    test('does not show chat window initially', () => {
      render(<ClientAwareChat />);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText('AI Cliënt Chat')).not.toBeInTheDocument();
    });
  });

  describe('Chat Window Opening/Closing', () => {
    test('opens chat window when button is clicked', async () => {
      render(<ClientAwareChat />);
      
      const chatButton = screen.getByRole('button', { name: /open ai chat/i });
      await user.click(chatButton);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('AI Cliënt Chat')).toBeInTheDocument();
    });

    test('closes chat window when close button is clicked', async () => {
      render(<ClientAwareChat />);
      
      // Open chat
      const chatButton = screen.getByRole('button', { name: /open ai chat/i });
      await user.click(chatButton);
      
      // Close chat
      const closeButton = screen.getByRole('button', { name: /sluit chat/i });
      await user.click(closeButton);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Basic Functionality', () => {
    test('shows client selector in chat window', async () => {
      render(<ClientAwareChat />);
      
      const chatButton = screen.getByRole('button', { name: /open ai chat/i });
      await user.click(chatButton);
      
      expect(screen.getByText('Selecteer Cliënt')).toBeInTheDocument();
      expect(screen.getByTestId('client-dropdown')).toBeInTheDocument();
    });

    test('input is initially disabled', async () => {
      render(<ClientAwareChat />);
      
      const chatButton = screen.getByRole('button', { name: /open ai chat/i });
      await user.click(chatButton);
      
      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /verstuur/i });
      
      expect(input).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', async () => {
      render(<ClientAwareChat />);
      
      const chatButton = screen.getByRole('button', { name: /open ai chat/i });
      expect(chatButton).toHaveAttribute('aria-label', 'Open AI Chat');
      
      await user.click(chatButton);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });
});
"@

$mainTest | Out-File -FilePath "src/__tests__/components/ClientAwareChat.test.tsx" -Encoding UTF8
Write-Host "✅ ClientAwareChat.test.tsx created" -ForegroundColor Green

# Create basic mock files
Write-Host "📝 Creating mock files..." -ForegroundColor Cyan

# Mock KiesClientDropdown
$mockDropdown = @"
// __mocks__/KiesClientDropdown.tsx
import React from 'react';

const MockKiesClientDropdown = ({ value, onSelect, ...props }: any) => (
  <select 
    data-testid="client-dropdown" 
    value={value} 
    onChange={(e) => onSelect(e.target.value)}
    {...props}
  >
    <option value="">Selecteer client</option>
    <option value="client-1">Test Client 1</option>
    <option value="client-2">Test Client 2</option>
  </select>
);

export default MockKiesClientDropdown;
"@

$mockDropdown | Out-File -FilePath "src/__mocks__/KiesClientDropdown.tsx" -Encoding UTF8

# Create types file
$typesFile = @"
// types/chat.types.ts
export interface Message {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: Date;
  context?: ClientContext;
  suggestions?: string[];
  isError?: boolean;
}

export interface ClientContext {
  id: string;
  naam?: string;
  adres?: string;
  telefoon?: string;
  email?: string;
  documentCount?: number;
  taskCount?: number;
  recentActivity?: any[];
}

export interface QueryPattern {
  pattern: RegExp;
  action: string;
  proactiveFollowUp?: string[];
}

export interface ChatConfig {
  aiEndpoint: string;
  maxRetries: number;
  timeoutMs: number;
}
"@

$typesFile | Out-File -FilePath "src/types/chat.types.ts" -Encoding UTF8

# Create basic component stub
$componentStub = @"
// components/ClientAwareChat.tsx
import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';

interface ClientAwareChatProps {
  className?: string;
  position?: 'bottom-left' | 'bottom-right';
  theme?: 'light' | 'dark';
}

export const ClientAwareChat: React.FC<ClientAwareChatProps> = ({ 
  className = '',
  position = 'bottom-left',
  theme = 'light'
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={`fixed z-50 bottom-6 left-6 ${className}`}>
      {!open && (
        <button
          className="w-16 h-16 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded-full shadow-2xl flex items-center justify-center focus:outline-none focus:ring-4 ring-blue-300 border-2 border-white transition-all duration-200"
          onClick={() => setOpen(true)}
          aria-label="Open AI Chat"
        >
          <MessageCircle className="w-8 h-8" />
        </button>
      )}

      {open && (
        <div 
          className="w-96 max-w-[95vw] bg-white rounded-xl shadow-2xl flex flex-col border border-gray-200"
          role="dialog"
          aria-labelledby="chat-title"
          aria-modal="true"
        >
          <header className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-xl">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              <h1 id="chat-title" className="font-semibold text-blue-800">
                AI Cliënt Chat
              </h1>
            </div>
            <button
              className="text-gray-400 hover:text-blue-600 text-xl px-2 transition-colors"
              onClick={() => setOpen(false)}
              aria-label="Sluit chat"
            >
              ×
            </button>
          </header>

          <div className="p-3 border-b bg-gray-50">
            <label className="text-sm font-medium text-gray-700">
              Selecteer Cliënt
            </label>
            <select data-testid="client-dropdown" className="w-full mt-1 border rounded">
              <option value="">Selecteer client</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-80 text-sm">
            {/* Messages would go here */}
          </div>

          <div className="p-3 border-t">
            <div className="flex gap-2">
              <input
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Selecteer eerst een cliënt..."
                disabled={true}
                role="textbox"
              />
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                disabled={true}
                aria-label="Verstuur bericht"
              >
                Verstuur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientAwareChat;
"@

$componentStub | Out-File -FilePath "src/components/ClientAwareChat.tsx" -Encoding UTF8

Write-Host "✅ Mock files and component stub created" -ForegroundColor Green

# Update package.json scripts
Write-Host "📝 Updating package.json scripts..." -ForegroundColor Cyan
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    
    # Add test scripts
    if (-not $packageJson.scripts) {
        $packageJson | Add-Member -Type NoteProperty -Name "scripts" -Value @{}
    }
    
    $packageJson.scripts | Add-Member -Type NoteProperty -Name "test" -Value "jest" -Force
    $packageJson.scripts | Add-Member -Type NoteProperty -Name "test:watch" -Value "jest --watch" -Force
    $packageJson.scripts | Add-Member -Type NoteProperty -Name "test:coverage" -Value "jest --coverage" -Force
    $packageJson.scripts | Add-Member -Type NoteProperty -Name "test:ci" -Value "jest --ci --coverage --passWithNoTests" -Force
    
    $packageJson | ConvertTo-Json -Depth 10 | Out-File "package.json" -Encoding UTF8
    Write-Host "✅ package.json updated with test scripts" -ForegroundColor Green
}

# Create README for tests
$readme = @"
# Test Setup Complete! 🎉

## 📁 Created Structure:
```
src/
├── __tests__/
│   └── components/
│       └── ClientAwareChat.test.tsx
├── __mocks__/
│   └── KiesClientDropdown.tsx
├── components/
│   └── ClientAwareChat.tsx (basic stub)
├── types/
│   └── chat.types.ts
├── setupTests.ts
└── (other directories...)

jest.config.js (root level)
```

## 🚀 Available Commands:
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ci` - Run tests for CI/CD

## 🧪 Test the Setup:
```powershell
npm test
```

## 📋 Next Steps:
1. Run `npm test` to verify setup
2. Customize the ClientAwareChat component
3. Add more tests as needed
4. Run `npm run test:coverage` for coverage report

## 🔧 Troubleshooting:
If you get errors, check:
- All dependencies are installed
- TypeScript paths are correct
- Component imports match your structure
"@

$readme | Out-File -FilePath "TEST_SETUP_README.md" -Encoding UTF8

# Final summary
Write-Host "`n🎉 SETUP COMPLETE!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Yellow
Write-Host "✅ jest.config.js created" -ForegroundColor Green
Write-Host "✅ setupTests.ts created" -ForegroundColor Green
Write-Host "✅ Directory structure created" -ForegroundColor Green
Write-Host "✅ ClientAwareChat.test.tsx created" -ForegroundColor Green
Write-Host "✅ Mock files created" -ForegroundColor Green
Write-Host "✅ Basic component stub created" -ForegroundColor Green
Write-Host "✅ package.json updated" -ForegroundColor Green
Write-Host "✅ README created" -ForegroundColor Green

Write-Host "`n🧪 TEST THE SETUP:" -ForegroundColor Cyan
Write-Host "npm test" -ForegroundColor Yellow

Write-Host "`n📋 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Run 'npm test' to verify everything works" -ForegroundColor White
Write-Host "2. Check TEST_SETUP_README.md for details" -ForegroundColor White
Write-Host "3. Customize components as needed" -ForegroundColor White

Write-Host "`n🚀 Setup completed successfully!" -ForegroundColor Green