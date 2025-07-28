import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { 
  Plus, 
  FileText, 
  Clock, 
  User,
  Trash2,
  Edit3
} from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';

interface ClientNote {
  id: string;
  client_id: string;
  note_type: 'general' | 'medical' | 'care' | 'incident' | 'family' | 'administrative';
  note_text: string;
  is_confidential: boolean;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

interface ClientNotesProps {
  clientId: string;
}

const noteTypeLabels: Record<string, string> = {
  general: 'Algemeen',
  medical: 'Medisch',
  care: 'Zorg',
  incident: 'Incident',
  family: 'Familie',
  administrative: 'Administratief'
};

const noteTypeColors: Record<string, string> = {
  general: 'bg-blue-100 text-blue-800',
  medical: 'bg-red-100 text-red-800',
  care: 'bg-green-100 text-green-800',
  incident: 'bg-orange-100 text-orange-800',
  family: 'bg-purple-100 text-purple-800',
  administrative: 'bg-gray-100 text-gray-800'
};

export const ClientNotes: React.FC<ClientNotesProps> = ({ clientId }) => {
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'general' | 'medical' | 'care' | 'incident' | 'family' | 'administrative'>('general');
  const [isConfidential, setIsConfidential] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Fetch notes from Supabase
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_notes')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notes:', error);
        return;
      }

      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add new note
  const addNote = async () => {
    if (!newNote.trim()) return;

    try {
      setIsAddingNote(true);
      const { data, error } = await supabase
        .from('client_notes')
        .insert({
          client_id: clientId,
          note_type: noteType,
          note_text: newNote.trim(),
          is_confidential: isConfidential
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding note:', error);
        return;
      }

      setNotes([data, ...notes]);
      setNewNote('');
      setNoteType('general');
      setIsConfidential(false);
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsAddingNote(false);
    }
  };

  // Update note
  const updateNote = async (noteId: string) => {
    if (!editText.trim()) return;

    try {
      const { error } = await supabase
        .from('client_notes')
        .update({
          note_text: editText.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId);

      if (error) {
        console.error('Error updating note:', error);
        return;
      }

      setNotes(notes.map(note => 
        note.id === noteId 
          ? { ...note, note_text: editText.trim(), updated_at: new Date().toISOString() }
          : note
      ));
      setEditingNote(null);
      setEditText('');
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  // Delete note
  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('client_notes')
        .delete()
        .eq('id', noteId);

      if (error) {
        console.error('Error deleting note:', error);
        return;
      }

      setNotes(notes.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  // Start editing note
  const startEditing = (note: ClientNote) => {
    setEditingNote(note.id);
    setEditText(note.note_text);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingNote(null);
    setEditText('');
  };

  useEffect(() => {
    fetchNotes();
  }, [clientId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New Note Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="w-5 h-5" />
            Nieuwe Notitie Toevoegen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type Notitie
              </label>
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="general">Algemeen</option>
                <option value="medical">Medisch</option>
                <option value="care">Zorg</option>
                <option value="incident">Incident</option>
                <option value="family">Familie</option>
                <option value="administrative">Administratief</option>
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="confidential"
                checked={isConfidential}
                onChange={(e) => setIsConfidential(e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="confidential" className="ml-2 text-sm text-gray-700">
                Vertrouwelijke notitie
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notitie
            </label>
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Voer hier je notitie in..."
              rows={4}
              className="w-full"
            />
          </div>
          
          <div className="flex justify-end">
            <Button
              onClick={addNote}
              disabled={!newNote.trim() || isAddingNote}
              className="bg-purple-100 text-purple-600 border border-purple-500 hover:bg-purple-200"
            >
              {isAddingNote ? 'Toevoegen...' : 'Notitie Toevoegen'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Notes List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          Eerdere Notities ({notes.length})
        </h3>
        
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nog geen notities voor deze cliënt</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <Card key={note.id} className={`${note.is_confidential ? 'border-orange-200 bg-orange-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={noteTypeColors[note.note_type]}>
                        {noteTypeLabels[note.note_type]}
                      </Badge>
                      {note.is_confidential && (
                        <Badge className="bg-orange-100 text-orange-800">
                          Vertrouwelijk
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(note)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNote(note.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {editingNote === note.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                        className="w-full"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateNote(note.id)}
                          disabled={!editText.trim()}
                          className="bg-purple-100 text-purple-600 border border-purple-500 hover:bg-purple-200"
                        >
                          Opslaan
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEditing}
                        >
                          Annuleren
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-900 whitespace-pre-wrap mb-3">
                        {note.note_text}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(note.created_at)}
                        </div>
                        {note.updated_at !== note.created_at && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Bijgewerkt: {formatDate(note.updated_at)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientNotes; 