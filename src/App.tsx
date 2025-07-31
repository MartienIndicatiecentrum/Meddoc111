import React, { Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createBrowserRouter,
  RouterProvider,
  useParams,
} from 'react-router-dom';

// Stagewise imports
import { StagewiseToolbar } from '@stagewise/toolbar-react';
import ReactPlugin from '@stagewise-plugins/react';

// Import pages
import Dashboard from './pages/Dashboard';
import Documenten from './pages/Documenten';
import Clienten from './pages/Clienten';
import Planning from './pages/Planning';
import Medewerkers from './pages/Medewerkers';
import TakenPage from './pages/TakenPage';
import Factuur from './pages/Factuur';
import FileUpload from './pages/FileUpload';
import DocumentUpload from './pages/DocumentUpload';
import AIChat from './pages/AIChat';
import NotFound from './pages/NotFound';
import Kalender from './pages/Kalender';
import ProgressFlowPage from './pages/ProgressFlowPage';
import PGBProcesFlowPage from './pages/PGBProcesFlowPage';
import TestAIChat from './pages/TestAIChat';
import TakenVerzekeraar from './pages/TakenVerzekeraar';
import FactuurGeneratorPage from './pages/FactuurGeneratorPage';
import FactuurPdfSjabloonPage from './pages/FactuurPdfSjabloonPage';
import LopendeZaken from './pages/LopendeZaken';
import Logboek from './pages/Logboek';

// Import admin components
import EmailReminderAdmin from './components/admin/EmailReminderAdmin';

// Lazy loaded components
const DocumentDetailPage = React.lazy(
  () => import('./pages/DocumentDetailPage')
);
const ClientDocumentsPage = React.lazy(
  () => import('./pages/ClientDocumentsPage')
);

// Import components
import ChatWindow from './components/ChatWindow';
import DocumentAITest from './components/DocumentAITest';

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading component for Suspense fallbacks
const LoadingSpinner: React.FC<{ message?: string }> = ({
  message = 'Loading...',
}) => (
  <div className='flex items-center justify-center min-h-[200px]'>
    <div className='text-center'>
      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2'></div>
      <p className='text-gray-600 text-sm'>{message}</p>
    </div>
  </div>
);

// Error Boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50'>
          <div className='text-center p-8'>
            <h1 className='text-2xl font-bold text-red-600 mb-4'>
              Er is iets misgegaan
            </h1>
            <p className='text-gray-600 mb-4'>
              {this.state.error?.message || 'Onverwachte fout opgetreden'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
            >
              Pagina herladen
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component for client documents page
const ClientDocumentsPageWrapper: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();

  if (!clientId) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold text-gray-800 mb-2'>
            Geen cliënt geselecteerd
          </h2>
          <p className='text-gray-600'>
            Selecteer een cliënt om documenten te bekijken.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner message='Documenten laden...' />}>
      <ClientDocumentsPage clientId={clientId} />
    </Suspense>
  );
};

// Create router with v7 future flags
const router = createBrowserRouter(
  [
    // Main Routes
    { path: '/', element: <Dashboard /> },
    { path: '/dashboard', element: <Dashboard /> },

    // Document Routes
    { path: '/documenten', element: <Documenten /> },
    {
      path: '/documenten/:id',
      element: (
        <Suspense fallback={<LoadingSpinner message='Document laden...' />}>
          <DocumentDetailPage />
        </Suspense>
      ),
    },

    // Client Routes
    { path: '/clienten', element: <Clienten /> },
    {
      path: '/clienten/:clientId/documenten',
      element: <ClientDocumentsPageWrapper />,
    },

    // Task Routes
    { path: '/taken', element: <TakenPage /> },
    { path: '/lopende-zaken', element: <LopendeZaken /> },
    { path: '/logboek', element: <Logboek /> },

    // Progress Flow Routes
    { path: '/progress-flow', element: <ProgressFlowPage /> },

    // Planning Routes
    { path: '/planning', element: <Planning /> },

    // Medewerkers Routes
    { path: '/medewerkers', element: <Medewerkers /> },

    // Factuur Routes
    { path: '/factuur', element: <Factuur /> },
    { path: '/factuur-generator', element: <FactuurGeneratorPage /> },
    { path: '/factuur-pdf-sjabloon', element: <FactuurPdfSjabloonPage /> },

    // File Upload Routes
    { path: '/file-upload', element: <FileUpload /> },
    { path: '/document-upload', element: <DocumentUpload /> },
    { path: '/ai-chat', element: <AIChat /> },

    // Kalender Route
    { path: '/kalender', element: <Kalender /> },

    // Overige routes
    { path: '/taken-verzekeraar', element: <TakenVerzekeraar /> },

    // Admin Routes
    {
      path: '/admin/email-reminders',
      element: (
        <div className='min-h-screen bg-gray-50 py-8'>
          <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='mb-6'>
              <h1 className='text-3xl font-bold text-gray-900'>
                Email Reminder Beheer
              </h1>
              <p className='text-gray-600 mt-2'>
                Beheer en test het email reminder systeem voor afspraken
              </p>
            </div>
            <EmailReminderAdmin />
          </div>
        </div>
      ),
    },

    // PGB Process Flow
    { path: '/pgb-proces-flow', element: <PGBProcesFlowPage /> },

    // Development/Testing Routes
    {
      path: '/ai-test',
      element: (
        <div className='p-8'>
          <h1 className='text-2xl font-bold mb-4'>AI Document Test</h1>
          <DocumentAITest />
        </div>
      ),
    },
    { path: '/test-ai-chat', element: <TestAIChat /> },

    // Catch-all 404 Route
    { path: '*', element: <NotFound /> },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

// Main App component
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <div className='min-h-screen bg-gray-50'>
            <RouterProvider router={router} />

            {/* Global Components */}
            <ChatWindow />

            {/* Stagewise Toolbar - Only in development */}
            {import.meta.env.DEV && (
              <StagewiseToolbar
                config={{
                  plugins: [ReactPlugin],
                }}
              />
            )}
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
