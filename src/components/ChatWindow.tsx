import React, { useState } from "react";
import KiesClientDropdown from "./KiesClientDropdown";
import { supabase } from "@/integrations/supabase/client";

const AI_CHAT_ENDPOINT =
  "https://ltasjbgamoljvqoclgkf.supabase.co/functions/v1/ai-chat";

const CLIENT_FIELDS = [
  { key: "adres", labels: ["adres", "address", "straat", "straatnaam"] },
  { key: "email", labels: ["e-mail", "email", "mail", "emailadres"] },
  { key: "geboortedatum", labels: ["geboortedatum", "geboorte datum", "geboren", "verjaardag", "geboortedatum van", "wanneer geboren"] },
  { key: "bsn", labels: ["bsn", "burgerservicenummer", "sofinummer"] },
  { key: "verzekeraar", labels: ["verzekeraar", "verzekering", "zorgverzekeraar", "zorgverzekering"] },
  { key: "polisnummer", labels: ["polisnummer", "polis nummer", "polis", "verzekeringsnummer"] },
  { key: "telefoon", labels: ["telefoon", "telefoonnummer", "tel", "mobiel", "nummer"] },
  { key: "postcode", labels: ["postcode", "post code", "zip"] },
  { key: "woonplaats", labels: ["woonplaats", "woon plaats", "plaats", "stad", "gemeente"] },
  { key: "huisarts", labels: ["huisarts", "huis arts", "dokter", "arts"] },
  { key: "notities", labels: ["notities", "notitie", "aantekeningen", "opmerkingen"] },
];

type Document = { id: string; title?: string; naam?: string };
type Task = { id: string; taak_type?: string };

import { MessageCircle } from 'lucide-react';

const ChatWindow = () => {
  const [clientId, setClientId] = useState<string>("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{
    sender: "user" | "ai" | "db";
    text: string;
  }[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  function isDbQuery(text: string) {
    return (
      text.trim().toLowerCase().startsWith("toon ") ||
      text.trim().toLowerCase().startsWith("update ") ||
      text.trim().toLowerCase().startsWith("verwijder ")
    );
  }

  function detectClientField(text: string) {
    const lower = text.toLowerCase();
    // Remove common question words to improve matching
    const cleanText = lower.replace(/wat is|wat zijn|wat was|welke|wanneer|wie is|hoe heet/g, '').trim();
    
    console.log('[ChatWindow] Detecting field for query:', text, 'Clean text:', cleanText);
    
    for (const field of CLIENT_FIELDS) {
      for (const label of field.labels) {
        if (lower.includes(label) || cleanText.includes(label)) {
          console.log('[ChatWindow] Matched field:', field.key, 'with label:', label);
          return field.key;
        }
      }
    }
    console.log('[ChatWindow] No field matched');
    return null;
  }

  async function handleSend() {
    if (!input.trim()) return;
    setMessages((msgs) => [...msgs, { sender: "user", text: input }]);
    setLoading(true);
    if (isDbQuery(input)) {
      let dbResult = "";
      if (input.toLowerCase().includes("document")) {
        const { data, error } = await supabase
          .from("documents")
          .select("id,title,naam")
          .eq("client_id", clientId)
          .limit(5);
        if (error) dbResult = `Fout: ${error.message}`;
        else if (data && data.length > 0)
          dbResult = (data as Document[])
            .map((d) => `${d.title || d.naam || d.id}`)
            .join("\n");
        else dbResult = "Geen documenten gevonden.";
      } else if (input.toLowerCase().includes("taak")) {
        const { data, error } = await supabase
          .from("clienttaskstable")
          .select("id,taak_type")
          .eq("client_id", clientId)
          .limit(5);
        if (error) dbResult = `Fout: ${error.message}`;
        else if (data && data.length > 0)
          dbResult = (data as Task[])
            .map((t) => `${t.taak_type || t.id}`)
            .join("\n");
        else dbResult = "Geen taken gevonden.";
      } else {
        dbResult = "Onbekende database-actie. Probeer: 'Toon documenten' of 'Toon taken'.";
      }
      setMessages((msgs) => [...msgs, { sender: "db", text: dbResult }]);
      setLoading(false);
      setInput("");
      return;
    }
    // Try to detect if this is a client-specific query
    const field = detectClientField(input);
    if (field && clientId) {
      console.log('[ChatWindow] Fetching client field:', field, 'for client:', clientId);
      
      try {
        const { data, error } = await supabase
          .from("clients")
          .select(`${field}, naam`)
          .eq("id", clientId)
          .single();
          
        if (error) {
          console.error('[ChatWindow] Database error:', error);
          setMessages((msgs) => [
            ...msgs,
            { sender: "db", text: `Fout bij ophalen gegevens: ${error.message}` },
          ]);
        } else if (!data) {
          setMessages((msgs) => [
            ...msgs,
            { sender: "db", text: "Geen gegevens gevonden voor deze client." },
          ]);
        } else {
          const clientName = data.naam || 'Client';
          const fieldValue = data[field];
          let displayValue = fieldValue || "Niet ingevuld";
          
          // Format dates nicely
          if (field === 'geboortedatum' && fieldValue) {
            const date = new Date(fieldValue);
            displayValue = date.toLocaleDateString('nl-NL', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            });
          }
          
          setMessages((msgs) => [
            ...msgs,
            { sender: "db", text: `${field} van ${clientName}: ${displayValue}` },
          ]);
        }
      } catch (err) {
        console.error('[ChatWindow] Unexpected error:', err);
        setMessages((msgs) => [
          ...msgs,
          { sender: "db", text: "Er is een onverwachte fout opgetreden." },
        ]);
      }
      
      setLoading(false);
      setInput("");
      return;
    }
    // If we have a client selected, try AI with client context
    let clientData = null;
    if (clientId) {
      console.log('[ChatWindow] Fetching full client data for AI context');
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();
      
      if (error) {
        console.error('[ChatWindow] Error fetching client data:', error);
      } else {
        console.log('[ChatWindow] Client data retrieved:', data);
      }
      clientData = data;
    }
    
    console.log('[ChatWindow] Sending to AI endpoint with client context:', clientData ? 'Yes' : 'No');
    
    try {
      const res = await fetch(AI_CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: input, 
          userId: null, 
          documentId: null,
          clientId: clientId || null,
          clientData: clientData,
          context: clientData ? `Je hebt toegang tot gegevens van client ${clientData.naam}` : null
        }),
      });
      
      if (!res.ok) {
        console.error('[ChatWindow] AI endpoint error:', res.status, res.statusText);
        throw new Error(`AI service returned ${res.status}`);
      }
      
      const data = await res.json();
      console.log('[ChatWindow] AI response received:', data);
      
      // Format response with sources if available
      let responseText = data.response || "Geen antwoord ontvangen.";
      if (data.sources && data.sources.length > 0) {
        responseText += "\n\n📄 Bronnen:";
        data.sources.forEach((source: any) => {
          responseText += `\n• ${source.title}`;
        });
      }
      
      setMessages((msgs) => [
        ...msgs,
        { sender: "ai", text: responseText },
      ]);
    } catch (err) {
      console.error('[ChatWindow] Failed to get AI response:', err);
      setMessages((msgs) => [
        ...msgs,
        { sender: "ai", text: "Er is een fout opgetreden bij het verwerken van je vraag. Probeer het opnieuw." },
      ]);
    }
    
    setLoading(false);
    setInput("");
  }

  function handleReset() {
    setMessages([]);
  }

  return (
    <>
      {/* Floating chat button */}
      {!open && (
        <a
          href="/ai-chat"
          className="fixed z-50 bottom-6 left-6 bg-gradient-to-br from-blue-200 via-blue-400 to-blue-600 hover:from-blue-300 hover:to-blue-700 text-white rounded-full shadow-2xl w-16 h-16 flex items-center justify-center text-3xl focus:outline-none focus:ring-2 ring-blue-300 border border-white border-opacity-60 transition-all duration-200"
          aria-label="Open AI Chat"
        >
          <MessageCircle className="w-8 h-8 text-white drop-shadow" />
        </a>
      )}
      {/* Chat window overlay */}
      {open && (
        <div className="fixed z-50 bottom-6 left-6 w-80 max-w-[95vw] bg-white rounded-lg shadow-xl flex flex-col border border-gray-200">
          <div className="flex items-center justify-between p-3 border-b bg-primary-50 rounded-t-lg">
            <span className="font-semibold text-primary-800">Chat & Database</span>
            <button
              className="text-gray-400 hover:text-primary-600 text-xl px-2"
              onClick={() => setOpen(false)}
              title="Sluit chatvenster"
            >
              ×
            </button>
          </div>
          <div className="p-2 border-b">
            <KiesClientDropdown value={clientId} onSelect={setClientId} />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 text-sm">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded px-2 py-1 max-w-[90%] whitespace-pre-line ${
                  msg.sender === "user"
                    ? "bg-blue-100 self-end ml-auto"
                    : msg.sender === "ai"
                    ? "bg-green-100"
                    : "bg-yellow-100"
                }`}
              >
                <b>{msg.sender === "user" ? "Jij" : msg.sender === "ai" ? "AI" : "Database"}:</b> {msg.text}
              </div>
            ))}
            {loading && <div className="text-gray-400">Even geduld...</div>}
          </div>
          <div className="p-2 flex gap-2 border-t">
            <input
              className="flex-1 border rounded px-2 py-1"
              placeholder="Stel een vraag of typ 'Toon documenten'..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={loading || !clientId}
            />
            <button
              className="bg-blue-600 text-white px-3 py-1 rounded disabled:bg-gray-300"
              onClick={handleSend}
              disabled={loading || !input.trim() || !clientId}
            >
              Verstuur
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWindow; 