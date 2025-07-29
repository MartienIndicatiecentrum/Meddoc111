import React, { useState } from 'react';
import PGBProcessFlow from '../components/PGBProcessFlow';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Link } from 'react-router-dom';

export default function PGBProcesFlowPage() {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);

  React.useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase.from('clients').select('id, naam').order('naam');
      setClients(data || []);
    };
    fetchClients();
  }, []);

  return (
    <AppLayout>
      <div className="w-full p-6 space-y-8">
        {/* Navigation and Client Selection */}
        <div className="flex flex-wrap gap-4 items-center">
          <Link to="/taken">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Terug naar Taken
            </button>
          </Link>

          {/* Client Selection */}
          <Autocomplete
            options={clients}
            getOptionLabel={(option) => option.naam}
            value={clients.find(c => c.id === selectedClientId) || null}
            onChange={(_, newValue) => setSelectedClientId(newValue ? newValue.id : null)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Selecteer cliënt"
                variant="outlined"
                size="small"
                placeholder="Kies een cliënt om het proces te bekijken..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#e6f0fa'
                  }
                }}
              />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            sx={{ minWidth: 300 }}
          />
        </div>

        {/* Process Flow Content */}
        {selectedClientId ? (
          <PGBProcessFlow clientId={selectedClientId} />
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
                            <h3 className="text-lg font-medium text-gray-500 mb-2">Selecteer een cliënt</h3>
                <p className="text-gray-500 mb-4">
                  Kies een cliënt uit de dropdown hierboven om het PGB proces flow te bekijken.
                </p>
          </div>
        )}

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 Over het PGB Proces Flow:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Volg de voortgang van PGB aanvragen per cliënt</li>
            <li>• Markeer stappen als afgerond door de switches aan te zetten</li>
            <li>• Voeg opmerkingen toe aan elke stap voor duidelijkheid</li>
            <li>• Urgente stappen kunnen apart worden gemarkeerd</li>
            <li>• Het proces wordt automatisch bijgehouden in de database</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}