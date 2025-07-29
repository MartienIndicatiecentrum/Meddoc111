import React, { useState } from 'react';
import { useEmailReminders } from '@/hooks/useEmailReminders';
import { Bell, Play, Square, RefreshCw, Mail, Settings } from 'lucide-react';

/**
 * Admin component for managing email reminder system
 */
const EmailReminderAdmin: React.FC = () => {
  const {
    status,
    isProcessing,
    startScheduler,
    stopScheduler,
    processRemindersManually,
    sendTestReminder
  } = useEmailReminders();

  const [intervalMinutes, setIntervalMinutes] = useState(5);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Email Reminder Systeem</h2>
      </div>

      {/* Status Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${status.isRunning ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="font-medium">
            Status: {status.isRunning ? 'Actief' : 'Gestopt'}
          </span>
        </div>
        {status.isRunning && (
          <p className="text-sm text-gray-600">
            Controleert elke {status.intervalMinutes} minuten op nieuwe herinneringen
          </p>
        )}
        {status.lastProcessed && (
          <p className="text-sm text-gray-600">
            Laatst verwerkt: {status.lastProcessed.toLocaleString('nl-NL')}
          </p>
        )}
      </div>

      {/* Controls Section */}
      <div className="space-y-4">
        {/* Scheduler Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Interval (minuten):</label>
            <input
              type="number"
              min="1"
              max="60"
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(Number(e.target.value))}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              disabled={status.isRunning}
            />
          </div>

          {!status.isRunning ? (
            <button
              onClick={() => startScheduler(intervalMinutes)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              Start Scheduler
            </button>
          ) : (
            <button
              onClick={stopScheduler}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Square className="w-4 h-4" />
              Stop Scheduler
            </button>
          )}
        </div>

        {/* Manual Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={processRemindersManually}
            disabled={isProcessing}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            {isProcessing ? 'Verwerken...' : 'Handmatig Verwerken'}
          </button>

          <button
            onClick={sendTestReminder}
            disabled={isProcessing}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Mail className="w-4 h-4" />
            Test Email Versturen
          </button>
        </div>
      </div>

      {/* Information Section */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">ℹ️ Informatie</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• De scheduler controleert automatisch op afspraken die een herinnering nodig hebben</li>
          <li>• Herinneringen worden alleen verzonden voor afspraken met status "Gepland"</li>
          <li>• Elke herinnering wordt slechts één keer verzonden</li>
          <li>• Test emails worden verzonden naar test@example.com</li>
        </ul>
      </div>

      {/* Requirements Section */}
      <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-medium text-yellow-900 mb-2">⚠️ Vereisten</h3>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Zorg ervoor dat de Supabase Edge Function 'send-email' is gedeployed</li>
          <li>• Configureer de RESEND_API_KEY in Supabase omgevingsvariabelen</li>
          <li>• Voeg de reminder kolommen toe aan de appointments tabel</li>
        </ul>
      </div>
    </div>
  );
};

export default EmailReminderAdmin;
