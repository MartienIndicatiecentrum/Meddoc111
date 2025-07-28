# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MedDoc AI Flow** is a healthcare document management and planning application designed for Dutch home care organizations (thuiszorgorganisaties). It combines document processing, client management, task scheduling, and AI-powered features to streamline healthcare workflows.
https://github.com/MartienIndicatiecentrum/meddoc-ai-flow

#### Frontend (`src/`)
- `pages/` - Route components (Dashboard, Clienten, Documenten, etc.)
- `components/` - Reusable UI components organized by feature
  - `ui/` - shadcn/ui base components
  - `clients/` - Client management components
  - `documents/` - Document handling components
  - `tasks/` - Task management components
  - `layout/` - Layout components (Header, Sidebar)
- `integrations/supabase/` - Database client and type definitions
- `hooks/` - Custom React hooks
- `services/` - Business logic and API calls
- `store/` - State management
- `types/` - TypeScript type definitions
- `utils/` - Utility functions

#### Backend (`backend/`)
- Simple Express.js server for additional API endpoints
- Primarily used for proxy operations and custom business logic

#### AI/RAG System (`LightRAG/`)
- Document processing and indexing
- Vector embeddings and semantic search
- Question-answering capabilities over healthcare documents

### Database Schema (Supabase)

Key tables:
- `documents` - Document metadata, file paths, and processing status
- `activity_logs` - Audit trail for document operations
- `ai_insights` - AI-generated document insights
- `notifications` - System notifications and reminders
- `search_queries` - Search history and analytics

### Key Features

1. **Document Management**
   - PDF upload and processing
   - AI-powered document analysis
   - Secure file storage in Supabase Storage
   - Document categorization and metadata extraction

2. **Client Management**
   - Comprehensive client profiles
   - Document association with clients
   - GDPR-compliant data handling

3. **Task Management**
   - Task creation and assignment
   - Status tracking and notifications
   - Integration with client workflows

4. **AI Chat Interface**
   - RAG-based question answering
   - Document content querying
   - Contextual responses based on uploaded documents

5. **Planning & Scheduling**
   - Calendar integration
   - Appointment management
   - Resource allocation

## Development Guidelines

### Component Patterns
- Use TypeScript strict mode - all components must be fully typed
- Follow shadcn/ui patterns for consistent styling
- Implement proper error boundaries and loading states
- Use React.lazy() for code splitting on heavy components

### State Management
- Use React Query for server state (caching, synchronization)
- Local state with useState/useReducer for component state
- Zustand stores for complex shared state (see `src/store/`)

### Forms and Validation
- React Hook Form for form management
- Zod schemas for validation (see examples in existing forms)
- Proper error handling and user feedback

### Styling Conventions
- Tailwind CSS utility classes
- Healthcare-appropriate color palette (professional blues and greens)
- Mobile-first responsive design
- Consistent spacing using Tailwind's spacing scale

### Security & Compliance
- GDPR/AVG compliance features implemented
- Proper authentication with Supabase Auth
- Row-level security (RLS) policies in database
- Audit logging for sensitive operations

### AI Integration
- Document processing pipeline with LightRAG
- Vector embeddings for semantic search
- RAG server running on Python backend
- Integration with Supabase for document storage

## Important Files

### Configuration
- `vite.config.ts` - Vite configuration with React SWC
- `tailwind.config.ts` - Tailwind CSS configuration
- `components.json` - shadcn/ui configuration
- `supabase/config.toml` - Supabase local development config

### Key Components
- `src/App.tsx` - Main app with routing and error boundaries
- `src/components/layout/AppLayout.tsx` - Main application layout
- `src/integrations/supabase/client.ts` - Supabase client configuration
- `src/integrations/supabase/types.ts` - Generated TypeScript types

### Development Rules
- Follow the guidelines in `AUTONOMY_RULES.md` for development decisions
- Maintain healthcare compliance requirements
- Implement comprehensive error handling
- Use proper TypeScript typing throughout
- Follow accessibility best practices (WCAG 2.1 AA)

## Testing Strategy

While not fully implemented yet, tests should cover:
- Unit tests for utility functions and hooks
- Integration tests for component interactions
- E2E tests for critical user workflows
- Accessibility testing with tools like axe-core

## Deployment

The application is configured for deployment on platforms supporting static hosting (frontend) and Node.js (backend). Supabase provides the production database and authentication services.