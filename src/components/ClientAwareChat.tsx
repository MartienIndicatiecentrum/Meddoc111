import React, { useState } from 'react';

interface ClientAwareChatProps {
  className?: string;
}

export const ClientAwareChat: React.FC<ClientAwareChatProps> = ({ className }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      {!open && (
        <button 
          onClick={() => setOpen(true)} 
          aria-label="Open AI Chat"
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Open Chat
        </button>
      )}
      {open && (
        <div role="dialog" className="border p-4 rounded shadow-lg bg-white">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-lg font-bold">AI Chat</h1>
            <button 
              onClick={() => setOpen(false)} 
              aria-label="Close chat"
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Select Client
            </label>
            <select 
              data-testid="client-dropdown"
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select client</option>
              <option value="client-1">Client 1</option>
              <option value="client-2">Client 2</option>
            </select>
          </div>
          
          <div>
            <input 
              disabled 
              role="textbox"
              placeholder="Select a client first..."
              className="w-full border rounded px-3 py-2 mb-2 bg-gray-100"
            />
            <button 
              disabled 
              aria-label="Send message"
              className="px-4 py-2 bg-gray-300 text-gray-500 rounded"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientAwareChat;
import React, { useState } from 'react';

interface ClientAwareChatProps {
  className?: string;
}

export const ClientAwareChat: React.FC<ClientAwareChatProps> = ({ className }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      {!open && (
        <button 
          onClick={() => setOpen(true)} 
          aria-label="Open AI Chat"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Open Chat
        </button>
      )}
      {open && (
        <div role="dialog" className="border p-4 rounded shadow-lg bg-white max-w-sm">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-lg font-bold">AI Chat</h1>
            <button 
              onClick={() => setOpen(false)} 
              aria-label="Close chat"
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Select Client
            </label>
            <select 
              data-testid="client-dropdown"
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select client</option>
              <option value="client-1">Client 1</option>
              <option value="client-2">Client 2</option>
            </select>
          </div>
          
          <div>
            <input 
              disabled 
              role="textbox"
              placeholder="Select a client first..."
              className="w-full border rounded px-3 py-2 mb-2 bg-gray-100"
            />
            <button 
              disabled 
              aria-label="Send message"
              className="px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientAwareChat;