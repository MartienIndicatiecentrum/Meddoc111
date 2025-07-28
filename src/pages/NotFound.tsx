import React from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';

const NotFound: React.FC = () => {
  return (
    <AppLayout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Pagina niet gevonden
          </h1>
          <p className="text-gray-600 mb-8 max-w-md">
            Sorry, de pagina die je zoekt bestaat niet of is verplaatst. 
            Controleer de URL of ga terug naar de startpagina.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ga naar Dashboard
            </Link>
            <button 
              onClick={() => window.history.back()}
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Ga terug
            </button>
          </div>
          
          <div className="mt-12">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Populaire pagina's:
            </h2>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link 
                to="/" 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Dashboard
              </Link>
              <Link 
                to="/taken" 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Taken
              </Link>
              <Link 
                to="/clienten" 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                <span className="text-gray-500">Cliënten</span>
              </Link>
              <Link 
                to="/documenten" 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Documenten
              </Link>
              <Link 
                to="/planning" 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Planning
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default NotFound;