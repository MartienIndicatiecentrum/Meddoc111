# MedDoc AI Flow

Een geavanceerd document management en communicatie systeem voor de gezondheidszorg, gebouwd met moderne web technologieën.

## 🚀 Features

- **Document Management**: Upload, preview en beheer van medische documenten
- **Client Communication**: Logboek systeem voor client communicatie
- **AI Integration**: RAG (Retrieval-Augmented Generation) voor document analyse
- **Real-time Updates**: Live updates via Supabase real-time subscriptions
- **Responsive Design**: Werkt op alle apparaten en schermformaten
- **Type Safety**: Volledige TypeScript ondersteuning
- **Modern UI**: Gebouwd met Shadcn UI en Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React 18** - Moderne React met hooks en concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Snelle build tool en development server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn UI** - Moderne component library
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **Lucide React** - Icon library

### Backend
- **Supabase** - Backend-as-a-Service (Database, Auth, Storage)
- **Node.js** - Server-side JavaScript
- **Express.js** - Web framework
- **Python** - RAG server voor AI functionaliteit

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **Husky** - Git hooks
- **Lint-staged** - Pre-commit linting

## 📋 Vereisten

- Node.js 18+
- npm 8+
- Python 3.11+
- Supabase account

## 🚀 Installatie

### 1. Clone de repository

```bash
git clone <repository-url>
cd Meddoc111
```

### 2. Installeer dependencies

```bash
npm install
```

### 3. Configureer environment variables

Kopieer het voorbeeld bestand en vul je eigen waarden in:

```bash
cp env.example .env
```

Vul de volgende variabelen in:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: Anthropic API Key (voor AI responses)
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# Server Configuration
PORT=8081
RAG_PORT=5001
DEBUG=false
NODE_ENV=development
```

### 4. Setup database

Voer het SQL script uit in je Supabase dashboard:

```sql
-- Kopieer en plak de inhoud van create-logboek-documents-table-fixed.sql
-- in de Supabase SQL Editor en klik op "Run"
```

### 5. Installeer Python dependencies

```bash
pip install -r requirements.txt
```

### 6. Start de development servers

```bash
npm run dev
```

Dit start alle services:
- Frontend (Vite) op http://localhost:3000
- Backend (Express) op http://localhost:8081
- RAG Server (Python) op http://localhost:5001

## 📁 Project Structuur

```
Meddoc111/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Shadcn UI components
│   │   ├── clients/        # Client-related components
│   │   └── layout/         # Layout components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── integrations/       # Third-party integrations
├── supabase/               # Supabase configuration
├── scripts/                # Utility scripts
└── docs/                   # Documentation
```

## 🧪 Testing

### Run tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

### Run linting

```bash
# Check for linting errors
npm run lint:check

# Fix linting errors automatically
npm run lint:fix

# Type checking
npm run type-check
```

## 🏗️ Development

### Code Quality

Dit project volgt strikte code quality standaarden:

- **ESLint**: Code linting met TypeScript en React regels
- **Prettier**: Automatische code formatting
- **TypeScript**: Volledige type safety
- **Husky**: Pre-commit hooks voor code quality
- **Error Boundaries**: Graceful error handling

### Best Practices

1. **Type Safety**: Gebruik altijd TypeScript types
2. **Error Handling**: Implementeer proper error boundaries
3. **Performance**: Gebruik React.memo en useMemo waar nodig
4. **Accessibility**: Volg WCAG guidelines
5. **Security**: Valideer alle user input
6. **Testing**: Schrijf tests voor kritieke functionaliteit

### Code Style

- Gebruik functionele componenten met hooks
- Implementeer proper error boundaries
- Gebruik custom hooks voor shared logic
- Volg de ESLint en Prettier configuratie
- Schrijf duidelijke comments voor complexe logica

## 🚀 Deployment

### Production Build

```bash
npm run build:prod
```

### Environment Variables

Zorg ervoor dat alle production environment variables correct zijn ingesteld:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NODE_ENV=production`

### Database Migrations

Voer alle database migraties uit voordat je deployt:

```bash
# In Supabase dashboard
-- Voer alle SQL scripts uit in de juiste volgorde
```

## 🔧 Scripts

### Development

```bash
npm run dev              # Start alle services
npm run dev:frontend     # Start alleen frontend
npm run dev:backend      # Start alleen backend
npm run dev:rag          # Start alleen RAG server
```

### Build & Deploy

```bash
npm run build            # Build voor development
npm run build:prod       # Build voor production
npm run preview          # Preview build
```

### Code Quality

```bash
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run type-check       # TypeScript type checking
npm run format           # Format code met Prettier
```

### Testing

```bash
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests met coverage
```

### Utilities

```bash
npm run verify           # Verify alle services
npm run check:env        # Check environment variables
npm run clean            # Clean build artifacts
npm run analyze          # Analyze bundle size
```

## 🐛 Troubleshooting

### Veelvoorkomende Problemen

1. **"dotenv module not found"**
   ```bash
   npm install
   ```

2. **Python not found**
   ```bash
   # Installeer Python 3.11+
   # Update start-all-services.js met correcte Python path
   ```

3. **Supabase connection errors**
   - Controleer environment variables
   - Verifieer Supabase project instellingen
   - Check RLS policies

4. **Port conflicts**
   ```bash
   npm run test:ports
   ```

### Debug Mode

```bash
# Start met debug logging
DEBUG=true npm run dev
```

## 📚 API Documentation

### Client Service

```typescript
// Get all clients
const clients = await clientService.getClients();

// Get client by ID
const client = await clientService.getClient(id);

// Create log entry
const entry = await clientService.createLogEntry(data);

// Upload document
const document = await clientService.uploadDocument(file, clientId);
```

### Custom Hooks

```typescript
// Use logboek hook
const { entries, loading, error, addEntry } = useLogboek({
  clientId: 'client-id',
  initialFilters: { status: 'Urgent' }
});
```

## 🤝 Contributing

1. Fork de repository
2. Maak een feature branch (`git checkout -b feature/amazing-feature`)
3. Commit je changes (`git commit -m 'Add amazing feature'`)
4. Push naar de branch (`git push origin feature/amazing-feature`)
5. Open een Pull Request

### Development Guidelines

- Volg de bestaande code style
- Schrijf tests voor nieuwe functionaliteit
- Update documentatie waar nodig
- Gebruik conventional commits
- Test je changes lokaal

## 📄 License

Dit project is gelicenseerd onder de MIT License - zie het [LICENSE](LICENSE) bestand voor details.

## 🆘 Support

Voor vragen of problemen:

1. Check de [Issues](../../issues) pagina
2. Raadpleeg de [Documentation](docs/)
3. Neem contact op met het development team

## 🔄 Changelog

### v1.0.0
- Initial release
- Document management systeem
- Client communication logboek
- AI integration met RAG
- Modern UI met Shadcn UI
- Type-safe development met TypeScript
